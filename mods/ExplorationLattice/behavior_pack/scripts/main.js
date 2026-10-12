import { world, system } from "@minecraft/server";

const GRID = 4;
const CHUNK_SIZE = 16;
const CHUNKS_RADIUS = 4;
const MIN_Y = -64;
const MAX_Y = 319;
const BLOCK_BUDGET_PER_TICK = 512;

const queuedChunks = [];
const queuedKeys = new Set();
const completedKeys = new Set();
const lastPlayerChunks = new Map();
let currentJob = null;

function floorToChunk(value) {
  return Math.floor(value / CHUNK_SIZE);
}

function chunkKey(dimensionId, chunkX, chunkZ) {
  return dimensionId + "|" + chunkX + "|" + chunkZ;
}

function enqueueAround(player) {
  const centerX = floorToChunk(player.location.x);
  const centerZ = floorToChunk(player.location.z);
  const dimensionId = player.dimension.id;

  for (let dz = -CHUNKS_RADIUS; dz <= CHUNKS_RADIUS; dz++) {
    for (let dx = -CHUNKS_RADIUS; dx <= CHUNKS_RADIUS; dx++) {
      const chunkX = centerX + dx;
      const chunkZ = centerZ + dz;
      const key = chunkKey(dimensionId, chunkX, chunkZ);
      if (queuedKeys.has(key) || completedKeys.has(key)) continue;

      queuedKeys.add(key);
      queuedChunks.push({
        key,
        dimensionId,
        startX: chunkX * CHUNK_SIZE,
        startZ: chunkZ * CHUNK_SIZE,
        xOffset: 0,
        zOffset: 0,
        y: MIN_Y
      });
    }
  }
}

function isLatticeBlock(x, y, z) {
  // Three perpendicular grid planes intersect at (0, 0, 0).
  return x % GRID === 0 || y % GRID === 0 || z % GRID === 0;
}

function startNextJob() {
  if (currentJob || queuedChunks.length === 0) return;
  currentJob = queuedChunks.shift();
}

function processOneBlock(job) {
  const x = job.startX + job.xOffset;
  const z = job.startZ + job.zOffset;
  const y = job.y;

  job.y++;
  if (job.y > MAX_Y) {
    job.y = MIN_Y;
    job.xOffset++;
    if (job.xOffset >= CHUNK_SIZE) {
      job.xOffset = 0;
      job.zOffset++;
    }
  }

  if (job.zOffset >= CHUNK_SIZE) {
    completedKeys.add(job.key);
    queuedKeys.delete(job.key);
    currentJob = null;
    return;
  }

  try {
    const dimension = world.getDimension(job.dimensionId);
    const block = dimension.getBlock({ x, y, z });
    if (!block || block.isAir || block.typeId === "minecraft:bedrock") return;
    if (!isLatticeBlock(x, y, z)) block.setType("minecraft:air");
  } catch (error) {
    // Unavailable chunks or invalid coordinates should not stop the queue.
  }
}

world.afterEvents.playerSpawn.subscribe((event) => {
  enqueueAround(event.player);
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const cx = floorToChunk(player.location.x);
    const cz = floorToChunk(player.location.z);
    const key = player.id;
    const previous = lastPlayerChunks.get(key);
    if (!previous || previous.cx !== cx || previous.cz !== cz || previous.dimensionId !== player.dimension.id) {
      lastPlayerChunks.set(key, { cx, cz, dimensionId: player.dimension.id });
      enqueueAround(player);
    }
  }

  startNextJob();
  if (!currentJob) return;
  for (let i = 0; i < BLOCK_BUDGET_PER_TICK && currentJob; i++) {
    processOneBlock(currentJob);
    startNextJob();
  }
}, 1);

world.afterEvents.playerLeave.subscribe((event) => {
  lastPlayerChunks.delete(event.playerId);
});
