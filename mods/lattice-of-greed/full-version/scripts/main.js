import {
  world,
  system,
  BlockPermutation,
  ItemStack,
  EquipmentSlot,
  GameMode,
  HudElement,
  HudVisibility
} from "@minecraft/server";

/*
 * Lattice of Greed - full-system build, version 1.0.6
 * The main game takes place in an isolated custom void dimension. The normal
 * Overworld is left alone until the ending, where a small outcome vignette is
 * generated around the world's default spawn.
 */
const DIM = {
  main: "log:abyss",
  dream: "log:dream",
  memory: "log:memory",
  overworld: "minecraft:overworld"
};

const Y_MIN = -64;
const Y_MAX = 319;
const GRID_MIN = -32;
const GRID_MAX = 0;
const GRID_STEP = 4;
const REGION_SIZE = 16;
const NIGHTMARE_TICKS = 1200;
const MEMORY_SAFE_TICKS = 100;
const MEMORY_SLOW_TICKS = 160;
const MEMORY_RETURN_TICKS = 420;
const MAIN_SPAWN = { x: 4.5, y: 2, z: 4.5 };
const TREE = { x: 2, z: 2 };
const TESS = { x: -64, z: 64 };
const TESS_CENTER_Y = 13;
const TESS_OUTER_RADIUS = 12;
const TESS_INNER_RADIUS = 6;
const DREAM_CENTER = { x: 0, y: 64, z: 0 };
const DREAM_EDGE = 27;
const TOWER_LIST = [
  { id: "west", x: 80, z: 80, size: 32, height: 48 },
  { id: "east", x: 144, z: 80, size: 64, height: 108 },
  { id: "spire", x: 128, z: 176, size: 128, height: 312 }
];
const EQUIPMENT_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
  EquipmentSlot.Offhand
];

const sessions = new Map();
const memoryTrips = new Map();
const generatingMain = new Set();
const queuedMainRegions = new Set();
const mainRegionQueue = [];
let activeMainRegions = 0;
const MAX_ACTIVE_MAIN_REGIONS = 2;
const generatingMainStructures = new Set();
const queuedMainStructures = new Set();
const mainStructureQueue = [];
let activeMainStructures = 0;
const MAX_ACTIVE_MAIN_STRUCTURES = 1;
let focusMainRegionX = 0;
let focusMainRegionZ = 0;
let latticeGenerationFailures = 0;
let structureGenerationFailures = 0;
let automaticGenerationChecks = 0;
let lastAutomaticGenerationError = "none";
let lastLatticeGenerationError = "none";
let lastStructureGenerationError = "none";
const dimensionRegistrationErrors = [];
const generatingDream = new Set();
const newlyPlantedSaplings = new Map();
const watcherEntities = new Map();
const specialBarrelDrops = new Map();
const topTrapVisits = new Set();
const tesseractRestoreDelay = new Map();
const lastRegionCheck = new Map();
const lastDreamRegionCheck = new Map();
let lastTesseractClearTick = -10000;
let lastNightDay = -1;
let lastNightState = false;
let worldLoadAnnounced = false;

function waitTicks(ticks) {
  return new Promise(resolve => system.runTimeout(resolve, Math.max(1, ticks)));
}

function statKey(name) {
  return "log:stat_" + name;
}

function stat(name, fallback = 0) {
  try {
    const value = world.getDynamicProperty(statKey(name));
    return typeof value === "number" ? value : fallback;
  } catch {
    return fallback;
  }
}

function setStat(name, value) {
  try { world.setDynamicProperty(statKey(name), value); } catch {}
}

function addStat(name, amount = 1) {
  setStat(name, stat(name) + amount);
}

function stableId(player) {
  try {
    if (player.persistentId) return String(player.persistentId).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 70);
  } catch {}
  return String(player.name || player.id).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 70);
}

function backupKey(player) {
  return "log:backup_" + stableId(player);
}

function regionKey(prefix, rx, rz, suffix = "") {
  return "log:" + prefix + "_" + rx + "_" + rz + (suffix ? "_" + suffix : "");
}

function hash(x, z, salt = 0) {
  const raw = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453123;
  return raw - Math.floor(raw);
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function floorDiv(value, size) {
  return Math.floor(value / size);
}

function mainDim() {
  return world.getDimension(DIM.main);
}

function dreamDim() {
  return world.getDimension(DIM.dream);
}

function memoryDim() {
  return world.getDimension(DIM.memory);
}

function regionIsLoaded(dim, rx, rz) {
  try {
    return dim.isChunkLoaded({ x: rx * REGION_SIZE + 8, y: 0, z: rz * REGION_SIZE + 8 });
  } catch {
    return false;
  }
}

// Keep the target chunk loaded throughout each asynchronous generation pass.
// Merely checking isChunkLoaded lets Bedrock unload a chunk during a long build.
function regionTickingAreaOptions(dim, rx, rz, minY, maxY) {
  const sx = rx * REGION_SIZE;
  const sz = rz * REGION_SIZE;
  return {
    dimension: dim,
    from: { x: sx, y: minY, z: sz },
    to: { x: sx + REGION_SIZE - 1, y: maxY, z: sz + REGION_SIZE - 1 }
  };
}

async function acquireRegionTickingArea(kind, dim, rx, rz, minY, maxY) {
  const manager = world.tickingAreaManager;
  const identifier = "log_" + kind + "_" + rx + "_" + rz;
  const options = regionTickingAreaOptions(dim, rx, rz, minY, maxY);
  try {
    if (manager.hasTickingArea(identifier)) manager.removeTickingArea(identifier);
    if (!manager.hasCapacity(options)) {
      throw new Error("No free Script API ticking-area chunk capacity");
    }
    await manager.createTickingArea(identifier, options);
    return identifier;
  } catch (error) {
    throw new Error("Could not load " + kind + " region " + rx + "," + rz + ": " + String(error));
  }
}

function releaseRegionTickingArea(identifier) {
  if (!identifier) return;
  try {
    const manager = world.tickingAreaManager;
    if (manager.hasTickingArea(identifier)) manager.removeTickingArea(identifier);
  } catch (error) {
    console.warn("[Lattice of Greed] Could not remove ticking area " + identifier + ": " + String(error));
  }
}

function safeSet(dim, x, y, z, typeId) {
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  if (y < Y_MIN || y > Y_MAX) return false;
  try {
    const block = dim.getBlock({ x, y, z });
    if (!block) return false;
    if (block.typeId !== typeId) block.setType(typeId);
    return true;
  } catch {
    return false;
  }
}

function safeSetPermutation(dim, x, y, z, typeId, states) {
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  if (y < Y_MIN || y > Y_MAX) return false;
  try {
    const block = dim.getBlock({ x, y, z });
    if (!block) return false;
    block.setPermutation(BlockPermutation.resolve(typeId, states));
    return true;
  } catch {
    return safeSet(dim, x, y, z, typeId);
  }
}

function blockAt(dim, x, y, z) {
  try { return dim.getBlock({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) }); }
  catch { return undefined; }
}

function isGridLine(value) {
  return ((value % GRID_STEP) + GRID_STEP) % GRID_STEP === 0;
}

function distance2D(x1, z1, x2, z2) {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dz * dz);
}

function currentDamageScore() {
  return Math.max(
    0,
    stat("extraction") +
    stat("tesseract_mined") +
    stat("tesseract_uses") * 12 +
    stat("ordinary_barrels") * 2 +
    stat("city_barrels") * 3 -
    stat("restoration") * 3
  );
}

function setSign(dim, x, y, z, text) {
  safeSet(dim, x, y, z, "minecraft:standing_sign");
  try {
    const sign = blockAt(dim, x, y, z)?.getComponent("minecraft:sign");
    if (sign) {
      sign.setText(text);
      try { sign.setWaxed(true); } catch {}
    }
  } catch {}
}

function addTask(tasks, x, y, z, typeId) {
  if (y < Y_MIN || y > Y_MAX) return;
  tasks.push([Math.floor(x), Math.floor(y), Math.floor(z), typeId]);
}

async function applyTasks(dim, tasks, chunkX, chunkZ, batchSize = 420) {
  let failed = 0;
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!regionIsLoaded(dim, chunkX, chunkZ)) throw new Error("Target chunk unloaded during generation");
    if (!safeSet(dim, task[0], task[1], task[2], task[3])) failed++;
    if (i > 0 && i % batchSize === 0) await waitTicks(1);
  }
  return failed;
}

/* ------------------------------ main lattice ------------------------------ */

function enqueueLattice(tasks, sx, sz) {
  for (let y = GRID_MIN; y <= GRID_MAX; y += GRID_STEP) {
    for (let x = sx; x < sx + REGION_SIZE; x++) {
      if (isGridLine(x)) {
        for (let z = sz; z < sz + REGION_SIZE; z++) addTask(tasks, x, y, z, "minecraft:bedrock");
      }
    }
    for (let z = sz; z < sz + REGION_SIZE; z++) {
      if (isGridLine(z)) {
        for (let x = sx; x < sx + REGION_SIZE; x++) addTask(tasks, x, y, z, "minecraft:bedrock");
      }
    }
  }
  for (let x = sx; x < sx + REGION_SIZE; x++) {
    if (!isGridLine(x)) continue;
    for (let z = sz; z < sz + REGION_SIZE; z++) {
      if (!isGridLine(z)) continue;
      for (let y = GRID_MIN; y <= GRID_MAX; y++) addTask(tasks, x, y, z, "minecraft:bedrock");
    }
  }
}

function enqueueMainTree(tasks, sx, sz) {
  if (sx !== 0 || sz !== 0) return;
  // The tree uses the same full 3x3x3 island as the other resource cells.
  // Grass forms the top, dirt fills the body, and bedrock occupies the exact
  // center block of the middle layer directly beneath the tree.
  for (let x = TREE.x - 1; x <= TREE.x + 1; x++) {
    for (let z = TREE.z - 1; z <= TREE.z + 1; z++) {
      addTask(tasks, x, -3, z, "minecraft:dirt");
      addTask(tasks, x, -2, z, "minecraft:dirt");
      addTask(tasks, x, -1, z, "minecraft:grass_block");
      addTask(tasks, x, -64, z, "minecraft:dirt");
    }
  }
  addTask(tasks, TREE.x, -2, TREE.z, "minecraft:bedrock");
  for (let y = 0; y <= 6; y++) addTask(tasks, TREE.x, y, TREE.z, "minecraft:oak_log");
  for (const layer of [
    { y: 3, r: 2 }, { y: 4, r: 2 }, { y: 5, r: 2 }, { y: 6, r: 1 }, { y: 7, r: 1 }
  ]) {
    for (let dx = -layer.r; dx <= layer.r; dx++) {
      for (let dz = -layer.r; dz <= layer.r; dz++) {
        if (Math.abs(dx) === layer.r && Math.abs(dz) === layer.r && hash(dx + TREE.x, dz + TREE.z, layer.y) < 0.36) continue;
        if (dx === 0 && dz === 0 && layer.y <= 6) continue;
        addTask(tasks, TREE.x + dx, layer.y, TREE.z + dz, "minecraft:oak_leaves");
      }
    }
  }
}

const PLATFORM_BLOCKS = [
  // Ordinary stone ores only: never deepslate or Nether ore variants.
  "minecraft:coal_ore",
  "minecraft:iron_ore",
  "minecraft:copper_ore",
  "minecraft:gold_ore",
  "minecraft:redstone_ore",
  "minecraft:lapis_ore",
  "minecraft:emerald_ore",
  "minecraft:diamond_ore"
];

function enqueueExtraPlatforms(tasks, sx, sz) {
  for (let bx = sx; bx < sx + REGION_SIZE; bx += GRID_STEP) {
    for (let bz = sz; bz < sz + REGION_SIZE; bz += GRID_STEP) {
      const cx = bx + 2;
      const cz = bz + 2;
      if (cx === TREE.x && cz === TREE.z) continue;
      const d = distance2D(cx, cz, TREE.x, TREE.z);
      let chance = 0.001;
      if (d <= 4.5) chance = 0.98;
      else if (d <= 8.5) chance = 0.86;
      else if (d <= 20) chance = 0.76 - (d - 8) * 0.025;
      else if (d <= 40) chance = 0.2 - (d - 20) * 0.009;
      else if (d <= 64) chance = 0.02;
      chance = Math.max(0.001, chance);
      if (hash(cx, cz, 12) > chance) continue;
      // Every resource island gets a 50/50 roll: ordinary stone or an ore.
      // If it rolls ore, each of the eight stone ores has equal probability.
      const pick = hash(cx, cz, 13) < 0.5
        ? "minecraft:stone"
        : PLATFORM_BLOCKS[Math.floor(hash(cx, cz, 14) * PLATFORM_BLOCKS.length)];
      // Each resource cell is a full 3x3x3 dirt island. The top is grass,
      // and the randomized resource sits in the center of the middle layer.
      for (let dy = -3; dy <= -1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            let typeId = "minecraft:dirt";
            if (dy === -1) typeId = "minecraft:grass_block";
            else if (dy === -2 && dx === 0 && dz === 0) typeId = pick;
            addTask(tasks, cx + dx, dy, cz + dz, typeId);
          }
        }
      }
    }
  }
}

