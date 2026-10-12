import { world, system } from "@minecraft/server";

// Exploration Lattice: preserve one-block-thick axis-aligned beams.
// The grid is absolute-world-coordinate based and intersects at (0, 0, 0).
const GRID_SPACING = 4;
const CHUNK_SIZE = 16;
const CHUNKS_RADIUS = 4; // Radius 4 means up to 9 x 9 chunks per player.
const RESCAN_INTERVAL_TICKS = 20;
const BLOCK_BUDGET_PER_TICK = 256;

const queuedChunks = [];
const queuedKeys = new Set();
const completedKeys = new Set();
let currentJob = null;
let tickCounter = 0;

function floorToChunk(blockCoordinate) {
  return Math.floor(blockCoordinate / CHUNK_SIZE);
}

function makeChunkKey(dimensionId, chunkX, chunkZ) {
  return dimensionId + "|" + chunkX + "|" + chunkZ;
}

function isLatticeBlock(x, y, z) {
  const xOnGrid = x % GRID_SPACING === 0;
  const yOnGrid = y % GRID_SPACING === 0;
  const zOnGrid = z % GRID_SPACING === 0;

  // Any two coordinates on grid lines make an X-, Y-, or Z-running beam.
  // This is a beam lattice, not a set of solid horizontal/vertical planes.
  return (xOnGrid && yOnGrid) ||
         (xOnGrid && zOnGrid) ||
         (yOnGrid && zOnGrid);
}

function scanPlayerAreas() {
  // Build the set of loaded chunks that are currently near any player.
  // This keeps the queue bounded when a player travels quickly.
  const nearbyLoaded = new Map();

  for (const player of world.getAllPlayers()) {
    let dimension;
    let heightRange;
    try {
      dimension = player.dimension;
      heightRange = dimension.heightRange;
    } catch (error) {
      continue;
    }

    const centerChunkX = floorToChunk(player.location.x);
    const centerChunkZ = floorToChunk(player.location.z);
    const minY = Math.ceil(heightRange.min);
    const maxYExclusive = Math.ceil(heightRange.max);

    for (let offsetZ = -CHUNKS_RADIUS; offsetZ <= CHUNKS_RADIUS; offsetZ++) {
      for (let offsetX = -CHUNKS_RADIUS; offsetX <= CHUNKS_RADIUS; offsetX++) {
        const chunkX = centerChunkX + offsetX;
        const chunkZ = centerChunkZ + offsetZ;
        const key = makeChunkKey(dimension.id, chunkX, chunkZ);

        let loaded = false;
        try {
          loaded = dimension.isChunkLoaded({
            x: chunkX * CHUNK_SIZE + 8,
            y: Math.max(minY, Math.min(maxYExclusive - 1, Math.floor(player.location.y))),
            z: chunkZ * CHUNK_SIZE + 8
          });
        } catch (error) {
          continue;
        }
        if (!loaded) continue;

        const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
        const previous = nearbyLoaded.get(key);
        if (!previous || distanceSquared < previous.distanceSquared) {
          nearbyLoaded.set(key, {
            key,
            dimensionId: dimension.id,
            startX: chunkX * CHUNK_SIZE,
            startZ: chunkZ * CHUNK_SIZE,
            minY,
            maxYExclusive,
            distanceSquared
          });
        }
      }
    }
  }

  const desiredKeys = new Set(nearbyLoaded.keys());

  // Remove queued-but-not-started chunks that have left every player's area.
  const stillNearby = [];
  for (const job of queuedChunks) {
    if (desiredKeys.has(job.key)) stillNearby.push(job);
    else queuedKeys.delete(job.key);
  }
  queuedChunks.length = 0;
  queuedChunks.push(...stillNearby);

  // Stop a partially processed job if its chunk is no longer near any player.
  // Its edits are idempotent, so it can safely restart if revisited later.
  if (currentJob && !desiredKeys.has(currentJob.key)) {
    queuedKeys.delete(currentJob.key);
    currentJob = null;
  }

  const candidates = Array.from(nearbyLoaded.values());
  candidates.sort((a, b) => a.distanceSquared - b.distanceSquared);

  for (const candidate of candidates) {
    if (queuedKeys.has(candidate.key) || completedKeys.has(candidate.key)) continue;
    queuedKeys.add(candidate.key);
    queuedChunks.push({
      ...candidate,
      xOffset: 0,
      zOffset: 0,
      y: candidate.minY
    });
  }

  // Keep closest chunks first, even when fresh chunks are discovered later.
  queuedChunks.sort((a, b) => a.distanceSquared - b.distanceSquared);
}

function startNextJob() {
  while (!currentJob && queuedChunks.length > 0) {
    const job = queuedChunks.shift();

    // Chunks may unload after being queued. Let the next area scan retry them.
    try {
      const dimension = world.getDimension(job.dimensionId);
      const loaded = dimension.isChunkLoaded({
        x: job.startX + 8,
        y: job.minY,
        z: job.startZ + 8
      });

      if (!loaded) {
        queuedKeys.delete(job.key);
        continue;
      }
    } catch (error) {
      queuedKeys.delete(job.key);
      continue;
    }

    currentJob = job;
  }
}

function finishCurrentJob() {
  if (!currentJob) return;
  completedKeys.add(currentJob.key);
  queuedKeys.delete(currentJob.key);
  currentJob = null;
}

function releaseJobForRetry(job) {
  queuedKeys.delete(job.key);
  currentJob = null;
  // A later area scan will queue this chunk again if it is loaded and nearby.
}

function processOneBlock(job) {
  const x = job.startX + job.xOffset;
  const y = job.y;
  const z = job.startZ + job.zOffset;

  try {
    const dimension = world.getDimension(job.dimensionId);
    const block = dimension.getBlock({ x, y, z });

    // Undefined means the chunk is no longer loaded. Do not mark it completed.
    if (!block) {
      releaseJobForRetry(job);
      return;
    }

    if (!block.isAir && !isLatticeBlock(x, y, z)) {
      dimension.setBlockType({ x, y, z }, "minecraft:air");
    }
  } catch (error) {
    // Avoid marking a partially edited chunk complete after an API error.
    releaseJobForRetry(job);
    return;
  }

  // Advance only after the current block was processed successfully.
  job.y++;
  if (job.y >= job.maxYExclusive) {
    job.y = job.minY;
    job.xOffset++;

    if (job.xOffset >= CHUNK_SIZE) {
      job.xOffset = 0;
      job.zOffset++;
    }
  }

  if (job.zOffset >= CHUNK_SIZE) {
    finishCurrentJob();
  }
}

world.afterEvents.playerSpawn.subscribe(() => {
  scanPlayerAreas();
});

// Re-scan nearby chunks once a second; edits themselves are spread across ticks.
system.runInterval(() => {
  tickCounter++;

  if (tickCounter % RESCAN_INTERVAL_TICKS === 0) {
    scanPlayerAreas();
  }

  startNextJob();

  for (let i = 0; i < BLOCK_BUDGET_PER_TICK && currentJob; i++) {
    processOneBlock(currentJob);
    startNextJob();
  }
}, 1);
