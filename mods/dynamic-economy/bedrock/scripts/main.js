import { world, system, ItemStack, ItemTypes, PlayerPermissionLevel } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData, CustomForm, ObservableString } from "@minecraft/server-ui";

/*
 * Dynamic Economy v0.3.18: modern market UI and price history.
 * Use a stick or any sword to open the market. Market scores are stored per item,
 * balances are integer cents, and sales tax carries fractional cents forward.
 */
const CONFIG = Object.freeze({
  namespace: "diceyinked:economy",
  growthFactor: 1.01,
  scoreChangePerItem: 1,
  startingBalanceCents: 10000,
  salesTaxRate: 0.50,
  minimumPriceCents: 1,
  maximumTradeQuantity: 64,
  maximumSafeCents: Number.MAX_SAFE_INTEGER,
  pageSize: 7,
});

const DYE_COLORS = [
  { id: "white", name: "White" }, { id: "light_gray", name: "Light Gray" },
  { id: "gray", name: "Gray" }, { id: "black", name: "Black" },
  { id: "brown", name: "Brown" }, { id: "red", name: "Red" },
  { id: "orange", name: "Orange" }, { id: "yellow", name: "Yellow" },
  { id: "lime", name: "Lime" }, { id: "green", name: "Green" },
  { id: "cyan", name: "Cyan" }, { id: "light_blue", name: "Light Blue" },
  { id: "blue", name: "Blue" }, { id: "purple", name: "Purple" },
  { id: "magenta", name: "Magenta" }, { id: "pink", name: "Pink" }
];
const COLOR_PAGE_SIZE = 8;
const COLOR_ITEM_SUFFIXES = [
  "_wool", "_carpet", "_bed", "_banner", "_shulker_box",
  "_terracotta", "_glazed_terracotta", "_concrete", "_concrete_powder",
  "_stained_glass", "_stained_glass_pane", "_candle", "_dye",
  "_bundle", "_harness"
];

const SELL_BARREL_ID = "diceyinked:sell_barrel";
const SELL_BARREL_COMPONENT_ID = "diceyinked:sell_barrel_runtime";
const SELL_BARREL_OWNER_PROPERTY_PREFIX = CONFIG.namespace + ":sell_barrel_owner:";
const SELL_BARREL_ITEM_OWNER_ID_PROPERTY = CONFIG.namespace + ":sell_barrel_item_owner_id";
const SELL_BARREL_ITEM_OWNER_NAME_PROPERTY = CONFIG.namespace + ":sell_barrel_item_owner_name";
const pendingBarrelOwners = new Map();
const openBarrelUsers = new Map();
const processingBarrels = new Set();
const OPERATOR_TOOL_ID = "minecraft:blaze_rod";
const MARKET_TOOL_IDS = new Set([
  "minecraft:stick",
  "minecraft:wooden_sword",
  "minecraft:stone_sword",
  "minecraft:iron_sword",
  "minecraft:golden_sword",
  "minecraft:diamond_sword",
  "minecraft:netherite_sword"
]);
// Bedrock's Script API exposes registered item types, but not a universal
// "obtainable in Survival" flag. Explicitly reject known creative-only items.
const NON_SURVIVAL_ITEM_IDS = new Set([
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
function isSurvivalObtainableItem(itemId) {
  if (typeof itemId !== "string" || !itemId.startsWith("minecraft:")) return false;
  if (NON_SURVIVAL_ITEM_IDS.has(itemId)) return false;
  const bareId = itemId.slice("minecraft:".length);
  if (bareId.endsWith("_spawn_egg") || bareId === "spawn_egg" || bareId.startsWith("element_")) return false;
  return true;
}
function isMarketTool(itemStack) {
  return !!itemStack && MARKET_TOOL_IDS.has(itemStack.typeId);
}

const MARKET_KEY = CONFIG.namespace + ":market"; // Legacy JSON key, migrated on world load.
const MARKET_SCORE_PREFIX = CONFIG.namespace + ":score:";
const BALANCE_PREFIX = CONFIG.namespace + ":balance:";
const TAX_REMAINDER_KEY = CONFIG.namespace + ":sales_tax_remainder";
const TAX_REMAINDER_DENOMINATOR = 10000; // Remainder units are 1/10,000 of a cent.
const HISTORY_TRANSACTION_PREFIX = CONFIG.namespace + ":history:tx:";
const HISTORY_SERIES_PREFIX = CONFIG.namespace + ":history:series:";
const HISTORY_NEXT_TRANSACTION_KEY = CONFIG.namespace + ":history:next_tx";
const HISTORY_SERIES_CHUNK_SIZE = 32;
const openCooldown = new Map();
let cachedMarket;

function tell(player, message) {
  try { player.sendMessage("§2[Market]§r " + message); } catch {}
}
function money(cents) {
  return "$" + (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function safeInteger(value) {
  return Number.isSafeInteger(value) && Math.abs(value) <= CONFIG.maximumSafeCents;
}
function getTaxRemainder() {
  const value = world.getDynamicProperty(TAX_REMAINDER_KEY);
  return Number.isSafeInteger(value) && value >= 0 && value < TAX_REMAINDER_DENOMINATOR ? value : 0;
}
function setTaxRemainder(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value >= TAX_REMAINDER_DENOMINATOR) {
    throw new Error("The sales-tax rounding remainder is invalid.");
  }
  world.setDynamicProperty(TAX_REMAINDER_KEY, value);
}
function taxRateUnits() {
  if (!Number.isFinite(CONFIG.salesTaxRate) || CONFIG.salesTaxRate < 0 || CONFIG.salesTaxRate > 1) {
    throw new Error("The sales-tax rate must be between 0% and 100%.");
  }
  return Math.round(CONFIG.salesTaxRate * TAX_REMAINDER_DENOMINATOR);
}
function taxPercentLabel() {
  return (CONFIG.salesTaxRate * 100).toLocaleString("en-US", { maximumFractionDigits: 2 }) + "%";
}

function barrelLocationId(dimension, location) {
  return dimension.id + ":" + Math.floor(location.x) + "," + Math.floor(location.y) + "," + Math.floor(location.z);
}
function barrelOwnerPropertyId(dimension, location) {
  return SELL_BARREL_OWNER_PROPERTY_PREFIX + barrelLocationId(dimension, location);
}
function readBarrelOwner(dimension, location) {
  const raw = world.getDynamicProperty(barrelOwnerPropertyId(dimension, location));
  if (typeof raw !== "string") return null;
  try {
    const record = JSON.parse(raw);
    if (record && typeof record.id === "string" && record.id.length > 0 &&
        typeof record.name === "string" && record.name.length > 0) return record;
  } catch {}
  return null;
}
function writeBarrelOwner(dimension, location, owner) {
  if (!owner || typeof owner.id !== "string" || !owner.id ||
      typeof owner.name !== "string" || !owner.name) {
    throw new Error("Sell Barrel owner data is invalid.");
  }
  world.setDynamicProperty(barrelOwnerPropertyId(dimension, location),
    JSON.stringify({ id: owner.id, name: owner.name }));
}
function clearBarrelOwner(dimension, location) {
  world.setDynamicProperty(barrelOwnerPropertyId(dimension, location), undefined);
}
function readOwnerFromItemOrPlayer(player, itemStack) {
  try {
    const ownerId = itemStack && itemStack.getDynamicProperty(SELL_BARREL_ITEM_OWNER_ID_PROPERTY);
    const ownerName = itemStack && itemStack.getDynamicProperty(SELL_BARREL_ITEM_OWNER_NAME_PROPERTY);
    if (typeof ownerId === "string" && ownerId && typeof ownerName === "string" && ownerName) {
      return { id: ownerId, name: ownerName };
    }
  } catch (error) {
    console.warn("[Dynamic Economy] Could not read Sell Barrel item ownership: " + error);
  }
  return { id: player.id, name: player.name };
}
function heldMainhandItem(player) {
  try {
    const inventory = player.getComponent("minecraft:inventory");
    return inventory && inventory.container
      ? inventory.container.getItem(player.selectedSlotIndex)
      : undefined;
  } catch {
    return undefined;
  }
}
function setSellBarrelItemOwner(itemStack, owner) {
  if (!owner) return;
  itemStack.nameTag = owner.name + "'s Sell Barrel";
  itemStack.setDynamicProperty(SELL_BARREL_ITEM_OWNER_ID_PROPERTY, owner.id);
  itemStack.setDynamicProperty(SELL_BARREL_ITEM_OWNER_NAME_PROPERTY, owner.name);
}
function ownerAccount(owner) {
  return { id: owner.id, name: owner.name, sendMessage: function () {} };
}
function sourcePlayer(source) {
  const entity = source && source.entity;
  return entity && entity.typeId === "minecraft:player" ? entity : null;
}
function addOpenBarrelUser(dimension, location, player) {
  const key = barrelLocationId(dimension, location);
  let players = openBarrelUsers.get(key);
  if (!players) { players = new Set(); openBarrelUsers.set(key, players); }
  players.add(player.id);
}
function removeOpenBarrelUser(dimension, location, player) {
  const key = barrelLocationId(dimension, location);
  const players = openBarrelUsers.get(key);
  if (!players) return;
  if (player) players.delete(player.id);
  if (!players.size) openBarrelUsers.delete(key);
}
function isBarrelOpenToPlayer(dimension, location) {
  const players = openBarrelUsers.get(barrelLocationId(dimension, location));
  return !!players && players.size > 0;
}

function getBalance(player) {
  const key = BALANCE_PREFIX + player.id;
  const value = world.getDynamicProperty(key);
  if (value === undefined) {
    world.setDynamicProperty(key, CONFIG.startingBalanceCents);
    return CONFIG.startingBalanceCents;
  }
  return typeof value === "number" && safeInteger(value) && value >= 0
    ? value : CONFIG.startingBalanceCents;
}
function setBalance(player, cents) {
  if (!safeInteger(cents) || cents < 0) throw new Error("Your balance would be outside the allowed range.");
  world.setDynamicProperty(BALANCE_PREFIX + player.id, cents);
}
function getMarket() {
  if (cachedMarket) return cachedMarket;
  const market = {};
  const raw = world.getDynamicProperty(MARKET_KEY);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [itemId, score] of Object.entries(parsed)) {
          if (Number.isSafeInteger(score)) market[itemId] = score;
        }
      }
    } catch {
      // Keep the legacy value untouched if it is malformed; readable scores below still load.
    }
  }
  for (const propertyId of world.getDynamicPropertyIds()) {
    if (!propertyId.startsWith(MARKET_SCORE_PREFIX)) continue;
    const itemId = propertyId.slice(MARKET_SCORE_PREFIX.length);
    const score = world.getDynamicProperty(propertyId);
    if (itemId && Number.isSafeInteger(score)) market[itemId] = score;
  }
  cachedMarket = market;
  return cachedMarket;
}
function persistScore(itemId, score) {
  if (typeof itemId !== "string" || !itemId || !Number.isSafeInteger(score)) {
    throw new Error("The market score is invalid.");
  }
  world.setDynamicProperty(MARKET_SCORE_PREFIX + itemId, score);
  if (!cachedMarket) cachedMarket = getMarket();
  cachedMarket[itemId] = score;
}
function migrateLegacyMarket() {
  const raw = world.getDynamicProperty(MARKET_KEY);
  if (typeof raw !== "string") return;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn("[Dynamic Economy] Legacy market data is malformed and was kept for recovery: " + error);
    return;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.warn("[Dynamic Economy] Legacy market data has an unexpected format and was kept for recovery.");
    return;
  }
  try {
    let migrated = 0;
    for (const [itemId, score] of Object.entries(parsed)) {
      if (!itemId || !Number.isSafeInteger(score)) continue;
      const propertyId = MARKET_SCORE_PREFIX + itemId;
      const existing = world.getDynamicProperty(propertyId);
      if (Number.isSafeInteger(existing)) continue;
      world.setDynamicProperty(propertyId, score);
      if (world.getDynamicProperty(propertyId) !== score) {
        throw new Error("Could not verify the migrated score for " + itemId);
      }
      migrated++;
    }
    world.setDynamicProperty(MARKET_KEY, undefined);
    cachedMarket = undefined;
    console.warn("[Dynamic Economy] Migrated legacy market scores to per-item properties (" + migrated + " new score(s)).");
  } catch (error) {
    cachedMarket = undefined;
    console.warn("[Dynamic Economy] Market migration did not finish; the legacy market data was retained: " + error);
  }
}
function getScore(market, itemId) {
  const score = market[itemId];
  return Number.isSafeInteger(score) ? score : 0;
}
function unitPriceCents(score) {
  const raw = 100 * Math.pow(CONFIG.growthFactor, score);
  if (!Number.isFinite(raw) || raw >= CONFIG.maximumSafeCents) {
    throw new Error("This item's market price is too high to trade safely.");
  }
  return Math.max(CONFIG.minimumPriceCents, Math.round(raw));
}
function itemType(itemId) {
  const normalized = itemId.indexOf(":") >= 0 ? itemId : "minecraft:" + itemId;
  if (!ItemTypes.get(normalized) || normalized === "minecraft:air" || !isSurvivalObtainableItem(normalized)) {
    throw new Error("That item is not available in this world.");
  }
  return normalized;
}
function prettyName(itemId) {
  return itemId.replace(/^[^:]+:/, "").split("_")
    .map(function (part) { return part.length ? part[0].toUpperCase() + part.slice(1) : part; })
    .join(" ");
}
function colorDisplayName(colorId) {
  const color = DYE_COLORS.find(function (entry) { return entry.id === colorId; });
  return color ? color.name : "Colored";
}
function isColoredItem(itemId, colorId) {
  const bareId = itemId.replace(/^minecraft:/, "");
  if (bareId.indexOf(colorId + "_") !== 0) return false;
  return COLOR_ITEM_SUFFIXES.some(function (suffix) { return bareId.endsWith(suffix); });
}
function returnToMenu(player,destination){
 const t=destination||{type:"main"};
 if(t.type==="buy")showBuyMenu(player,t.query||"",t.page||0,t.colorId||"",t.backTo);
 else if(t.type==="sell")showSellMenu(player,t.query||"",t.page||0,t.colorId||"",t.backTo);
 else if(t.type==="marketDetail")showMarketItemDetail(player,t.id,t.page||0);
 else if(t.type==="marketPrices")showMarketPrices(player,t.page||0);
 else if(t.type==="colors")showColorMenu(player,t.mode,t.page||0,t.returnTo);
 else showMainMenu(player);
}
function safePlainStack(stack) {
  if (!stack) return false;
  try {
    if (stack.nameTag) return false;
    if (stack.getLore().length > 0) return false;
    if (stack.getDynamicPropertyIds().length > 0) return false;
    if (stack.getCanPlaceOn().length > 0 || stack.getCanDestroy().length > 0) return false;
    const enchantable = stack.getComponent("minecraft:enchantable");
    if (enchantable && enchantable.getEnchantments().length > 0) return false;
    const durability = stack.getComponent("minecraft:durability");
    if (durability && durability.damage > 0) return false;
    return true;
  } catch {
    // If the script cannot inspect an item safely, don't sell or merge it.
    return false;
  }
}
function inventoryOf(player) {
  const component = player.getComponent("minecraft:inventory");
  if (!component || !component.container) throw new Error("Could not access your inventory.");
  return component.container;
}

