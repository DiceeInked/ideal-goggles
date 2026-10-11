import { world, system } from "@minecraft/server";

/*
 * Lattice of Greed - minimal build, version 1.0.9.
 * This script does exactly two world-generation jobs:
 * 1. A bedrock lattice from Y=-32 through Y=0, with a four-block grid.
 * 2. One oak tree on its small island at the origin.
 *
 * Generation is intentionally independent of saved completion markers and
 * ticking-area reservations. The current player chunk is built in small,
 * retryable batches, and a new script session rebuilds the chunk it enters.
 */

const DIMENSION_ID = "log:abyss";
const GRID_MIN = -32;
const GRID_MAX = 0;
const GRID_STEP = 4;
const REGION_SIZE = 16;
const TREE_X = 2;
const TREE_Z = 2;
const BLOCKS_PER_TICK = 240;

const generatedRegions = new Set();
const jobs = new Map();
const registrationErrors = [];
let lastError = "none";
let totalRegionsBuilt = 0;
let totalAutomaticChecks = 0;
let lastCheckTick = -1;

function mainDimension() {
  return world.getDimension(DIMENSION_ID);
}

function floorDiv(value, divisor) {
  return Math.floor(value / divisor);
}

function regionKey(rx, rz) {
  return rx + "," + rz;
}

function regionForPlayer(player) {
  return {
    rx: floorDiv(player.location.x, REGION_SIZE),
    rz: floorDiv(player.location.z, REGION_SIZE)
  };
}

function addTask(tasks, x, y, z, typeId) {
  if (y < -64 || y > 319) return;
  tasks.set(x + "," + y + "," + z, { x, y, z, typeId });
}

function isGridLine(value) {
  return ((value % GRID_STEP) + GRID_STEP) % GRID_STEP === 0;
}

function addLatticeTasks(tasks, sx, sz) {
  // Horizontal grid beams at Y=-32, -28, ... 0.
  for (let y = GRID_MIN; y <= GRID_MAX; y += GRID_STEP) {
    for (let x = sx; x < sx + REGION_SIZE; x++) {
      if (!isGridLine(x)) continue;
      for (let z = sz; z < sz + REGION_SIZE; z++) {
        addTask(tasks, x, y, z, "minecraft:bedrock");
      }
    }
    for (let z = sz; z < sz + REGION_SIZE; z++) {
      if (!isGridLine(z)) continue;
      for (let x = sx; x < sx + REGION_SIZE; x++) {
        addTask(tasks, x, y, z, "minecraft:bedrock");
      }
    }
  }

  // Vertical beams at every grid intersection.
  for (let x = sx; x < sx + REGION_SIZE; x++) {
    if (!isGridLine(x)) continue;
    for (let z = sz; z < sz + REGION_SIZE; z++) {
      if (!isGridLine(z)) continue;
      for (let y = GRID_MIN; y <= GRID_MAX; y++) {
        addTask(tasks, x, y, z, "minecraft:bedrock");
      }
    }
  }
}

function addTreeTasks(tasks, sx, sz) {
  // The tree and its island are only placed in the region containing (0, 0).
  if (sx !== 0 || sz !== 0) return;

  for (let x = TREE_X - 1; x <= TREE_X + 1; x++) {
    for (let z = TREE_Z - 1; z <= TREE_Z + 1; z++) {
      addTask(tasks, x, -3, z, "minecraft:dirt");
      addTask(tasks, x, -2, z, "minecraft:dirt");
      addTask(tasks, x, -1, z, "minecraft:grass_block");
    }
  }
  addTask(tasks, TREE_X, -2, TREE_Z, "minecraft:bedrock");

  for (let y = 0; y <= 6; y++) {
    addTask(tasks, TREE_X, y, TREE_Z, "minecraft:oak_log");
  }

  const canopy = [
    { y: 3, radius: 2 },
    { y: 4, radius: 2 },
    { y: 5, radius: 2 },
    { y: 6, radius: 1 },
    { y: 7, radius: 1 }
  ];
  for (const layer of canopy) {
    for (let dx = -layer.radius; dx <= layer.radius; dx++) {
      for (let dz = -layer.radius; dz <= layer.radius; dz++) {
        if (dx === 0 && dz === 0 && layer.y <= 6) continue;
        if (Math.abs(dx) === layer.radius &&
            Math.abs(dz) === layer.radius &&
            ((TREE_X + dx) * 17 + (TREE_Z + dz) * 31 + layer.y) % 5 === 0) {
          continue;
        }
        addTask(tasks, TREE_X + dx, layer.y, TREE_Z + dz, "minecraft:oak_leaves");
      }
    }
  }
}

function buildTasks(rx, rz) {
  const sx = rx * REGION_SIZE;
  const sz = rz * REGION_SIZE;
  const tasks = new Map();
  addLatticeTasks(tasks, sx, sz);
  addTreeTasks(tasks, sx, sz);
  return [...tasks.values()];
}


function queueRegion(rx, rz, force = false) {
  const key = regionKey(rx, rz);
  if (!force && (generatedRegions.has(key) || jobs.has(key))) return;
  if (force) generatedRegions.delete(key);
  jobs.set(key, {
    rx,
    rz,
    tasks: buildTasks(rx, rz),
    index: 0,
    startedAt: system.currentTick
  });
}

