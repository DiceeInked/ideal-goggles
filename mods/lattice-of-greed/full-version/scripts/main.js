import { world, system, ItemStack } from "@minecraft/server";

/*
 * Lattice of Greed - biome-island build, version 1.3.1.
 * This release returns to the lean 1.1 generator and adds:
 * - the original tiny resource islets around the starter oak tree;
 * - a rotating catalog of Overworld and cave biome island clusters;
 * - eight satellite islets around every biome main island;
 * - a walkable themed room inside the lower lattice with a survival loot chest.
 *
 * Structure markers persist across sessions so mined islands and claimed room
 * loot do not respawn when players leave and return.
 */

const DIMENSION_ID = "log:abyss";
const GRID_MIN = -32;
const GRID_MAX = 0;
const GRID_STEP = 4;
const REGION_SIZE = 16;
// Bedrock Script API does not expose the client's exact render-distance setting.
// Four chunks in each direction is a conservative, configurable approximation.
const NEARBY_REGION_RADIUS = 4;
const BLOCK_RETRY_COOLDOWN = 100;
const TREE_X = 2;
const TREE_Z = 2;
const BLOCKS_PER_TICK = 240;

const generatedRegions = new Set();
const jobs = new Map();
const retryAfterTick = new Map();
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

const BIOME_CATALOG = [
  biomeProfile("plains", "Plains", "grass_block", "dirt", "stone", ["hay_block", "coal_ore", "iron_ore"], "farm"),
  biomeProfile("sunflower_plains", "Sunflower Plains", "grass_block", "dirt", "stone", ["hay_block", "gold_ore", "coal_ore"], "farm"),
  biomeProfile("snowy_plains", "Snowy Plains", "snow_block", "dirt", "stone", ["snow_block", "coal_ore", "iron_ore"], "cold"),
  biomeProfile("ice_spikes", "Ice Spikes", "packed_ice", "ice", "blue_ice", ["packed_ice", "blue_ice", "ice"], "cold"),
  biomeProfile("desert", "Desert", "sand", "sand", "sandstone", ["sandstone", "red_sandstone", "gold_ore"], "desert"),
  biomeProfile("swamp", "Swamp", "mud", "clay", "stone", ["mud", "moss_block", "clay"], "swamp"),
  biomeProfile("mangrove_swamp", "Mangrove Swamp", "mud", "mangrove_roots", "clay", ["mangrove_log", "mud", "clay"], "swamp"),
  biomeProfile("forest", "Forest", "grass_block", "dirt", "stone", ["oak_log", "coal_ore", "iron_ore"], "forest"),
  biomeProfile("flower_forest", "Flower Forest", "grass_block", "moss_block", "dirt", ["moss_block", "bone_block", "coal_ore"], "flowers"),
  biomeProfile("birch_forest", "Birch Forest", "grass_block", "dirt", "stone", ["birch_log", "iron_ore", "coal_ore"], "forest"),
  biomeProfile("old_growth_birch_forest", "Old Growth Birch Forest", "grass_block", "podzol", "stone", ["birch_log", "moss_block", "iron_ore"], "forest"),
  biomeProfile("dark_forest", "Dark Forest", "grass_block", "podzol", "stone", ["dark_oak_log", "mossy_cobblestone", "gold_ore"], "dark_forest"),
  biomeProfile("pale_garden", "Pale Garden", "pale_moss_block", "pale_moss_block", "stone", ["pale_oak_log", "pale_moss_block", "coal_ore"], "pale_garden"),
  biomeProfile("dappled_forest", "Dappled Forest", "grass_block", "moss_block", "stone", ["oak_log", "moss_block", "birch_log"], "forest"),
  biomeProfile("taiga", "Taiga", "podzol", "dirt", "stone", ["spruce_log", "coal_ore", "iron_ore"], "taiga"),
  biomeProfile("snowy_taiga", "Snowy Taiga", "snow_block", "podzol", "stone", ["spruce_log", "packed_ice", "iron_ore"], "cold"),
  biomeProfile("old_growth_spruce_taiga", "Old Growth Spruce Taiga", "podzol", "coarse_dirt", "stone", ["spruce_log", "moss_block", "iron_ore"], "taiga"),
  biomeProfile("old_growth_pine_taiga", "Old Growth Pine Taiga", "podzol", "coarse_dirt", "stone", ["spruce_log", "gravel", "coal_ore"], "taiga"),
  biomeProfile("savanna", "Savanna", "grass_block", "coarse_dirt", "stone", ["acacia_log", "terracotta", "gold_ore"], "savanna"),
  biomeProfile("savanna_plateau", "Savanna Plateau", "grass_block", "coarse_dirt", "stone", ["acacia_log", "terracotta", "iron_ore"], "savanna"),
  biomeProfile("windswept_hills", "Windswept Hills", "stone", "stone", "cobblestone", ["stone", "emerald_ore", "iron_ore"], "mountain"),
  biomeProfile("windswept_forest", "Windswept Forest", "grass_block", "coarse_dirt", "stone", ["oak_log", "stone", "iron_ore"], "forest"),
  biomeProfile("windswept_gravelly_hills", "Windswept Gravelly Hills", "gravel", "stone", "cobblestone", ["gravel", "stone", "iron_ore"], "mountain"),
  biomeProfile("windswept_savanna", "Windswept Savanna", "coarse_dirt", "stone", "terracotta", ["acacia_log", "coarse_dirt", "gold_ore"], "savanna"),
  biomeProfile("jungle", "Jungle", "grass_block", "dirt", "stone", ["jungle_log", "melon_block", "bamboo_block"], "jungle"),
  biomeProfile("sparse_jungle", "Sparse Jungle", "grass_block", "coarse_dirt", "stone", ["jungle_log", "melon_block", "moss_block"], "jungle"),
  biomeProfile("bamboo_jungle", "Bamboo Jungle", "podzol", "dirt", "stone", ["bamboo_block", "jungle_log", "moss_block"], "jungle"),
  biomeProfile("badlands", "Badlands", "red_sand", "red_sand", "red_sandstone", ["red_sandstone", "terracotta", "gold_ore"], "badlands"),
  biomeProfile("eroded_badlands", "Eroded Badlands", "red_sand", "orange_terracotta", "red_sandstone", ["red_sandstone", "orange_terracotta", "gold_ore"], "badlands"),
  biomeProfile("wooded_badlands", "Wooded Badlands", "red_sand", "terracotta", "red_sandstone", ["red_sandstone", "oak_log", "gold_ore"], "badlands"),
  biomeProfile("meadow", "Meadow", "grass_block", "dirt", "stone", ["emerald_ore", "iron_ore", "moss_block"], "mountain"),
  biomeProfile("cherry_grove", "Cherry Grove", "grass_block", "dirt", "stone", ["cherry_log", "cherry_leaves", "iron_ore"], "cherry"),
  biomeProfile("grove", "Grove", "snow_block", "podzol", "stone", ["spruce_log", "packed_ice", "iron_ore"], "cold"),
  biomeProfile("snowy_slopes", "Snowy Slopes", "snow_block", "stone", "packed_ice", ["snow_block", "iron_ore", "packed_ice"], "cold"),
  biomeProfile("frozen_peaks", "Frozen Peaks", "packed_ice", "snow_block", "blue_ice", ["blue_ice", "iron_ore", "packed_ice"], "cold"),
  biomeProfile("jagged_peaks", "Jagged Peaks", "stone", "cobblestone", "deepslate", ["iron_ore", "emerald_ore", "stone"], "mountain"),
  biomeProfile("stony_peaks", "Stony Peaks", "calcite", "stone", "cobblestone", ["calcite", "iron_ore", "coal_ore"], "mountain"),
  biomeProfile("river", "River", "gravel", "clay", "stone", ["clay", "gravel", "sand"], "ocean"),
  biomeProfile("frozen_river", "Frozen River", "ice", "packed_ice", "blue_ice", ["ice", "packed_ice", "blue_ice"], "cold"),
  biomeProfile("beach", "Beach", "sand", "sand", "sandstone", ["sand", "gravel", "sandstone"], "ocean"),
  biomeProfile("snowy_beach", "Snowy Beach", "snow_block", "sand", "packed_ice", ["sand", "snow_block", "ice"], "cold"),
  biomeProfile("stony_shore", "Stony Shore", "stone", "gravel", "cobblestone", ["stone", "gravel", "iron_ore"], "mountain"),
  biomeProfile("warm_ocean", "Warm Ocean", "sand", "gravel", "stone", ["prismarine", "coral_block", "sand"], "ocean"),
  biomeProfile("lukewarm_ocean", "Lukewarm Ocean", "gravel", "sand", "stone", ["prismarine", "sea_lantern", "gravel"], "ocean"),
  biomeProfile("deep_lukewarm_ocean", "Deep Lukewarm Ocean", "gravel", "stone", "deepslate", ["prismarine", "gold_ore", "deepslate"], "ocean"),
  biomeProfile("ocean", "Ocean", "sand", "gravel", "stone", ["kelp", "prismarine", "iron_ore"], "ocean"),
  biomeProfile("deep_ocean", "Deep Ocean", "gravel", "stone", "deepslate", ["prismarine", "gold_ore", "deepslate"], "ocean"),
  biomeProfile("cold_ocean", "Cold Ocean", "gravel", "stone", "cobblestone", ["ice", "prismarine", "iron_ore"], "ocean"),
  biomeProfile("deep_cold_ocean", "Deep Cold Ocean", "gravel", "deepslate", "stone", ["prismarine", "deepslate", "gold_ore"], "ocean"),
  biomeProfile("frozen_ocean", "Frozen Ocean", "ice", "packed_ice", "blue_ice", ["ice", "packed_ice", "blue_ice"], "cold"),
  biomeProfile("deep_frozen_ocean", "Deep Frozen Ocean", "packed_ice", "blue_ice", "stone", ["blue_ice", "packed_ice", "prismarine"], "cold"),
  biomeProfile("mushroom_fields", "Mushroom Fields", "mycelium", "dirt", "stone", ["red_mushroom_block", "brown_mushroom_block", "mycelium"], "mushroom"),
  biomeProfile("lush_caves", "Lush Caves", "moss_block", "rooted_dirt", "stone", ["moss_block", "clay", "iron_ore"], "lush_caves"),
  biomeProfile("dripstone_caves", "Dripstone Caves", "dripstone_block", "tuff", "stone", ["dripstone_block", "copper_ore", "tuff"], "dripstone_caves"),
  biomeProfile("deep_dark", "Deep Dark", "sculk", "deepslate", "cobbled_deepslate", ["sculk", "sculk_catalyst", "deepslate"], "deep_dark"),
  biomeProfile("sulfur_caves", "Sulfur Caves", "yellow_terracotta", "tuff", "stone", ["yellow_terracotta", "calcite", "gold_ore"], "sulfur_caves")
];