function countTradableItem(container, typeId, includeCustomized) {
  let count = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack && stack.typeId === typeId && (includeCustomized === true || safePlainStack(stack))) {
      count += stack.amount;
    }
  }
  return count;
}

function removeTradableItems(container, typeId, quantity, includeCustomized) {
  if (countTradableItem(container, typeId, includeCustomized) < quantity) return false;
  let remaining = quantity;
  for (let slot = 0; slot < container.size && remaining > 0; slot++) {
    const stack = container.getItem(slot);
    if (!stack || stack.typeId !== typeId ||
        (includeCustomized !== true && !safePlainStack(stack))) continue;
    const take = Math.min(stack.amount, remaining);
    if (take === stack.amount) container.setItem(slot, undefined);
    else {
      stack.amount -= take;
      container.setItem(slot, stack);
    }
    remaining -= take;
  }
  return remaining === 0;
}
function canFit(container, typeId, quantity) {
  const sample = new ItemStack(typeId, 1);
  let remaining = quantity;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (!stack) remaining -= sample.maxAmount;
    else if (stack.typeId === typeId && safePlainStack(stack)) {
      remaining -= Math.max(0, stack.maxAmount - stack.amount);
    }
    if (remaining <= 0) return true;
  }
  return false;
}
function addItems(container, typeId, quantity) {
  let remaining = quantity;
  while (remaining > 0) {
    const sample = new ItemStack(typeId, 1);
    const amount = Math.min(sample.maxAmount, remaining);
    const leftover = container.addItem(new ItemStack(typeId, amount));
    if (leftover) {
      const inserted = amount - leftover.amount;
      return quantity - remaining + inserted;
    }
    remaining -= amount;
  }
  return quantity;
}
function totalBuyCost(startScore, quantity) {
  let total = 0;
  for (let i = 0; i < quantity; i++) {
    total += unitPriceCents(startScore + i * CONFIG.scoreChangePerItem);
    if (!safeInteger(total)) throw new Error("That purchase is too large to price safely.");
  }
  return total;
}
function totalSaleProceeds(startScore, quantity, startingTaxRemainder) {
  let gross = 0;
  for (let i = 1; i <= quantity; i++) {
    gross += unitPriceCents(startScore - i * CONFIG.scoreChangePerItem);
    if (!safeInteger(gross)) throw new Error("That sale is too large to price safely.");
  }
  // Carry fractional cents forward so splitting the same score path into smaller
  // transactions cannot erase the tax that would have been charged on a bulk sale.
  const remainderBefore = Number.isSafeInteger(startingTaxRemainder) && startingTaxRemainder >= 0 && startingTaxRemainder < TAX_REMAINDER_DENOMINATOR
    ? startingTaxRemainder : getTaxRemainder();
  const rateUnits = taxRateUnits();
  const fractionalTaxNumerator = (gross % TAX_REMAINDER_DENOMINATOR) * rateUnits + remainderBefore;
  const wholeTaxCents = Math.floor(gross / TAX_REMAINDER_DENOMINATOR) * rateUnits;
  const tax = wholeTaxCents + Math.floor(fractionalTaxNumerator / TAX_REMAINDER_DENOMINATOR);
  const remainderAfter = fractionalTaxNumerator % TAX_REMAINDER_DENOMINATOR;
  return {
    gross: gross,
    tax: tax,
    net: gross - tax,
    taxRemainderBefore: remainderBefore,
    taxRemainderAfter: remainderAfter
  };
}

