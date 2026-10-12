import {
  world,
  system,
  BlockVolume,
  ListBlockVolume,
  BlockPermutation,
  BlockTypes,
  LiquidType
} from "@minecraft/server";

// Exploration Lattice: preserve one-block-thick beams on a world-origin grid.
// Native bulk fills replace thousands of individual block API calls. Work is
// split into small batches so one tick cannot try to transform a whole chunk.
const GRID_SPACING = 4;
const CHUNK_SIZE = 16;
const CHUNKS_RADIUS = 2; // 5 x 5 chunks near each player, not 9 x 9.
const RESCAN_INTERVAL_TICKS = 20;
const BATCH_HEIGHT = 4;
const BATCHES_PER_TICK = 2;
const WATERLOGGABLE_TYPES_PER_TICK = 32;

const BASE_PROTECTED_TYPES = [
  "minecraft:bedrock",
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:bubble_column",
  "minecraft:sand",
  "minecraft:red_sand",
  "minecraft:gravel",
  "minecraft:suspicious_sand",
  "minecraft:suspicious_gravel",
  "minecraft:anvil",
  "minecraft:chipped_anvil",
  "minecraft:damaged_anvil",
  "minecraft:dragon_egg",
  "minecraft:white_concrete_powder",
  "minecraft:orange_concrete_powder",
  "minecraft:magenta_concrete_powder",
  "minecraft:light_blue_concrete_powder",
  "minecraft:yellow_concrete_powder",
  "minecraft:lime_concrete_powder",
  "minecraft:pink_concrete_powder",
  "minecraft:gray_concrete_powder",
  "minecraft:light_gray_concrete_powder",
  "minecraft:cyan_concrete_powder",
  "minecraft:purple_concrete_powder",
  "minecraft:blue_concrete_powder",
  "minecraft:brown_concrete_powder",
  "minecraft:green_concrete_powder",
  "minecraft:red_concrete_powder",
  "minecraft:black_concrete_powder"
];

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

const queuedChunks = [];
const queuedKeys = new Set();
const completedKeys = new Set();
const waterloggableTypes = [];
let protectedTypes = BASE_PROTECTED_TYPES.slice();
let currentJob = null;
let tickCounter = 0;

let blockTypeCatalog = [];
let discoveryIndex = 0;
let discoveryStarted = false;
let discoveryComplete = false;
let discoveryFailed = false;

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
  return (xOnGrid && yOnGrid) ||
         (xOnGrid && zOnGrid) ||
         (yOnGrid && zOnGrid);
}

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

function initializeBlockTypeCatalog() {
  if (discoveryStarted || discoveryFailed) return;
  discoveryStarted = true;

  try {
    blockTypeCatalog = BlockTypes.getAll();
    if (!blockTypeCatalog || blockTypeCatalog.length === 0) {
      discoveryFailed = true;
    }
  } catch (error) {
    discoveryFailed = true;
  }
}

function discoverWaterloggableTypes() {
  initializeBlockTypeCatalog();
  if (discoveryComplete || discoveryFailed) return;

  const end = Math.min(
    discoveryIndex + WATERLOGGABLE_TYPES_PER_TICK,
    blockTypeCatalog.length
  );

  for (; discoveryIndex < end; discoveryIndex++) {
    const blockType = blockTypeCatalog[discoveryIndex];
    try {
      const permutation = BlockPermutation.resolve(blockType.id);
      if (permutation.canContainLiquid(LiquidType.Water)) {
        waterloggableTypes.push(blockType.id);
      }
    } catch (error) {
      // Some custom block types may not expose a resolvable default
      // permutation. Skip those instead of interrupting the whole add-on.
    }
  }

  if (discoveryIndex >= blockTypeCatalog.length) {
    protectedTypes = Array.from(new Set([
      ...BASE_PROTECTED_TYPES,
      ...waterloggableTypes
    ]));
    discoveryComplete = true;
    blockTypeCatalog = [];
  }
}