function towerBounds(tower) {
  const half = Math.floor(tower.size / 2);
  // size is the distance between the outer lattice walls, not the number
  // of block coordinates. The inclusive max coordinate stays on the grid.
  return {
    minX: tower.x - half,
    maxX: tower.x + half,
    minZ: tower.z - half,
    maxZ: tower.z + half
  };
}

function pointInTower(x, z, tower) {
  const b = towerBounds(tower);
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
}

const LEGACY_TOWER_BLOCKS = new Set([
  "minecraft:stone_bricks",
  "minecraft:cracked_stone_bricks",
  "minecraft:water",
  "minecraft:chest",
  "minecraft:standing_sign"
]);

function clearLegacyTowerBlock(dim, tasks, x, y, z) {
  const block = blockAt(dim, x, y, z);
  if (block && LEGACY_TOWER_BLOCKS.has(block.typeId)) {
    addTask(tasks, x, y, z, "minecraft:air");
  }
}

function enqueueLegacyTowerCleanup(dim, tasks, tower, b, sx, sz) {
  const ex = sx + REGION_SIZE - 1;
  const ez = sz + REGION_SIZE - 1;
  const minX = Math.max(sx, b.minX);
  const maxX = Math.min(ex, b.maxX);
  const minZ = Math.max(sz, b.minZ);
  const maxZ = Math.min(ez, b.maxZ);

  // Earlier builds put their outer wall on size-1 instead of on the next
  // lattice coordinate. Remove those old walls before drawing the new grid.
  const legacyMaxX = b.minX + tower.size - 1;
  const legacyMaxZ = b.minZ + tower.size - 1;
  const legacyXWalls = [...new Set([b.minX, legacyMaxX])];
  const legacyZWalls = [...new Set([b.minZ, legacyMaxZ])];
  for (const x of legacyXWalls) {
    if (x < sx || x > ex) continue;
    for (let z = Math.max(sz, b.minZ); z <= Math.min(ez, legacyMaxZ); z++) {
      if (z < b.minZ || z > legacyMaxZ) continue;
      for (let y = 1; y <= tower.height; y++) clearLegacyTowerBlock(dim, tasks, x, y, z);
    }
  }
  for (const z of legacyZWalls) {
    if (z < sz || z > ez) continue;
    for (let x = Math.max(sx, b.minX); x <= Math.min(ex, legacyMaxX); x++) {
      if (x < b.minX || x > legacyMaxX) continue;
      for (let y = 1; y <= tower.height; y++) clearLegacyTowerBlock(dim, tasks, x, y, z);
    }
  }

  // Remove the old giant 3x3 water shaft and its raised central ledge.
  for (let x = tower.x - 1; x <= tower.x + 1; x++) {
    if (x < sx || x > ex) continue;
    for (let z = tower.z - 1; z <= tower.z + 1; z++) {
      if (z < sz || z > ez) continue;
      for (let y = 1; y <= tower.height; y++) {
        const block = blockAt(dim, x, y, z);
        if (block?.typeId === "minecraft:water") addTask(tasks, x, y, z, "minecraft:air");
      }
      if (tower.height === 312) {
        clearLegacyTowerBlock(dim, tasks, x, tower.height + 1, z);
      }
    }
  }

  // Remove old deterministic chest/sign positions so this layout can replace
  // them with chests placed safely inside the new room cells.
  for (let floorY = 12; floorY < tower.height; floorY += 12) {
    const p = 0.025 + 0.30 * (floorY / tower.height);
    if (hash(tower.x + floorY, tower.z, 34) >= p && floorY !== 12) continue;
    const chestX = b.minX + 3;
    const chestZ = b.minZ + 3 + Math.floor(hash(tower.x, floorY, 35) * Math.max(1, tower.size - 6));
    if (chestX >= sx && chestX <= ex && chestZ >= sz && chestZ <= ez) {
      clearLegacyTowerBlock(dim, tasks, chestX, floorY + 1, chestZ);
    }
    if (floorY === 12) {
      const signX = chestX + 1;
      if (signX >= sx && signX <= ex && chestZ >= sz && chestZ <= ez) {
        clearLegacyTowerBlock(dim, tasks, signX, floorY + 1, chestZ);
      }
    }
  }
}

function isTowerExteriorOpening(tower, face, panelIndex, floorIndex) {
  const panelCount = tower.size / GRID_STEP;
  const openingCount = hash(tower.x + floorIndex * 3, tower.z, 410) < 0.35 ? 2 : 1;
  for (let slot = 0; slot < openingCount; slot++) {
    const chosenFace = Math.floor(hash(tower.x + floorIndex + slot * 11, tower.z + floorIndex, 411) * 4);
    const chosenPanel = Math.floor(hash(tower.x + floorIndex * 5 + slot, tower.z + 17, 412) * panelCount);
    if (chosenFace === face && chosenPanel === panelIndex) return true;
  }
  return false;
}

function enqueueTowerWaterClimbs(tasks, tower, b, sx, sz) {
  const corners = [
    { x: b.minX + 1, z: b.minZ + 1, openX: 1, openZ: 0 },
    { x: b.maxX - 1, z: b.minZ + 1, openX: 0, openZ: 1 },
    { x: b.maxX - 1, z: b.maxZ - 1, openX: -1, openZ: 0 },
    { x: b.minX + 1, z: b.maxZ - 1, openX: 0, openZ: -1 }
  ];
  const ex = sx + REGION_SIZE - 1;
  const ez = sz + REGION_SIZE - 1;

  // Each storey gets a one-block water climb in a different corner room.
  // It is only four blocks tall and opens through the next floor at that
  // corner, instead of filling a giant central shaft through the whole tower.
  for (let floorY = 0; floorY < tower.height; floorY += GRID_STEP) {
    const corner = corners[(floorY / GRID_STEP) % corners.length];
    const x = corner.x;
    const z = corner.z;
    if (x < sx || x > ex || z < sz || z > ez) continue;

    for (let y = floorY + 1; y <= floorY + GRID_STEP; y++) {
      addTask(tasks, x, y, z, "minecraft:water");
    }

    // A small three-sided stone niche keeps most of the water in its corner.
    // A two-block opening faces into the room so the player can enter it.
    for (let localY = 1; localY <= 3; localY++) {
      const y = floorY + localY;
      for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        if (dx === corner.openX && dz === corner.openZ && localY <= 2) continue;
        const wx = x + dx;
        const wz = z + dz;
        // A neighboring chunk owns its own blocks. The two outside corner
        // walls are also created by the matching lattice-aligned wall pass.
        if (wx < sx || wx > ex || wz < sz || wz > ez) continue;
        addTask(tasks, wx, y, wz, "minecraft:stone");
      }
    }
  }
}

function enqueueTowerSlices(dim, tasks, chestList, signList, sx, sz) {
  const ex = sx + REGION_SIZE - 1;
  const ez = sz + REGION_SIZE - 1;

  for (const tower of TOWER_LIST) {
    const b = towerBounds(tower);
    if (b.maxX < sx || b.minX > ex || b.maxZ < sz || b.minZ > ez) continue;

    const minX = Math.max(sx, b.minX);
    const maxX = Math.min(ex, b.maxX);
    const minZ = Math.max(sz, b.minZ);
    const maxZ = Math.min(ez, b.maxZ);

    enqueueLegacyTowerCleanup(dim, tasks, tower, b, sx, sz);

    // Horizontal floors follow the original lattice spacing exactly.
    // Bedrock remains on every lattice rail; regular stone fills each 3x3 cell.
    for (let floorY = 0; floorY <= tower.height; floorY += GRID_STEP) {
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          addTask(tasks, x, floorY, z,
            isGridLine(x) || isGridLine(z) ? "minecraft:bedrock" : "minecraft:stone");
        }
      }
    }

    // Extend the lattice's vertical bedrock posts upward at every grid crossing.
    for (let x = Math.ceil(b.minX / GRID_STEP) * GRID_STEP; x <= b.maxX; x += GRID_STEP) {
      if (x < minX || x > maxX) continue;
      for (let z = Math.ceil(b.minZ / GRID_STEP) * GRID_STEP; z <= b.maxZ; z += GRID_STEP) {
        if (z < minZ || z > maxZ) continue;
        for (let y = 1; y < tower.height; y++) {
          addTask(tasks, x, y, z, "minecraft:bedrock");
        }
      }
    }

    // Fill each lattice wall cell with regular stone. Each 4x4 lattice cell
    // becomes a room with a 3x3 open interior and 3 blocks of headroom.
    for (let floorY = 0; floorY < tower.height; floorY += GRID_STEP) {
      const floorIndex = floorY / GRID_STEP;

      for (let x = Math.ceil(b.minX / GRID_STEP) * GRID_STEP; x <= b.maxX; x += GRID_STEP) {
        if (x < minX || x > maxX) continue;
        const exterior = x === b.minX || x === b.maxX;
        const face = x === b.minX ? 0 : 1;
        for (let z = minZ; z <= maxZ; z++) {
          if (isGridLine(z)) continue;
          const cellZ = Math.floor((z - b.minZ) / GRID_STEP);
          const zOffset = ((z - b.minZ) % GRID_STEP + GRID_STEP) % GRID_STEP;
          const outerHole = exterior && isTowerExteriorOpening(tower, face, cellZ, floorIndex);
          for (let localY = 1; localY < GRID_STEP; localY++) {
            const y = floorY + localY;
            const doorway = !exterior && localY <= 2 && (zOffset === 1 || zOffset === 2);
            addTask(tasks, x, y, z, outerHole || doorway ? "minecraft:air" : "minecraft:stone");
          }
        }
      }

      for (let z = Math.ceil(b.minZ / GRID_STEP) * GRID_STEP; z <= b.maxZ; z += GRID_STEP) {
        if (z < minZ || z > maxZ) continue;
        const exterior = z === b.minZ || z === b.maxZ;
        const face = z === b.minZ ? 2 : 3;
        for (let x = minX; x <= maxX; x++) {
          if (isGridLine(x)) continue;
          const cellX = Math.floor((x - b.minX) / GRID_STEP);
          const xOffset = ((x - b.minX) % GRID_STEP + GRID_STEP) % GRID_STEP;
          const outerHole = exterior && isTowerExteriorOpening(tower, face, cellX, floorIndex);
          for (let localY = 1; localY < GRID_STEP; localY++) {
            const y = floorY + localY;
            const doorway = !exterior && localY <= 2 && (xOffset === 1 || xOffset === 2);
            addTask(tasks, x, y, z, outerHole || doorway ? "minecraft:air" : "minecraft:stone");
          }
        }
      }
    }

    enqueueTowerWaterClimbs(tasks, tower, b, sx, sz);

    // Chests are placed inside room cells, away from lattice intersections.
    for (let floorY = 12; floorY < tower.height; floorY += 12) {
      const p = 0.025 + 0.30 * (floorY / tower.height);
      if (hash(tower.x + floorY, tower.z, 34) >= p && floorY !== 12) continue;
      const roomCount = tower.size / GRID_STEP;
      const roomX = Math.floor(hash(tower.x, floorY, 35) * roomCount);
      const roomZ = Math.floor(hash(tower.z, floorY, 36) * roomCount);
      const chestX = b.minX + roomX * GRID_STEP + 2;
      const chestZ = b.minZ + roomZ * GRID_STEP + 2;
      if (chestX >= sx && chestX <= ex && chestZ >= sz && chestZ <= ez) {
        addTask(tasks, chestX, floorY + 1, chestZ, "minecraft:chest");
        chestList.push({ x: chestX, y: floorY + 1, z: chestZ, topness: floorY / tower.height, quote: floorY === 12 });
        if (floorY === 12) signList.push({
          x: chestX + 1, y: floorY + 1, z: chestZ,
          text: "Who are you doing this for?"
        });
      }
    }
  }
}