const STRUCTURE_ROOMS = [
  structureRoom("village", "Village Cellar", "cobblestone", "oak_planks", "hay_block", "farm"),
  structureRoom("mineshaft", "Abandoned Mineshaft", "oak_planks", "cobblestone", "rail", "mineshaft"),
  structureRoom("stronghold", "Stronghold Chamber", "stone_bricks", "cracked_stone_bricks", "mossy_stone_bricks", "stronghold"),
  structureRoom("trial_chamber", "Trial Chamber", "tuff_bricks", "polished_tuff", "copper_block", "trial_chamber"),
  structureRoom("ancient_city", "Ancient City", "deepslate_bricks", "polished_deepslate", "sculk", "ancient_city"),
  structureRoom("desert_temple", "Desert Temple", "sandstone", "smooth_sandstone", "orange_terracotta", "desert_temple"),
  structureRoom("jungle_temple", "Jungle Temple", "mossy_cobblestone", "cobblestone", "chiseled_stone_bricks", "jungle_temple"),
  structureRoom("ocean_monument", "Ocean Monument", "prismarine_bricks", "dark_prismarine", "sea_lantern", "ocean_monument"),
  structureRoom("ocean_ruins", "Ocean Ruins", "mossy_stone_bricks", "stone_bricks", "mossy_cobblestone", "ocean_ruins"),
  structureRoom("shipwreck", "Shipwreck Hold", "oak_planks", "stripped_oak_log", "barrel", "shipwreck"),
  structureRoom("buried_treasure", "Buried Treasure", "sandstone", "sandstone", "gold_block", "treasure"),
  structureRoom("ruined_portal", "Ruined Portal", "obsidian", "crying_obsidian", "gold_block", "ruined_portal"),
  structureRoom("igloo", "Igloo Basement", "snow_block", "packed_ice", "furnace", "igloo"),
  structureRoom("witch_hut", "Witch Hut", "spruce_planks", "mud", "cauldron", "witch_hut"),
  structureRoom("woodland_mansion", "Woodland Mansion", "dark_oak_planks", "oak_planks", "bookshelf", "mansion"),
  structureRoom("pillager_outpost", "Pillager Outpost", "spruce_planks", "cobblestone", "iron_bars", "outpost"),
  structureRoom("trail_ruins", "Trail Ruins", "mud_bricks", "packed_mud", "terracotta", "trail_ruins"),
  structureRoom("amethyst_geode", "Amethyst Geode", "smooth_basalt", "calcite", "amethyst_block", "geode"),
  structureRoom("fossil", "Fossil Chamber", "bone_block", "sandstone", "coal_ore", "fossil"),
  structureRoom("dungeon", "Dungeon Spawner Room", "mossy_cobblestone", "cobblestone", "iron_bars", "dungeon"),
  structureRoom("abandoned_camp", "Abandoned Camp", "oak_planks", "coarse_dirt", "campfire", "camp")
];