function reserveHistoryTransactionId() {
  const previous = world.getDynamicProperty(HISTORY_NEXT_TRANSACTION_KEY);
  const next = Number.isSafeInteger(previous) && previous >= 0 ? previous + 1 : 1;
  if (!Number.isSafeInteger(next)) throw new Error("Trade history has reached its safe record limit.");
  world.setDynamicProperty(HISTORY_NEXT_TRANSACTION_KEY, next);
  return next;
}

// One summary per transaction; unit-price points are stored in compact chunks.
function persistTradeHistory(player, action, itemId, quantity, scoreBefore, amounts, balanceAfter, source) {
  const transactionId = reserveHistoryTransactionId();
  const tick = system.currentTick;
  const direction = action === "buy" ? 1 : -1;
  const scoreAfter = scoreBefore + direction * quantity * CONFIG.scoreChangePerItem;

  for (let offset = 0, chunkIndex = 0; offset < quantity; offset += HISTORY_SERIES_CHUNK_SIZE, chunkIndex++) {
    const points = [];
    const end = Math.min(quantity, offset + HISTORY_SERIES_CHUNK_SIZE);
    for (let zeroIndex = offset; zeroIndex < end; zeroIndex++) {
      const unitIndex = zeroIndex + 1;
      const pointScore = scoreBefore + direction * unitIndex * CONFIG.scoreChangePerItem;
      let priceCents = null;
      try { priceCents = unitPriceCents(pointScore); } catch {}
      points.push({ unitIndex: unitIndex, score: pointScore, priceCents: priceCents, tick: tick });
    }
    const seriesChunk = {
      transactionId: transactionId, itemId: itemId, action: action,
      playerName: player.name, tick: tick, points: points
    };
    world.setDynamicProperty(HISTORY_SERIES_PREFIX + transactionId + ":" + chunkIndex, JSON.stringify(seriesChunk));
  }

  const record = {
    id: transactionId, tick: tick, action: action, source: source,
    playerId: player.id, playerName: player.name, itemId: itemId, quantity: quantity,
    scoreBefore: scoreBefore, scoreAfter: scoreAfter,
    grossCents: amounts.grossCents, taxCents: amounts.taxCents,
    netCents: amounts.netCents, balanceAfterCents: balanceAfter
  };
  // Summary written last; incomplete series chunks are ignored by future graph views.
  world.setDynamicProperty(HISTORY_TRANSACTION_PREFIX + transactionId, JSON.stringify(record));
}

function recordTradeHistorySafely(player, action, itemId, quantity, scoreBefore, amounts, balanceAfter, source) {
  try {
    persistTradeHistory(player, action, itemId, quantity, scoreBefore, amounts, balanceAfter, source);
  } catch (error) {
    console.warn("[Dynamic Economy] Trade completed but history could not be saved: " + error);
    tell(player, "Your trade completed, but its history record could not be saved. Please tell a world operator.");
  }
}

function getRecentTradeRecords(limit) {
  const records = [];
  const maximum = Number.isSafeInteger(limit) && limit > 0 ? limit : 10;
  const latest = world.getDynamicProperty(HISTORY_NEXT_TRANSACTION_KEY);
  if (!Number.isSafeInteger(latest) || latest < 1) return records;
  // Walk backwards from the persisted sequence instead of scanning every history property.
  for (let id = latest; id >= 1 && records.length < maximum; id--) {
    const raw = world.getDynamicProperty(HISTORY_TRANSACTION_PREFIX + id);
    if (typeof raw !== "string") continue;
    try {
      const record = JSON.parse(raw);
      if (record && record.id === id && typeof record.action === "string" &&
          typeof record.itemId === "string" && Number.isSafeInteger(record.quantity)) records.push(record);
    } catch {
      console.warn("[Dynamic Economy] Skipping malformed trade-history record: " + id);
    }
  }
  return records;
}

function isEconomyOperator(player) {
  try { return player.playerPermissionLevel === PlayerPermissionLevel.Operator; }
  catch { return false; }
}

function parseQuantity(value,maximum){
 const max=Number.isSafeInteger(maximum)&&maximum>=1?maximum:CONFIG.maximumTradeQuantity;
 if(!Number.isSafeInteger(value)||value<1||value>max)throw new Error("Choose a quantity from 1 to "+max+".");return value;
}
function buy(player, rawItemId, rawQuantity) {
  const typeId = itemType(rawItemId);
  const quantity = parseQuantity(rawQuantity, CONFIG.maximumTradeQuantity);
  const market = getMarket();
  const score = getScore(market, typeId);
  const cost = totalBuyCost(score, quantity);
  const balance = getBalance(player);
  const inventory = inventoryOf(player);

  if (balance < cost) throw new Error("You need " + money(cost) + "; your balance is " + money(balance) + ".");
  if (!canFit(inventory, typeId, quantity)) throw new Error("Make enough room in your inventory first.");

  let inserted = 0;
  try {
    inserted = addItems(inventory, typeId, quantity);
    if (inserted !== quantity) throw new Error("Your inventory could not accept all the items.");
    setBalance(player, balance - cost);
    persistScore(typeId, score + quantity * CONFIG.scoreChangePerItem);
  } catch (error) {
    if (inserted > 0) {
      try { removeTradableItems(inventory, typeId, inserted); } catch {}
    }
    try { setBalance(player, balance); } catch {}
    throw error;
  }
  recordTradeHistorySafely(player, "buy", typeId, quantity, score,
    { grossCents: cost, taxCents: 0, netCents: cost }, balance - cost, "market");
  tell(player, "Bought " + quantity + " " + prettyName(typeId) + " for " + money(cost) +
    ". Balance: " + money(balance - cost) + ".");
}

