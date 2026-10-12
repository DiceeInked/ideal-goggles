import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
const CONFIG = Object.freeze({
  growthFactor: 1.01,
  scoreChangePerItem: 1,
  minimumPriceCents: 1,
  maximumSafeCents: Number.MAX_SAFE_INTEGER,
  salesTaxRate: 0.50
});
const TAX_REMAINDER_DENOMINATOR = 10000;

function extract(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Missing source function: ${startMarker}`);
  assert.notEqual(end, -1, `Missing end marker after ${startMarker}`);
  return source.slice(start, end);
}

// Execute the production math functions directly with only their Bedrock-world
// dependency (the tax remainder getter) supplied by this small test harness.
const safeInteger = value => Number.isSafeInteger(value) && Math.abs(value) <= CONFIG.maximumSafeCents;
const unitPriceCents = new Function(
  "CONFIG",
  "safeInteger",
  extract("function unitPriceCents(", "function itemType") + "\nreturn unitPriceCents;"
)(CONFIG, safeInteger);
const totalBuyCost = new Function(
  "CONFIG",
  "safeInteger",
  "unitPriceCents",
  extract("function totalBuyCost(", "function totalSaleProceeds") + "\nreturn totalBuyCost;"
)(CONFIG, safeInteger, unitPriceCents);
const taxRateUnits = new Function(
  "CONFIG",
  "TAX_REMAINDER_DENOMINATOR",
  extract("function taxRateUnits()", "function taxPercentLabel") + "\nreturn taxRateUnits;"
)(CONFIG, TAX_REMAINDER_DENOMINATOR);
const totalSaleProceeds = new Function(
  "CONFIG",
  "safeInteger",
  "unitPriceCents",
  "getTaxRemainder",
  "taxRateUnits",
  "TAX_REMAINDER_DENOMINATOR",
  extract("function totalSaleProceeds(", "function parseQuantity") + "\nreturn totalSaleProceeds;"
)(
  CONFIG,
  safeInteger,
  unitPriceCents,
  () => 0,
  taxRateUnits,
  TAX_REMAINDER_DENOMINATOR
);

test("a sale uses the post-sale score and buying uses the pre-purchase score", () => {
  assert.equal(unitPriceCents(0), 100);
  assert.equal(totalBuyCost(0, 2), 201);
  const sale = totalSaleProceeds(1, 1, 0);
  assert.equal(sale.gross, 100);
  assert.equal(sale.tax, 50);
  assert.equal(sale.net, 50);
});

test("splitting a sale preserves its gross, tax, net, and final rounding remainder", () => {
  const startingScore = 12;
  const whole = totalSaleProceeds(startingScore, 64, 0);
  let score = startingScore;
  let remainder = 0;
  let gross = 0;
  let tax = 0;
  let net = 0;

  for (const quantity of [1, 7, 2, 15, 39]) {
    const part = totalSaleProceeds(score, quantity, remainder);
    gross += part.gross;
    tax += part.tax;
    net += part.net;
    remainder = part.taxRemainderAfter;
    score -= quantity * CONFIG.scoreChangePerItem;
  }

  assert.equal(gross, whole.gross);
  assert.equal(tax, whole.tax);
  assert.equal(net, whole.net);
  assert.equal(remainder, whole.taxRemainderAfter);
});

test("fractional tax does not disappear when items remain at the one-cent price floor", () => {
  const whole = totalSaleProceeds(-2000, 64, 0);
  let remainder = 0;
  let tax = 0;
  for (let i = 0; i < 64; i++) {
    const part = totalSaleProceeds(-2000 - i, 1, remainder);
    tax += part.tax;
    remainder = part.taxRemainderAfter;
  }
  assert.equal(whole.gross, 64);
  assert.equal(tax, whole.tax);
  assert.equal(remainder, whole.taxRemainderAfter);
});

test("creative-only items and spawn eggs are excluded from all trading", () => {
  const blockedIds = new Set([
    "minecraft:allow", "minecraft:barrier", "minecraft:bedrock", "minecraft:border_block",
    "minecraft:budding_amethyst", "minecraft:camera", "minecraft:chain_command_block",
    "minecraft:command_block", "minecraft:command_block_minecart", "minecraft:debug_stick",
    "minecraft:deny", "minecraft:end_gateway", "minecraft:end_portal", "minecraft:end_portal_frame",
    "minecraft:info_update", "minecraft:info_update2", "minecraft:jigsaw",
    "minecraft:knowledge_book", "minecraft:light_block", "minecraft:mob_spawner",
    "minecraft:moving_block", "minecraft:netherreactor", "minecraft:player_head",
    "minecraft:repeating_command_block", "minecraft:reserved6", "minecraft:structure_block",
    "minecraft:structure_void", "minecraft:reinforced_deepslate", "minecraft:trial_spawner",
    "minecraft:vault", "minecraft:unknown", "minecraft:chemistry_table", "minecraft:compound", "minecraft:element",
    "minecraft:lab_table", "minecraft:material_reducer", "minecraft:medicine",
    "minecraft:underwater_tnt", "minecraft:underwater_torch", "minecraft:glow_stick",
    "minecraft:balloon", "minecraft:ice_bomb", "minecraft:latex", "minecraft:super_fertilizer",
    "minecraft:sparkler"
  ]);
  const isSurvivalObtainableItem = new Function("NON_SURVIVAL_ITEM_IDS",
    extract("function isSurvivalObtainableItem(", "function isMarketTool") + "\nreturn isSurvivalObtainableItem;"
  )(blockedIds);
  assert.equal(isSurvivalObtainableItem("minecraft:zombie_spawn_egg"), false);
  assert.equal(isSurvivalObtainableItem("minecraft:bedrock"), false);
  assert.equal(isSurvivalObtainableItem("minecraft:command_block"), false);
  assert.equal(isSurvivalObtainableItem("minecraft:element_0"), false);
  assert.equal(isSurvivalObtainableItem("minecraft:diamond"), true);
  assert.equal(isSurvivalObtainableItem("example:custom_item"), false);
});

test("market menu tools include every vanilla sword and the original stick", () => {
  const toolIds = [
    "minecraft:stick", "minecraft:wooden_sword", "minecraft:stone_sword",
    "minecraft:iron_sword", "minecraft:golden_sword", "minecraft:diamond_sword",
    "minecraft:netherite_sword"
  ];
  for (const id of toolIds) assert.ok(source.includes('"'+id+'"'), "Missing market tool: " + id);
  assert.match(source, /salesTaxRate: 0\.50/);
});


test("trade history stores transaction summaries and per-unit price-series chunks", () => {
  assert.match(source, /HISTORY_TRANSACTION_PREFIX/);
  assert.match(source, /HISTORY_SERIES_PREFIX/);
  assert.match(source, /HISTORY_SERIES_CHUNK_SIZE = 32/);
  assert.match(source, /function persistTradeHistory\(/);
  assert.match(source, /recordTradeHistorySafely\(player, "buy"/);
  assert.match(source, /recordTradeHistorySafely\(player, "sell"/);
  assert.match(source, /priceCents: priceCents/);
});

test("Blaze Rod opens operator tools only after a permission-level check", () => {
  assert.ok(source.includes('const OPERATOR_TOOL_ID = "minecraft:blaze_rod"'));
  assert.match(source, /player\.playerPermissionLevel === PlayerPermissionLevel\.Operator/);
  assert.match(source, /function showOperatorMenu\(/);
  assert.match(source, /function showRecentTradeRecords\(/);
  assert.match(source, /function showTradeRecordDetail\(/);
  assert.match(source, /function handleEconomyToolUse\(/);
});

test("crafted Sell Barrels receive the crafting player's name", () => {
  assert.match(source, /world\.afterEvents\.playerCraftRecipe\.subscribe\(nameCraftedSellBarrel\)/);
  assert.match(source, /function nameCraftedSellBarrel\(/);
  assert.match(source, /owner\.name \+ "'s Sell Barrel"/);
  assert.match(source, /SELL_BARREL_ITEM_OWNER_ID_PROPERTY/);
  assert.match(source, /setDynamicProperty\(SELL_BARREL_ITEM_OWNER_ID_PROPERTY, owner\.id\)/);
});


test("Sell Barrels have per-item owner metadata and persisted block-owner records", () => {
  assert.match(source, /SELL_BARREL_OWNER_PROPERTY_PREFIX/);
  assert.match(source, /function readBarrelOwner\(/);
  assert.match(source, /function writeBarrelOwner\(/);
  assert.match(source, /function readOwnerFromItemOrPlayer\(/);
  assert.match(source, /function assignOwnerBeforePlacement\(/);
  assert.match(source, /function saveOwnerAfterPlacement\(/);
  assert.match(source, /function ownerAccount\(/);
  assert.match(source, /sell\(owner, typeId, chunkQuantity, container, true, true\)/);
});

test("Sell Barrels are ticked for hopper-fed auto-selling and avoid selling while a player has them open", () => {
  assert.match(source, /function handleSellBarrelTick\(/);
  assert.match(source, /processClosedSellBarrel\(event\.dimension, event\.block\.location\)/);
  assert.match(source, /if \(processingBarrels\.has\(key\) \|\| isBarrelOpenToPlayer\(dimension, location\)\) return/);
  assert.match(source, /blockComponentRegistry\.registerCustomComponent\(SELL_BARREL_COMPONENT_ID/);
  assert.match(source, /onTick: handleSellBarrelTick/);
  assert.match(source, /onBreak: sellBarrelBlockBroken/);
});

test("ownerless legacy barrels are not claimed just by opening them", () => {
  assert.match(source, /function warnUnownedSellBarrel\(/);
  assert.match(source, /This Sell Barrel has no saved owner, so it cannot sell items yet/);
  assert.doesNotMatch(source, /function claimUnownedSellBarrel\(/);
  assert.match(source, /if \(!lockOwner\) return/);
});

test("barrel placement fallback preserves a tagged item's saved owner", () => {
  assert.match(source, /const owner = pendingBarrelOwners\.get\(key\) \|\| \{ id: event\.player\.id, name: event\.player\.name \}/);
  assert.match(source, /world\.afterEvents\.playerLeave\.subscribe/);
  assert.match(source, /players\.delete\(playerId\)/);
});

test("hopper-fed barrels split large item groups into transaction-safe chunks", () => {
  const processor = extract("function processClosedSellBarrel(", "function warnUnownedSellBarrel(");
  assert.match(processor, /let remainingQuantity = quantity/);
  assert.match(processor, /Math\.min\(remainingQuantity, CONFIG\.maximumTradeQuantity\)/);
  assert.match(processor, /remainingQuantity -= result\.quantity/);
});