const COMMON_LOOT = [
  "oak_log", "oak_planks", "stick", "torch", "crafting_table", "furnace",
  "cobblestone", "stone", "coal", "charcoal", "raw_iron", "raw_copper",
  "raw_gold", "iron_ingot", "copper_ingot", "gold_ingot", "glass", "sand",
  "gravel", "flint", "clay_ball", "brick", "wheat", "wheat_seeds", "bread",
  "apple", "carrot", "potato", "beetroot_seeds", "pumpkin_seeds", "melon_seeds",
  "bone", "string", "arrow", "feather", "leather", "egg", "white_wool",
  "spruce_log", "spruce_sapling", "birch_log", "birch_sapling",
  "jungle_log", "jungle_sapling", "acacia_log", "acacia_sapling",
  "dark_oak_log", "dark_oak_sapling", "mangrove_log", "mangrove_propagule",
  "cherry_log", "cherry_sapling", "bamboo", "sugar_cane", "cactus",
  "red_mushroom", "brown_mushroom", "vine", "glow_berries", "sweet_berries",
  "bucket", "water_bucket", "lava_bucket", "milk_bucket", "powder_snow_bucket",
  "flint_and_steel", "shears", "shield", "bow", "crossbow", "fishing_rod",
  "lead", "compass", "clock", "map", "paper", "book", "writable_book",
  "glass_bottle", "sugar", "bone_meal", "mushroom_stew", "rabbit_stew",
  "baked_potato", "cooked_beef", "cooked_porkchop", "cooked_chicken",
  "cooked_mutton", "cooked_rabbit", "cooked_cod", "cooked_salmon",
  "oak_boat", "spruce_boat", "birch_boat", "jungle_boat", "acacia_boat",
  "dark_oak_boat", "mangrove_boat", "cherry_boat", "pale_oak_boat", "bamboo_raft",
  "rail", "powered_rail", "detector_rail", "activator_rail", "minecart",
  "chest_minecart", "hopper_minecart", "tnt_minecart",
  "redstone", "redstone_torch", "repeater", "comparator", "lever",
  "piston", "sticky_piston", "observer", "dispenser", "dropper", "hopper",
  "anvil", "cauldron", "composter", "lectern", "loom", "smithing_table",
  "stonecutter", "grindstone", "cartography_table", "fletching_table",
  "barrel", "chest", "trapped_chest", "ender_chest",
  "white_dye", "orange_dye", "magenta_dye", "light_blue_dye", "yellow_dye",
  "lime_dye", "pink_dye", "gray_dye", "light_gray_dye", "cyan_dye",
  "purple_dye", "blue_dye", "brown_dye", "green_dye", "red_dye", "black_dye",
  "white_wool", "orange_wool", "magenta_wool", "light_blue_wool", "yellow_wool",
  "lime_wool", "pink_wool", "gray_wool", "light_gray_wool", "cyan_wool",
  "purple_wool", "blue_wool", "brown_wool", "green_wool", "red_wool", "black_wool",
  "nether_wart", "quartz", "glowstone_dust",
  "crimson_stem", "warped_stem", "crimson_nylium", "warped_nylium",
  "prismarine", "prismarine_bricks", "dark_prismarine", "sea_lantern",
  "amethyst_shard", "copper_block", "iron_block", "gold_block",
  "redstone_block", "lapis_block", "diamond_block", "emerald_block"
];
const RARE_LOOT = [
  "diamond", "emerald", "lapis_lazuli", "redstone", "amethyst_shard",
  "prismarine_shard", "prismarine_crystals", "nautilus_shell", "heart_of_the_sea",
  "saddle", "name_tag", "golden_apple", "enchanted_golden_apple", "obsidian",
  "crying_obsidian", "sponge", "turtle_scute", "phantom_membrane", "slime_ball",
  "gunpowder", "ender_pearl", "echo_shard", "disc_fragment_5", "goat_horn",
  "armadillo_scute", "rabbit_foot", "rabbit_hide", "honeycomb", "honey_bottle",
  "raw_beef", "raw_porkchop", "raw_chicken", "raw_mutton", "raw_rabbit",
  "raw_cod", "raw_salmon", "tropical_fish", "pufferfish", "ink_sac", "glow_ink_sac",
  "rotten_flesh", "spider_eye", "blaze_rod", "ghast_tear", "magma_cream",
  "fire_charge", "wind_charge", "breeze_rod", "heavy_core", "trial_key",
  "ominous_trial_key", "music_disc_13", "music_disc_cat", "music_disc_creator",
  "coast_armor_trim_smithing_template", "dune_armor_trim_smithing_template",
  "eye_armor_trim_smithing_template", "sentry_armor_trim_smithing_template",
  "silence_armor_trim_smithing_template", "ward_armor_trim_smithing_template",
  "wayfinder_armor_trim_smithing_template", "raiser_armor_trim_smithing_template",
  "shaper_armor_trim_smithing_template", "host_armor_trim_smithing_template",
  "flow_armor_trim_smithing_template", "bolt_armor_trim_smithing_template",
  "angler_pottery_sherd", "archer_pottery_sherd", "arms_up_pottery_sherd",
  "blade_pottery_sherd", "brewer_pottery_sherd", "burn_pottery_sherd",
  "danger_pottery_sherd", "explorer_pottery_sherd", "flow_pottery_sherd",
  "friend_pottery_sherd", "guster_pottery_sherd", "heart_pottery_sherd",
  "heartbreak_pottery_sherd", "howl_pottery_sherd", "miner_pottery_sherd",
  "mourner_pottery_sherd", "plenty_pottery_sherd", "prize_pottery_sherd",
  "scrape_pottery_sherd", "sheaf_pottery_sherd", "shelter_pottery_sherd",
  "skull_pottery_sherd", "snort_pottery_sherd",
  "elytra", "totem_of_undying", "trident", "mace", "netherite_ingot",
  "netherite_scrap", "netherite_upgrade_smithing_template", "ancient_debris",
  "blaze_powder", "ender_eye", "shulker_shell", "shulker_box", "dragon_breath",
  "chorus_fruit", "popped_chorus_fruit", "end_stone", "purpur_block",
  "nether_star", "beacon", "conduit", "end_crystal", "nether_wart",
  "quartz", "nether_brick", "red_nether_bricks", "soul_sand", "soul_soil",
  "blackstone", "gilded_blackstone", "basalt", "polished_basalt",
  "turtle_helmet", "leather_helmet", "leather_chestplate", "leather_leggings",
  "leather_boots", "chainmail_helmet", "chainmail_chestplate",
  "chainmail_leggings", "chainmail_boots", "iron_helmet", "iron_chestplate",
  "iron_leggings", "iron_boots", "golden_helmet", "golden_chestplate",
  "golden_leggings", "golden_boots", "diamond_helmet", "diamond_chestplate",
  "diamond_leggings", "diamond_boots", "netherite_helmet", "netherite_chestplate",
  "netherite_leggings", "netherite_boots", "wooden_pickaxe", "stone_pickaxe",
  "iron_pickaxe", "golden_pickaxe", "diamond_pickaxe", "netherite_pickaxe",
  "wooden_axe", "stone_axe", "iron_axe", "diamond_axe", "netherite_axe",
  "wooden_shovel", "stone_shovel", "iron_shovel", "diamond_shovel",
  "wooden_hoe", "stone_hoe", "iron_hoe", "diamond_hoe",
  "wooden_sword", "stone_sword", "iron_sword", "diamond_sword",
  "netherite_sword", "iron_door", "oak_door", "spruce_door", "birch_door",
  "jungle_door", "acacia_door", "dark_oak_door", "mangrove_door",
  "cherry_door", "pale_oak_door", "iron_bars", "chain", "lantern",
  "soul_lantern", "end_rod", "lightning_rod", "honey_block", "slime_block"
];
const SINGLE_ITEM_LOOT = new Set([
  "crafting_table", "furnace", "saddle", "name_tag", "heart_of_the_sea",
  "enchanted_golden_apple", "golden_apple", "sponge", "turtle_scute",
  "phantom_membrane", "ender_pearl", "echo_shard", "disc_fragment_5",
  "goat_horn", "armadillo_scute", "rabbit_foot", "honey_bottle",
  "blaze_rod", "ghast_tear", "magma_cream", "fire_charge", "wind_charge",
  "breeze_rod", "heavy_core", "trial_key", "ominous_trial_key",
  "music_disc_13", "music_disc_cat", "music_disc_creator",
  "bucket", "water_bucket", "lava_bucket", "milk_bucket", "powder_snow_bucket",
  "flint_and_steel", "shears", "shield", "bow", "crossbow", "fishing_rod",
  "lead", "compass", "clock", "map", "paper", "book", "writable_book",
  "glass_bottle", "oak_boat", "spruce_boat", "birch_boat", "jungle_boat",
  "acacia_boat", "dark_oak_boat", "mangrove_boat", "cherry_boat", "pale_oak_boat",
  "bamboo_raft", "minecart", "chest_minecart", "hopper_minecart", "tnt_minecart",
  "rail", "powered_rail", "detector_rail", "activator_rail",
  "repeater", "comparator", "lever", "piston", "sticky_piston", "observer",
  "dispenser", "dropper", "hopper", "anvil", "cauldron", "lectern", "loom",
  "smithing_table", "stonecutter", "grindstone", "cartography_table",
  "fletching_table", "barrel", "chest", "trapped_chest", "ender_chest",
  "elytra", "totem_of_undying", "trident", "mace", "netherite_ingot",
  "netherite_upgrade_smithing_template", "shulker_shell", "shulker_box",
  "dragon_breath", "nether_star", "beacon", "conduit", "end_crystal",
  "wooden_pickaxe", "stone_pickaxe", "iron_pickaxe", "golden_pickaxe",
  "diamond_pickaxe", "netherite_pickaxe", "wooden_axe", "stone_axe", "iron_axe",
  "diamond_axe", "netherite_axe", "wooden_shovel", "stone_shovel", "iron_shovel",
  "diamond_shovel", "wooden_hoe", "stone_hoe", "iron_hoe", "diamond_hoe",
  "wooden_sword", "stone_sword", "iron_sword", "diamond_sword", "netherite_sword",
  "turtle_helmet", "leather_helmet", "leather_chestplate", "leather_leggings",
  "leather_boots", "chainmail_helmet", "chainmail_chestplate", "chainmail_leggings",
  "chainmail_boots", "iron_helmet", "iron_chestplate", "iron_leggings", "iron_boots",
  "golden_helmet", "golden_chestplate", "golden_leggings", "golden_boots",
  "diamond_helmet", "diamond_chestplate", "diamond_leggings", "diamond_boots",
  "netherite_helmet", "netherite_chestplate", "netherite_leggings", "netherite_boots"
]);