function sell(player, rawItemId, rawQuantity, sourceContainer, silent, includeCustomized) {
  const typeId = itemType(rawItemId);
  const inventory = sourceContainer || inventoryOf(player);
  const allowCustomized = includeCustomized === true;
  const available = countTradableItem(inventory, typeId, allowCustomized);
  if (available < 1) throw new Error("You don't have any sellable " + prettyName(typeId) + ".");
  const quantity = parseQuantity(rawQuantity, available);
  if (available < quantity) throw new Error("You don't have that many " + prettyName(typeId) + " to sell.");

  // The barrel sells full type groups. Keep exact cloned stacks in case an economy-property
  // write fails after removal, including names, lore, enchantments, and durability.
  const rollbackStacks = allowCustomized ? [] : null;
  if (allowCustomized) {
    for (let slot = 0; slot < inventory.size; slot++) {
      const stack = inventory.getItem(slot);
      if (stack && stack.typeId === typeId) rollbackStacks.push({ slot: slot, stack: stack.clone() });
    }
  }

  const market = getMarket();
  const score = getScore(market, typeId);
  const quote = totalSaleProceeds(score, quantity);
  const balance = getBalance(player);
  if (!safeInteger(balance + quote.net)) throw new Error("This sale would exceed the safe balance limit.");
  if (!removeTradableItems(inventory, typeId, quantity, allowCustomized)) {
    throw new Error("The container changed; the sale was cancelled.");
  }
  try {
    setBalance(player, balance + quote.net);
    persistScore(typeId, score - quantity * CONFIG.scoreChangePerItem);
    setTaxRemainder(quote.taxRemainderAfter);
  } catch (error) {
    if (rollbackStacks) {
      for (const entry of rollbackStacks) {
        try { inventory.setItem(entry.slot, entry.stack); }
        catch {
          try { inventory.addItem(entry.stack); } catch {}
        }
      }
    } else {
      try { addItems(inventory, typeId, quantity); } catch {}
    }
    try { setBalance(player, balance); } catch {}
    try { persistScore(typeId, score); } catch {}
    try { setTaxRemainder(quote.taxRemainderBefore); } catch {}
    throw error;
  }
  recordTradeHistorySafely(player, "sell", typeId, quantity, score,
    { grossCents: quote.gross, taxCents: quote.tax, netCents: quote.net },
    balance + quote.net, sourceContainer ? "sell_barrel" : "market");
  if (!silent) {
    tell(player, "Sold " + quantity + " " + prettyName(typeId) + ". Gross: " + money(quote.gross) +
      ", sales tax: " + money(quote.tax) + ", paid: " + money(quote.net) +
      ". Balance: " + money(balance + quote.net) + ".");
  }
  return { quantity: quantity, gross: quote.gross, tax: quote.tax, net: quote.net };
}
function currentPriceLabel(itemId, mode) {
  try {
    const score = getScore(getMarket(), itemId);
    if (mode === "sell") {
      return money(totalSaleProceeds(score, 1).net) + " net / item";
    }
    return money(unitPriceCents(score)) + " each";
  } catch {
    return "Price unavailable";
  }
}
let cachedCatalog;
function getCatalog() {
  if (cachedCatalog) return cachedCatalog;
  const items = [];
  const seen = new Set();
  for (const type of ItemTypes.getAll()) {
    const id = type.id;
    if (typeof id !== "string" || id.indexOf("minecraft:") !== 0 || id === "minecraft:air" || !isSurvivalObtainableItem(id) || seen.has(id)) continue;
    try {
      new ItemStack(id, 1);
      unitPriceCents(getScore(getMarket(), id));
      items.push({ id: id, name: prettyName(id) });
      seen.add(id);
    } catch {
      // Hide internal/non-creatable item types rather than offering broken trades.
    }
  }
  items.sort(function (a, b) { return a.name.localeCompare(b.name); });
  cachedCatalog = items;
  return items;
}
function getSellableInventory(player) {
  const container = inventoryOf(player);
  const counts = new Map();
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (!stack || !safePlainStack(stack)) continue;
    counts.set(stack.typeId, (counts.get(stack.typeId) || 0) + stack.amount);
  }
  return Array.from(counts.entries())
    .map(function (entry) {
      return { id: entry[0], name: prettyName(entry[0]), count: entry[1] };
    })
    .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
}
function showMainMenu(player) {
  const form = new CustomForm(player, "Dynamic Economy");
  const query = new ObservableString("", { clientWritable: true });
  form.closeButton()
    .header("GLOBAL MARKET")
    .label("Balance: " + money(getBalance(player)))
    .label("Buy raises prices. Selling lowers them. Sales tax: " + taxPercentLabel() + ".")
    .divider()
    .header("MARKET TABS")
    .button("BUY", function () {
      try { form.close(); } catch {}
      system.run(function () { showBuyMenu(player, "", 0); });
    })
    .button("SELL", function () {
      try { form.close(); } catch {}
      system.run(function () { showSellMenu(player, "", 0); });
    })
    .button("ECONOMY", function () {
      try { form.close(); } catch {}
      system.run(function () { showMarketPrices(player, 0); });
    })
    .button("PRICE / TRADE HISTORY", function () {
      try { form.close(); } catch {}
      system.run(function () { showTradeHistoryPage(player, 0); });
    })
    .button("OVERSATURATED ITEMS", function () {
      try { form.close(); } catch {}
      system.run(function () { showMarketPrices(player, 0, true); });
    })
    .divider()
    .header("QUICK SEARCH")
    .textField("Item name or item ID", query, { description: "Type an item name or Minecraft item ID." })
    .button("Search items to buy", function () {
      const term = String(query.getData() || "").trim().toLowerCase();
      try { form.close(); } catch {}
      system.run(function () { showBuyMenu(player, term, 0); });
    });
  form.show().catch(function (error) {
    console.warn("[Dynamic Economy] Could not show modern market menu: " + error);
    tell(player, "The modern market menu could not open. Try again.");
  });
}
function showSearchForm(player,mode,currentQuery,currentColorId,returnTo){
 const colorFilter=currentColorId||"",noun=mode==="buy"?"items":"your inventory";
 const form=new ModalFormData().title("Search "+(mode==="buy"?"Market":"Inventory"))
 .textField("Search "+noun+" by name or item ID","Example: oak log",{defaultValue:currentQuery}).submitButton("Search");
 form.show(player).then(function(r){
  if(r.canceled||!r.formValues){returnToMenu(player,returnTo);return;}
  const query=String(r.formValues[0]||"").trim().toLowerCase();
  if(mode==="buy")showBuyMenu(player,query,0,colorFilter,returnTo);else showSellMenu(player,query,0,colorFilter,returnTo);
 }).catch(function(){tell(player,"The search form could not open. Try again.");returnToMenu(player,returnTo);});
}
function showColorMenu(player,mode,page,returnTo){
 const maxPage=Math.ceil(DYE_COLORS.length/COLOR_PAGE_SIZE)-1,safePage=Math.max(0,Math.min(page||0,maxPage));
 const form=new ActionFormData().title(mode==="buy"?"Buy by Color":"Sell by Color")
 .body("Choose a color. Matching items include wool, beds, carpet, banners, concrete, terracotta, glass, candles, shulker boxes, and dye when available.\nPage "+(safePage+1)+" of "+(maxPage+1));
 const actions=[];
 for(const color of DYE_COLORS.slice(safePage*COLOR_PAGE_SIZE,(safePage+1)*COLOR_PAGE_SIZE)){form.button(color.name+" Items");actions.push({type:"color",id:color.id});}
 if(safePage>0){form.button("Previous Colors");actions.push({type:"previous"});}
 if(safePage<maxPage){form.button("More Colors");actions.push({type:"next"});}
 form.button("Back");actions.push({type:"back"});
 form.show(player).then(function(r){
  if(r.canceled||r.selection===undefined){returnToMenu(player,returnTo);return;}
  const a=actions[r.selection];if(!a)return;
  if(a.type==="color"){const parent={type:"colors",mode:mode,page:safePage,returnTo:returnTo};if(mode==="buy")showBuyMenu(player,"",0,a.id,parent);else showSellMenu(player,"",0,a.id,parent);}
  else if(a.type==="previous")showColorMenu(player,mode,safePage-1,returnTo);
  else if(a.type==="next")showColorMenu(player,mode,safePage+1,returnTo);
  else if(a.type==="back")returnToMenu(player,returnTo);
 }).catch(function(){tell(player,"The color menu could not open. Try again.");returnToMenu(player,returnTo);});
}
function showBuyMenu(player,query,page,colorId,backTo){
 const colorFilter=colorId||"",market=getMarket();
 const matches=getCatalog().filter(function(item){const mq=!query||item.id.toLowerCase().indexOf(query)>=0||item.name.toLowerCase().indexOf(query)>=0;return mq&&(!colorFilter||isColoredItem(item.id,colorFilter));});
 matches.sort(function(a,b){let pa=0,pb=0;try{pa=unitPriceCents(getScore(market,a.id));}catch{}try{pb=unitPriceCents(getScore(market,b.id));}catch{}return pb-pa||a.name.localeCompare(b.name);});
 if(!matches.length)tell(player,"No items matched that search. Try a shorter name or item ID.");
 const maxPage=Math.max(0,Math.ceil(matches.length/CONFIG.pageSize)-1),safePage=Math.max(0,Math.min(page,maxPage));
 const form=new ActionFormData().title("Buy Items").body((colorFilter?"Color: "+colorDisplayName(colorFilter)+"\n":"")+(query?"Search: "+query+"\n":"")+"Choose an item. Prices are sorted from highest to lowest, then alphabetically for ties.\nPage "+(safePage+1)+" of "+(maxPage+1));
 const actions=[];
 for(const item of matches.slice(safePage*CONFIG.pageSize,(safePage+1)*CONFIG.pageSize)){form.button(item.name+"\n"+currentPriceLabel(item.id,"buy"));actions.push({type:"item",id:item.id});}
 if(safePage>0){form.button("Previous Page");actions.push({type:"previous"});}
 if(safePage<maxPage){form.button("Next Page");actions.push({type:"next"});}
 form.button("Search Items");actions.push({type:"search"});
 if(query){form.button("Clear Search");actions.push({type:"clear"});}
 form.button("Browse by Color");actions.push({type:"colors"});
 if(colorFilter){form.button("All Buy Items");actions.push({type:"all"});}
 form.button("Back");actions.push({type:"back"});
 form.show(player).then(function(r){
  if(r.canceled||r.selection===undefined){returnToMenu(player,backTo);return;}
  const a=actions[r.selection];if(!a)return;
  if(a.type==="item")showQuantityForm(player,"buy",a.id,CONFIG.maximumTradeQuantity,{type:"buy",query:query,page:safePage,colorId:colorFilter,backTo:backTo});
  else if(a.type==="previous")showBuyMenu(player,query,safePage-1,colorFilter,backTo);
  else if(a.type==="next")showBuyMenu(player,query,safePage+1,colorFilter,backTo);
  else if(a.type==="search")showSearchForm(player,"buy",query,colorFilter,{type:"buy",query:query,page:safePage,colorId:colorFilter,backTo:backTo});
  else if(a.type==="clear")showBuyMenu(player,"",0,colorFilter,backTo);
  else if(a.type==="colors")showColorMenu(player,"buy",0,{type:"buy",query:query,page:safePage,colorId:colorFilter,backTo:backTo});
  else if(a.type==="all")showBuyMenu(player,query,0,"",backTo);
  else if(a.type==="back")returnToMenu(player,backTo);
 }).catch(function(){tell(player,"The buy menu could not open. Close other menus and try again.");returnToMenu(player,backTo);});
}
function showSellMenu(player,query,page,colorId,backTo){
 const colorFilter=colorId||"";
 const matches=getSellableInventory(player).filter(function(item){const mq=!query||item.id.toLowerCase().indexOf(query)>=0||item.name.toLowerCase().indexOf(query)>=0;return mq&&(!colorFilter||isColoredItem(item.id,colorFilter));});
 if(!matches.length){tell(player,query?"No sellable items matched that search.":colorFilter?"You don't have any sellable "+colorDisplayName(colorFilter)+" items.":"You don't have any plain, undamaged items to sell.");if(query)showSearchForm(player,"sell",query,colorFilter,backTo);else returnToMenu(player,backTo);return;}
 const maxPage=Math.max(0,Math.ceil(matches.length/CONFIG.pageSize)-1),safePage=Math.max(0,Math.min(page,maxPage));
 const form=new ActionFormData().title("Sell Items").body((colorFilter?"Color: "+colorDisplayName(colorFilter)+"\n":"")+(query?"Search: "+query+"\n":"")+"Only plain, undamaged items are listed. Sorted by quantity you own, most to least, then alphabetically.\nPage "+(safePage+1)+" of "+(maxPage+1));
 const actions=[];
 for(const item of matches.slice(safePage*CONFIG.pageSize,(safePage+1)*CONFIG.pageSize)){form.button(item.name+" x"+item.count+"\n"+currentPriceLabel(item.id,"sell"));actions.push({type:"item",id:item.id,count:item.count});}
 if(safePage>0){form.button("Previous Page");actions.push({type:"previous"});}
 if(safePage<maxPage){form.button("Next Page");actions.push({type:"next"});}
 form.button("Search Inventory");actions.push({type:"search"});
 if(query){form.button("Clear Search");actions.push({type:"clear"});}
 form.button("Browse by Color");actions.push({type:"colors"});
 if(colorFilter){form.button("All Sell Items");actions.push({type:"all"});}
 form.button("Back");actions.push({type:"back"});
 form.show(player).then(function(r){
  if(r.canceled||r.selection===undefined){returnToMenu(player,backTo);return;}
  const a=actions[r.selection];if(!a)return;
  if(a.type==="item"){const count=countTradableItem(inventoryOf(player),a.id);showQuantityForm(player,"sell",a.id,count,{type:"sell",query:query,page:safePage,colorId:colorFilter,backTo:backTo});}
  else if(a.type==="previous")showSellMenu(player,query,safePage-1,colorFilter,backTo);
  else if(a.type==="next")showSellMenu(player,query,safePage+1,colorFilter,backTo);
  else if(a.type==="search")showSearchForm(player,"sell",query,colorFilter,{type:"sell",query:query,page:safePage,colorId:colorFilter,backTo:backTo});
  else if(a.type==="clear")showSellMenu(player,"",0,colorFilter,backTo);
  else if(a.type==="colors")showColorMenu(player,"sell",0,{type:"sell",query:query,page:safePage,colorId:colorFilter,backTo:backTo});
  else if(a.type==="all")showSellMenu(player,query,0,"",backTo);
  else if(a.type==="back")returnToMenu(player,backTo);
 }).catch(function(){tell(player,"The sell menu could not open. Close other menus and try again.");returnToMenu(player,backTo);});
}
function showQuantityForm(player,mode,typeId,maximum,returnTo){
 const available=mode==="sell"?maximum:Math.min(CONFIG.maximumTradeQuantity,maximum);
 if(available<1){tell(player,"You don't have that item available to sell.");returnToMenu(player,returnTo);return;}
 // Only the slider is capped at 64; Sell All uses the full available count.
 const sliderMaximum=Math.min(CONFIG.maximumTradeQuantity,available),score=getScore(getMarket(),typeId);
 if(mode==="sell"){
  let priceNote;try{priceNote="First item's estimated payout after tax: "+money(totalSaleProceeds(score,1).net)+".";}catch(error){tell(player,error instanceof Error?error.message:"This item can't be traded right now.");return;}
  const form=new ActionFormData().title("Sell "+prettyName(typeId)).body("You can sell up to "+available+" "+prettyName(typeId)+".\n"+priceNote+"\n\nChoose a custom quantity or sell every available item.").button("Choose Quantity").button("Sell All ("+available+")").button("Back");
  form.show(player).then(function(r){if(r.canceled||r.selection===undefined){returnToMenu(player,returnTo);return;}if(r.selection===0)showQuantitySliderForm(player,mode,typeId,sliderMaximum,score,returnTo);else if(r.selection===1)showTradeConfirmation(player,"sell",typeId,available,score,returnTo,false);else if(r.selection===2)returnToMenu(player,returnTo);})
   .catch(function(e){tell(player,"Sell quantity menu error: "+(e instanceof Error?e.message:String(e)));returnToMenu(player,returnTo);});
  return;
 }
 showQuantitySliderForm(player,mode,typeId,sliderMaximum,score,returnTo);
}
function showQuantitySliderForm(player,mode,typeId,maximum,quotedScore,returnTo){
 const max=Math.min(CONFIG.maximumTradeQuantity,maximum);
 if(max<1){tell(player,"You don't have that item available to sell.");returnToMenu(player,returnTo);return;}
 const score=quotedScore,firstItemPrice=mode==="buy"?money(unitPriceCents(score)):money(totalSaleProceeds(score,1).net)+" net";
 const quantityLabel="Quantity (first item: "+firstItemPrice+")",hasQuantitySlider=max>1;
 const form=new ModalFormData().title((mode==="buy"?"Buy ":"Sell ")+prettyName(typeId));
 if(hasQuantitySlider)form.slider(quantityLabel,1,max,{defaultValue:mode==="buy"?1:max,valueStep:1});else form.dropdown(quantityLabel,["1"],{defaultValueIndex:0});
 form.submitButton(mode==="buy"?"Review Purchase":"Review Sale");
 system.runTimeout(function(){try{form.show(player).then(function(r){
  if(r.canceled||!r.formValues){returnToMenu(player,returnTo);return;}
  const quantity=hasQuantitySlider?parseQuantity(Math.round(Number(r.formValues[0])),max):parseQuantity(Number(r.formValues[0])+1,max);
  showTradeConfirmation(player,mode,typeId,quantity,score,returnTo,true);
 }).catch(function(e){tell(player,"Quantity form error: "+(e instanceof Error?e.message:String(e)));returnToMenu(player,returnTo);});}
 catch(e){tell(player,"Quantity form error: "+(e instanceof Error?e.message:String(e)));returnToMenu(player,returnTo);}},2);
}
function showTradeConfirmation(player,mode,typeId,quantity,quotedScore,returnTo,fromSlider){
 const currentScore=getScore(getMarket(),typeId);
 if(currentScore!==quotedScore){tell(player,"The market price changed while you were choosing. Please review the new quote.");showQuantityForm(player,mode,typeId,mode==="buy"?CONFIG.maximumTradeQuantity:countTradableItem(inventoryOf(player),typeId),returnTo);return;}
 const quotedTaxRemainder=mode==="sell"?getTaxRemainder():null;
 let body;
 try{if(mode==="buy"){const total=totalBuyCost(quotedScore,quantity);body="Buy "+quantity+" "+prettyName(typeId)+"?\n\nTotal: "+money(total)+"\nBalance: "+money(getBalance(player))+"\n\nThis purchase raises the global item's price.";}
 else{const q=totalSaleProceeds(quotedScore,quantity,quotedTaxRemainder);body="Sell "+quantity+" "+prettyName(typeId)+"?\n\nGross: "+money(q.gross)+"\nSales tax ("+taxPercentLabel()+"): "+money(q.tax)+"\nYou receive: "+money(q.net)+"\n\nThis sale lowers the global item's price.";}}
 catch(e){tell(player,e instanceof Error?e.message:"Couldn't calculate that trade.");returnToMenu(player,returnTo);return;}
 const form=new MessageFormData().title(mode==="buy"?"Confirm Purchase":"Confirm Sale").body(body).button1(mode==="buy"?"Confirm Purchase":"Confirm Sale").button2("Back");
 form.show(player).then(function(r){
  if(r.canceled||r.selection===1){if(fromSlider){const mx=mode==="buy"?CONFIG.maximumTradeQuantity:Math.min(CONFIG.maximumTradeQuantity,countTradableItem(inventoryOf(player),typeId));showQuantitySliderForm(player,mode,typeId,mx,quotedScore,returnTo);}else showQuantityForm(player,mode,typeId,mode==="buy"?CONFIG.maximumTradeQuantity:countTradableItem(inventoryOf(player),typeId),returnTo);return;}
  if(r.selection!==0)return;
  if(getScore(getMarket(),typeId)!==quotedScore||(mode==="sell"&&getTaxRemainder()!==quotedTaxRemainder)){tell(player,"The market quote changed before confirmation, so no trade was made. Review the fresh quote.");showQuantityForm(player,mode,typeId,mode==="buy"?CONFIG.maximumTradeQuantity:countTradableItem(inventoryOf(player),typeId),returnTo);return;}
  try{if(mode==="buy")buy(player,typeId,quantity);else sell(player,typeId,quantity);system.runTimeout(function(){try{returnToMenu(player,returnTo);}catch{}},5);}
  catch(e){tell(player,e instanceof Error?e.message:"Trade failed safely.");system.runTimeout(function(){try{returnToMenu(player,returnTo);}catch{}},5);}
 }).catch(function(){tell(player,"The confirmation form could not open. No trade was made.");returnToMenu(player,returnTo);});
}
function showMarketPrices(player, page, oversaturatedOnly) {
  const market = getMarket();
  const tracked = Object.entries(market)
    .filter(function (entry) { return Number.isSafeInteger(entry[1]); })
    .map(function (entry) { return { id: entry[0], name: prettyName(entry[0]), score: entry[1] }; })
    .filter(function (entry) {
      if (!oversaturatedOnly) return true;
      try { return unitPriceCents(entry.score) <= 10; } catch { return false; }
    })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });
  const title = oversaturatedOnly ? "Oversaturated Items" : "Market Prices";
  if (!tracked.length) {
    new MessageFormData()
      .title(title)
      .body(oversaturatedOnly
        ? "No tracked items are currently at or below $0.10 per item. This filter only identifies low-priced items; it does not change prices or trade rules."
        : "The shared market is fresh. All items start at $1.00 per item.\n\nUse Buy Items or Sell Items to start trading.")
      .button1("Close")
      .button2("Back")
      .show(player)
      .then(function (response) { if (!response.canceled && response.selection === 1) showMainMenu(player); })
      .catch(function () {});
    return;
  }
  const maxPage = Math.max(0, Math.ceil(tracked.length / CONFIG.pageSize) - 1);
  const safePage = Math.max(0, Math.min(page, maxPage));
  const form = new ActionFormData()
    .title(title)
    .body("Tracked items: " + tracked.length +
      (oversaturatedOnly
        ? "\nShowing items priced at $0.10 or less. No prices or trade permissions are changed."
        : "\nPrices are shared by every player.") +
      "\nPage " + (safePage + 1) + " of " + (maxPage + 1));
  const actions = [];
  for (const entry of tracked.slice(safePage * CONFIG.pageSize, (safePage + 1) * CONFIG.pageSize)) {
    form.button(entry.name + "\n" + currentPriceLabel(entry.id, "buy") + "  |  score " + entry.score);
    actions.push({ type: "item", id: entry.id });
  }
  if (safePage > 0) {
    form.button("Previous Page");
    actions.push("previous");
  }
  if (safePage < maxPage) {
    form.button("Next Page");
    actions.push("next");
  }
  form.button("Back");
  actions.push("back");
  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    const action = actions[response.selection];
    if (action === "previous") showMarketPrices(player, safePage - 1, oversaturatedOnly);
    else if (action === "next") showMarketPrices(player, safePage + 1, oversaturatedOnly);
    else if (action === "back") showMainMenu(player);
    else if (action && action.type === "item") showMarketItemDetail(player, action.id, safePage, oversaturatedOnly);
  }).catch(function () {});
}
function showMarketItemDetail(player, typeId, page, oversaturatedOnly) {
  const score = getScore(getMarket(), typeId);
  let buyPrice = "Unavailable", sellPrice = "Unavailable";
  try { buyPrice = money(unitPriceCents(score)); } catch {}
  try { sellPrice = money(totalSaleProceeds(score, 1).net); } catch {}
  const form = new ActionFormData()
    .title(prettyName(typeId))
    .body("Current shared-market score: " + score +
      "\nBuy price: " + buyPrice + " per item" +
      "\nEstimated first-item sale payout after tax: " + sellPrice +
      "\n\nPrices can move as anyone in the world trades.")
    .button("Buy This Item")
    .button("Sell This Item")
    .button("Price History Graph")
    .button("Back");
  form.show(player).then(function (r) {
    if (r.canceled || r.selection === undefined) {
      showMarketPrices(player, page, oversaturatedOnly);
      return;
    }
    if (r.selection === 0) showQuantityForm(player, "buy", typeId, CONFIG.maximumTradeQuantity, { type: "marketDetail", id: typeId, page: page });
    else if (r.selection === 1) {
      const count = countTradableItem(inventoryOf(player), typeId);
      if (count < 1) {
        tell(player, "You don't have any plain, undamaged " + prettyName(typeId) + " to sell.");
        showMarketItemDetail(player, typeId, page, oversaturatedOnly);
      } else showQuantityForm(player, "sell", typeId, count, { type: "marketDetail", id: typeId, page: page });
    } else if (r.selection === 2) showItemPriceHistory(player, typeId, page, oversaturatedOnly);
    else if (r.selection === 3) showMarketPrices(player, page, oversaturatedOnly);
  }).catch(function () {
    tell(player, "The item details could not open. Try again.");
    showMarketPrices(player, page, oversaturatedOnly);
  });
}

