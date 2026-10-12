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

function releaseJobForRetry(job) {
  queuedKeys.delete(job.key);
  currentJob = null;
  // A later scan queues this chunk again only while it is loaded.
}

function enqueueLoadedChunksAround(player) {
  let dimension;
  let heightRange;

  try {
    dimension = player.dimension;
    heightRange = dimension.heightRange;
  } catch (error) {
    return;
  }

  const centerChunkX = floorToChunk(player.location.x);
  const centerChunkZ = floorToChunk(player.location.z);
  const candidates = [];

  for (let offsetZ = -CHUNKS_RADIUS; offsetZ <= CHUNKS_RADIUS; offsetZ++) {
    for (let offsetX = -CHUNKS_RADIUS; offsetX <= CHUNKS_RADIUS; offsetX++) {
      const chunkX = centerChunkX + offsetX;
      const chunkZ = centerChunkZ + offsetZ;
      const key = makeChunkKey(dimension.id, chunkX, chunkZ);

      if (queuedKeys.has(key) || completedKeys.has(key)) continue;

      // Prioritize chunks closest to the player so the effect appears nearby first.
      candidates.push({
        key,
        dimensionId: dimension.id,
        chunkX,
        chunkZ,
        distanceSquared: offsetX * offsetX + offsetZ * offsetZ,
        minY: Math.ceil(heightRange.min),
        maxYExclusive: Math.ceil(heightRange.max)
      });
    }
  }

  candidates.sort((a, b) => a.distanceSquared - b.distanceSquared);

  for (const candidate of candidates) {
    try {
      const isLoaded = dimension.isChunkLoaded({
        x: candidate.chunkX * CHUNK_SIZE + 8,
        y: Math.max(candidate.minY, Math.min(candidate.maxYExclusive - 1, Math.floor(player.location.y))),
        z: candidate.chunkZ * CHUNK_SIZE + 8
      });

      if (!isLoaded) continue;

      queuedKeys.add(candidate.key);
      queuedChunks.push({
        key: candidate.key,
        dimensionId: candidate.dimensionId,
        startX: candidate.chunkX * CHUNK_SIZE,
        startZ: candidate.chunkZ * CHUNK_SIZE,
        minY: candidate.minY,
        maxYExclusive: candidate.maxYExclusive,
        xOffset: 0,
        zOffset: 0,
        y: candidate.minY
      });
    } catch (error) {
      // If a chunk or dimension isn't available, a later scan can retry it.
    }
  }
}

function scanPlayerAreas() {
  for (const player of world.getAllPlayers()) {
    enqueueLoadedChunksAround(player);
  }
}

function startNextJob() {
  while (!currentJob && queuedChunks.length > 0) {
    const job = queuedChunks.shift();

    // Chunks can unload while waiting in the queue. Drop unloaded jobs and let
    // a later player-area scan queue them again.
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

function processOneBlock(job) {
  const x = job.startX + job.xOffset;
  const y = job.y;
  const z = job.startZ + job.zOffset;

  try {
    const dimension = world.getDimension(job.dimensionId);
    const block = dimension.getBlock({ x, y, z });

    // Undefined means the chunk is no longer loaded. Reprocess it from the
    // beginning after it loads again; edits already made are idempotent.
    if (!block) {
      releaseJobForRetry(job);
      return;
    }

    if (!block.isAir && !isLatticeBlock(x, y, z)) {
      dimension.setBlockType({ x, y, z }, "minecraft:air");
    }
  } catch (error) {
    // Avoid marking a partially edited chunk as complete after an API error.
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

// Keep discovering newly loaded chunks as players move. The chunk edits
// themselves are spread across ticks to limit per-tick work.
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
