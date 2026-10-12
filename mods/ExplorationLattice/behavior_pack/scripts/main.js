import { world, system } from "@minecraft/server";

// Exploration Lattice: preserve one-block-thick axis-aligned beams.
// The grid is absolute-world-coordinate based and intersects at (0, 0, 0).
const GRID_SPACING = 4;
const CHUNK_SIZE = 16;
const CHUNKS_RADIUS = 4; // Radius 4 means up to 9 x 9 chunks per player.
const RESCAN_INTERVAL_TICKS = 20;
const BLOCK_BUDGET_PER_TICK = 4096; // Higher throughput; fluid-neighbor checks are only done for blocks that would actually be removed.

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

const GRAVITY_BLOCKS = new Set([
  "minecraft:sand", "minecraft:red_sand", "minecraft:gravel",
  "minecraft:suspicious_sand", "minecraft:suspicious_gravel",
  "minecraft:anvil", "minecraft:chipped_anvil", "minecraft:damaged_anvil",
  "minecraft:dragon_egg",
  "minecraft:white_concrete_powder", "minecraft:orange_concrete_powder",
  "minecraft:magenta_concrete_powder", "minecraft:light_blue_concrete_powder",
  "minecraft:yellow_concrete_powder", "minecraft:lime_concrete_powder",
  "minecraft:pink_concrete_powder", "minecraft:gray_concrete_powder",
  "minecraft:light_gray_concrete_powder", "minecraft:cyan_concrete_powder",
  "minecraft:purple_concrete_powder", "minecraft:blue_concrete_powder",
  "minecraft:brown_concrete_powder", "minecraft:green_concrete_powder",
  "minecraft:red_concrete_powder", "minecraft:black_concrete_powder"
]);

function isWaterlogged(block) {
  try {
    return block.permutation.getState("waterlogged") === true ||
           block.permutation.getState("waterlogged_bit") === true;
  } catch (error) {
    return false;
  }
}

function isGravityBlock(block) {
  return GRAVITY_BLOCKS.has(block.typeId);
}

function isNearFluid(dimension, x, y, z) {
  const neighbors = [
    { x: x + 1, y, z }, { x: x - 1, y, z },
    { x, y: y + 1, z }, { x, y: y - 1, z },
    { x, y, z: z + 1 }, { x, y, z: z - 1 }
  ];
  for (const location of neighbors) {
    try {
      const neighbor = dimension.getBlock(location);
      if (neighbor && (neighbor.isLiquid || isWaterlogged(neighbor))) return true;
    } catch (error) {
      // Ignore inaccessible neighbor positions; the current block is still checked.
    }
  }
  return false;
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
      // Scan from top to bottom so falling blocks can protect their support.
      y: candidate.maxYExclusive - 1,
      protectBelow: false
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

    if (!block) {
      releaseJobForRetry(job);
      return;
    }

    const gravityBlock = isGravityBlock(block);
    const protectedSupport = job.protectBelow === true;
    const bedrockBlock = block.typeId === "minecraft:bedrock";
    const fluidBlock = block.isLiquid || isWaterlogged(block);
    const eligibleForRemoval = !block.isAir &&
        !bedrockBlock &&
        !fluidBlock &&
        !gravityBlock &&
        !protectedSupport &&
        !isLatticeBlock(x, y, z);

    // Cheap exclusions come first. Only inspect adjacent blocks when this
    // block would otherwise be deleted, reducing expensive API calls sharply.
    if (eligibleForRemoval && !isNearFluid(dimension, x, y, z)) {
      dimension.setBlockType({ x, y, z }, "minecraft:air");
    }

    // Descending scan preserves the support under sand, gravel, anvils, etc.
    job.protectBelow = gravityBlock;
  } catch (error) {
    releaseJobForRetry(job);
    return;
  }

  // Descend through the column, then start the next column at the top.
  job.y--;
  if (job.y < job.minY) {
    job.y = job.maxYExclusive - 1;
    job.protectBelow = false;
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