function addTesseractPoint(tasks, x, y, z, sx, sz, typeId = "minecraft:bedrock") {
  if (x < sx || x >= sx + REGION_SIZE || z < sz || z >= sz + REGION_SIZE) return;
  addTask(tasks, x, y, z, typeId);
}

function enqueueTesseractCubeEdges(tasks, sx, sz, centerY, radius) {
  const cx = TESS.x;
  const cz = TESS.z;
  const minX = cx - radius;
  const maxX = cx + radius;
  const minY = centerY - radius;
  const maxY = centerY + radius;
  const minZ = cz - radius;
  const maxZ = cz + radius;

  for (let x = minX; x <= maxX; x++) {
    for (const y of [minY, maxY]) {
      for (const z of [minZ, maxZ]) addTesseractPoint(tasks, x, y, z, sx, sz);
    }
  }
  for (let y = minY; y <= maxY; y++) {
    for (const x of [minX, maxX]) {
      for (const z of [minZ, maxZ]) addTesseractPoint(tasks, x, y, z, sx, sz);
    }
  }
  for (let z = minZ; z <= maxZ; z++) {
    for (const y of [minY, maxY]) {
      for (const x of [minX, maxX]) addTesseractPoint(tasks, x, y, z, sx, sz);
    }
  }
}

function enqueueTesseractConnectors(tasks, sx, sz) {
  for (const signX of [-1, 1]) {
    for (const signY of [-1, 1]) {
      for (const signZ of [-1, 1]) {
        let x = TESS.x + signX * TESS_OUTER_RADIUS;
        let y = TESS_CENTER_Y + signY * TESS_OUTER_RADIUS;
        let z = TESS.z + signZ * TESS_OUTER_RADIUS;
        addTesseractPoint(tasks, x, y, z, sx, sz);
        // Stair-step each connector one block at a time so it is physically
        // continuous in Minecraft, joining every outer corner to its inner one.
        for (let step = 0; step < TESS_OUTER_RADIUS - TESS_INNER_RADIUS; step++) {
          x -= signX;
          addTesseractPoint(tasks, x, y, z, sx, sz);
          y -= signY;
          addTesseractPoint(tasks, x, y, z, sx, sz);
          z -= signZ;
          addTesseractPoint(tasks, x, y, z, sx, sz);
        }
      }
    }
  }
}

function enqueueTesseract(tasks, sx, sz) {
  const consumed = stat("tesseract_consumed") > 0;
  const minX = TESS.x - 16;
  const maxX = TESS.x + 16;
  const minZ = TESS.z - 16;
  const maxZ = TESS.z + 16;
  const ex = sx + REGION_SIZE - 1;
  const ez = sz + REGION_SIZE - 1;
  if (sx > maxX || ex < minX || sz > maxZ || ez < minZ) return;

  // Clear the old nested-square structure and any partially built new frame
  // inside this region before drawing the intended bedrock wireframe.
  for (let x = Math.max(sx, minX); x <= Math.min(ex, maxX); x++) {
    for (let z = Math.max(sz, minZ); z <= Math.min(ez, maxZ); z++) {
      for (let y = 1; y <= TESS_CENTER_Y + TESS_OUTER_RADIUS; y++) {
        addTask(tasks, x, y, z, "minecraft:air");
      }
    }
  }

  if (consumed) {
    addTesseractPoint(tasks, TESS.x, TESS_CENTER_Y, TESS.z, sx, sz, "minecraft:obsidian");
    return;
  }

  // A recognizable 3D tesseract projection: an outer bedrock cube, a smaller
  // inner bedrock cube, and eight continuous corner-to-corner connectors.
  enqueueTesseractCubeEdges(tasks, sx, sz, TESS_CENTER_Y, TESS_OUTER_RADIUS);
  enqueueTesseractCubeEdges(tasks, sx, sz, TESS_CENTER_Y, TESS_INNER_RADIUS);
  enqueueTesseractConnectors(tasks, sx, sz);
  addTesseractPoint(tasks, TESS.x, TESS_CENTER_Y, TESS.z, sx, sz, "minecraft:stone");
}

const BIOME_LOOT = [
  ["minecraft:oak_log", "minecraft:oak_sapling", "minecraft:apple", "minecraft:oak_leaves"],
  ["minecraft:sand", "minecraft:cactus", "minecraft:dead_bush", "minecraft:bone"],
  ["minecraft:stone", "minecraft:coal", "minecraft:raw_iron", "minecraft:gravel"],
  ["minecraft:spruce_log", "minecraft:spruce_sapling", "minecraft:snowball", "minecraft:sweet_berries"],
  ["minecraft:jungle_log", "minecraft:vine", "minecraft:cocoa_beans", "minecraft:bamboo"],
  ["minecraft:kelp", "minecraft:seagrass", "minecraft:prismarine_shard", "minecraft:sand"],
  ["minecraft:grass", "minecraft:wheat_seeds", "minecraft:dandelion", "minecraft:poppy"]
];

function barrelProperty(x, y, z) {
  return "log:barrel_" + x + "_" + y + "_" + z;
}

function chestFilledProperty(x, y, z) {
  return "log:chest_" + x + "_" + y + "_" + z;
}

