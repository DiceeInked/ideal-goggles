import {
  world,
  system,
  BlockPermutation,
  ItemStack,
  EquipmentSlot,
  HudElement,
  HudVisibility
} from "@minecraft/server";

const DREAM_DIMENSION_ID = "lattice:dream";
const CENTER = { x: 0, y: 80, z: 0 };
const TERRAIN_RADIUS = 24;
const TICKING_AREA_ID = "lattice_dream_build";
const NIGHTMARE_TICKS = 20 * 60;

const sessions = new Map();
let dreamBuildPromise = null;
let lastDamageScore = -1;
let lastRestorationScore = -1;
let wasNight = false;
const obsidianMined = new Map();

const EQUIPMENT_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
  EquipmentSlot.Offhand
];

function metric(key) {
  try {
    return Number(world.getDynamicProperty("lattice:" + key) ?? 0);
  } catch {
    return 0;
  }
}

function addMetric(key, amount = 1) {
  try {
    world.setDynamicProperty("lattice:" + key, metric(key) + amount);
  } catch {
    // The prototype can still run if persistent metrics are unavailable.
  }
}

function block(id) {
  return BlockPermutation.resolve(id);
}

function put(dim, x, y, z, permutation) {
  try {
    dim.getBlock({ x, y, z })?.setPermutation(permutation);
  } catch {
    // Ignore out-of-bounds or temporarily unavailable blocks during generation.
  }
}

function terrainHeight(x, z, damageScore) {
  const broad = Math.sin(x * 0.27) * 2.2 + Math.cos(z * 0.23) * 2.0;
  const small = Math.sin((x + z) * 0.43) * 1.2 + Math.cos((x - z) * 0.31) * 0.8;
  let variation = broad + small;
  const flattening = Math.max(0, Math.min(1, damageScore / 96));
  if (Math.abs(x) <= 2 || Math.abs(z) <= 2) variation *= 1 - flattening;
  if (damageScore > 48 && (Math.abs(x) <= 5 || Math.abs(z) <= 5)) variation *= 0.25;
  return CENTER.y + Math.round(variation);
}

function seeded(x, z, salt = 0) {
  const v = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

function setSign(dim, x, y, z, text) {
  try {
    const signBlock = dim.getBlock({ x, y, z });
    if (!signBlock) return;
    signBlock.setType("minecraft:oak_sign");
    const sign = signBlock.getComponent("minecraft:sign");
    if (sign && typeof sign.setText === "function") sign.setText(text);
  } catch {
    // Sign text support varies between Bedrock builds; the sign remains a clue marker.
  }
}

async function buildDreamscape() {
  const dim = world.getDimension(DREAM_DIMENSION_ID);
  const extraction = metric("extraction");
  const restoration = metric("restoration");
  const damageScore = Math.max(0, extraction - restoration * 3);

  const stone = block("minecraft:stone");
  const dirt = block("minecraft:dirt");
  const grass = block("minecraft:grass_block");
  const cobble = block("minecraft:cobblestone");
  const moss = block("minecraft:moss_block");
  const flower = block("minecraft:dandelion");
  const deadBush = block("minecraft:dead_bush");
  const obsidian = block("minecraft:obsidian");
  const air = block("minecraft:air");
  const glowstone = block("minecraft:glowstone");

  for (let x = -TERRAIN_RADIUS; x <= TERRAIN_RADIUS; x++) {
    for (let z = -TERRAIN_RADIUS; z <= TERRAIN_RADIUS; z++) {
      const edge = Math.max(Math.abs(x), Math.abs(z));
      const h = terrainHeight(x, z, damageScore);
      const damagePatch = seeded(x, z, 1) < Math.min(0.42, damageScore / 220);
      const restoredPatch = seeded(x, z, 2) < Math.min(0.30, restoration / 90);

      for (let y = h - 4; y < h - 1; y++) put(dim, x, y, z, stone);
      put(dim, x, h - 1, z, dirt);
      put(dim, x, h, z, grass);

      if (damagePatch && edge > 5 && seeded(x, z, 3) < 0.55) {
        put(dim, x, h, z, cobble);
        if (seeded(x, z, 4) < 0.25) put(dim, x, h - 1, z, cobble);
      } else if (restoredPatch && edge > 5 && seeded(x, z, 5) < 0.55) {
        put(dim, x, h, z, moss);
      }

      if (restoration > 0 && restoredPatch && edge > 7 && seeded(x, z, 6) < 0.22) {
        put(dim, x, h + 1, z, flower);
      }
      if (damageScore > 80 && edge > 8 && seeded(x, z, 7) < 0.025) {
        put(dim, x, h + 1, z, deadBush);
      }
    }
    // Yield periodically so generating the dream does not monopolize a single tick.
    if ((x + TERRAIN_RADIUS) % 4 === 3) {
      await new Promise(resolve => system.runTimeout(resolve, 1));
    }
  }

  // The center is an open shaft. Falling into it is the voluntary exit from a daymare.
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      for (let y = CENTER.y - 22; y <= CENTER.y + 2; y++) put(dim, x, y, z, air);
    }
  }

  // A large, geometric Tesseract-like frame around the abyss.
  const low = CENTER.y + 1;
  const high = CENTER.y + 9;
  for (let y = low; y <= high; y++) {
    for (let t = -4; t <= 4; t++) {
      put(dim, -4, y, t, obsidian);
      put(dim, 4, y, t, obsidian);
      put(dim, t, y, -4, obsidian);
      put(dim, t, y, 4, obsidian);
    }
  }
  for (const y of [low, high]) {
    for (let t = -4; t <= 4; t++) {
      put(dim, -4, y, t, obsidian);
      put(dim, 4, y, t, obsidian);
      put(dim, t, y, -4, obsidian);
      put(dim, t, y, 4, obsidian);
    }
  }

  // A few dark, almost-too-straight lines lead toward the structure.
  for (let p = -TERRAIN_RADIUS; p <= TERRAIN_RADIUS; p++) {
    if (Math.abs(p) > 4) {
      const yX = terrainHeight(p, 0, damageScore);
      const yZ = terrainHeight(0, p, damageScore);
      put(dim, p, yX, 0, damageScore > 20 ? cobble : stone);
      put(dim, 0, yZ, p, damageScore > 20 ? cobble : stone);
    }
  }

  setSign(dim, 7, terrainHeight(7, 0, damageScore) + 1, 0, "Does the terrain look a bit flat to you?");
  setSign(dim, -7, terrainHeight(-7, 0, damageScore) + 1, 0, "You can't make something from nothing.");
  setSign(dim, 0, terrainHeight(0, 8, damageScore) + 1, 8, "Take what you need. Please use what you take.");

  // Small, sparse lights only become more common as restoration grows.
  if (restoration > 12) {
    for (const p of [-18, -12, 12, 18]) {
      put(dim, p, terrainHeight(p, 15, damageScore) + 1, 15, glowstone);
    }
  }

  lastDamageScore = damageScore;
  lastRestorationScore = restoration;
}