const BIOME_LOOT_POOLS = {
  farm: ["wheat", "wheat_seeds", "bread", "hay_block", "carrot", "potato", "beetroot_seeds", "pumpkin", "melon", "apple", "bone_meal", "composter"],
  cold: ["snowball", "snow_block", "ice", "packed_ice", "blue_ice", "spruce_log", "spruce_sapling", "rabbit_hide", "leather", "cod", "salmon"],
  desert: ["sand", "sandstone", "red_sand", "red_sandstone", "terracotta", "orange_terracotta", "cactus", "dead_bush", "bone", "gold_ingot"],
  swamp: ["mud", "clay_ball", "mangrove_log", "mangrove_roots", "lily_pad", "vine", "slime_ball", "blue_orchid", "honeycomb"],
  forest: ["oak_log", "oak_sapling", "birch_log", "birch_sapling", "spruce_log", "spruce_sapling", "apple", "stick", "mushroom_stew", "bee_nest"],
  flowers: ["dandelion", "poppy", "azure_bluet", "oxeye_daisy", "cornflower", "allium", "lily_of_the_valley", "sunflower", "pink_petals", "bone_meal", "honeycomb"],
  dark_forest: ["dark_oak_log", "dark_oak_sapling", "mushroom_stew", "red_mushroom", "brown_mushroom", "mossy_cobblestone", "gold_ingot"],
  pale_garden: ["pale_oak_log", "pale_oak_sapling", "pale_moss_block", "pale_hanging_moss", "closed_eyeblossom", "bone_meal"],
  taiga: ["spruce_log", "spruce_sapling", "sweet_berries", "podzol", "moss_block", "coal", "leather"],
  savanna: ["acacia_log", "acacia_sapling", "coarse_dirt", "gold_ingot", "wheat", "bone"],
  mountain: ["stone", "cobblestone", "andesite", "diorite", "granite", "tuff", "calcite", "raw_iron", "coal", "emerald"],
  jungle: ["jungle_log", "jungle_sapling", "bamboo", "cocoa_beans", "melon", "melon_seeds", "vine", "moss_block"],
  badlands: ["red_sand", "red_sandstone", "terracotta", "orange_terracotta", "yellow_terracotta", "gold_ore", "gold_ingot"],
  cherry: ["cherry_log", "cherry_sapling", "pink_petals", "cherry_leaves", "honeycomb", "bee_nest"],
  ocean: ["kelp", "seagrass", "prismarine_shard", "prismarine_crystals", "sea_pickle", "sponge", "nautilus_shell", "heart_of_the_sea", "turtle_scute", "cod", "salmon", "tropical_fish", "pufferfish"],
  mushroom: ["mycelium", "red_mushroom", "brown_mushroom", "red_mushroom_block", "brown_mushroom_block", "mushroom_stew"],
  lush_caves: ["moss_block", "rooted_dirt", "clay_ball", "glow_berries", "spore_blossom", "azalea", "flowering_azalea", "iron_ore", "coal"],
  dripstone_caves: ["pointed_dripstone", "dripstone_block", "copper_ore", "raw_copper", "tuff", "calcite", "iron_ore"],
  deep_dark: ["sculk", "sculk_catalyst", "sculk_sensor", "echo_shard", "disc_fragment_5", "deepslate", "diamond", "iron_ingot"],
  sulfur_caves: ["yellow_terracotta", "tuff", "calcite", "raw_gold", "gold_ingot", "glowstone_dust"]
};
const STRUCTURE_LOOT_POOLS = {
  farm: ["bread", "wheat", "carrot", "potato", "beetroot_seeds", "iron_ingot", "emerald", "saddle", "name_tag"],
  mineshaft: ["rail", "torch", "coal", "raw_iron", "raw_copper", "iron_ingot", "minecart", "name_tag", "golden_apple"],
  stronghold: ["ender_pearl", "eye_of_ender", "iron_ingot", "gold_ingot", "book", "compass", "clock", "diamond", "emerald"],
  trial_chamber: ["copper_ingot", "trial_key", "ominous_trial_key", "breeze_rod", "wind_charge", "heavy_core", "diamond", "emerald"],
  ancient_city: ["echo_shard", "disc_fragment_5", "sculk", "diamond", "enchanted_golden_apple", "gold_ingot", "silence_armor_trim_smithing_template"],
  desert_temple: ["gold_ingot", "iron_ingot", "diamond", "emerald", "sandstone", "dune_armor_trim_smithing_template", "gunpowder"],
  jungle_temple: ["emerald", "gold_ingot", "iron_ingot", "bamboo", "cocoa_beans", "wild_armor_trim_smithing_template"],
  ocean_monument: ["prismarine_shard", "prismarine_crystals", "sponge", "gold_ingot", "nautilus_shell", "heart_of_the_sea"],
  ocean_ruins: ["prismarine_shard", "coal", "rotten_flesh", "gold_nugget", "fishing_rod", "snort_pottery_sherd"],
  shipwreck: ["paper", "map", "compass", "iron_ingot", "emerald", "gold_ingot", "potato", "carrot", "coast_armor_trim_smithing_template"],
  treasure: ["diamond", "emerald", "gold_ingot", "iron_ingot", "heart_of_the_sea", "tnt", "prismarine_crystals"],
  ruined_portal: ["obsidian", "crying_obsidian", "flint_and_steel", "gold_ingot", "gold_nugget", "golden_apple"],
  igloo: ["snowball", "golden_apple", "coal", "gold_nugget", "emerald"],
  witch_hut: ["glass_bottle", "spider_eye", "sugar", "red_mushroom", "brown_mushroom", "cauldron", "emerald"],
  mansion: ["totem_of_undying", "emerald", "iron_ingot", "gold_ingot", "diamond", "vex_armor_trim_smithing_template"],
  outpost: ["crossbow", "arrow", "iron_ingot", "emerald", "dark_oak_log", "sentry_armor_trim_smithing_template"],
  trail_ruins: ["brush", "brick", "emerald", "prize_pottery_sherd", "raiser_armor_trim_smithing_template"],
  geode: ["amethyst_shard", "amethyst_block", "calcite", "smooth_basalt", "copper_ingot"],
  fossil: ["bone", "bone_block", "coal", "diamond", "raw_iron"],
  dungeon: ["bone", "string", "arrow", "rotten_flesh", "spider_eye", "golden_apple", "music_disc_cat"],
  camp: ["bread", "torch", "campfire", "oak_log", "stick", "leather", "bed", "compass"]
};