function fillContainer(dim, x, y, z, itemIds, salt = 0, treasure = false) {
  try {
    const container = blockAt(dim, x, y, z)?.getComponent("minecraft:inventory")?.container;
    if (!container) return false;
    container.clear();
    for (let slot = 0; slot < container.size; slot++) {
      const roll = hash(x + slot, z - slot, salt + y);
      let itemId;
      let amount;
      if (treasure) {
        if (roll < 0.54) itemId = "minecraft:stone";
        else if (roll < 0.68) itemId = "minecraft:cobblestone";
        else if (roll < 0.79) itemId = "minecraft:coal";
        else if (roll < 0.87) itemId = "minecraft:raw_iron";
        else if (roll < 0.925) itemId = "minecraft:raw_copper";
        else if (roll < 0.96) itemId = "minecraft:raw_gold";
        else if (roll < 0.982) itemId = "minecraft:diamond";
        else if (roll < 0.992) itemId = "minecraft:emerald";
        else itemId = "minecraft:iron_ingot";
        amount = itemId === "minecraft:stone" || itemId === "minecraft:cobblestone" ? 2 + Math.floor(roll * 20) : 1 + Math.floor(roll * 3);
      } else {
        itemId = itemIds[Math.floor(roll * itemIds.length)];
        amount = 1 + Math.floor(hash(x, z + slot, salt + 77) * 5);
      }
      try { container.setItem(slot, new ItemStack(itemId, Math.min(64, Math.max(1, amount)))); } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

function enqueueBiomeBarrel(tasks, barrels, cx, cz, city = false, sx = 0, sz = 0) {
  const openedLoss = city ? stat("city_barrels") : stat("ordinary_barrels");
  const baseChance = city ? 0.018 : 0.012;
  const chance = Math.max(0.001, baseChance * Math.exp(-openedLoss / (city ? 22 : 28)));
  const normalRoll = hash(cx, cz, city ? 81 : 71);
  if (normalRoll >= chance) return;
  const rare = hash(cx, cz, 99) < 0.045;
  const y = 5;
  for (let yy = 1; yy <= 4; yy++) addTask(tasks, cx, yy, cz, city ? "minecraft:polished_blackstone_bricks" : "minecraft:stone_bricks");
  addTask(tasks, cx, y, cz, "minecraft:barrel");
  barrels.push({ x: cx, y, z: cz, kind: rare ? "special" : (city ? "city" : "ordinary"), salt: Math.floor(hash(cx, cz, 100) * BIOME_LOOT.length) });
}

function enqueueBarrelsForRegion(tasks, barrels, sx, sz) {
  const cityMinX = 48;
  const cityMaxX = 208;
  const cityMinZ = 32;
  const cityMaxZ = 248;
  for (let bx = sx; bx < sx + REGION_SIZE; bx += 4) {
    for (let bz = sz; bz < sz + REGION_SIZE; bz += 4) {
      const cx = bx + 2;
      const cz = bz + 2;
      if (distance2D(cx, cz, TREE.x, TREE.z) < 52) continue;
      if (Math.abs(cx - TESS.x) <= 20 && Math.abs(cz - TESS.z) <= 20) continue;
      let insideBuilding = false;
      for (const tower of TOWER_LIST) if (pointInTower(cx, cz, tower)) insideBuilding = true;
      if (insideBuilding) continue;
      const inCity = cx >= cityMinX && cx <= cityMaxX && cz >= cityMinZ && cz <= cityMaxZ;
      enqueueBiomeBarrel(tasks, barrels, cx, cz, inCity, sx, sz);
    }
  }
}

async function generateMainRegion(rx, rz) {
  const latticeKey = regionKey("region_lattice_v106", rx, rz);
  if (world.getDynamicProperty(latticeKey) === true || generatingMain.has(latticeKey)) {
    queueMainStructures(rx, rz);
    return;
  }
  const dim = mainDim();
  generatingMain.add(latticeKey);
  let areaId;
  try {
    areaId = await acquireRegionTickingArea("lattice", dim, rx, rz, GRID_MIN, GRID_MAX);
    world.setDynamicProperty(latticeKey, "building");
    const latticeTasks = [];
    enqueueLattice(latticeTasks, rx * REGION_SIZE, rz * REGION_SIZE);
    await applyTasks(dim, latticeTasks, rx, rz, 300);
    world.setDynamicProperty(latticeKey, true);
    lastLatticeGenerationError = "none";
  } catch (error) {
    latticeGenerationFailures++;
    lastLatticeGenerationError = String(error).slice(0, 180);
    try { world.setDynamicProperty(latticeKey, false); } catch {}
    console.warn("[Lattice of Greed] Lattice generation paused: " + String(error));
  } finally {
    releaseRegionTickingArea(areaId);
    generatingMain.delete(latticeKey);
    // Start the heavier build only after the lattice area's reservation has
    // been released. Overlapping areas count twice toward Bedrock's quota.
    if (world.getDynamicProperty(latticeKey) === true) {
      system.runTimeout(() => queueMainStructures(rx, rz), 1);
    }
  }
}

function queueMainStructures(rx, rz) {
  const key = regionKey("region_main_v106", rx, rz);
  const id = rx + "," + rz;
  if (world.getDynamicProperty(key) === true || generatingMainStructures.has(key) ||
      queuedMainStructures.has(id)) return;
  queuedMainStructures.add(id);
  mainStructureQueue.push({ rx, rz });
  pumpMainStructureQueue();
}

function pumpMainStructureQueue() {
  mainStructureQueue.sort((a, b) =>
    (Math.abs(a.rx - focusMainRegionX) + Math.abs(a.rz - focusMainRegionZ)) -
    (Math.abs(b.rx - focusMainRegionX) + Math.abs(b.rz - focusMainRegionZ))
  );
  while (activeMainStructures < MAX_ACTIVE_MAIN_STRUCTURES && mainStructureQueue.length > 0) {
    const next = mainStructureQueue.shift();
    queuedMainStructures.delete(next.rx + "," + next.rz);
    const key = regionKey("region_main_v106", next.rx, next.rz);
    if (world.getDynamicProperty(key) === true || generatingMainStructures.has(key)) continue;
    activeMainStructures++;
    void generateMainStructures(next.rx, next.rz).finally(() => {
      activeMainStructures = Math.max(0, activeMainStructures - 1);
      pumpMainStructureQueue();
    });
  }
}

async function generateMainStructures(rx, rz) {
  const key = regionKey("region_main_v106", rx, rz);
  if (world.getDynamicProperty(key) === true || generatingMainStructures.has(key)) return;
  const dim = mainDim();
  generatingMainStructures.add(key);
  let areaId;
  const sx = rx * REGION_SIZE;
  const sz = rz * REGION_SIZE;
  const tasks = [];
  const chests = [];
  const signs = [];
  const barrels = [];
  try {
    areaId = await acquireRegionTickingArea("structure", dim, rx, rz, Y_MIN, Y_MAX);
    world.setDynamicProperty(key, "building");
    enqueueMainTree(tasks, sx, sz);
    enqueueExtraPlatforms(tasks, sx, sz);
    enqueueTowerSlices(dim, tasks, chests, signs, sx, sz);
    enqueueTesseract(tasks, sx, sz);
    enqueueBarrelsForRegion(tasks, barrels, sx, sz);
    await applyTasks(dim, tasks, rx, rz, 420);
    for (const chest of chests) {
      system.runTimeout(() => {
        const done = fillContainer(dim, chest.x, chest.y, chest.z, [], chest.y, true);
        if (done) {
          try { world.setDynamicProperty(chestFilledProperty(chest.x, chest.y, chest.z), true); } catch {}
          if (chest.quote) {
            try {
              const inventory = blockAt(dim, chest.x, chest.y, chest.z)?.getComponent("minecraft:inventory")?.container;
              const note = new ItemStack("minecraft:book", 1);
              note.nameTag = "A note from the author";
              note.setLore(["Who are you doing this for?"]);
              inventory?.setItem(0, note);
            } catch {}
            setSign(dim, chest.x + 1, chest.y, chest.z, "Who are you doing this for?");
          }
        }
      }, 2);
    }
    for (const sign of signs) setSign(dim, sign.x, sign.y, sign.z, sign.text);
    for (const barrel of barrels) {
      try { world.setDynamicProperty(barrelProperty(barrel.x, barrel.y, barrel.z), barrel.kind); } catch {}
      const contents = BIOME_LOOT[barrel.salt] || BIOME_LOOT[0];
      system.runTimeout(() => {
        fillContainer(dim, barrel.x, barrel.y, barrel.z, contents, barrel.salt, false);
      }, 2);
    }
    world.setDynamicProperty(key, true);
    lastStructureGenerationError = "none";
  } catch (error) {
    structureGenerationFailures++;
    lastStructureGenerationError = String(error).slice(0, 180);
    try { world.setDynamicProperty(key, false); } catch {}
    console.warn("[Lattice of Greed] Structure generation paused: " + String(error));
  } finally {
    releaseRegionTickingArea(areaId);
    generatingMainStructures.delete(key);
  }
}

function pumpMainRegionQueue() {
  mainRegionQueue.sort((a, b) =>
    (Math.abs(a.rx - focusMainRegionX) + Math.abs(a.rz - focusMainRegionZ)) -
    (Math.abs(b.rx - focusMainRegionX) + Math.abs(b.rz - focusMainRegionZ))
  );
  while (activeMainRegions < MAX_ACTIVE_MAIN_REGIONS && mainRegionQueue.length > 0) {
    const next = mainRegionQueue.shift();
    queuedMainRegions.delete(next.rx + "," + next.rz);
    const key = regionKey("region_lattice_v106", next.rx, next.rz);
    if (world.getDynamicProperty(key) === true) {
      queueMainStructures(next.rx, next.rz);
      continue;
    }
    if (generatingMain.has(key)) continue;

    activeMainRegions++;
    void generateMainRegion(next.rx, next.rz).finally(() => {
      activeMainRegions = Math.max(0, activeMainRegions - 1);
      pumpMainRegionQueue();
    });
  }
}

function generateLoadedMainRegions(player) {
  if (player.dimension.id !== DIM.main) return;
  const rx = floorDiv(player.location.x, REGION_SIZE);
  const rz = floorDiv(player.location.z, REGION_SIZE);
  focusMainRegionX = rx;
  focusMainRegionZ = rz;

  // Recheck all nearby chunks as the player moves. The lattice has its own
  // short queue, separate from the slow structure queue, so tower generation
  // can never monopolize the workers that extend the walkable grid.
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = rx + dx;
      const z = rz + dz;
      const latticeKey = regionKey("region_lattice_v106", x, z);
      const queueId = x + "," + z;
      if (world.getDynamicProperty(latticeKey) === true) {
        queueMainStructures(x, z);
        continue;
      }
      if (generatingMain.has(latticeKey) || queuedMainRegions.has(queueId)) continue;
      queuedMainRegions.add(queueId);
      mainRegionQueue.push({ rx: x, rz: z });
    }
  }
  pumpMainRegionQueue();
  pumpMainStructureQueue();
}

function enqueueDreamRegion(tasks, sx, sz, damage, restoration, tesseractDamage, treesCut) {
  const ex = sx + REGION_SIZE - 1;
  const ez = sz + REGION_SIZE - 1;
  const radius = DREAM_EDGE;
  for (let x = sx; x <= ex; x++) {
    for (let z = sz; z <= ez; z++) {
      const edge = Math.max(Math.abs(x), Math.abs(z));
      if (edge > radius) continue;
      if (Math.abs(x) <= 1 && Math.abs(z) <= 1) continue; // open exit shaft
      const broad = Math.sin(x * 0.27) * 2.2 + Math.cos(z * 0.23) * 2.0;
      const small = Math.sin((x + z) * 0.43) * 1.2 + Math.cos((x - z) * 0.31) * 0.8;
      let variation = broad + small;
      const flattening = clamp(tesseractDamage / 160, 0, 0.92);
      if (Math.abs(x) <= 3 || Math.abs(z) <= 3) variation *= 1 - flattening;
      if (damage > 48 && (Math.abs(x) <= 5 || Math.abs(z) <= 5)) variation *= 0.25;
      const h = DREAM_CENTER.y + Math.round(variation);
      const damagedPatch = hash(x, z, 1) < Math.min(0.46, damage / 220);
      const restoredPatch = hash(x, z, 2) < Math.min(0.38, restoration / 90);
      for (let y = h - 3; y < h - 1; y++) addTask(tasks, x, y, z, "minecraft:stone");
      addTask(tasks, x, h - 1, z, "minecraft:dirt");
      addTask(tasks, x, h, z, damagedPatch && hash(x, z, 3) < 0.55 ? "minecraft:cobblestone" : "minecraft:grass_block");
      if (damagedPatch && hash(x, z, 4) < 0.25) addTask(tasks, x, h - 1, z, "minecraft:cobblestone");
      else if (restoredPatch && edge > 4) addTask(tasks, x, h, z, "minecraft:moss_block");
      if (restoration > 0 && restoredPatch && edge > 5 && hash(x, z, 5) < 0.2) {
        addTask(tasks, x, h + 1, z, hash(x, z, 6) < 0.5 ? "minecraft:dandelion" : "minecraft:azure_bluet");
      }
      if (damage > 80 && edge > 7 && hash(x, z, 7) < 0.025) addTask(tasks, x, h + 1, z, "minecraft:dead_bush");
      // Fallen-looking logs are sparse and appear only after the main tree is harvested.
      if (treesCut > 0 && edge > 5 && hash(x, z, 18) < Math.min(0.018, treesCut * 0.003)) {
        const alongX = hash(x, z, 19) < 0.5;
        for (let k = -1; k <= 1; k++) {

          addTask(tasks, x + (alongX ? k : 0), h + 1, z + (alongX ? 0 : k), "minecraft:oak_log");
          if (k !== 0) addTask(tasks, x + (alongX ? k : 0), h + 2, z + (alongX ? 0 : k), "minecraft:oak_leaves");
        }
      }
    }
  }

  // Tesseract-like frame, always surrounded by ordinary dream terrain.
  for (let x = Math.max(sx, -12); x <= Math.min(ex, 12); x++) {
    for (let z = Math.max(sz, -12); z <= Math.min(ez, 12); z++) {
      const dx = Math.abs(x);
      const dz = Math.abs(z);
      for (let y = 64; y <= 73; y++) {
        const isFrame = [4, 8, 12].some(r => (dx === r && dz <= r) || (dz === r && dx <= r));
        if (isFrame && (y === 64 || y === 73 || y === 68 || dx === dz)) {
          addTask(tasks, x, y, z, dx === 4 || dz === 4 ? "minecraft:crying_obsidian" : "minecraft:obsidian");
        }
      }
    }
  }
  for (let x = Math.max(sx, -1); x <= Math.min(ex, 1); x++) {
    for (let z = Math.max(sz, -1); z <= Math.min(ez, 1); z++) {
      for (let y = 36; y <= 78; y++) addTask(tasks, x, y, z, "minecraft:air");
    }
  }
}

async function generateDreamRegion(rx, rz, signature) {
  const key = regionKey("region_dream", rx, rz, signature);
  if (world.getDynamicProperty(key) === true || generatingDream.has(key)) return;
  const dim = dreamDim();
  if (!regionIsLoaded(dim, rx, rz)) return;
  generatingDream.add(key);
  const sx = rx * REGION_SIZE;
  const sz = rz * REGION_SIZE;
  const tasks = [];
  try {
    enqueueDreamRegion(tasks, sx, sz, currentDamageScore(), stat("restoration"), stat("tesseract_mined") + stat("tesseract_uses") * 12, stat("trees_cut"));
    await applyTasks(dim, tasks, rx, rz, 350);
    const clues = [
      { x: 6, z: 0, text: "Does the terrain look a bit flat to you?" },
      { x: -7, z: 0, text: "You can't make something from nothing." },
      { x: 0, z: 10, text: "Take what you need. Please use what you take." }
    ];
    for (const clue of clues) {
      if (clue.x >= sx && clue.x < sx + REGION_SIZE && clue.z >= sz && clue.z < sz + REGION_SIZE) {
        const surface = dreamHeight(clue.x, clue.z);
        setSign(dim, clue.x, surface + 1, clue.z, clue.text);
      }
    }
    if (stat("restoration") > 12) {
      for (const p of [-18, -12, 12, 18]) {
        if (p >= sx && p < sx + REGION_SIZE && 15 >= sz && 15 < sz + REGION_SIZE) {
          safeSet(dim, p, dreamHeight(p, 15) + 1, 15, "minecraft:glowstone");
        }
      }
    }
    world.setDynamicProperty(key, true);
  } catch (error) {
    console.warn("[Lattice of Greed] Dream generation paused: " + String(error));
  } finally {
    generatingDream.delete(key);
  }
}

function dreamHeight(x, z) {
  let variation = Math.sin(x * 0.27) * 2.2 + Math.cos(z * 0.23) * 2.0 +
    Math.sin((x + z) * 0.43) * 1.2 + Math.cos((x - z) * 0.31) * 0.8;
  const flattening = clamp((stat("tesseract_mined") + stat("tesseract_uses") * 12) / 160, 0, 0.92);
  if (Math.abs(x) <= 3 || Math.abs(z) <= 3) variation *= 1 - flattening;
  if (currentDamageScore() > 48 && (Math.abs(x) <= 5 || Math.abs(z) <= 5)) variation *= 0.25;
  return DREAM_CENTER.y + Math.round(variation);
}

function dreamSignature() {
  return "e" + Math.floor(stat("extraction") / 8) +
    "_r" + Math.floor(stat("restoration") / 5) +
    "_t" + Math.floor((stat("tesseract_mined") + stat("tesseract_uses") * 12) / 8) +
    "_c" + Math.floor(stat("trees_cut"));
}

async function generateDreamAroundPlayer(player) {
  const rx = floorDiv(player.location.x, REGION_SIZE);
  const rz = floorDiv(player.location.z, REGION_SIZE);
  const signature = dreamSignature();
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const x = rx + dx;
      const z = rz + dz;
      if (Math.max(Math.abs(x * REGION_SIZE), Math.abs(z * REGION_SIZE)) > DREAM_EDGE + REGION_SIZE) continue;
      if (regionIsLoaded(dreamDim(), x, z)) await generateDreamRegion(x, z, signature);
    }
  }
}

function spawnDreamWatchers(player, session) {
  session.watchers = [];
  // Most dreams contain no watcher. Its rarity helps preserve the uncanny effect.
  const roll = hash(player.location.x + session.startedAt, player.location.z, 91);
  if (roll > 0.24) return;

  const angle = hash(player.location.x, player.location.z + session.startedAt, 92) * Math.PI * 2;
  const radius = 18 + Math.floor(hash(session.startedAt, player.location.z, 93) * 5);
  const x = Math.round(Math.cos(angle) * radius);
  const z = Math.round(Math.sin(angle) * radius);
  const y = dreamHeight(x, z) + 1;
  try {
    const type = hash(x, z, 94) < 0.5 ? "minecraft:sheep" : "minecraft:cow";
    const watcher = dreamDim().spawnEntity(type, { x: x + 0.5, y, z: z + 0.5 });
    watcher.addTag("log:dream_watcher");
    try { watcher.addEffect("slowness", NIGHTMARE_TICKS, { amplifier: 8, showParticles: false }); } catch {}
    try { watcher.addEffect("resistance", NIGHTMARE_TICKS, { amplifier: 4, showParticles: false }); } catch {}
    watcher.lookAt({ x: player.location.x, y: player.location.y + 1, z: player.location.z });
    session.watchers.push({ id: watcher.id, x: x + 0.5, y, z: z + 0.5 });
  } catch {
    // A watcher is optional; unsupported entity behavior must not block a dream.
  }
}