async function prepareDreamscape() {
  if (dreamBuildPromise) return dreamBuildPromise;
  dreamBuildPromise = (async () => {
    const dim = world.getDimension(DREAM_DIMENSION_ID);
    await world.tickingAreaManager.createTickingArea(TICKING_AREA_ID, {
      dimension: dim,
      from: { x: -TERRAIN_RADIUS - 3, y: CENTER.y - 24, z: -TERRAIN_RADIUS - 3 },
      to: { x: TERRAIN_RADIUS + 3, y: CENTER.y + 14, z: TERRAIN_RADIUS + 3 }
    });
    const extraction = metric("extraction");
    const restoration = metric("restoration");
    const damageScore = Math.max(0, extraction - restoration * 3);
    if (lastDamageScore !== damageScore || lastRestorationScore !== restoration) await buildDreamscape();
    else if (lastDamageScore < 0) await buildDreamscape();
    world.tickingAreaManager.removeTickingArea(TICKING_AREA_ID);
  })();
  try {
    await dreamBuildPromise;
  } finally {
    dreamBuildPromise = null;
  }
}

function saveInventory(player) {
  const inventoryComponent = player.getComponent("minecraft:inventory");
  const container = inventoryComponent?.container;
  const inventory = [];
  if (container) {
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      inventory.push(item ? item.clone() : undefined);
    }
  }

  const equipmentComponent = player.getComponent("minecraft:equippable");
  const equipment = new Map();
  if (equipmentComponent) {
    for (const slot of EQUIPMENT_SLOTS) {
      try {
        const item = equipmentComponent.getEquipment(slot);
        equipment.set(slot, item ? item.clone() : undefined);
      } catch {
        equipment.set(slot, undefined);
      }
    }
  }

  let hiddenHud = [];
  try {
    hiddenHud = player.onScreenDisplay.getHiddenHudElements();
  } catch {}

  return { inventory, equipment, hiddenHud };
}

function backupKey(player) {
  return "lattice:backup:" + player.name;
}