function showTradeHistoryPage(player, page) {
  const records = getRecentTradeRecords(70);
  const pageSize = 6;
  const maxPage = Math.max(0, Math.ceil(records.length / pageSize) - 1);
  const safePage = Math.max(0, Math.min(Number.isSafeInteger(page) ? page : 0, maxPage));
  const visible = records.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const form = new ActionFormData()
    .title("Trade History")
    .body(records.length
      ? "Recent completed trades across the shared market. Select a trade to view that item's price graph.\nPage " + (safePage + 1) + " of " + (maxPage + 1)
      : "No trade history has been recorded yet. Graphs appear after the first successful trades.");
  const actions = [];
  for (const record of visible) {
    const actionLabel = record.action === "buy" ? "BOUGHT" : "SOLD";
    const amount = Number.isSafeInteger(record.netCents) ? money(record.netCents) : "Unknown";
    form.button(actionLabel + " " + record.quantity + " x " + prettyName(record.itemId) +
      "\n" + record.playerName + " | " + amount + " | tick " + record.tick);
    actions.push({ type: "record", itemId: record.itemId });
  }
  if (safePage > 0) { form.button("Previous Page"); actions.push({ type: "previous" }); }
  if (safePage < maxPage) { form.button("Next Page"); actions.push({ type: "next" }); }
  form.button("Back to Market"); actions.push({ type: "back" });
  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    const action = actions[response.selection];
    if (!action) return;
    if (action.type === "record") showItemPriceHistory(player, action.itemId, safePage, false);
    else if (action.type === "previous") showTradeHistoryPage(player, safePage - 1);
    else if (action.type === "next") showTradeHistoryPage(player, safePage + 1);
    else if (action.type === "back") showMainMenu(player);
  }).catch(function (error) {
    console.warn("[Dynamic Economy] Could not open trade history: " + error);
    tell(player, "Trade history could not open. Try again.");
  });
}