function updateDreamWatchers(player, session) {
  if (!session.watchers?.length || system.currentTick % 20 !== 0) return;
  for (const watcherData of session.watchers) {
    try {
      const watcher = world.getEntity(watcherData.id);
      if (!watcher || watcher.dimension.id !== DIM.dream) continue;
      watcher.teleport(
        { x: watcherData.x, y: watcherData.y, z: watcherData.z },
        { dimension: dreamDim() }
      );
      watcher.lookAt({ x: player.location.x, y: player.location.y + 1, z: player.location.z });
    } catch {}
  }
}

function saveInventory(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  const inventory = [];
  if (container) {
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      inventory.push(item ? item.clone() : undefined);
    }
  }
  const equipment = new Map();
  const equip = player.getComponent("minecraft:equippable");
  if (equip) {
    for (const slot of EQUIPMENT_SLOTS) {
      try {
        const item = equip.getEquipment(slot);
        equipment.set(slot, item ? item.clone() : undefined);
      } catch { equipment.set(slot, undefined); }
    }
  }
  let hiddenHud = [];
  try { hiddenHud = player.onScreenDisplay.getHiddenHudElements(); } catch {}
  let gameMode = GameMode.Survival;
  try { gameMode = player.getGameMode(); } catch {}
  return { inventory, equipment, hiddenHud, gameMode };
}

function serializeItem(item) {
  if (!item) return null;
  const out = { typeId: item.typeId, amount: item.amount };
  try { if (item.nameTag) out.nameTag = item.nameTag; } catch {}
  try {
    const lore = item.getLore();
    if (lore?.length) out.lore = lore;
  } catch {}
  try {
    const durability = item.getComponent("minecraft:durability");
    if (durability) out.damage = durability.damage;
  } catch {}
  return out;
}

function persistDreamBackup(player, saved) {
  const payload = {
    dimensionId: DIM.main,
    location: saved.location,
    rotation: saved.rotation,
    inventory: saved.inventory.inventory.map(serializeItem),
    equipment: EQUIPMENT_SLOTS.map(slot => ({ slot, item: serializeItem(saved.inventory.equipment.get(slot)) })),
    hiddenHud: saved.inventory.hiddenHud,
    gameMode: String(saved.inventory.gameMode)
  };
  try { world.setDynamicProperty(backupKey(player), JSON.stringify(payload)); } catch {}
}

function restoreSerializedItem(data) {
  if (!data || !data.typeId) return undefined;
  try {
    const item = new ItemStack(data.typeId, Math.max(1, Math.min(64, data.amount || 1)));
    if (data.nameTag) item.nameTag = data.nameTag;
    if (data.lore) item.setLore(data.lore);
    if (typeof data.damage === "number") {
      const durability = item.getComponent("minecraft:durability");
      if (durability) durability.damage = data.damage;
    }
    return item;
  } catch {
    return undefined;
  }
}

function restoreSerializedBackup(player) {
  let payload;
  try {
    const raw = world.getDynamicProperty(backupKey(player));
    if (typeof raw !== "string") return false;
    payload = JSON.parse(raw);
  } catch { return false; }

  const dimId = payload.dimensionId || DIM.main;
  try {
    player.teleport(payload.location || MAIN_SPAWN, {
      dimension: world.getDimension(dimId),
      rotation: payload.rotation
    });
  } catch {
    try { player.teleport(MAIN_SPAWN, { dimension: mainDim() }); } catch {}
  }
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container && Array.isArray(payload.inventory)) {
    container.clear();
    for (let i = 0; i < payload.inventory.length && i < container.size; i++) {
      const item = restoreSerializedItem(payload.inventory[i]);
      try { if (item) container.setItem(i, item); } catch {}
    }
  }
  const equip = player.getComponent("minecraft:equippable");
  if (equip && Array.isArray(payload.equipment)) {
    for (const row of payload.equipment) {
      try { equip.setEquipment(row.slot, restoreSerializedItem(row.item)); } catch {}
    }
  }
  restoreHud(player, { hiddenHud: payload.hiddenHud || [] });
  try { player.setGameMode(GameMode.Survival); } catch {}
  try { world.setDynamicProperty(backupKey(player), undefined); } catch {}
  return true;
}

function clearInventory(player) {
  try { player.getComponent("minecraft:inventory")?.container?.clear(); } catch {}
  const equip = player.getComponent("minecraft:equippable");
  if (equip) for (const slot of EQUIPMENT_SLOTS) {
    try { equip.setEquipment(slot, undefined); } catch {}
  }
}

function restoreInventory(player, saved) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container && saved?.inventory) {
    container.clear();
    for (let i = 0; i < saved.inventory.length && i < container.size; i++) {
      try { if (saved.inventory[i]) container.setItem(i, saved.inventory[i]); } catch {}
    }
  }
  const equip = player.getComponent("minecraft:equippable");
  if (equip && saved?.equipment) {
    for (const slot of EQUIPMENT_SLOTS) {
      try { equip.setEquipment(slot, saved.equipment.get(slot)); } catch {}
    }
  }
}

const DREAM_HIDDEN_HUD = [
  HudElement.PaperDoll,
  HudElement.Armor,
  HudElement.ToolTips,
  HudElement.Crosshair,
  HudElement.Hotbar,
  HudElement.Health,
  HudElement.ProgressBar,
  HudElement.Hunger,
  HudElement.AirBubbles,
  HudElement.HorseHealth,
  HudElement.StatusEffects,
  HudElement.ItemText
];

function hideDreamHud(player) {
  try {
    player.onScreenDisplay.hideAllExcept([HudElement.TouchControls]);
  } catch {
    // HudElement has no "All" member. Explicitly list valid elements as fallback.
    try { player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, DREAM_HIDDEN_HUD); } catch {}
  }
}

function restoreHud(player, saved) {
  try {
    player.onScreenDisplay.resetHudElementsVisibility();
    if (saved?.hiddenHud?.length) player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, saved.hiddenHud);
  } catch {}
}

async function startDream(player, type) {
  if (!player || sessions.has(player.id) || player.dimension.id !== DIM.main) return;
  const saved = {
    dimensionId: player.dimension.id,
    location: { x: player.location.x, y: player.location.y, z: player.location.z },
    rotation: player.getRotation(),
    type,
    inventory: saveInventory(player),
    startedAt: system.currentTick,
    lastSafePos: { x: -16, y: 68, z: -12 },
    cluesSeen: new Set(),
    watchers: []
  };
  try {
    sessions.set(player.id, saved);
    persistDreamBackup(player, saved);
    clearInventory(player);
    hideDreamHud(player);
    player.setGameMode(GameMode.Adventure);
    try { player.addEffect("blindness", 15, { showParticles: false }); } catch {}
    player.teleport({ x: -16.5, y: 88, z: -12.5 }, { dimension: dreamDim(), rotation: { x: 0, y: 0 } });
    try { player.addEffect("slow_falling", 160, { showParticles: false }); } catch {}
    await waitTicks(12);
    await generateDreamAroundPlayer(player);
    spawnDreamWatchers(player, saved);
    player.teleport({
      x: -16.5,
      y: dreamHeight(-16, -12) + 1.1,
      z: -12.5
    }, { dimension: dreamDim(), rotation: { x: 0, y: 0 } });
    try { player.removeEffect("blindness"); } catch {}
    try { player.removeEffect("slow_falling"); } catch {}
    if (type === "nightmare") {
      system.runTimeout(() => {
        const online = world.getAllPlayers().find(p => p.id === player.id);
        if (online && sessions.get(player.id)?.type === "nightmare") endDream(online, "nightmare ended");
      }, NIGHTMARE_TICKS);
    }
  } catch (error) {
    sessions.delete(player.id);
    try { player.teleport(saved.location, { dimension: world.getDimension(saved.dimensionId), rotation: saved.rotation }); } catch {}
    try {
      restoreInventory(player, saved.inventory);
      restoreHud(player, saved.inventory);
      player.setGameMode(saved.inventory.gameMode);
      world.setDynamicProperty(backupKey(player), undefined);
    } catch {}
    world.sendMessage("[Lattice of Greed] The dream could not start safely: " + String(error));
  }
}

function endDream(player, reason = "returned") {
  const saved = sessions.get(player.id);
  if (!saved) return;
  for (const watcherData of saved.watchers || []) {
    try { world.getEntity(watcherData.id)?.remove(); } catch {}
  }
  sessions.delete(player.id);
  try {
    player.teleport(saved.location, {
      dimension: world.getDimension(saved.dimensionId),
      rotation: saved.rotation
    });
  } catch {
    try { player.teleport(MAIN_SPAWN, { dimension: mainDim() }); } catch {}
  }
  restoreInventory(player, saved.inventory);
  restoreHud(player, saved.inventory);
  try { player.setGameMode(saved.inventory.gameMode); } catch {}
  try { player.removeEffect("blindness"); player.removeEffect("slow_falling"); player.removeEffect("darkness"); } catch {}
  try { world.setDynamicProperty(backupKey(player), undefined); } catch {}
  if (reason === "nightmare ended" || reason === "respawned") {
    try { player.sendMessage("§8The dream fades. The world is still here."); } catch {}
  }
}

/* ----------------------------- memory dimension ---------------------------- */

function enqueueMemoryRegion(tasks, sx, sz, offsetX = 0, offsetZ = 0) {
  for (let x = sx; x < sx + REGION_SIZE; x++) {
    for (let z = sz; z < sz + REGION_SIZE; z++) {
      const wx = x + offsetX;
      const wz = z + offsetZ;
      const variation = Math.sin(wx * 0.19) * 2 + Math.cos(wz * 0.22) * 2 +
        Math.sin((wx + wz) * 0.12) * 1.5;
      const h = 62 + Math.round(variation);
      for (let y = h - 4; y < h - 1; y++) addTask(tasks, x, y, z, "minecraft:dirt");
      addTask(tasks, x, h - 1, z, "minecraft:dirt");
      addTask(tasks, x, h, z, "minecraft:grass_block");
      if (hash(wx, wz, 71) < 0.022) {
        for (let y = h + 1; y <= h + 4; y++) addTask(tasks, x, y, z, "minecraft:oak_log");
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) < 4) addTask(tasks, x + dx, h + 4, z + dz, "minecraft:oak_leaves");
          }
        }
      }
      if (hash(wx, wz, 82) < 0.0025) addTask(tasks, x, h - 1, z, "minecraft:coal_ore");
      if (hash(wx, wz, 83) < 0.0009) addTask(tasks, x, h - 1, z, "minecraft:iron_ore");
    }
  }
}

async function buildMemoryPatch(player) {
  const dim = memoryDim();
  const rx = floorDiv(player.location.x, REGION_SIZE);
  const rz = floorDiv(player.location.z, REGION_SIZE);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = rx + dx;
      const z = rz + dz;
      if (!regionIsLoaded(dim, x, z)) continue;
      const key = regionKey("region_memory", x, z);
      if (world.getDynamicProperty(key) === true) continue;
      const tasks = [];
      enqueueMemoryRegion(tasks, x * REGION_SIZE, z * REGION_SIZE);
      await applyTasks(dim, tasks, x, z, 450);
      world.setDynamicProperty(key, true);
    }
  }
  for (const [x, z, y] of [[-3, -3, 63], [3, 2, 64], [0, 5, 63]]) {
    safeSet(dim, x, y, z, "minecraft:oak_log");
  }
  for (const point of [[-10, -8], [10, 6], [8, -10]]) {
    let top;
    try { top = dim.getTopmostBlock({ x: point[0], z: point[1] }); } catch {}
    if (!top) continue;
    if (hash(point[0], point[1], 55) < 0.75) {
      try { dim.spawnEntity("minecraft:cow", { x: point[0] + 0.5, y: top.location.y + 1, z: point[1] + 0.5 }); } catch {}
    }
  }
}