function blockId(value) {
  return value.indexOf(":") >= 0 ? value : "minecraft:" + value;
}

function biomeProfile(key, name, top, soil, base, resources, loot) {
  return {
    key, name,
    top: blockId(top),
    soil: blockId(soil),
    base: blockId(base),
    resources: resources.map(blockId),
    loot
  };
}

function structureRoom(key, name, wall, floor, accent, loot) {
  return {
    key, name,
    wall: blockId(wall),
    floor: blockId(floor),
    accent: blockId(accent),
    loot
  };
}

function seededValue(x, z, salt = 0) {
  let value = Math.imul((x | 0), 374761393) +
    Math.imul((z | 0), 668265263) + Math.imul((salt | 0), 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function seededUnit(x, z, salt = 0) {
  return seededValue(x, z, salt) / 4294967295;
}

function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

function persistentRegionKey(rx, rz) {
  return "log:biome_region_" + rx + "_" + rz;
}

function hasPersistentRegion(rx, rz) {
  try {
    return world.getDynamicProperty(persistentRegionKey(rx, rz)) === true;
  } catch {
    return false;
  }
}

function chooseStructure(rx, rz) {
  return STRUCTURE_ROOMS[positiveModulo(rx + rz * 7 + 5, STRUCTURE_ROOMS.length)];
}

function chooseBiome(rx, rz) {
  // A 9x9 neighbourhood spans at least 81 consecutive indices, ensuring
  // every one of the 56 catalogue entries occurs near every explored region.
  return BIOME_CATALOG[positiveModulo(rx + rz * 9 + 17, BIOME_CATALOG.length)];
}

function addResourceIsletTasks(tasks, cx, cz, blockType) {
  // Restored from the older build: a 3x3x3 dirt islet with one resource in the middle.
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      addTask(tasks, cx + dx, -3, cz + dz, "minecraft:dirt");
      addTask(tasks, cx + dx, -2, cz + dz,
        dx === 0 && dz === 0 ? blockType : "minecraft:dirt");
      addTask(tasks, cx + dx, -1, cz + dz, "minecraft:grass_block");
    }
  }
}

const STARTER_PLATFORM_BLOCKS = [
  "minecraft:stone", "minecraft:coal_ore", "minecraft:iron_ore",
  "minecraft:copper_ore", "minecraft:gold_ore", "minecraft:redstone_ore",
  "minecraft:lapis_ore", "minecraft:emerald_ore", "minecraft:diamond_ore",
  "minecraft:oak_log", "minecraft:glass", "minecraft:deepslate",
  "minecraft:granite", "minecraft:diorite", "minecraft:andesite",
  "minecraft:cobblestone", "minecraft:sandstone"
];