function showItemPriceHistory(player, typeId, returnPage, oversaturatedOnly) {
  const records = getRecentTradeRecords(100).filter(function (record) { return record.itemId === typeId; }).reverse();
  const points = [];
  for (const record of records) {
    const chunks = Math.ceil(record.quantity / HISTORY_SERIES_CHUNK_SIZE);
    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
      const raw = world.getDynamicProperty(HISTORY_SERIES_PREFIX + record.id + ":" + chunkIndex);
      if (typeof raw !== "string") continue;
      try {
        const chunk = JSON.parse(raw);
        if (!chunk || chunk.itemId !== typeId || !Array.isArray(chunk.points)) continue;
        for (const point of chunk.points) {
          if (Number.isSafeInteger(point.priceCents) && point.priceCents > 0) {
            points.push({ priceCents: point.priceCents, score: point.score, action: chunk.action, tick: point.tick });
          }
        }
      } catch (error) {
        console.warn("[Dynamic Economy] Skipping malformed price-history chunk: " + error);
      }
    }
  }
  const visible = points.slice(-32);
  const prices = visible.map(function (point) { return point.priceCents; });
  const min = prices.length ? Math.min.apply(null, prices) : 0;
  const max = prices.length ? Math.max.apply(null, prices) : 0;
  const bars = visible.map(function (point) {
    const level = max === min ? 4 : Math.max(1, Math.min(8, Math.round(((point.priceCents - min) / (max - min)) * 7) + 1));
    return "▁▂▃▄▅▆▇█"[level - 1];
  }).join("");
  let body = "Item: " + prettyName(typeId) + "\nCurrent price: " + currentPriceLabel(typeId, "buy");
  if (!visible.length) {
    body += "\n\nNo saved price points for this item yet. New successful trades will add graph data.";
  } else {
    body += "\n\nRecent price trend (oldest → newest):\n" + bars +
      "\nLow: " + money(min) + "   High: " + money(max) +
      "\nPoints shown: " + visible.length +
      "\n\nEach bar represents a saved per-item price after a trade. The graph uses only saved trades, not estimated prices between trades.";
    const recent = visible.slice(-5).reverse();
    body += "\n\nLatest points:";
    for (const point of recent) body += "\n" + (point.action === "buy" ? "Buy" : "Sell") +
      " · " + money(point.priceCents) + " · score " + point.score;
  }
  const form = new ActionFormData().title("Price History").body(body)
    .button("Back to " + prettyName(typeId))
    .button("Trade History Pages")
    .button("Market Home");
  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    if (response.selection === 0) showMarketItemDetail(player, typeId, returnPage, oversaturatedOnly);
    else if (response.selection === 1) showTradeHistoryPage(player, 0);
    else if (response.selection === 2) showMainMenu(player);
  }).catch(function () {
    tell(player, "Price history could not open. Try again.");
    showMarketItemDetail(player, typeId, returnPage, oversaturatedOnly);
  });
}