async function enterTesseract(player) {
  if (stat("tesseract_consumed") > 0 || sessions.has(player.id) || memoryTrips.has(player.id)) return;
  const returnLocation = { x: player.location.x, y: player.location.y, z: player.location.z };
  addStat("tesseract_uses", 1);
  setStat("tesseract_consumed", 1);
  const trip = {
    returnLocation,
    startedAt: system.currentTick,
    mined: 0,
    infectionStarted: false,
    infected: new Map(),
    returned: false
  };
  memoryTrips.set(player.id, trip);
  try {
    player.setSpawnPoint({ dimension: mainDim(), x: MAIN_SPAWN.x, y: MAIN_SPAWN.y, z: MAIN_SPAWN.z });
  } catch {}
  // Place the replacement block immediately, and clear the structure in loaded
  // chunks. Other sections are cleared lazily when their chunks load again.
  const dim = mainDim();
  safeSet(dim, TESS.x, TESS_CENTER_Y, TESS.z, "minecraft:obsidian");
  for (let rx = -5; rx <= -3; rx++) for (let rz = 3; rz <= 5; rz++) {
    if (regionIsLoaded(dim, rx, rz)) clearTesseractChunk(dim, rx, rz);
  }
  player.teleport({ x: 0.5, y: 88, z: 0.5 }, { dimension: memoryDim(), rotation: { x: 0, y: 0 } });
  try { player.addEffect("slow_falling", 200, { showParticles: false }); } catch {}
  await waitTicks(15);
  await buildMemoryPatch(player);
  player.teleport({ x: 0.5, y: 69, z: 0.5 }, { dimension: memoryDim(), rotation: { x: 0, y: 0 } });
  try { player.removeEffect("slow_falling"); } catch {}
  player.sendMessage("§7The world is intact here. For a moment.");
}

function clearTesseractChunk(dim, rx, rz) {
  const sx = rx * REGION_SIZE;
  const sz = rz * REGION_SIZE;
  const ex = sx + REGION_SIZE - 1;
  const ez = sz + REGION_SIZE - 1;
  const minX = TESS.x - 16;
  const maxX = TESS.x + 16;
  const minZ = TESS.z - 16;
  const maxZ = TESS.z + 16;
  if (sx > maxX || ex < minX || sz > maxZ || ez < minZ) return;

  for (let x = Math.max(sx, minX); x <= Math.min(ex, maxX); x++) {
    for (let z = Math.max(sz, minZ); z <= Math.min(ez, maxZ); z++) {
      for (let y = 1; y <= TESS_CENTER_Y + TESS_OUTER_RADIUS; y++) {
        safeSet(dim, x, y, z, "minecraft:air");
      }
    }
  }
  if (TESS.x >= sx && TESS.x <= ex && TESS.z >= sz && TESS.z <= ez) {
    safeSet(dim, TESS.x, TESS_CENTER_Y, TESS.z, "minecraft:obsidian");
  }
}

function updateMemoryCollapse(player, trip) {
  const age = system.currentTick - trip.startedAt;
  const dim = memoryDim();
  const px = Math.floor(player.location.x);
  const py = Math.floor(player.location.y);
  const pz = Math.floor(player.location.z);
  if (age < MEMORY_SAFE_TICKS) return;
  if (age < MEMORY_SLOW_TICKS) {
    const amount = age > MEMORY_SAFE_TICKS + 20 ? 2 : 1;
    for (let i = 0; i < amount; i++) {
      const dx = Math.floor(hash(px + i, pz, age + i) * 9) - 4;
      const dz = Math.floor(hash(pz - i, px, age + i + 2) * 9) - 4;
      const y = py - 1 + Math.floor(hash(px, pz, i + age) * 3);
      safeSet(dim, px + dx, y, pz + dz, "minecraft:black_concrete");
      trip.infected.set((px + dx) + "_" + y + "_" + (pz + dz), system.currentTick);
    }
    return;
  }

  trip.infectionStarted = true;
  const radius = clamp(Math.floor((age - MEMORY_SLOW_TICKS) / 18) + 3, 3, 14);
  let placed = 0;
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (placed >= 22) break;
      if (hash(px + dx, pz + dz, Math.floor(age / 4)) > 0.42) continue;
      const loc = { x: px + dx, y: py - 1, z: pz + dz };
      const existing = blockAt(dim, loc.x, loc.y, loc.z);
      if (!existing || existing.typeId === "minecraft:air" || existing.typeId === "minecraft:water") continue;
      safeSet(dim, loc.x, loc.y, loc.z, "minecraft:black_concrete");
      trip.infected.set(loc.x + "_" + loc.y + "_" + loc.z, system.currentTick);
      placed++;
    }
  }

  for (const [key, tick] of trip.infected.entries()) {
    if (system.currentTick - tick < 30) continue;
    const bits = key.split("_").map(Number);
    safeSet(dim, bits[0], bits[1], bits[2], "minecraft:air");
    trip.infected.delete(key);
  }

  if (age >= MEMORY_RETURN_TICKS || player.location.y < 48) returnFromMemory(player, "the place collapsed");
}

function returnFromMemory(player, reason = "returned") {
  const trip = memoryTrips.get(player.id);
  if (!trip || trip.returned) return;
  trip.returned = true;
  memoryTrips.delete(player.id);
  const safeReturn = { x: TESS.x + 3.5, y: 4, z: TESS.z + 0.5 };
  player.teleport(safeReturn, { dimension: mainDim(), rotation: { x: 0, y: 0 } });
  try { player.removeEffect("slow_falling"); } catch {}
  if (reason === "the place collapsed") player.sendMessage("§8The memory fractures, and you fall back into the lattice.");
  else player.sendMessage("§8You return to the lattice.");
  if (trip.mined >= 64) {

    system.runTimeout(() => {
      const online = world.getAllPlayers().find(p => p.id === player.id);
      if (online && online.dimension.id === DIM.main) startDream(online, "daymare");
    }, 10);
  }
}

/* ---------------------------- Biome Barrels ------------------------------- */

function openBiomeBarrel(event) {
  const player = event.player;
  const block = event.block;
  if (!player || !block || player.dimension.id !== DIM.main || block.typeId !== "minecraft:barrel") return;
  const x = block.location.x;
  const y = block.location.y;
  const z = block.location.z;
  const kind = world.getDynamicProperty(barrelProperty(x, y, z));
  if (typeof kind !== "string") return;
  const once = "log:barrelopened_" + x + "_" + y + "_" + z;
  if (world.getDynamicProperty(once) === true) return;
  world.setDynamicProperty(once, true);

  if (kind === "city") {
    addStat("city_barrels", 1);
    player.sendMessage("§8The city feels a little emptier.");
  } else if (kind === "ordinary") {
    addStat("ordinary_barrels", 1);
    player.sendMessage("§8Another slice of a biome, removed from somewhere else.");
  } else if (kind === "special") {
    player.sendMessage("§8Something behind the barrel is becoming visible...");
    system.runTimeout(() => revealPortalFromBarrel(player, block.dimension, x, y, z), 20);
  }
}

function revealPortalFromBarrel(player, dim, x, y, z) {
  const drops = [];
  try {
    const container = blockAt(dim, x, y, z)?.getComponent("minecraft:inventory")?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item) continue;
        try {
          const entity = dim.spawnItem(item.clone(), { x: x + 0.5, y: y + 1, z: z + 0.5 });
          drops.push(entity.id);
        } catch {}
      }
      container.clear();
    }
  } catch {}
  specialBarrelDrops.set(x + "_" + y + "_" + z, drops);
  safeSet(dim, x, y, z, "minecraft:air");
  // The revealed structure is only an obsidian outline, not a working Nether.
  for (let yy = 1; yy <= 4; yy++) {
    safeSet(dim, x + 2, y + yy, z, "minecraft:obsidian");
    safeSet(dim, x - 2, y + yy, z, "minecraft:obsidian");
  }
  for (let xx = -2; xx <= 2; xx++) {
    safeSet(dim, x + xx, y + 1, z, "minecraft:obsidian");
    safeSet(dim, x + xx, y + 4, z, "minecraft:obsidian");
  }
  system.runTimeout(() => {
    for (const id of drops) {
      try { world.getEntity(id)?.kill(); } catch {}
    }
  }, 20);
}

/* -------------------------- restoration tracking -------------------------- */

function recordPlant(event) {
  const player = event.player;
  const placed = event.block;
  if (!player || !placed || player.dimension.id !== DIM.main || sessions.has(player.id)) return;
  const id = placed.typeId;
  const loc = placed.location;
  if (id.includes("sapling")) {
    newlyPlantedSaplings.set(loc.x + "_" + loc.y + "_" + loc.z, {
      x: loc.x, y: loc.y, z: loc.z, plantedAt: system.currentTick
    });
  } else if (
    id.includes("flower") || id.includes("moss") || id.includes("vine") ||
    id.includes("azalea") || id.includes("grass") || id.includes("fern")
  ) {
    addStat("restoration", 1);
  } else if (Math.abs(loc.y) <= 1 && (isGridLine(loc.x) || isGridLine(loc.z))) {
    addStat("restoration", 0.25);
  }
}

function checkSaplingGrowth() {
  for (const [key, entry] of newlyPlantedSaplings.entries()) {
    let grown = false;
    const dim = mainDim();
    for (let dx = -2; dx <= 2 && !grown; dx++) {
      for (let dz = -2; dz <= 2 && !grown; dz++) {
        for (let dy = 0; dy <= 8; dy++) {
          const b = blockAt(dim, entry.x + dx, entry.y + dy, entry.z + dz);
          if (b && b.typeId.endsWith("_log")) { grown = true; break; }
        }
      }
    }
    if (grown) {
      addStat("restoration", 8);
      newlyPlantedSaplings.delete(key);
    } else if (system.currentTick - entry.plantedAt > 12000) {
      newlyPlantedSaplings.delete(key);
    }
  }
}

/* ---------------------------- Temi village ------------------------------- */

async function buildTemiVillage(player) {
  if (stat("temi_built") > 0 || player.dimension.id !== DIM.main) return;
  const dim = mainDim();
  const rx = floorDiv(player.location.x, REGION_SIZE);
  const rz = floorDiv(player.location.z, REGION_SIZE);
  if (!regionIsLoaded(dim, rx, rz)) return;
  const baseX = rx * REGION_SIZE;
  const baseZ = rz * REGION_SIZE;
  const tasks = [];

  // Four compact huts stay inside one active 16x16 chunk.
  for (let hx = 0; hx < 2; hx++) {
    for (let hz = 0; hz < 2; hz++) {
      const houseX = baseX + 1 + hx * 7;
      const houseZ = baseZ + 1 + hz * 7;
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          addTask(tasks, houseX + x, 0, houseZ + z, "minecraft:oak_planks");
          const wall = x === 0 || x === 4 || z === 0 || z === 4;
          if (wall) {
            for (let y = 1; y <= 3; y++) {
              const door = z === 0 && x === 2 && y <= 2;
              const window = y === 2 && (x === 0 || x === 4 || z === 4) && (x + z) % 2 === 0;
              if (!door && !window) addTask(tasks, houseX + x, y, houseZ + z, "minecraft:oak_planks");
            }
          }
          if (x === 0 || x === 4 || z === 0 || z === 4) {
            addTask(tasks, houseX + x, 4, houseZ + z, "minecraft:oak_planks");
          }
        }
      }
      try {
        const villager = dim.spawnEntity("minecraft:villager_v2", {
          x: houseX + 2.5, y: 1, z: houseZ + 2.5
        });
        villager.nameTag = "Temi";
        try { villager.addEffect("resistance", 999999, { showParticles: false }); } catch {}
      } catch {}
    }
  }
  try {
    await applyTasks(dim, tasks, rx, rz, 280);
    for (let hx = 0; hx < 2; hx++) {
      for (let hz = 0; hz < 2; hz++) {
        const houseX = baseX + 1 + hx * 7;
        const houseZ = baseZ + 1 + hz * 7;
        setSign(dim, houseX + 2, 2, houseZ, "Thank you for helping us be here.");
      }
    }
    setStat("temi_built", 1);
    player.sendMessage("§aYou hear a small village coming to life nearby.");
  } catch (error) {
    console.warn("[Lattice of Greed] Temi village deferred: " + String(error));
  }
}

/* ---------------------------- city interactions --------------------------- */

function towerAt(x, z) {
  return TOWER_LIST.find(tower => pointInTower(Math.floor(x), Math.floor(z), tower));
}

function isInsideBuilding(player) {
  if (player.dimension.id !== DIM.main) return false;
  const tower = towerAt(player.location.x, player.location.z);
  if (!tower || player.location.y < 0 || player.location.y > tower.height + 2) return false;
  const b = towerBounds(tower);
  return player.location.x > b.minX && player.location.x < b.maxX &&
    player.location.z > b.minZ && player.location.z < b.maxZ;
}