function scanPlayerAreas() {
  const nearbyLoaded = new Map();

  for (const player of world.getAllPlayers()) {
    let dimension;
    let heightRange;
    let playerY;
    try {
      dimension = player.dimension;
      heightRange = dimension.heightRange;
      playerY = Math.floor(player.location.y);
    } catch (error) {
      continue;
    }

    const centerChunkX = floorToChunk(player.location.x);
    const centerChunkZ = floorToChunk(player.location.z);
    const minY = Math.ceil(heightRange.min);
    const maxYExclusive = Math.ceil(heightRange.max);
    const checkY = Math.max(minY, Math.min(maxYExclusive - 1, playerY));

    for (let offsetZ = -CHUNKS_RADIUS; offsetZ <= CHUNKS_RADIUS; offsetZ++) {
      for (let offsetX = -CHUNKS_RADIUS; offsetX <= CHUNKS_RADIUS; offsetX++) {
        const chunkX = centerChunkX + offsetX;
        const chunkZ = centerChunkZ + offsetZ;
        const key = makeChunkKey(dimension.id, chunkX, chunkZ);

        let loaded = false;
        try {
          loaded = dimension.isChunkLoaded({
            x: chunkX * CHUNK_SIZE + 8,
            y: checkY,
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

  // Bound memory during long expeditions. If a finished chunk leaves every
  // player's nearby scan area, forget its marker; revisiting it is safe
  // because lattice conversion is idempotent.
  for (const key of completedKeys) {
    if (!desiredKeys.has(key)) completedKeys.delete(key);
  }

  const stillNearby = [];
  for (const job of queuedChunks) {
    if (desiredKeys.has(job.key)) stillNearby.push(job);
    else queuedKeys.delete(job.key);
  }
  queuedChunks.length = 0;
  queuedChunks.push(...stillNearby);

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
      nextY: candidate.maxYExclusive - 1
    });
  }

  queuedChunks.sort((a, b) => a.distanceSquared - b.distanceSquared);
}

function startNextJob() {
  while (!currentJob && queuedChunks.length > 0) {
    const job = queuedChunks.shift();

    try {
      const dimension = world.getDimension(job.dimensionId);
      const loaded = dimension.isChunkLoaded({
        x: job.startX + 8,
        y: Math.max(job.minY, Math.min(job.maxYExclusive - 1, job.nextY)),
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
}

function processNextBatch(job) {
  try {
    const dimension = world.getDimension(job.dimensionId);
    const topY = job.nextY;
    const bottomY = Math.max(job.minY, topY - BATCH_HEIGHT + 1);

    if (!dimension.isChunkLoaded({
      x: job.startX + 8,
      y: topY,
      z: job.startZ + 8
    })) {
      releaseJobForRetry(job);
      return;
    }

    // Only off-lattice positions are included in this list volume. The
    // native fill operation can clear hundreds of positions with one call.
    const removalLocations = [];
    for (let y = bottomY; y <= topY; y++) {
      const yOnGrid = y % GRID_SPACING === 0;
      for (let zOffset = 0; zOffset < CHUNK_SIZE; zOffset++) {
        const z = job.startZ + zOffset;
        const zOnGrid = z % GRID_SPACING === 0;
        for (let xOffset = 0; xOffset < CHUNK_SIZE; xOffset++) {
          const x = job.startX + xOffset;
          const xOnGrid = x % GRID_SPACING === 0;
          const onLattice = (xOnGrid && yOnGrid) ||
                            (xOnGrid && zOnGrid) ||
                            (yOnGrid && zOnGrid);
          if (!onLattice) removalLocations.push({ x, y, z });
        }
      }
    }

    if (removalLocations.length > 0) {
      dimension.fillBlocks(
        new ListBlockVolume(removalLocations),
        "minecraft:air",
        {
          blockFilter: { excludeTypes: protectedTypes },
          ignoreChunkBoundErrors: true
        }
      );
    }

    // Waterloggable block types are excluded from the bulk fill. Query this
    // small batch for those types and remove only off-lattice, dry instances.
    if (waterloggableTypes.length > 0) {
      const volume = new BlockVolume(
        { x: job.startX, y: bottomY, z: job.startZ },
        { x: job.startX + CHUNK_SIZE - 1, y: topY, z: job.startZ + CHUNK_SIZE - 1 }
      );
      const candidates = dimension.getBlocks(
        volume,
        { includeTypes: waterloggableTypes },
        true
      );

      for (const location of candidates.getBlockLocationIterator()) {
        if (isLatticeBlock(location.x, location.y, location.z)) continue;

        const block = dimension.getBlock(location);
        if (!block) {
          releaseJobForRetry(job);
          return;
        }

        if (isWaterlogged(block) || block.isLiquid ||
            block.typeId === "minecraft:bedrock" ||
            isGravityBlock(block)) {
          continue;
        }

        dimension.setBlockType(location, "minecraft:air");
      }
    }

    job.nextY = bottomY - 1;
    if (job.nextY < job.minY) finishCurrentJob();
  } catch (error) {
    // A failed batch is safe to retry because the lattice edits are idempotent.
    releaseJobForRetry(job);
  }
}

world.afterEvents.playerSpawn.subscribe(() => {
  scanPlayerAreas();
});

system.runInterval(() => {
  tickCounter++;

  if (tickCounter % RESCAN_INTERVAL_TICKS === 0) {
    scanPlayerAreas();
  }

  discoverWaterloggableTypes();

  // Fail closed if the catalog cannot be inspected. It is safer to pause
  // than to clear terrain without knowing which blocks may be waterlogged.
  if (!discoveryComplete) return;

  for (let batch = 0; batch < BATCHES_PER_TICK; batch++) {
    startNextJob();
    if (!currentJob) break;
    processNextBatch(currentJob);
  }
}, 1);