function serializeItem(item) {
  if (!item) return null;
  const result = { typeId: item.typeId, amount: item.amount };
  try { if (item.nameTag) result.nameTag = item.nameTag; } catch {}
  try { const lore = item.getLore(); if (lore && lore.length) result.lore = lore; } catch {}
  try {
    const durability = item.getComponent("minecraft:durability");
    if (durability) result.damage = durability.damage;
  } catch {}
  return result;
}

function persistBackup(player, saved) {
  const equipment = [];
  for (const slot of EQUIPMENT_SLOTS) {
    equipment.push({ slot, item: serializeItem(saved.inventory.equipment.get(slot)) });
  }
  const payload = {
    dimensionId: saved.dimensionId,
    location: saved.location,
    rotation: saved.rotation,
    inventory: saved.inventory.inventory.map(serializeItem),
    equipment,
    hiddenHud: saved.inventory.hiddenHud
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

function restorePersistentBackup(player) {
  let payload;
  try {
    const raw = world.getDynamicProperty(backupKey(player));
    if (typeof raw !== "string") return false;
    payload = JSON.parse(raw);
  } catch { return false; }

  try {
    player.teleport(payload.location, {
      dimension: world.getDimension(payload.dimensionId),
      rotation: payload.rotation
    });
  } catch {
    try { player.teleport(world.getDefaultSpawnLocation(), { dimension: world.getDimension("minecraft:overworld") }); } catch {}
  }

  const container = player.getComponent("minecraft:inventory")?.container;
  if (container && Array.isArray(payload.inventory)) {
    container.clear();
    for (let i = 0; i < payload.inventory.length && i < container.size; i++) {
      const item = restoreSerializedItem(payload.inventory[i]);
      try { if (item) container.setItem(i, item); } catch {}
    }
  }
  const equipment = player.getComponent("minecraft:equippable");
  if (equipment && Array.isArray(payload.equipment)) {
    for (const entry of payload.equipment) {
      try { equipment.setEquipment(entry.slot, restoreSerializedItem(entry.item)); } catch {}
    }
  }
  restoreHud(player, { hiddenHud: payload.hiddenHud || [] });
  try { player.removeEffect("resistance"); player.removeEffect("saturation"); } catch {}
  try { world.setDynamicProperty(backupKey(player), undefined); } catch {}
  return true;
}

function clearInventory(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container) container.clear();
  const equipment = player.getComponent("minecraft:equippable");
  if (equipment) {
    for (const slot of EQUIPMENT_SLOTS) {
      try { equipment.setEquipment(slot, undefined); } catch {}
    }
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
  const equipment = player.getComponent("minecraft:equippable");
  if (equipment && saved?.equipment) {
    for (const slot of EQUIPMENT_SLOTS) {
      try { equipment.setEquipment(slot, saved.equipment.get(slot)); } catch {}
    }
  }
}

function setDreamHud(player) {
  try {
    // Keep touch controls so phone/tablet players can still move.
    player.onScreenDisplay.hideAllExcept([HudElement.TouchControls]);
  } catch {
    try { player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [HudElement.All]); } catch {}
  }
}

function restoreHud(player, saved) {
  try {
    player.onScreenDisplay.setHudVisibility(HudVisibility.Reset, [HudElement.All]);
    if (saved?.hiddenHud?.length) {
      player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, saved.hiddenHud);
    }
  } catch {}
}

async function startDream(player, type) {
  if (!player || sessions.has(player.id)) return;
  let saved;
  try {
    await prepareDreamscape();
    saved = {
      dimensionId: player.dimension.id,
      location: { x: player.location.x, y: player.location.y, z: player.location.z },
      rotation: player.getRotation(),
      type,
      inventory: saveInventory(player)
    };
    sessions.set(player.id, saved);
    persistBackup(player, saved);
    clearInventory(player);
    setDreamHud(player);
    player.teleport({ x: 0, y: CENTER.y + 4, z: -16 }, { dimension: world.getDimension(DREAM_DIMENSION_ID), rotation: { x: 0, y: 0 } });
    try { player.addEffect("resistance", 20 * 60 * 60, { amplifier: 4, showParticles: false }); } catch {}
    try { player.addEffect("saturation", 20 * 60 * 60, { amplifier: 1, showParticles: false }); } catch {}
    if (type === "nightmare") {
      system.runTimeout(() => {
        const online = world.getAllPlayers().find(p => p.id === player.id);
        if (online && sessions.get(player.id)?.type === "nightmare") endDream(online, "nightmare ended");
      }, NIGHTMARE_TICKS);
    }
  } catch (error) {
    if (saved) {
      sessions.delete(player.id);
      try { player.teleport(saved.location, { dimension: world.getDimension(saved.dimensionId), rotation: saved.rotation }); } catch {}
      try { restoreInventory(player, saved.inventory); restoreHud(player, saved.inventory); world.setDynamicProperty(backupKey(player), undefined); } catch {}
      try { player.removeEffect("resistance"); player.removeEffect("saturation"); } catch {}
    }
    world.sendMessage("[Lattice of Greed] Could not start the dream: " + String(error));
  }
}