function processClosedSellBarrel(dimension, location) {
  const key = barrelLocationId(dimension, location);
  if (processingBarrels.has(key) || isBarrelOpenToPlayer(dimension, location)) return;
  const lockOwner = readBarrelOwner(dimension, location);
  if (!lockOwner) return;
  processingBarrels.add(key);
  try {
    const block = dimension.getBlock(location);
    if (!block || block.typeId !== SELL_BARREL_ID) {
      clearBarrelOwner(dimension, location);
      return;
    }
    const inventoryComponent = block.getComponent("minecraft:inventory");
    const container = inventoryComponent && inventoryComponent.container;
    if (!container) throw new Error("Could not access the Sell Barrel inventory.");
    const quantities = new Map();
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (!stack || stack.typeId === "minecraft:air") continue;
      quantities.set(stack.typeId, (quantities.get(stack.typeId) || 0) + stack.amount);
    }
    if (!quantities.size) return;
    const owner = ownerAccount(lockOwner);
    let unitsSold = 0;
    let payoutCents = 0;
    let failedTypes = 0;
    for (const [typeId, quantity] of quantities.entries()) {
      let remainingQuantity = quantity;
      try {
        // The market UI's per-transaction limit is 64. Keep selling this item
        // in bounded chunks so a full 27-slot barrel never gets stuck unsold.
        while (remainingQuantity > 0) {
          const chunkQuantity = Math.min(remainingQuantity, CONFIG.maximumTradeQuantity);
          const result = sell(owner, typeId, chunkQuantity, container, true, true);
          remainingQuantity -= result.quantity;
          unitsSold += result.quantity;
          payoutCents += result.net;
        }
      } catch (error) {
        failedTypes++;
        console.warn("[Dynamic Economy] Sell Barrel owned by " + lockOwner.name +
          " left " + remainingQuantity + " " + typeId + " item(s) unsold: " + error);
      }
    }
    if (unitsSold > 0) {
      const onlineOwner = world.getAllPlayers().find(function (player) { return player.id === lockOwner.id; });
      if (onlineOwner) {
        tell(onlineOwner, "Your Sell Barrel sold " + unitsSold + " item(s) for " + money(payoutCents) +
          " after tax. Balance: " + money(getBalance(onlineOwner)) + ".");
      }
    }
    if (failedTypes > 0) {
      console.warn("[Dynamic Economy] " + failedTypes + " item type(s) stayed in the Sell Barrel owned by " +
        lockOwner.name + " because this game could not resolve them for trading.");
    }
  } catch (error) {
    console.warn("[Dynamic Economy] Sell Barrel processing failed: " + error);
  } finally {
    processingBarrels.delete(key);
  }
}
function warnUnownedSellBarrel(dimension, location, player) {
  if (!player || readBarrelOwner(dimension, location)) return;
  tell(player, "This Sell Barrel has no saved owner, so it cannot sell items yet. Ask an operator to replace it with an owner-tagged Sell Barrel.");
}
function assignOwnerBeforePlacement(event) {
  const player = event && event.player;
  if (!player || !event.block || !event.dimension) return;
  const location = event.block.location;
  const key = barrelLocationId(event.dimension, location);
  pendingBarrelOwners.set(key, readOwnerFromItemOrPlayer(player, heldMainhandItem(player)));
  system.runTimeout(function () { pendingBarrelOwners.delete(key); }, 2);
}
function saveOwnerAfterPlacement(event) {
  if (!event || !event.block || event.block.typeId !== SELL_BARREL_ID || !event.dimension) return;
  const location = event.block.location;
  const key = barrelLocationId(event.dimension, location);
  const owner = pendingBarrelOwners.get(key);
  if (!owner) return;
  try {
    writeBarrelOwner(event.dimension, location, owner);
    pendingBarrelOwners.delete(key);
  } catch (error) {
    // Keep the pending copy briefly so the after-placement fallback can retry it.
    console.warn("[Dynamic Economy] Could not save Sell Barrel owner in onPlace; will retry: " + error);
  }
}
function placeOwnerFallback(event) {
  try {
    if (!event || !event.block || event.block.typeId !== SELL_BARREL_ID || !event.dimension || !event.player) return;
    const location = event.block.location;
    const key = barrelLocationId(event.dimension, location);
    if (readBarrelOwner(event.dimension, location)) {
      pendingBarrelOwners.delete(key);
      return;
    }
    // Prefer captured item identity. Only use the placer as owner when no owner
    // metadata was available from the item being placed.
    const owner = pendingBarrelOwners.get(key) || { id: event.player.id, name: event.player.name };
    writeBarrelOwner(event.dimension, location, owner);
    pendingBarrelOwners.delete(key);
  } catch (error) {
    console.warn("[Dynamic Economy] Sell Barrel placement owner fallback failed: " + error);
  }
}
function sellBarrelBlockBroken(event) {
  try {
    if (!event || !event.block || !event.dimension) return;
    const location = event.block.location;
    const dimension = event.dimension;
    const owner = readBarrelOwner(dimension, location);
    const item = new ItemStack(SELL_BARREL_ID, 1);
    if (owner) setSellBarrelItemOwner(item, owner);
    dimension.spawnItem(item, { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 });
    clearBarrelOwner(dimension, location);
    openBarrelUsers.delete(barrelLocationId(dimension, location));
  } catch (error) {
    console.warn("[Dynamic Economy] Could not preserve Sell Barrel ownership when broken: " + error);
  }
}
function handleSellBarrelOpened(event) {
  try {
    if (!event || !event.block || event.block.typeId !== SELL_BARREL_ID) return;
    const player = sourcePlayer(event.openSource);
    if (!player) return;
    const location = event.block.location;
    addOpenBarrelUser(event.dimension, location, player);
    warnUnownedSellBarrel(event.dimension, location, player);
  } catch (error) {
    console.warn("[Dynamic Economy] Sell Barrel open event failed: " + error);
  }
}
function handleSellBarrelClosed(event) {
  try {
    if (!event || !event.block || event.block.typeId !== SELL_BARREL_ID) return;
    const player = sourcePlayer(event.closeSource);
    const location = event.block.location;
    if (player) {
      removeOpenBarrelUser(event.dimension, location, player);
      warnUnownedSellBarrel(event.dimension, location, player);
    }
    system.runTimeout(function () { processClosedSellBarrel(event.dimension, location); }, 1);
  } catch (error) {
    console.warn("[Dynamic Economy] Sell Barrel close event failed: " + error);
  }
}
function handleSellBarrelTick(event) {
  try {
    if (!event || !event.block || event.block.typeId !== SELL_BARREL_ID || !event.dimension) return;
    processClosedSellBarrel(event.dimension, event.block.location);
  } catch (error) {
    console.warn("[Dynamic Economy] Sell Barrel hopper tick failed: " + error);
  }
}

function showOperatorMenu(player) {
  if (!isEconomyOperator(player)) {
    tell(player, "The Blaze Rod is reserved for world operators.");
    return;
  }
  const form = new ActionFormData()
    .title("Economy Operator")
    .body("Operator tools\n\nReview saved trades or inspect the current rules. The price curve remains unchanged.")
    .button("Recent Trade Records")
    .button("Current Economy Rules")
    .button("Back to Market");
  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    if (response.selection === 0) showRecentTradeRecords(player, 0);
    else if (response.selection === 1) showOperatorRules(player);
    else if (response.selection === 2) showMainMenu(player);
  }).catch(function (error) {
    console.warn("[Dynamic Economy] Could not show operator menu: " + error);
    tell(player, "The operator menu could not open. Try using the Blaze Rod again.");
  });
}