function updateTowerTopTraps(player) {
  if (player.dimension.id !== DIM.main) {
    for (const key of [...topTrapVisits]) if (key.startsWith(player.id + "_")) topTrapVisits.delete(key);
    return;
  }
  const tower = TOWER_LIST.find(t => t.height >= 48 && pointInTower(Math.floor(player.location.x), Math.floor(player.location.z), t));
  if (!tower || player.location.y < tower.height + 2) {
    for (const key of [...topTrapVisits]) if (key.startsWith(player.id + "_")) topTrapVisits.delete(key);
    return;
  }
  const visitKey = player.id + "_" + tower.id;
  if (topTrapVisits.has(visitKey)) return;
  const bx = Math.floor(player.location.x);
  const by = Math.floor(player.location.y) - 1;
  const bz = Math.floor(player.location.z);
  const under = blockAt(mainDim(), bx, by, bz);
  if (!under || (under.typeId !== "minecraft:stone_bricks" && under.typeId !== "minecraft:cracked_stone_bricks")) return;
  topTrapVisits.add(visitKey);
  // The top ledge gives way once. Only connected ruin blocks are removed.
  for (let y = tower.height + 1; y >= -32; y--) {
    const b = blockAt(mainDim(), bx, y, bz);
    if (!b) continue;
    if (
      b.typeId === "minecraft:stone_bricks" ||
      b.typeId === "minecraft:cracked_stone_bricks" ||
      b.typeId === "minecraft:cobblestone"
    ) safeSet(mainDim(), bx, y, bz, "minecraft:air");
  }
}

/* ----------------------------- bedrock serpent ---------------------------- */

let serpentPath = [];
let serpentMoveAt = 0;
function initializeSerpent() {
  if (serpentPath.length) return;
  serpentPath = [
    { x: 0, y: -40, z: 0 },
    { x: -1, y: -40, z: 0 },
    { x: -2, y: -40, z: 0 },
    { x: -3, y: -40, z: 0 },
    { x: -4, y: -40, z: 0 }
  ];
}

function serpentField(dim, pos) {
  for (let x = pos.x - 2; x <= pos.x + 2; x++) {
    for (let y = Math.max(-64, pos.y - 2); y <= Math.min(-33, pos.y + 2); y++) {
      for (let z = pos.z - 2; z <= pos.z + 2; z++) {
        if (serpentPath.some(s => s.x === x && s.y === y && s.z === z)) continue;
        const b = blockAt(dim, x, y, z);
        if (!b || b.typeId === "minecraft:air") continue;
        safeSet(dim, x, y, z, "minecraft:air");
      }
    }
  }
}

function moveSerpent() {
  initializeSerpent();
  const dim = mainDim();
  const head = serpentPath[0];
  const players = world.getAllPlayers().filter(p => p.dimension.id === DIM.main);
  const target = players.length ? players[0] : undefined;
  const brain = serpentPath[2];
  if (target) {
    const standing = Math.floor(target.location.x) === brain.x &&
      Math.floor(target.location.z) === brain.z &&
      Math.floor(target.location.y) - 1 === brain.y;
    if (standing) {
      for (const segment of serpentPath) serpentField(dim, segment);
      return;
    }
  }

  let next = { x: head.x, y: head.y, z: head.z };
  if (target) {
    const tx = Math.floor(target.location.x);
    const tz = Math.floor(target.location.z);
    const ty = clamp(Math.floor(target.location.y) - 1, -64, -35);
    if (next.x !== tx) next.x += next.x < tx ? 1 : -1;
    else if (next.z !== tz) next.z += next.z < tz ? 1 : -1;
    else if (next.y !== ty) next.y += next.y < ty ? 1 : -1;
  } else {
    const dir = Math.floor(hash(head.x + system.currentTick, head.z, head.y) * 6);
    if (dir === 0) next.x++;
    else if (dir === 1) next.x--;
    else if (dir === 2) next.y++;
    else if (dir === 3) next.y--;
    else if (dir === 4) next.z++;
    else next.z--;
  }
  next.y = clamp(next.y, -64, -35);
  serpentPath.unshift(next);
  serpentPath = serpentPath.slice(0, 5);
  for (const segment of serpentPath) safeSet(dim, segment.x, segment.y, segment.z, "minecraft:bedrock");
  for (const segment of serpentPath) serpentField(dim, segment);
}

/* ----------------------------- ending system ------------------------------ */

async function finishGame(player) {
  if (stat("ending_complete") > 0 || player.dimension.id !== DIM.main) return;
  setStat("ending_complete", 1);
  const overworld = world.getDimension(DIM.overworld);
  const spawn = world.getDefaultSpawnLocation();
  const sx = Math.floor(spawn.x);
  const sz = Math.floor(spawn.z);
  let surface;
  try { surface = overworld.getTopmostBlock({ x: sx, z: sz }); } catch {}
  const sy = surface ? surface.location.y + 3 : 120;
  player.teleport({ x: sx + 0.5, y: sy, z: sz + 0.5 }, { dimension: overworld, rotation: { x: 0, y: 0 } });
  try { player.addEffect("slow_falling", 200, { showParticles: false }); } catch {}
  await waitTicks(15);
  const damage = currentDamageScore();
  const restoration = stat("restoration");
  const damageRatio = clamp(damage / 180, 0, 1);
  const restorationRatio = clamp(restoration / 90, 0, 1);
  for (let x = sx - 14; x <= sx + 14; x++) {
    for (let z = sz - 14; z <= sz + 14; z++) {
      let top;
      try { top = overworld.getTopmostBlock({ x, z }); } catch { top = undefined; }
      if (!top) continue;
      const y = top.location.y;
      const roll = hash(x, z, 151);
      const damaged = roll < damageRatio * 0.6;
      const restored = roll > 1 - restorationRatio * 0.5;
      if (damaged && top.typeId === "minecraft:grass_block") safeSet(overworld, x, y, z, hash(x, z, 152) < 0.5 ? "minecraft:dirt" : "minecraft:cobblestone");
      else if (restored && top.typeId === "minecraft:dirt") safeSet(overworld, x, y, z, "minecraft:grass_block");

      const above = blockAt(overworld, x, y + 1, z);
      if (above && above.typeId === "minecraft:air" && restored && roll > 0.94) {
        safeSet(overworld, x, y + 1, z, "minecraft:dandelion");
      }
      if (above && above.typeId === "minecraft:air" && damaged && roll < 0.08) {
        safeSet(overworld, x, y + 1, z, "minecraft:dead_bush");
      }
    }
    if ((x - sx + 14) % 5 === 0) await waitTicks(1);
  }

  // A restored world grows a small grove; a damaged world keeps a few visible scars.
  if (restoration > 20) {
    for (const [dx, dz] of [[-6, -5], [7, -4], [-8, 6], [5, 8]]) {
      const x = sx + dx;
      const z = sz + dz;
      let top;
      try { top = overworld.getTopmostBlock({ x, z }); } catch { top = undefined; }
      if (!top) continue;
      const y = top.location.y + 1;
      if (top.typeId !== "minecraft:grass_block") continue;
      for (let h = 0; h < 5; h++) safeSet(overworld, x, y + h, z, "minecraft:oak_log");
      for (let dx2 = -2; dx2 <= 2; dx2++) {
        for (let dz2 = -2; dz2 <= 2; dz2++) {
          for (let dy = 2; dy <= 5; dy++) {
            if (Math.abs(dx2) + Math.abs(dz2) < 4) safeSet(overworld, x + dx2, y + dy, z + dz2, "minecraft:oak_leaves");
          }
        }
      }
    }
  }

  try {
    player.setSpawnPoint({
      dimension: overworld,
      x: sx + 0.5,
      y: (overworld.getTopmostBlock({ x: sx, z: sz })?.location.y ?? 64) + 1,
      z: sz + 0.5
    });
  } catch {}
  try { player.removeEffect("slow_falling"); } catch {}
  player.onScreenDisplay.setTitle("The world remembers.", { fadeInDuration: 15, stayDuration: 100, fadeOutDuration: 25 });
  player.sendMessage("§8What you took, what you restored, and what you left behind are still here.");
}

function nearbyPortal(dim, player) {
  const x = Math.floor(player.location.x);
  const y = Math.floor(player.location.y);
  const z = Math.floor(player.location.z);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -2; dz <= 2; dz++) {
        const b = blockAt(dim, x + dx, y + dy, z + dz);
        if (b?.typeId === "minecraft:portal") return true;
      }
    }
  }
  return false;
}

/* ------------------------------ event wiring ------------------------------ */

system.beforeEvents.startup.subscribe(event => {
  for (const id of [DIM.main, DIM.dream, DIM.memory]) {
    try {
      event.dimensionRegistry.registerCustomDimension(id);
    } catch (error) {
      const message = id + ": " + String(error);
      dimensionRegistrationErrors.push(message);
      console.warn("[Lattice of Greed] Dimension registration: " + message);
    }
  }
});

world.afterEvents.worldLoad.subscribe(() => {
  if (worldLoadAnnounced) return;
  worldLoadAnnounced = true;
  world.sendMessage("§8[Lattice of Greed] The lattice is awake. Your world begins with what you can reach.");
});

world.afterEvents.playerSpawn.subscribe(event => {
  system.runTimeout(async () => {
    const player = event.player;
    if (!player) return;
    if (stat("ending_complete") > 0 && player.dimension.id === DIM.overworld) return;

    // A death/respawn during a dream must return the saved inventory and
    // state. A death in the temporary memory dimension must end that trip.
    if (sessions.has(player.id)) {
      endDream(player, "respawned");
      return;
    }
    if (memoryTrips.has(player.id)) {
      returnFromMemory(player, "respawned");
      return;
    }

    // Also recover a persistent backup after a script reload or reconnect,
    // even if Bedrock respawned the player in the main dimension already.
    let hasBackup = false;
    try { hasBackup = typeof world.getDynamicProperty(backupKey(player)) === "string"; } catch {}
    if (hasBackup && restoreSerializedBackup(player)) return;

    if (player.dimension.id === DIM.dream) {
      try { player.teleport(MAIN_SPAWN, { dimension: mainDim() }); } catch {}
      return;
    }
    if (player.dimension.id === DIM.memory) {
      try { player.teleport({ x: TESS.x + 3.5, y: 4, z: TESS.z + 0.5 }, { dimension: mainDim() }); } catch {}
      return;
    }

    if (player.dimension.id !== DIM.main) {
      try {
        player.teleport({ x: MAIN_SPAWN.x, y: 80, z: MAIN_SPAWN.z }, { dimension: mainDim() });
        await waitTicks(10);
      } catch {
        return;
      }
    }

    const enteredKey = "log:entered_" + stableId(player);
    if (world.getDynamicProperty(enteredKey) !== true) {
      clearInventory(player);
      world.setDynamicProperty(enteredKey, true);
      player.sendMessage("§8No supplies. One tree. An endless lattice.");
    }
    try {
      player.setSpawnPoint({ dimension: mainDim(), x: MAIN_SPAWN.x, y: MAIN_SPAWN.y, z: MAIN_SPAWN.z });
    } catch {}
    await waitTicks(2);
    await generateLoadedMainRegions(player);
    player.teleport(MAIN_SPAWN, { dimension: mainDim(), rotation: { x: 0, y: 0 } });
  }, 1);
});