function setTask(dim, task) {
  const block = dim.getBlock({ x: task.x, y: task.y, z: task.z });
  if (!block) throw new Error("No block at " + task.x + "," + task.y + "," + task.z);
  if (block.typeId !== task.typeId) block.setType(task.typeId);
  const actual = dim.getBlock({ x: task.x, y: task.y, z: task.z });
  if (!actual || actual.typeId !== task.typeId) {
    throw new Error("Write check failed at " + task.x + "," + task.y + "," + task.z +
      "; expected " + task.typeId + ", found " + (actual?.typeId || "unavailable"));
  }
}

function processJobs() {
  if (jobs.size === 0) return;
  const dim = mainDimension();

  for (const [key, job] of jobs) {
    // Only edit a region while a player is standing in it. This avoids
    // guessing whether a custom-dimension chunk is loaded through an API
    // probe that can disagree with the actual player's loaded area.
    const occupied = world.getAllPlayers().some(player => {
      if (player.dimension.id !== DIMENSION_ID) return false;
      const pos = regionForPlayer(player);
      return pos.rx === job.rx && pos.rz === job.rz;
    });
    if (!occupied) continue;
    let writes = 0;
    try {
      while (job.index < job.tasks.length && writes < BLOCKS_PER_TICK) {
        setTask(dim, job.tasks[job.index]);
        job.index++;
        writes++;
      }
      if (job.index >= job.tasks.length) {
        jobs.delete(key);
        generatedRegions.add(key);
        totalRegionsBuilt++;
        lastError = "none";
        console.warn("[Lattice of Greed] Built lattice region " + key +
          " with " + job.tasks.length + " verified block placements.");
      }
    } catch (error) {
      lastError = "Region " + key + ", task " + job.index + "/" + job.tasks.length +
        ": " + String(error).slice(0, 220);
      console.warn("[Lattice of Greed] Generation paused: " + lastError);
      // Keep the failed task at the front and retry while the chunk is loaded.
      break;
    }
    // One region per tick prevents several nearby players from causing a burst.
    break;
  }
}

function ensurePlayerRegion(player) {
  if (player.dimension.id !== DIMENSION_ID) return;
  const { rx, rz } = regionForPlayer(player);
  queueRegion(rx, rz);
}

function getRelevantPlayer(event) {
  const source = event?.sourceEntity;
  if (source?.typeId === "minecraft:player") return source;
  return world.getAllPlayers().find(player => player.dimension.id === DIMENSION_ID) ||
    world.getAllPlayers()[0] || null;
}

function status(player) {
  const { rx, rz } = regionForPlayer(player);
  const key = regionKey(rx, rz);
  const job = jobs.get(key);
  const loaded = player.dimension.id === DIMENSION_ID;
  player.sendMessage("§8[Lattice] Dimension=" + player.dimension.id +
    "; region=" + key + "; loaded=" + loaded);
  player.sendMessage("§8Current region=" +
    (generatedRegions.has(key) ? "built this session" :
      job ? "building " + job.index + "/" + job.tasks.length : "waiting to build"));
  player.sendMessage("§8Regions built=" + totalRegionsBuilt +
    "; automatic checks=" + totalAutomaticChecks + "; dimension=" + DIMENSION_ID);
  if (lastError !== "none") player.sendMessage("§cLast generation error: " + lastError);
  if (registrationErrors.length) {
    player.sendMessage("§cDimension registration error: " +
      registrationErrors[registrationErrors.length - 1]);
  }
}

system.beforeEvents.startup.subscribe(event => {
  try {
    event.dimensionRegistry.registerCustomDimension(DIMENSION_ID);
  } catch (error) {
    registrationErrors.push(String(error).slice(0, 220));
    console.warn("[Lattice of Greed] Dimension registration failed: " + String(error));
  }
});

world.afterEvents.playerSpawn.subscribe(event => {
  system.runTimeout(() => {
    const player = event.player;
    if (!player) return;
    if (player.dimension.id !== DIMENSION_ID) {
      try {
        player.teleport({ x: 4.5, y: 2, z: 4.5 }, { dimension: mainDimension() });
      } catch (error) {
        lastError = "Could not enter " + DIMENSION_ID + ": " + String(error).slice(0, 180);
        player.sendMessage("§c[Lattice] " + lastError);
        return;
      }
    }
    system.runTimeout(() => ensurePlayerRegion(player), 1);
  }, 1);
});

system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== "log:lattice_recheck" && event.id !== "log:lattice_status") return;
  const player = getRelevantPlayer(event);
  if (!player) {
    world.sendMessage("§c[Lattice] No player is online; cannot run this check.");
    return;
  }
  if (event.id === "log:lattice_status") {
    status(player);
    return;
  }
  if (player.dimension.id !== DIMENSION_ID) {
    player.sendMessage("§c[Lattice] Move into " + DIMENSION_ID + " before rechecking.");
    return;
  }
  const { rx, rz } = regionForPlayer(player);
  queueRegion(rx, rz, true);
  player.sendMessage("§8[Lattice] Rebuilding current region " + regionKey(rx, rz) +
    ". Stay in this area for a few seconds, then run /function lattice_status.");
});

system.runInterval(() => {
  if (system.currentTick % 10 === 0) {
    lastCheckTick = system.currentTick;
    for (const player of world.getAllPlayers()) {
      ensurePlayerRegion(player);
      if (player.dimension.id === DIMENSION_ID) totalAutomaticChecks++;
    }
  }
  processJobs();
}, 1);

world.afterEvents.playerDimensionChange.subscribe(event => {
  if (event.player.dimension.id === DIMENSION_ID) {
    system.runTimeout(() => ensurePlayerRegion(event.player), 2);
  }
});