function addStarterIslets(tasks, sx, sz) {
  // Original distance curve: islets are common close to the tree and taper off farther away.
  for (let bx = sx; bx < sx + REGION_SIZE; bx += GRID_STEP) {
    for (let bz = sz; bz < sz + REGION_SIZE; bz += GRID_STEP) {
      const cx = bx + 2;
      const cz = bz + 2;
      if (cx === TREE_X && cz === TREE_Z) continue;
      const distance = Math.sqrt((cx - TREE_X) ** 2 + (cz - TREE_Z) ** 2);
      let chance = 0.001;
      if (distance <= 4.5) chance = 0.98;
      else if (distance <= 8.5) chance = 0.86;
      else if (distance <= 20) chance = 0.76 - (distance - 8) * 0.025;
      else if (distance <= 40) chance = 0.2 - (distance - 20) * 0.009;
      else if (distance <= 64) chance = 0.02;
      chance = Math.max(0.001, chance);
      if (seededUnit(cx, cz, 12) > chance) continue;
      const resource = STARTER_PLATFORM_BLOCKS[
        seededValue(cx, cz, 13) % STARTER_PLATFORM_BLOCKS.length
      ];
      addResourceIsletTasks(tasks, cx, cz, resource);
    }
  }
}

const BIOME_TREE_STYLES = {
  forest: ["oak_log", "oak_leaves"],
  flower_forest: ["oak_log", "oak_leaves"],
  birch_forest: ["birch_log", "birch_leaves"],
  old_growth_birch_forest: ["birch_log", "birch_leaves"],
  dark_forest: ["dark_oak_log", "dark_oak_leaves"],
  dappled_forest: ["oak_log", "oak_leaves"],
  pale_garden: ["pale_oak_log", "pale_oak_leaves"],
  taiga: ["spruce_log", "spruce_leaves"],
  snowy_taiga: ["spruce_log", "spruce_leaves"],
  old_growth_spruce_taiga: ["spruce_log", "spruce_leaves"],
  old_growth_pine_taiga: ["spruce_log", "spruce_leaves"],
  windswept_forest: ["oak_log", "oak_leaves"],
  jungle: ["jungle_log", "jungle_leaves"],
  sparse_jungle: ["jungle_log", "jungle_leaves"],
  bamboo_jungle: ["jungle_log", "jungle_leaves"],
  savanna: ["acacia_log", "acacia_leaves"],
  savanna_plateau: ["acacia_log", "acacia_leaves"],
  cherry_grove: ["cherry_log", "cherry_leaves"],
  mangrove_swamp: ["mangrove_log", "mangrove_leaves"]
};

const ISLAND_FLOWERS = [
  "dandelion", "poppy", "azure_bluet", "oxeye_daisy",
  "cornflower", "allium", "red_tulip", "orange_tulip",
  "white_tulip", "pink_tulip", "blue_orchid", "lily_of_the_valley"
];

function addTinyBiomeTree(tasks, cx, cz, logId, leavesId) {
  const trunkHeight = 2 + (seededValue(cx, cz, 811) % 2);
  for (let y = 0; y < trunkHeight; y++) {
    addTask(tasks, cx, y, cz, blockId(logId));
  }

  // Two small leaf layers fit on the 3x3 island without touching its neighbours.
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      if (Math.abs(dx) === 1 && Math.abs(dz) === 1 &&
          seededValue(cx + dx, cz + dz, 812) % 4 === 0) continue;
      addTask(tasks, cx + dx, trunkHeight - 1, cz + dz, blockId(leavesId));
      addTask(tasks, cx + dx, trunkHeight, cz + dz, blockId(leavesId));
    }
  }
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      addTask(tasks, cx + dx, trunkHeight + 1, cz + dz, blockId(leavesId));
    }
  }
}

function addBiomeSurfaceDecorations(tasks, cx, cz, profile, isMain) {
  const key = profile.key;
  const roll = seededValue(cx, cz, isMain ? 830 : 831);
  const positions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];
  const pickPosition = salt => positions[seededValue(cx, cz, salt) % positions.length];

  const treeStyle = BIOME_TREE_STYLES[key];
  if (treeStyle && (isMain || roll % 100 < 68)) {
    addTinyBiomeTree(tasks, cx, cz, treeStyle[0], treeStyle[1]);
  }

  if (profile.loot === "flowers" || profile.loot === "farm" ||
      profile.loot === "cherry" || profile.loot === "swamp" ||
      key === "meadow" || key === "river") {
    const count = isMain ? 3 : 1 + (roll % 2);
    for (let i = 0; i < count; i++) {
      const [dx, dz] = pickPosition(840 + i);
      const flower = ISLAND_FLOWERS[seededValue(cx + dx, cz + dz, 850 + i) % ISLAND_FLOWERS.length];
      addTask(tasks, cx + dx, 0, cz + dz, blockId(flower));
    }
    if (profile.loot === "farm" && isMain) {
      addTask(tasks, cx, 0, cz, "minecraft:hay_block");
    }
  }

  if (key === "desert" || profile.loot === "badlands") {
    if (isMain || roll % 100 < 45) {
      const [dx, dz] = pickPosition(860);
      const plant = key === "desert" ? "minecraft:cactus" : "minecraft:dead_bush";
      addTask(tasks, cx + dx, 0, cz + dz, plant);
      if (key === "desert" && roll % 3 === 0) {
        addTask(tasks, cx + dx, 1, cz + dz, "minecraft:cactus");
      }
    }
    if (profile.loot === "badlands" && isMain) {
      addTask(tasks, cx, 0, cz, "minecraft:terracotta");
      addTask(tasks, cx, 1, cz, "minecraft:red_sandstone");
    }
  }

  if (profile.loot === "cold" && (isMain || roll % 100 < 70)) {
    const [dx, dz] = pickPosition(870);
    addTask(tasks, cx + dx, 0, cz + dz, "minecraft:snow_layer");
    if (roll % 3 === 0) addTask(tasks, cx, 0, cz, "minecraft:ice");
  }

  if (profile.loot === "ocean") {
    const material = ["minecraft:prismarine", "minecraft:prismarine_bricks",
      "minecraft:dark_prismarine", "minecraft:sea_lantern"][roll % 4];
    addTask(tasks, cx, 0, cz, material);
    if (isMain) addTask(tasks, cx, 1, cz, "minecraft:sea_lantern");
  }

  if (profile.loot === "mushroom") {
    const mushroom = roll % 2 === 0 ? "minecraft:red_mushroom" : "minecraft:brown_mushroom";
    addTask(tasks, cx, 0, cz, mushroom);
    if (isMain) addTask(tasks, cx + 1, 0, cz, "minecraft:red_mushroom");
  }

  if (profile.loot === "lush_caves") {
    const plant = roll % 3 === 0 ? "minecraft:azalea" :
      roll % 3 === 1 ? "minecraft:flowering_azalea" : "minecraft:moss_carpet";
    addTask(tasks, cx, 0, cz, plant);
    if (isMain) addTask(tasks, cx, 1, cz, "minecraft:glow_berries");
  }

  if (profile.loot === "dripstone_caves") {
    addTask(tasks, cx, 0, cz, "minecraft:pointed_dripstone");
    if (isMain) addTask(tasks, cx, 1, cz, "minecraft:dripstone_block");
  }

  if (profile.loot === "deep_dark") {
    addTask(tasks, cx, 0, cz, "minecraft:sculk_sensor");
    if (isMain) addTask(tasks, cx + 1, 0, cz, "minecraft:sculk_catalyst");
  }

  if (profile.loot === "swamp" && !treeStyle) {
    const [dx, dz] = pickPosition(880);
    addTask(tasks, cx + dx, 0, cz + dz, "minecraft:brown_mushroom");
    if (isMain) addTask(tasks, cx, 0, cz, "minecraft:mangrove_roots");
  }

  if (profile.loot === "mountain" || profile.loot === "badlands" ||
      profile.loot === "desert") {
    const rock = profile.base;
    addTask(tasks, cx, 0, cz, rock);
    if (isMain && roll % 2 === 0) addTask(tasks, cx, 1, cz, rock);
  }

  if (key === "pale_garden") {
    const [dx, dz] = pickPosition(890);
    addTask(tasks, cx + dx, 0, cz + dz, "minecraft:pale_moss_carpet");
    if (isMain) addTask(tasks, cx, 0, cz, "minecraft:closed_eyeblossom");
  }
}