function showRecentTradeRecords(player, page) {
  if (!isEconomyOperator(player)) {
    tell(player, "Only world operators can view economy records.");
    return;
  }
  const pageSize = 5;
  const records = getRecentTradeRecords(100);
  if (!records.length) {
    new MessageFormData().title("Recent Trade Records")
      .body("No recorded trades yet. Successful purchases and sales will appear here.")
      .button1("Operator Menu").button2("Close")
      .show(player).then(function (r) {
        if (!r.canceled && r.selection === 0) showOperatorMenu(player);
      }).catch(function () {});
    return;
  }
  const maxPage = Math.max(0, Math.ceil(records.length / pageSize) - 1);
  const safePage = Math.max(0, Math.min(Number.isSafeInteger(page) ? page : 0, maxPage));
  const form = new ActionFormData()
    .title("Recent Trade Records")
    .body("Newest first. Showing saved transactions " + (safePage * pageSize + 1) + "–" +
      Math.min(records.length, (safePage + 1) * pageSize) + " of " + records.length + ".\nSelect a trade for details.");
  const actions = [];
  for (const record of records.slice(safePage * pageSize, (safePage + 1) * pageSize)) {
    const verb = record.action === "buy" ? "BUY" : "SELL";
    const amount = record.action === "buy" ? record.grossCents : record.netCents;
    form.button(verb + " " + record.quantity + " x " + prettyName(record.itemId) +
      "\n" + money(Number.isSafeInteger(amount) ? amount : 0) + "  |  " + String(record.playerName || "Unknown"));
    actions.push(record);
  }
  if (safePage > 0) { form.button("Previous Page"); actions.push("previous"); }
  if (safePage < maxPage) { form.button("Next Page"); actions.push("next"); }
  form.button("Back to Operator Menu"); actions.push("back");
  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    const selected = actions[response.selection];
    if (selected === "previous") showRecentTradeRecords(player, safePage - 1);
    else if (selected === "next") showRecentTradeRecords(player, safePage + 1);
    else if (selected === "back") showOperatorMenu(player);
    else if (selected && typeof selected === "object") showTradeRecordDetail(player, selected, safePage);
  }).catch(function (error) {
    console.warn("[Dynamic Economy] Could not show trade records: " + error);
    tell(player, "Trade records could not open.");
  });
}

function showTradeRecordDetail(player, record, page) {
  if (!isEconomyOperator(player)) {
    tell(player, "Only world operators can view economy records.");
    return;
  }
  const verb = record.action === "buy" ? "Purchase" : "Sale";
  const body = "Transaction #" + record.id + "  |  " + verb +
    "\nPlayer: " + String(record.playerName || "Unknown") +
    "\nItem: " + prettyName(record.itemId) +
    "\nQuantity: " + record.quantity +
    "\nScore: " + record.scoreBefore + " -> " + record.scoreAfter +
    "\nGross: " + money(Number.isSafeInteger(record.grossCents) ? record.grossCents : 0) +
    "\nSales tax: " + money(Number.isSafeInteger(record.taxCents) ? record.taxCents : 0) +
    "\nNet: " + money(Number.isSafeInteger(record.netCents) ? record.netCents : 0) +
    "\nBalance after trade: " + money(Number.isSafeInteger(record.balanceAfterCents) ? record.balanceAfterCents : 0) +
    "\nSource: " + String(record.source || "market") +
    "\nWorld tick: " + record.tick;
  new MessageFormData().title("Trade Record #" + record.id).body(body)
    .button1("Back to Records").button2("Operator Menu")
    .show(player).then(function (response) {
      if (response.canceled || response.selection === 1) showOperatorMenu(player);
      else showRecentTradeRecords(player, page);
    }).catch(function () { showRecentTradeRecords(player, page); });
}

function showOperatorRules(player) {
  if (!isEconomyOperator(player)) {
    tell(player, "Only world operators can inspect economy rules.");
    return;
  }
  const body = "Current rules (informational):\n" +
    "Starting balance for new players: " + money(CONFIG.startingBalanceCents) + "\n" +
    "Sales tax: " + taxPercentLabel() + "\n" +
    "Growth multiplier: " + CONFIG.growthFactor + " per score point\n" +
    "Score change: " + CONFIG.scoreChangePerItem + " point per item\n" +
    "Minimum price: " + money(CONFIG.minimumPriceCents) + " per item\n" +
    "Custom quantity limit: " + CONFIG.maximumTradeQuantity + " items\n\n" +
    "The price rules are intentionally unchanged. Editable settings will be added after the desired controls are defined.";
  new MessageFormData().title("Current Economy Rules").body(body)
    .button1("Operator Menu").button2("Close")
    .show(player).then(function (response) {
      if (!response.canceled && response.selection === 0) showOperatorMenu(player);
    }).catch(function () {});
}

function handleEconomyToolUse(player, itemStack) {
  if (!player || !itemStack) return;
  if (itemStack.typeId === OPERATOR_TOOL_ID) {
    if (!isEconomyOperator(player)) {
      tell(player, "The Blaze Rod is reserved for world operators.");
      return;
    }
    requestMenu(player, "operator");
    return;
  }
  if (isMarketTool(itemStack)) requestMenu(player, "market");
}

function nameCraftedSellBarrel(event) {
  try {
    const player = event && event.player;
    const crafted = event && event.itemStack;
    if (!player || !crafted || crafted.typeId !== SELL_BARREL_ID) return;
    const owner = { id: player.id, name: player.name };
    setSellBarrelItemOwner(crafted, owner);
    tell(player, "Crafted " + owner.name + "'s Sell Barrel. Its sales will always pay you, even if someone else uses it.");
  } catch (error) {
    console.warn("[Dynamic Economy] Could not personalize crafted Sell Barrel: " + error);
    try {
      if (event && event.player) tell(event.player, "Your Sell Barrel was crafted, but its owner tag could not be applied. Verify before using automated sales.");
    } catch {}
  }
}

function requestMenu(player, menuType) {
  const tick = system.currentTick;
  const lastTick = openCooldown.get(player.id);
  if (lastTick !== undefined && tick - lastTick < 8) return;
  openCooldown.set(player.id, tick);
  system.run(function () {
    try { if (menuType === "operator") showOperatorMenu(player); else showMainMenu(player); }
    catch (error) {
      console.warn("[Dynamic Economy] Market menu error: " + error);
      tell(player, "The requested economy menu could not open. Try using the selected tool again.");
    }
  });
}

// Air-use listener, plus block/entity interaction listeners for touch and controller input.
world.beforeEvents.itemUse.subscribe(function (event) {
  // Defer form work until after the restricted before-event callback finishes.
  handleEconomyToolUse(event.source, event.itemStack);
});
world.afterEvents.playerInteractWithBlock.subscribe(function (event) {
  if (event.isFirstEvent === false) return;
  const held = event.beforeItemStack || event.itemStack;
  handleEconomyToolUse(event.player, held);
});
world.afterEvents.playerInteractWithEntity.subscribe(function (event) {
  const held = event.beforeItemStack || event.itemStack;
  handleEconomyToolUse(event.player, held);
});

// The craft event is still marked pre-release in API docs; skip safely if unavailable.
try {
  world.afterEvents.playerCraftRecipe.subscribe(nameCraftedSellBarrel);
} catch (error) {
  console.warn("[Dynamic Economy] Craft-name listener is unavailable on this game build: " + error);
}

world.afterEvents.playerSpawn.subscribe(function (event) {
  if (!event.initialSpawn) return;
  const player = event.player;
  system.runTimeout(function () {
    tell(player, "Dynamic Economy loaded. Hold a wooden stick or any sword and use/right-click to open the market.");
    tell(player, "Operators: use a Blaze Rod to open economy records and operator tools.");
    tell(player, "Starting balance: " + money(getBalance(player)) + ". All item prices start at $1.00.");
  }, 20);
});
system.beforeEvents.startup.subscribe(function (startupEvent) {
  startupEvent.blockComponentRegistry.registerCustomComponent(SELL_BARREL_COMPONENT_ID, {
    beforeOnPlayerPlace: assignOwnerBeforePlacement,
    onPlace: saveOwnerAfterPlacement,
    onTick: handleSellBarrelTick,
    onBreak: sellBarrelBlockBroken
  });
});
world.afterEvents.playerPlaceBlock.subscribe(placeOwnerFallback);
world.afterEvents.blockContainerOpened.subscribe(handleSellBarrelOpened);
world.afterEvents.blockContainerClosed.subscribe(handleSellBarrelClosed);
world.afterEvents.playerLeave.subscribe(function (event) {
  const playerId = event && event.playerId;
  if (typeof playerId !== "string") return;
  for (const [key, players] of openBarrelUsers.entries()) {
    players.delete(playerId);
    if (!players.size) openBarrelUsers.delete(key);
  }
});

world.afterEvents.worldLoad.subscribe(function () {
  try {
    migrateLegacyMarket();
    getMarket();
    getTaxRemainder();
  } catch (error) {
    console.warn("[Dynamic Economy] Market initialization warning: " + error);
  }
  console.warn("[Dynamic Economy] Form-based market initialized.");
});
