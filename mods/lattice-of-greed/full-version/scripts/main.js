import { world, system } from "@minecraft/server";

/*
 * Lattice of Greed - spreading survival islands, version 1.2.0.
 *
 * The world contains:
 * 1. A bedrock lattice from Y=-32 through Y=0, with a four-block grid.
 * 2. The original oak-tree starter island at the origin.
 * 3. Small dirt-and-plant islands whose density fades with distance from the tree.
 * 4. Repeated lush-cave, dripstone-cave, and amethyst-cave island systems.
 *
 * Cave systems use one main resource island surrounded by twelve smaller islands.
 * Structure-completion markers are saved as world dynamic properties so mining an
 * island does not cause its resources to respawn after a restart or re-entry.
 */

const DIMENSION_ID = "log:abyss";
const GRID_MIN = -32;
const GRID_MAX = 0;
const GRID_STEP = 4;
const REGION_SIZE = 16;
// Bedrock Script API does not expose the client's exact render-distance setting.
const NEARBY_REGION_RADIUS = 4;
const BLOCK_RETRY_COOLDOWN = 100;
const TREE_X = 2;
const TREE_Z = 2;
const BLOCKS_PER_TICK = 240;

const CAVE_CLUSTER_CELLS = 6;
const CAVE_ANCHOR_OFFSET = 3;
const CAVE_ISLAND_OFFSETS = [
  { dx: 0, dz: 0 },
  { dx: -1, dz: 0 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: -1 },
  { dx: 0, dz: 1 },
  { dx: -2, dz: 0 },
  { dx: 2, dz: 0 },
  { dx: 0, dz: -2 },
  { dx: 0, dz: 2 },
  { dx: -1, dz: -1 },
  { dx: -1, dz: 1 },
  { dx: 1, dz: -1 },
  { dx: 1, dz: 1 }
];
const CAVE_TYPES = ["lush", "dripstone", "amethyst"];
const TREE_ISLAND_PLANTS = [
  "minecraft:short_grass",
  "minecraft:short_grass",
  "minecraft:fern",
  "minecraft:dandelion",
  "minecraft:poppy",
  "minecraft:azure_bluet",
  "minecraft:oxeye_daisy",
  "minecraft:cornflower",
  "minecraft:allium",
  "minecraft:red_tulip",
  "minecraft:pink_tulip",
  "minecraft:white_tulip",
  "minecraft:orange_tulip",
  "minecraft:oak_sapling",
  "minecraft:sweet_berry_bush"
];

const generatedRegions = new Set();
const jobs = new Map();
const retryAfterTick = new Map();
const registrationErrors = [];
let lastError = "none";
let totalRegionsBuilt = 0;
let totalAutomaticChecks = 0;

function mainDimension() {
  return world.getDimension(DIMENSION_ID);
}

function floorDiv(value, divisor) {
  return Math.floor(value / divisor);
}

function regionKey(rx, rz) {
  return rx + "," + rz;
}

function structureMarkerId(rx, rz) {
  // Keep each completed region persistent without storing an ever-growing JSON list.
  return "log:structures_" + rx + "_" + rz;
}