function addBiomeIslandTasks(tasks, cx, cz, profile, isMain) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      addTask(tasks, cx + dx, -3, cz + dz, profile.base);
      addTask(tasks, cx + dx, -2, cz + dz, profile.soil);
      addTask(tasks, cx + dx, -1, cz + dz, profile.top);
    }
  }

  if (isMain) {
    const resourcePositions = [
      { dx: -1, dz: 0 }, { dx: 1, dz: 0 },
      { dx: 0, dz: -1 }, { dx: 0, dz: 1 }
    ];
    for (let i = 0; i < resourcePositions.length; i++) {
      const pos = resourcePositions[i];
      const resource = profile.resources[
        positiveModulo(i + seededValue(cx, cz, 71) % profile.resources.length,
          profile.resources.length)
      ];
      addTask(tasks, cx + pos.dx, -2, cz + pos.dz, resource);
    }
  } else {
    const resource = profile.resources[
      seededValue(cx, cz, 91) % profile.resources.length
    ];
    addTask(tasks, cx, -2, cz, resource);
  }

  addBiomeSurfaceDecorations(tasks, cx, cz, profile, isMain);
}

function addUndergroundRoomTasks(tasks, sx, sz, structure, chest) {
  // 10x10 themed room between the lower lattice floors at Y=-8 and Y=-12.
  // The existing bedrock beams at Y=-8 remain visible as its open ceiling.
  const minX = sx + 3;
  const maxX = sx + 12;
  const minZ = sz + 3;
  const maxZ = sz + 12;
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      addTask(tasks, x, -12, z, structure.floor);
      for (let y = -11; y <= -9; y++) {
        const isWall = x === minX || x === maxX || z === minZ || z === maxZ;
        addTask(tasks, x, y, z, isWall ? structure.wall : "minecraft:air");
      }
    }
  }

  addTask(tasks, minX, -9, minZ, structure.accent);
  addTask(tasks, maxX, -9, minZ, structure.accent);
  addTask(tasks, minX, -9, maxZ, structure.accent);
  addTask(tasks, maxX, -9, maxZ, structure.accent);
  addTask(tasks, sx + 4, -11, sz + 4, "minecraft:crafting_table");
  addTask(tasks, sx + 11, -11, sz + 4, "minecraft:furnace");
  addTask(tasks, chest.x, chest.y, chest.z, "minecraft:chest");
}

function addRoomStairwayTasks(tasks, sx, sz, structure) {
  // Walkable blocks form a one-block-at-a-time ramp from the main island to the room.
  const steps = [
    { dx: 1, dz: 0, y: -2 },
    { dx: 2, dz: 0, y: -3 },
    { dx: 3, dz: 0, y: -4 },
    { dx: 4, dz: 0, y: -5 },
    { dx: 4, dz: 1, y: -6 },
    { dx: 4, dz: 2, y: -7 },
    { dx: 3, dz: 2, y: -8 },
    { dx: 2, dz: 2, y: -9 },
    { dx: 1, dz: 2, y: -10 },
    { dx: 0, dz: 2, y: -11 }
  ];
  addTask(tasks, sx + 7, -1, sz + 6, "minecraft:air");
  for (const step of steps) {
    addTask(tasks, sx + 6 + step.dx, step.y, sz + 6 + step.dz, structure.floor);
  }
}

function buildTasks(rx, rz, includeStructures) {
  const sx = rx * REGION_SIZE;
  const sz = rz * REGION_SIZE;
  const tasks = new Map();
  addLatticeTasks(tasks, sx, sz);

  if (!includeStructures) {
    return { tasks: [...tasks.values()], room: null, profileName: "already generated", structureName: "none" };
  }

  const starterRegion = rx === 0 && rz === 0;
  const profile = starterRegion
    ? BIOME_CATALOG.find(item => item.key === "forest")
    : chooseBiome(rx, rz);
  const structure = starterRegion
    ? STRUCTURE_ROOMS.find(item => item.key === "village")
    : chooseStructure(rx, rz);

  if (starterRegion) {
    addTreeTasks(tasks, sx, sz);
    addStarterIslets(tasks, sx, sz);
  } else {
    const centerX = sx + 6;
    const centerZ = sz + 6;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        addBiomeIslandTasks(
          tasks, centerX + dx * GRID_STEP, centerZ + dz * GRID_STEP,
          profile, dx === 0 && dz === 0
        );
      }
    }
  }

  const chest = { x: sx + 10, y: -11, z: sz + 10 };
  addUndergroundRoomTasks(tasks, sx, sz, structure, chest);
  addRoomStairwayTasks(tasks, sx, sz, structure);

  return {
    tasks: [...tasks.values()],
    room: {
      chest,
      profileKey: profile.key,
      profileName: starterRegion ? "Starter Tree" : profile.name,
      structureKey: structure.key,
      structureName: structure.name,
      starterRegion,
      seed: seededValue(rx, rz, 7001)
    },
    profileName: starterRegion ? "Starter Tree" : profile.name,
    structureName: structure.name
  };
}