function endDream(player, reason = "returned") {
  const saved = sessions.get(player.id);
  if (!saved) return;
  sessions.delete(player.id);
  try {
    player.teleport(saved.location, {
      dimension: world.getDimension(saved.dimensionId),
      rotation: saved.rotation
    });
  } catch {
    try { player.teleport(world.getDefaultSpawnLocation(), { dimension: world.getDimension("minecraft:overworld") }); } catch {}
  }
  restoreInventory(player, saved.inventory);
  restoreHud(player, saved.inventory);
  try { world.setDynamicProperty(backupKey(player), undefined); } catch {}
  try { player.removeEffect("resistance"); } catch {}
  try { player.removeEffect("saturation"); } catch {}
}

system.beforeEvents.startup.subscribe((event) => {
  event.dimensionRegistry.registerCustomDimension(DREAM_DIMENSION_ID);
});

world.afterEvents.worldLoad.subscribe(() => {
  world.sendMessage("§8[Lattice of Greed] Prototype loaded. Test with /scriptevent lattice:daymare");
});

world.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "lattice:daymare" && event.id !== "lattice:nightmare") return;
  const player = event.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") {
    world.sendMessage("Run this event as a player: /scriptevent lattice:daymare");
    return;
  }
  startDream(player, event.id.endsWith("nightmare") ? "nightmare" : "daymare");
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
  if (event.player.dimension.id !== "minecraft:overworld" || sessions.has(event.player.id)) return;
  addMetric("extraction", 1);
  const id = event.brokenBlockPermutation.type.id;
  if (id === "minecraft:obsidian" || id === "minecraft:crying_obsidian") {
    const count = (obsidianMined.get(event.player.id) ?? 0) + 1;
    obsidianMined.set(event.player.id, count);
    if (count >= 64) {
      obsidianMined.set(event.player.id, 0);
      startDream(event.player, "daymare");
    }
  }
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  if (event.player.dimension.id !== "minecraft:overworld" || sessions.has(event.player.id)) return;
  const id = event.block.typeId;
  if (id.includes("sapling") || id.includes("flower") || id.includes("leaves") || id.includes("moss") || id.includes("vine")) {
    addMetric("restoration", 1);
  }
});

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  if (sessions.has(event.player.id)) event.cancel = true;
});

world.beforeEvents.playerPlaceBlock.subscribe((event) => {
  if (sessions.has(event.player.id)) event.cancel = true;
});

// Nightmares begin at nightfall and end automatically after about one minute.
system.runInterval(() => {
  let time = 0;
  try { time = world.getTimeOfDay(); } catch { return; }
  const isNight = time >= 13000 && time < 23000;
  if (isNight && !wasNight) {
    for (const player of world.getAllPlayers()) {
      if (player.dimension.id === "minecraft:overworld" && !sessions.has(player.id)) startDream(player, "nightmare");
    }
  }
  wasNight = isNight;

  for (const player of world.getAllPlayers()) {
    const session = sessions.get(player.id);
    if (!session || player.dimension.id !== DREAM_DIMENSION_ID) continue;
    if (player.location.y < CENTER.y - 5) {
      const inTesseract = Math.abs(player.location.x) <= 3 && Math.abs(player.location.z) <= 3;
      if (inTesseract || session.type === "nightmare") {
        endDream(player, inTesseract ? "entered the Tesseract" : "nightmare fall rescue");
      } else {
        // A fall elsewhere is a safety net, not an exit. Return to the dream's edge.
        player.teleport({ x: 0, y: CENTER.y + 4, z: -16 }, { dimension: world.getDimension(DREAM_DIMENSION_ID) });
      }
    }
  }
}, 1);

world.afterEvents.playerSpawn.subscribe((event) => {
  system.run(() => {
    const player = event.player;
    if (player.dimension.id === DREAM_DIMENSION_ID && !sessions.has(player.id)) {
      if (!restorePersistentBackup(player)) {
        try { player.teleport(world.getDefaultSpawnLocation(), { dimension: world.getDimension("minecraft:overworld") }); } catch {}
      }
    } else if (sessions.has(player.id) && player.dimension.id !== DREAM_DIMENSION_ID) {
      endDream(player, "reconnected");
    }
  });
});