function hasPersistentStructureMarker(rx, rz) {
  return world.getDynamicProperty(structureMarkerId(rx, rz)) === true;
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

function seededValue(x, z, salt = 0) {
  let value = Math.imul(x | 0, 374761393) +
    Math.imul(z | 0, 668265263) + Math.imul(salt | 0, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function cellStart(cell) {
  return cell * GRID_STEP + 1;
}

function addTreeTasks(tasks) {
  // The main oak tree sits on a 3x3 dirt island in lattice cell (0, 0).
  const sx = TREE_X - 1;
  const sz = TREE_Z - 1;
  for (let x = sx; x <= sx + 2; x++) {
    for (let z = sz; z <= sz + 2; z++) {
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

function vegetationIslandChance(cellX, cellZ) {
  // Plant islands are common near the starting tree, then taper off into the void.
  const distance = Math.max(Math.abs(cellX), Math.abs(cellZ));
  if (distance <= 3) return 45;
  if (distance <= 8) return 30;
  if (distance <= 20) return 16;
  return 5;
}

function addVegetationIslandTasks(tasks, cellX, cellZ) {
  const sx = cellStart(cellX);
  const sz = cellStart(cellZ);

  // These islands are entirely soil, with no special or random center block.
  for (let dx = 0; dx < 3; dx++) {
    for (let dz = 0; dz < 3; dz++) {
      addTask(tasks, sx + dx, -3, sz + dz, "minecraft:dirt");
      addTask(tasks, sx + dx, -2, sz + dz, "minecraft:dirt");
      addTask(tasks, sx + dx, -1, sz + dz, "minecraft:grass_block");
    }
  }

  const positions = [
    [1, 1], [0, 1], [2, 1], [1, 0], [1, 2],
    [0, 0], [0, 2], [2, 0], [2, 2]
  ];
  // Deterministically shuffle plant positions and place one to three plants.
  for (let i = positions.length - 1; i > 0; i--) {
    const j = seededValue(cellX, cellZ, 20 + i) % (i + 1);
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const plantCount = 1 + (seededValue(cellX, cellZ, 17) % 3);
  for (let i = 0; i < plantCount; i++) {
    const [dx, dz] = positions[i];
    const plant = TREE_ISLAND_PLANTS[
      seededValue(cellX, cellZ, 50 + i) % TREE_ISLAND_PLANTS.length
    ];
    addTask(tasks, sx + dx, 0, sz + dz, plant);
  }
}

function caveSystemForCell(cellX, cellZ) {
  const macroX = floorDiv(cellX, CAVE_CLUSTER_CELLS);
  const macroZ = floorDiv(cellZ, CAVE_CLUSTER_CELLS);
  const anchorX = macroX * CAVE_CLUSTER_CELLS + CAVE_ANCHOR_OFFSET;
  const anchorZ = macroZ * CAVE_CLUSTER_CELLS + CAVE_ANCHOR_OFFSET;
  const dx = cellX - anchorX;
  const dz = cellZ - anchorZ;
  const offset = CAVE_ISLAND_OFFSETS.find(item => item.dx === dx && item.dz === dz);
  if (!offset) return null;

  const caveType = CAVE_TYPES[seededValue(macroX, macroZ, 301) % CAVE_TYPES.length];
  return {
    caveType,
    isMain: dx === 0 && dz === 0,
    offsetX: dx,
    offsetZ: dz,
    macroX,
    macroZ
  };
}

function caveLayerBlocks(caveType, dx, dz, layer) {
  if (caveType === "lush") {
    if (layer === -3) return "minecraft:stone";
    if (layer === -2) {
      return (Math.abs(dx) + Math.abs(dz)) % 2 === 0
        ? "minecraft:rooted_dirt" : "minecraft:clay";
    }
    if (dx === 0 && dz === 0) return "minecraft:grass_block";
    return (seededValue(dx, dz, 311) % 3 === 0)
      ? "minecraft:moss_block" : "minecraft:grass_block";
  }

  if (caveType === "dripstone") {
    if (layer === -3) return "minecraft:stone";
    if (layer === -2) {
      return (Math.abs(dx) + Math.abs(dz)) % 2 === 0
        ? "minecraft:dripstone_block" : "minecraft:tuff";
    }
    return (Math.abs(dx) + Math.abs(dz)) % 2 === 0
      ? "minecraft:dripstone_block" : "minecraft:stone";
  }

  // Amethyst islands resemble the layered stone, calcite, and basalt around geodes.
  if (layer === -3) return "minecraft:stone";
  if (layer === -2) {
    return (Math.abs(dx) + Math.abs(dz)) % 2 === 0
      ? "minecraft:smooth_basalt" : "minecraft:calcite";
  }
  return (dx === 0 && dz === 0)
    ? "minecraft:amethyst_block" : "minecraft:calcite";
}

function addCaveIslandTasks(tasks, cellX, cellZ, systemInfo) {
  const sx = cellStart(cellX);
  const sz = cellStart(cellZ);
  const caveType = systemInfo.caveType;
  for (let dx = 0; dx < 3; dx++) {
    for (let dz = 0; dz < 3; dz++) {
      addTask(tasks, sx + dx, -3, sz + dz,
        caveLayerBlocks(caveType, dx - 1, dz - 1, -3));
      addTask(tasks, sx + dx, -2, sz + dz,
        caveLayerBlocks(caveType, dx - 1, dz - 1, -2));
      addTask(tasks, sx + dx, -1, sz + dz,
        caveLayerBlocks(caveType, dx - 1, dz - 1, -1));
    }
  }

  const centerX = sx + 1;
  const centerZ = sz + 1;
  if (systemInfo.isMain) {
    // Main islands offer several key resources. Satellites intentionally offer less.
    if (caveType === "lush") {
      addTask(tasks, centerX, -2, centerZ, "minecraft:iron_ore");
      addTask(tasks, centerX - 1, -2, centerZ, "minecraft:coal_ore");
      addTask(tasks, centerX + 1, -2, centerZ, "minecraft:copper_ore");
    } else if (caveType === "dripstone") {
      addTask(tasks, centerX, -2, centerZ, "minecraft:copper_ore");
      addTask(tasks, centerX - 1, -2, centerZ, "minecraft:coal_ore");
      addTask(tasks, centerX + 1, -2, centerZ, "minecraft:iron_ore");
    } else {
      addTask(tasks, centerX, -2, centerZ, "minecraft:amethyst_block");
      addTask(tasks, centerX - 1, -2, centerZ, "minecraft:iron_ore");
      addTask(tasks, centerX + 1, -2, centerZ, "minecraft:copper_ore");
    }
  } else {
    const resourceRoll = seededValue(cellX, cellZ, 401) % 4;
    if (resourceRoll === 0) {
      const ores = caveType === "dripstone"
        ? ["minecraft:copper_ore", "minecraft:coal_ore"]
        : caveType === "amethyst"
          ? ["minecraft:iron_ore", "minecraft:copper_ore"]
          : ["minecraft:coal_ore", "minecraft:iron_ore"];
      addTask(tasks, centerX, -2, centerZ,
        ores[seededValue(cellX, cellZ, 402) % ores.length]);
    } else if (caveType === "lush") {
      addTask(tasks, centerX, -2, centerZ,
        seededValue(cellX, cellZ, 403) % 2 === 0
          ? "minecraft:rooted_dirt" : "minecraft:clay");
    } else if (caveType === "dripstone") {
      addTask(tasks, centerX, -2, centerZ, "minecraft:dripstone_block");
    } else {
      addTask(tasks, centerX, -2, centerZ,
        seededValue(cellX, cellZ, 404) % 2 === 0
          ? "minecraft:amethyst_block" : "minecraft:calcite");
    }
  }

  if (caveType === "lush") {
    // A central grass block guarantees a suitable place for plants and food.
    addTask(tasks, centerX, -1, centerZ, "minecraft:grass_block");
    const plantRoll = seededValue(cellX, cellZ, 420) % 5;
    if (plantRoll <= 1) {
      addTask(tasks, centerX, 0, centerZ, "minecraft:sweet_berry_bush");
    } else if (plantRoll === 2) {
      addTask(tasks, centerX, 0, centerZ, "minecraft:azalea");
    } else if (plantRoll === 3) {
      addTask(tasks, centerX, 0, centerZ, "minecraft:fern");
    } else {
      addTask(tasks, centerX, 0, centerZ, "minecraft:short_grass");
    }
  } else if (caveType === "dripstone") {
    addTask(tasks, centerX, 0, centerZ, "minecraft:pointed_dripstone");
  }
}

function addCellIslandTasks(tasks, cellX, cellZ) {
  if (cellX === 0 && cellZ === 0) {
    addTreeTasks(tasks);
    return;
  }

  const cave = caveSystemForCell(cellX, cellZ);
  if (cave) {
    addCaveIslandTasks(tasks, cellX, cellZ, cave);
    return;
  }

  const chance = vegetationIslandChance(cellX, cellZ);
  if (seededValue(cellX, cellZ, 501) % 100 < chance) {
    addVegetationIslandTasks(tasks, cellX, cellZ);
  }
}

function buildTasks(rx, rz, includeStructures) {
  const sx = rx * REGION_SIZE;
  const sz = rz * REGION_SIZE;
  const tasks = new Map();
  addLatticeTasks(tasks, sx, sz);

  if (includeStructures) {
    const minCellX = floorDiv(sx, GRID_STEP);
    const minCellZ = floorDiv(sz, GRID_STEP);
    const maxCellX = floorDiv(sx + REGION_SIZE - 1, GRID_STEP);
    const maxCellZ = floorDiv(sz + REGION_SIZE - 1, GRID_STEP);
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
        addCellIslandTasks(tasks, cellX, cellZ);
      }
    }
  }

  return [...tasks.values()];
}

function queueRegion(rx, rz, force = false) {
  const key = regionKey(rx, rz);
  if (!force && (generatedRegions.has(key) || jobs.has(key))) return;
  if (!force && (retryAfterTick.get(key) || 0) > system.currentTick) return;
  if (force) {
    generatedRegions.delete(key);
    retryAfterTick.delete(key);
  }

  const includeStructures = !hasPersistentStructureMarker(rx, rz);
  jobs.set(key, {
    rx,
    rz,
    tasks: buildTasks(rx, rz, includeStructures),
    index: 0,
    startedAt: system.currentTick,
    needsStructureMarker: includeStructures
  });
}

function queueNearbyRegions(player) {
  if (player.dimension.id !== DIMENSION_ID) return;
  const center = regionForPlayer(player);
  // Queue center first, then expanding square rings so nearby regions win.
  for (let ring = 0; ring <= NEARBY_REGION_RADIUS; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dz = -ring; dz <= ring; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
        queueRegion(center.rx + dx, center.rz + dz);
      }
    }
  }
}

function distanceToNearestPlayer(rx, rz) {
  let nearest = Infinity;
  for (const player of world.getAllPlayers()) {
    if (player.dimension.id !== DIMENSION_ID) continue;
    const pos = regionForPlayer(player);
    const distance = Math.max(Math.abs(pos.rx - rx), Math.abs(pos.rz - rz));
    if (distance < nearest) nearest = distance;
  }
  return nearest;
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
  let selectedKey = null;
  let selectedJob = null;
  let selectedDistance = Infinity;

  for (const [key, job] of jobs) {
    const distance = distanceToNearestPlayer(job.rx, job.rz);
    if (distance > NEARBY_REGION_RADIUS) continue;
    if (distance < selectedDistance) {
      selectedDistance = distance;
      selectedKey = key;
      selectedJob = job;
    }
  }
  if (!selectedJob) return;

  let writes = 0;
  try {
    while (selectedJob.index < selectedJob.tasks.length && writes < BLOCKS_PER_TICK) {
      setTask(dim, selectedJob.tasks[selectedJob.index]);
      selectedJob.index++;
      writes++;
    }
    if (selectedJob.index >= selectedJob.tasks.length) {
      if (selectedJob.needsStructureMarker) {
        world.setDynamicProperty(
          structureMarkerId(selectedJob.rx, selectedJob.rz),
          true
        );
      }
      jobs.delete(selectedKey);
      retryAfterTick.delete(selectedKey);
      generatedRegions.add(selectedKey);
      totalRegionsBuilt++;
      lastError = "none";
      console.warn("[Lattice of Greed] Built region " + selectedKey +
        " with " + selectedJob.tasks.length + " verified block placements.");
    }
  } catch (error) {
    lastError = "Region " + selectedKey + ", task " + selectedJob.index + "/" +
      selectedJob.tasks.length + ": " + String(error).slice(0, 220);
    console.warn("[Lattice of Greed] Generation paused: " + lastError);
    jobs.delete(selectedKey);
    retryAfterTick.set(selectedKey, system.currentTick + BLOCK_RETRY_COOLDOWN);
  }
}

function ensurePlayerRegion(player) {
  if (player.dimension.id !== DIMENSION_ID) return;
  queueNearbyRegions(player);
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
    "; queued=" + jobs.size + "; scan radius=" + NEARBY_REGION_RADIUS +
    " chunks; automatic checks=" + totalAutomaticChecks);
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
        // Spawn on the starter island, beside the trunk instead of over the void.
        player.teleport({ x: 1.5, y: 0, z: 2.5 }, { dimension: mainDimension() });
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
  queueNearbyRegions(player);
  player.sendMessage("§8[Lattice] Rebuilding the current lattice and queueing nearby regions within " +
    NEARBY_REGION_RADIUS + " chunks. Generated islands won't be reset.");
});

system.runInterval(() => {
  if (system.currentTick % 10 === 0) {
    for (const player of world.getAllPlayers()) {
      queueNearbyRegions(player);
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