function pickLoot(pool, x, z, salt) {
  if (!pool || pool.length === 0) return null;
  return pool[seededValue(x, z, salt) % pool.length];
}

function fillRoomChest(dim, chestInfo) {
  try {
    const block = dim.getBlock(chestInfo.chest);
    const container = block?.getComponent("minecraft:inventory")?.container;
    if (!container) return false;
    container.clear();

    const profile = BIOME_CATALOG.find(item => item.key === chestInfo.profileKey) || BIOME_CATALOG[0];
    const structure = STRUCTURE_ROOMS.find(item => item.key === chestInfo.structureKey) || STRUCTURE_ROOMS[0];
    const biomePool = BIOME_LOOT_POOLS[profile.loot] || COMMON_LOOT;
    const structurePool = STRUCTURE_LOOT_POOLS[structure.loot] || COMMON_LOOT;

    if (chestInfo.starterRegion) {
      const starterItems = ["wooden_pickaxe", "bread", "torch", "oak_log"];
      for (let i = 0; i < starterItems.length; i++) {
        try {
          container.setItem(i, new ItemStack(blockId(starterItems[i]), 1));
        } catch {}
      }
    }

    const desired = chestInfo.starterRegion ? 11 : 8;
    const slots = [];
    for (let i = 0; i < container.size; i++) slots.push(i);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = seededValue(chestInfo.chest.x, chestInfo.chest.z, chestInfo.seed + i) % (i + 1);
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    let placed = chestInfo.starterRegion ? 4 : 0;
    for (let i = 0; i < slots.length && placed < desired; i++) {
      const slot = slots[i];
      if (chestInfo.starterRegion && slot < 4) continue;
      const roll = seededUnit(chestInfo.chest.x + slot, chestInfo.chest.z - slot, chestInfo.seed + 100);
      let itemId;
      if (roll < 0.40) {
        itemId = pickLoot(COMMON_LOOT, chestInfo.chest.x, chestInfo.chest.z, chestInfo.seed + slot);
      } else if (roll < 0.66) {
        itemId = pickLoot(biomePool, chestInfo.chest.x + slot, chestInfo.chest.z, chestInfo.seed + slot + 500);
      } else if (roll < 0.87) {
        itemId = pickLoot(structurePool, chestInfo.chest.x, chestInfo.chest.z + slot, chestInfo.seed + slot + 900);
      } else if (roll < 0.96) {
        itemId = pickLoot(RARE_LOOT, chestInfo.chest.x + slot, chestInfo.chest.z - slot, chestInfo.seed + slot + 1300);
      } else {
        itemId = pickLoot(COMMON_LOOT, chestInfo.chest.x - slot, chestInfo.chest.z + slot, chestInfo.seed + slot + 1600);
      }
      if (!itemId) continue;
      const amount = SINGLE_ITEM_LOOT.has(itemId) ? 1 :
        1 + (seededValue(chestInfo.chest.x, chestInfo.chest.z, chestInfo.seed + slot + 1700) % 4);
      try {
        container.setItem(slot, new ItemStack(blockId(itemId), amount));
        placed++;
      } catch {}
    }
    return placed > 0;
  } catch {
    return false;
  }
}



function queueRegion(rx, rz, force = false) {
  const key = regionKey(rx, rz);
  if (!force && (generatedRegions.has(key) || jobs.has(key))) return;
  if (!force && (retryAfterTick.get(key) || 0) > system.currentTick) return;
  if (force) {
    generatedRegions.delete(key);
    retryAfterTick.delete(key);
    jobs.delete(key);
  }

  const includeStructures = !hasPersistentRegion(rx, rz);
  const built = buildTasks(rx, rz, includeStructures);
  jobs.set(key, {
    rx,
    rz,
    tasks: built.tasks,
    index: 0,
    startedAt: system.currentTick,
    needsPersistentMarker: includeStructures,
    room: built.room,
    profileName: built.profileName,
    structureName: built.structureName,
    chestFilled: false,
    finalizingAttempts: 0
  });
}

function queueNearbyRegions(player) {
  if (player.dimension.id !== DIMENSION_ID) return;
  const center = regionForPlayer(player);
  // Queue center first, then expanding square rings so the closest regions
  // are always prioritized before the edge of the configured render radius.
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

  // Work on the nearest queued region that should be inside a player's
  // configured render-radius approximation. Chunks outside it remain queued
  // until a player moves closer.
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
      if (selectedJob.room && !selectedJob.chestFilled) {
        const chestDone = fillRoomChest(dim, selectedJob.room);
        if (!chestDone) {
          selectedJob.finalizingAttempts++;
          if (selectedJob.finalizingAttempts < 10) return;
          throw new Error("Could not fill structure room chest at " +
            selectedJob.room.chest.x + "," + selectedJob.room.chest.y + "," +
            selectedJob.room.chest.z);
        }
        selectedJob.chestFilled = true;
      }
      if (selectedJob.needsPersistentMarker) {
        world.setDynamicProperty(persistentRegionKey(selectedJob.rx, selectedJob.rz), true);
      }
      jobs.delete(selectedKey);
      retryAfterTick.delete(selectedKey);
      generatedRegions.add(selectedKey);
      totalRegionsBuilt++;
      lastError = "none";
      console.warn("[Lattice of Greed] Built region " + selectedKey +
        " (" + selectedJob.profileName + " / " + selectedJob.structureName +
        ") with " + selectedJob.tasks.length + " verified block placements.");
    }
  } catch (error) {
    lastError = "Region " + selectedKey + ", task " + selectedJob.index + "/" +
      selectedJob.tasks.length + ": " + String(error).slice(0, 220);
    console.warn("[Lattice of Greed] Generation paused: " + lastError);
    // A chunk at the edge of the radius may not actually be loaded on this
    // device. Drop this attempt and let the nearby scanner retry after a pause.
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
  player.sendMessage("§8Current region theme=" + (job ? job.profileName + " / " + job.structureName :
    (hasPersistentRegion(rx, rz) ? "generated and saved" : "waiting to build")));
  player.sendMessage("§8Regions built=" + totalRegionsBuilt +
    "; queued=" + jobs.size + "; scan radius=" + NEARBY_REGION_RADIUS +
    " chunks; biome types=" + BIOME_CATALOG.length + "; room types=" + STRUCTURE_ROOMS.length);
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
  player.sendMessage("§8[Lattice] Rebuilding the lattice and queueing nearby regions within " +
    NEARBY_REGION_RADIUS + " chunks. Already generated island clusters and room loot are preserved.");
});

system.runInterval(() => {
  if (system.currentTick % 10 === 0) {
    lastCheckTick = system.currentTick;
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