// Script events belong to system.afterEvents in the Script API v2.
system.afterEvents.scriptEventReceive.subscribe(event => {
  // A function-file invocation can sometimes arrive without a sourceEntity.
  // Prefer the actual source player, then fall back to an online player so
  // single-player diagnostic/test functions do not silently do nothing.
  const source = event.sourceEntity;
  const player = source?.typeId === "minecraft:player"
    ? source
    : world.getAllPlayers().find(p => p.dimension.id === DIM.main) || world.getAllPlayers()[0];
  if (!player) {
    world.sendMessage("[Lattice of Greed] Received script event " + event.id + " but no player is online.");
    return;
  }
  if (event.id === "log:daymare") startDream(player, "daymare");
  else if (event.id === "log:nightmare") startDream(player, "nightmare");
  else if (event.id === "log:memory" && player.dimension.id === DIM.main) enterTesseract(player);
  else if (event.id === "log:finish" && player.dimension.id === DIM.main) finishGame(player);
  else if (event.id === "log:status") {
    player.sendMessage("§8Restoration: " + stat("restoration") + " | World damage: " + currentDamageScore() +
      " | Tesseract mining: " + stat("tesseract_mined") + ". This is diagnostic information, not a morality score.");
  } else if (event.id === "log:lattice_status") {
    const rx = floorDiv(player.location.x, REGION_SIZE);
    const rz = floorDiv(player.location.z, REGION_SIZE);
    const latticeValue = world.getDynamicProperty(regionKey("region_lattice_v106", rx, rz));
    const structureValue = world.getDynamicProperty(regionKey("region_main_v106", rx, rz));
    const stateName = value => value === true ? "done" : value === "building" ? "building" : value === false ? "retry" : "not generated";
    let loaded = false;
    let ticking = "unavailable";
    try {
      loaded = regionIsLoaded(mainDim(), rx, rz);
      const manager = world.tickingAreaManager;
      ticking = manager.chunkCount + "/" + manager.maxChunkCount;
    } catch {}
    player.sendMessage("§8[Lattice] Dimension=" + player.dimension.id + "; region=" + rx + "," + rz + "; loaded=" + loaded);
    player.sendMessage("§8Lattice=" + stateName(latticeValue) + "; structures=" + stateName(structureValue) +
      "; queue=" + mainRegionQueue.length + "; active=" + activeMainRegions);
    player.sendMessage("§8Ticking chunks=" + ticking + "; auto checks=" + automaticGenerationChecks +
      "; lattice failures=" + latticeGenerationFailures + "; structure failures=" + structureGenerationFailures);
    if (lastAutomaticGenerationError !== "none") player.sendMessage("§cLast automatic error: " + lastAutomaticGenerationError);
    if (lastLatticeGenerationError !== "none") player.sendMessage("§cLast lattice error: " + lastLatticeGenerationError);
    if (lastStructureGenerationError !== "none") player.sendMessage("§cLast structure error: " + lastStructureGenerationError);
    if (dimensionRegistrationErrors.length) player.sendMessage("§cDimension registration error: " + dimensionRegistrationErrors[dimensionRegistrationErrors.length - 1]);
  } else if (event.id === "log:lattice_recheck") {
    if (player.dimension.id !== DIM.main) {
      player.sendMessage("§cLattice recheck only runs from the abyss dimension.");
    } else {
      generateLoadedMainRegions(player);
      player.sendMessage("§8Nearby ungenerated regions queued. Run /function lattice_status again in a few seconds.");
    }
  }
});

world.afterEvents.playerBreakBlock.subscribe(event => {
  const player = event.player;
  const b = event.block;
  if (!player || !b) return;
  const id = event.brokenBlockPermutation?.type?.id || "";
  if (player.dimension.id === DIM.main && !sessions.has(player.id)) {
    addStat("extraction", 1);
    if (id.endsWith("_log") && distance2D(b.location.x, b.location.z, TREE.x, TREE.z) <= 5) addStat("trees_cut", 1);

    // Portal-top duplication loophole: it remains available until the Tesseract
    // is entered. This is deliberately a consequence-bearing exploit.
    if (
      stat("tesseract_consumed") === 0 &&
      b.location.x === TESS.x &&
      b.location.z === TESS.z &&
      b.location.y === TESS_CENTER_Y + 1 &&
      id !== "minecraft:air" &&
      id !== "minecraft:bedrock"
    ) {
      const count = stat("tesseract_mined") + 1;
      setStat("tesseract_mined", count);
      const key = b.location.x + "_" + b.location.y + "_" + b.location.z;
      tesseractRestoreDelay.set(key, system.currentTick + 12);
      system.runTimeout(() => {
        const stillOpen = stat("tesseract_consumed") === 0 && tesseractRestoreDelay.has(key);
        if (!stillOpen) return;
        safeSet(mainDim(), b.location.x, b.location.y, b.location.z, id);
        tesseractRestoreDelay.delete(key);
      }, 12);
      if (count % 64 === 0) {

        system.runTimeout(() => {
          const online = world.getAllPlayers().find(p => p.id === player.id);
          if (online && online.dimension.id === DIM.main) startDream(online, "daymare");
        }, 2);
      }
    }
  } else if (player.dimension.id === DIM.memory) {
    const trip = memoryTrips.get(player.id);
    if (trip) {
      trip.mined++;
      addStat("extraction", 1);
    }
  }
});

world.beforeEvents.playerBreakBlock.subscribe(event => {
  const player = event.player;
  const block = event.block;
  if (sessions.has(player.id)) {
    event.cancel = true;
    return;
  }
  // Keep the one-use portal intact until the player deliberately enters it.
  if (player.dimension.id === DIM.main && stat("tesseract_consumed") === 0 &&
      block.location.x === TESS.x && block.location.y === TESS_CENTER_Y && block.location.z === TESS.z) {
    event.cancel = true;
    return;
  }
  // Tower walls are intentionally breakable while the room layout is being tested.
});

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  if (sessions.has(event.player.id)) event.cancel = true;
});

world.afterEvents.playerPlaceBlock.subscribe(recordPlant);

world.afterEvents.playerInteractWithBlock.subscribe(openBiomeBarrel);

// The Tesseract is a deliberate choice, not a proximity trap. Interacting with
// its center block enters the memory dimension; mining a block placed above it
// remains the separate, repeatable extraction loophole.
world.afterEvents.playerInteractWithBlock.subscribe(event => {
  const player = event.player;
  const block = event.block;
  if (!player || !block || player.dimension.id !== DIM.main) return;
  if (stat("tesseract_consumed") > 0) return;
  const loc = block.location;
  if (loc.x === TESS.x && loc.y === TESS_CENTER_Y && loc.z === TESS.z &&
      block.typeId === "minecraft:stone") {
    enterTesseract(player);
  }
});

// Nightmares happen once per night. Daymares remain open-ended until the
// player deliberately jumps into the central shaft.
system.runInterval(() => {
  const onlineIds = new Set(world.getAllPlayers().map(p => p.id));
  for (const id of lastRegionCheck.keys()) if (!onlineIds.has(id)) lastRegionCheck.delete(id);
  for (const id of lastDreamRegionCheck.keys()) if (!onlineIds.has(id)) lastDreamRegionCheck.delete(id);
  let time = 0;
  try { time = world.getTimeOfDay(); } catch { return; }
  const isNight = time >= 13000 && time < 23000;
  const day = world.getDay();
  if (isNight && (!lastNightState || lastNightDay !== day)) {
    lastNightDay = day;
    for (const player of world.getAllPlayers()) {
      if (player.dimension.id === DIM.main && !sessions.has(player.id) && !memoryTrips.has(player.id)) {
        startDream(player, "nightmare");
      }
    }
  }
  lastNightState = isNight;

  for (const player of world.getAllPlayers()) {
    if (player.dimension.id === DIM.main) {
      if (system.currentTick % 40 === 0) {
        if (isNight) {
          try { player.addEffect("darkness", 55, { showParticles: false, amplifier: 0 }); } catch {}
        } else {
          try { player.removeEffect("darkness"); } catch {}
        }
      }
      // Clear removed Tesseract pieces at a limited rate, avoiding a large
      // synchronous edit burst on every game tick.
      if (stat("tesseract_consumed") > 0 &&
          Math.abs(player.location.x - TESS.x) < 40 &&
          Math.abs(player.location.z - TESS.z) < 40 &&
          system.currentTick - lastTesseractClearTick >= 80) {
        lastTesseractClearTick = system.currentTick;
        for (let dx = -5; dx <= -3; dx++) for (let dz = 3; dz <= 5; dz++) {
          if (regionIsLoaded(mainDim(), dx, dz)) clearTesseractChunk(mainDim(), dx, dz);
        }
      }

      updateTowerTopTraps(player);
      if (!sessions.has(player.id) && !memoryTrips.has(player.id) && nearbyPortal(mainDim(), player)) finishGame(player);
    } else if (player.dimension.id === DIM.dream) {
      const dreamCheckedAt = lastDreamRegionCheck.get(player.id) ?? -10000;
      if (system.currentTick - dreamCheckedAt >= 20) {
        lastDreamRegionCheck.set(player.id, system.currentTick);
        generateDreamAroundPlayer(player);
      }
      const session = sessions.get(player.id);
      if (!session) continue;
      updateDreamWatchers(player, session);
      const px = player.location.x;
      const pz = player.location.z;
      if (Math.abs(px) > DREAM_EDGE || Math.abs(pz) > DREAM_EDGE) {
        const x = clamp(px, -DREAM_EDGE + 1, DREAM_EDGE - 1);
        const z = clamp(pz, -DREAM_EDGE + 1, DREAM_EDGE - 1);
        player.teleport({ x, y: dreamHeight(Math.floor(x), Math.floor(z)) + 1.2, z }, { dimension: dreamDim() });
      }
      const inTesseract = Math.abs(px) <= 1.5 && Math.abs(pz) <= 1.5;
      if (session.type === "daymare" && inTesseract && player.location.y < 60) {
        endDream(player, "entered the Tesseract");
      } else if (player.location.y < 30) {
        if (session.type === "nightmare" && system.currentTick - session.startedAt >= NIGHTMARE_TICKS) endDream(player, "nightmare ended");
        else {
          const sx = clamp(Math.floor(px), -DREAM_EDGE + 1, DREAM_EDGE - 1);
          const sz = clamp(Math.floor(pz), -DREAM_EDGE + 1, DREAM_EDGE - 1);
          player.teleport({ x: sx + 0.5, y: dreamHeight(sx, sz) + 1.2, z: sz + 0.5 }, { dimension: dreamDim() });
        }
      }
      // A nightmare grows darker as it progresses, hinting at the passage
      // from day toward night without changing the shared world clock.
      if (session.type === "nightmare" &&
          system.currentTick - session.startedAt > NIGHTMARE_TICKS / 2 &&
          system.currentTick % 40 === 0) {
        try { player.addEffect("darkness", 55, { showParticles: false, amplifier: 0 }); } catch {}
      }

      // Clues settle after a few seconds; they never force a daymare to end.
      for (const signLoc of [[6, 0], [-7, 0], [0, 10]]) {
        const key = signLoc[0] + "_" + signLoc[1];
        if (session.cluesSeen.has(key)) continue;
        const dx = player.location.x - signLoc[0];
        const dz = player.location.z - signLoc[1];
        if (Math.sqrt(dx * dx + dz * dz) < 3) {
          session.cluesSeen.add(key);
          player.onScreenDisplay.setTitle("...", { fadeInDuration: 5, stayDuration: 35, fadeOutDuration: 20 });
        }
      }
    } else if (player.dimension.id === DIM.memory) {
      const trip = memoryTrips.get(player.id);
      if (trip) updateMemoryCollapse(player, trip);
    }
  }
  if (system.currentTick % 100 === 0) checkSaplingGrowth();
  if (system.currentTick % 80 === 0) moveSerpent();

  if (stat("restoration") >= 30 && stat("temi_built") === 0) {
    const candidate = world.getAllPlayers().find(p => p.dimension.id === DIM.main && !sessions.has(p.id));
    if (candidate) buildTemiVillage(candidate);
  }
}, 1);

// Automatic lattice generation has its own loop. It must not depend on the
// time-of-day, dream, or effects logic above, any of which may fail separately.
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    if (player.dimension.id !== DIM.main) continue;
    const checkedAt = lastRegionCheck.get(player.id) ?? -10000;
    if (system.currentTick - checkedAt < 20) continue;
    lastRegionCheck.set(player.id, system.currentTick);
    automaticGenerationChecks++;
    try {
      generateLoadedMainRegions(player);
      lastAutomaticGenerationError = "none";
    } catch (error) {
      lastAutomaticGenerationError = String(error).slice(0, 180);
      console.warn("[Lattice of Greed] Automatic region check failed: " + lastAutomaticGenerationError);
    }
  }
}, 10);

world.afterEvents.playerDimensionChange.subscribe(event => {
  const player = event.player;
  if (player.dimension.id === DIM.main) {
    lastRegionCheck.delete(player.id);
    system.runTimeout(() => {
      try {
        if (player.dimension.id === DIM.main) generateLoadedMainRegions(player);
      } catch (error) {
        lastAutomaticGenerationError = String(error).slice(0, 180);
        console.warn("[Lattice of Greed] Dimension-entry region check failed: " + lastAutomaticGenerationError);
      }
    }, 2);
  }
  if (player.dimension.id === DIM.dream && !sessions.has(player.id)) {
    system.runTimeout(() => {
      if (player.dimension.id === DIM.dream && !sessions.has(player.id)) restoreSerializedBackup(player);
    }, 1);
  }
});


