import { world, system, ItemStack } from "@minecraft/server";

/**
 * Dynamic Economy for Bedrock Script API.
 * First playable prototype: global market scores, persistent balances,
 * buy/sell commands, per-unit price paths, and a configurable sales tax.
 *
 * Currency is stored as integer cents to avoid floating-point balance drift.
 * Market scores are separate from currency balances.
 */
const CONFIG = Object.freeze({
  namespace: "diceyinked:economy",
  growthFactor: 1.01,
  scoreChangePerItem: 1,
  startingBalanceCents: 0,
  salesTaxRate: 0.10,
  minimumPriceCents: 1,
  maximumTradeQuantity: 64,
  maximumSafeCents: Number.MAX_SAFE_INTEGER,
});

const MARKET_KEY = `${CONFIG.namespace}:market`;
const BALANCE_PREFIX = `${CONFIG.namespace}:balance:`;
const PRICE_FLOOR_KEY = `${CONFIG.namespace}:oversaturated`;

function tell(player, message) {
  try { player.sendMessage(`§a[Economy]§r ${message}`); } catch {}
}
function money(cents) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function safeInteger(value) {
  return Number.isSafeInteger(value) && Math.abs(value) <= CONFIG.maximumSafeCents;
}
function getBalance(player) {
  const value = world.getDynamicProperty(BALANCE_PREFIX + player.id);
  if (value === undefined) return CONFIG.startingBalanceCents;
  return typeof value === "number" && safeInteger(value) && value >= 0
    ? value : CONFIG.startingBalanceCents;
}
function setBalance(player, cents) {
  if (!safeInteger(cents) || cents < 0) throw new Error("Balance is outside the safe currency range.");
  world.setDynamicProperty(BALANCE_PREFIX + player.id, cents);
}
function getMarket() {
  const raw = world.getDynamicProperty(MARKET_KEY);
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function setMarket(market) {
  world.setDynamicProperty(MARKET_KEY, JSON.stringify(market));
}
function getScore(market, itemId) {
  const score = market[itemId];
  return Number.isSafeInteger(score) ? score : 0;
}
function unitPriceCents(score) {
  const raw = 100 * Math.pow(CONFIG.growthFactor, score);
  if (!Number.isFinite(raw) || raw >= CONFIG.maximumSafeCents) {
    throw new Error("That item's market price is currently outside the safe range.");
  }
  return Math.max(CONFIG.minimumPriceCents, Math.round(raw));
}
function inventoryOf(player) {
  const component = player.getComponent("minecraft:inventory");
  if (!component || !component.container) throw new Error("Could not access your inventory.");
  return component.container;
}
function itemType(itemId) {
  const normalized = itemId.includes(":") ? itemId : `minecraft:${itemId}`;
  const type = world.getDimension("overworld"); // ensure script API is initialized
  void type;
  return normalized;
}
function countItem(container, typeId) {
  let count = 0;
  for (let i = 0; i < container.size; i++) {
    const stack = container.getItem(i);
    if (stack?.typeId === typeId) count += stack.amount;
  }
  return count;
}
function removeItems(container, typeId, quantity) {
  if (countItem(container, typeId) < quantity) return false;
  let remaining = quantity;
  for (let i = 0; i < container.size && remaining > 0; i++) {
    const stack = container.getItem(i);
    if (!stack || stack.typeId !== typeId) continue;
    const take = Math.min(stack.amount, remaining);
    if (take === stack.amount) container.setItem(i, undefined);
    else {
      stack.amount -= take;
      container.setItem(i, stack);
    }
    remaining -= take;
  }
  return remaining === 0;
}
function canFit(container, typeId, quantity) {
  const sample = new ItemStack(typeId, 1);
  let remaining = quantity;
  for (let i = 0; i < container.size; i++) {
    const stack = container.getItem(i);
    if (!stack) {
      remaining -= sample.maxAmount;
    } else if (stack.typeId === typeId) {
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
function totalSaleProceeds(startScore, quantity) {
  let gross = 0;
  for (let i = 1; i <= quantity; i++) {
    gross += unitPriceCents(startScore - i * CONFIG.scoreChangePerItem);
    if (!safeInteger(gross)) throw new Error("That sale is too large to price safely.");
  }
  const tax = Math.floor(gross * CONFIG.salesTaxRate);
  return { gross, tax, net: gross - tax };
}
function parseQuantity(raw) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > CONFIG.maximumTradeQuantity) {
    throw new Error(`Quantity must be a whole number from 1 to ${CONFIG.maximumTradeQuantity}.`);
  }
  return value;
}
function buy(player, rawItemId, rawQuantity) {
  const typeId = itemType(rawItemId);
  const quantity = parseQuantity(rawQuantity);
  const market = getMarket();
  const score = getScore(market, typeId);
  const cost = totalBuyCost(score, quantity);
  const balance = getBalance(player);
  const inventory = inventoryOf(player);

  if (balance < cost) throw new Error(`You need ${money(cost)}; your balance is ${money(balance)}.`);
  if (!canFit(inventory, typeId, quantity)) throw new Error("Make enough room in your inventory first.");

  // Add first, then charge. Roll back only the quantity actually inserted.
  let inserted = 0;
  try {
    inserted = addItems(inventory, typeId, quantity);
    if (inserted !== quantity) throw new Error("Your inventory could not accept all items.");
    setBalance(player, balance - cost);
    market[typeId] = score + quantity * CONFIG.scoreChangePerItem;
    setMarket(market);
  } catch (error) {
    if (inserted > 0) {
      try { removeItems(inventory, typeId, inserted); } catch {}
    }
    try { setBalance(player, balance); } catch {}
    throw error;
  }
  tell(player, `Bought ${quantity} ${typeId} for ${money(cost)}. New balance: ${money(balance - cost)}.`);
}
function sell(player, rawItemId, rawQuantity) {
  const typeId = itemType(rawItemId);
  const quantity = parseQuantity(rawQuantity);
  const inventory = inventoryOf(player);
  if (countItem(inventory, typeId) < quantity) {
    throw new Error(`You do not have ${quantity} ${typeId}.`);
  }
  const market = getMarket();
  const score = getScore(market, typeId);
  const { gross, tax, net } = totalSaleProceeds(score, quantity);
  const balance = getBalance(player);
  if (!safeInteger(balance + net)) throw new Error("This sale would exceed the safe balance limit.");

  // Remove items first. On failure, no payment or market update is applied.
  if (!removeItems(inventory, typeId, quantity)) throw new Error("Could not remove the items; sale cancelled.");
  try {
    setBalance(player, balance + net);
    market[typeId] = score - quantity * CONFIG.scoreChangePerItem;
    setMarket(market);
  } catch (error) {
    try { addItems(inventory, typeId, quantity); } catch {}
    try { setBalance(player, balance); } catch {}
    throw error;
  }
  tell(player, `Sold ${quantity} ${typeId}. Gross: ${money(gross)}, sales tax: ${money(tax)}, paid: ${money(net)}. Balance: ${money(balance + net)}.`);
}
function price(player, rawItemId) {
  const typeId = itemType(rawItemId);
  const score = getScore(getMarket(), typeId);
  tell(player, `${typeId}: ${money(unitPriceCents(score) )} per item (market score ${score}).`);
}
function help(player) {
  tell(player, "Commands: !balance | !price <item_id> | !buy <item_id> [quantity] | !sell <item_id> [quantity] | !market");
  tell(player, "Use item IDs such as minecraft:oak_log. Trades are limited to 64 items per command.");
}
function marketSummary(player) {
  const market = getMarket();
  const entries = Object.entries(market)
    .filter(([, score]) => Number.isSafeInteger(score))
    .sort((a, b) => a[1] - b[1]);
  if (!entries.length) {
    tell(player, "The global market is fresh. All items start at $1.00.");
    return;
  }
  tell(player, `Global market tracked items: ${entries.length}. Prices are shared by everyone.`);
  const cheapest = entries.slice(0, 3).map(([id, score]) => `${id} ${money(unitPriceCents(score))}`);
  const priciest = entries.slice(-3).reverse().map(([id, score]) => `${id} ${money(unitPriceCents(score))}`);
  tell(player, `Lowest tracked: ${cheapest.join(" | ")}`);
  tell(player, `Highest tracked: ${priciest.join(" | ")}`);
}
function runCommand(player, message) {
  const args = message.trim().split(/\s+/);
  const command = args[0].toLowerCase();
  if (command === "!help" || command === "!economy") return help(player);
  if (command === "!balance") return tell(player, `Your balance is ${money(getBalance(player))}.`);
  if (command === "!market") return marketSummary(player);
  if (command === "!price") {
    if (!args[1]) throw new Error("Usage: !price <item_id>");
    return price(player, args[1]);
  }
  if (command === "!buy" || command === "!sell") {
    if (!args[1]) throw new Error(`Usage: ${command} <item_id> [quantity]`);
    const quantity = args[2] ?? "1";
    return command === "!buy" ? buy(player, args[1], quantity) : sell(player, args[1], quantity);
  }
  tell(player, "Unknown economy command. Type !economy for help.");
}

world.beforeEvents.chatSend.subscribe((event) => {
  const message = event.message.trim();
  if (!message.startsWith("!")) return;
  const command = message.split(/\s+/, 1)[0].toLowerCase();
  if (!["!help", "!economy", "!balance", "!price", "!buy", "!sell", "!market"].includes(command)) return;
  event.cancel = true;
  const player = event.sender;
  system.run(() => {
    try { runCommand(player, message); }
    catch (error) { tell(player, error instanceof Error ? error.message : "Trade failed safely."); }
  });
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return;
  const player = event.player;
  system.runTimeout(() => {
    tell(player, "Dynamic Economy prototype loaded. Type !economy for commands.");
    tell(player, `Starting balance: ${money(getBalance(player))}. All items begin at $1.00.`);
  }, 20);
});

world.afterEvents.worldLoad.subscribe(() => {
  if (world.getDynamicProperty(MARKET_KEY) === undefined) setMarket({});
  if (world.getDynamicProperty(PRICE_FLOOR_KEY) === undefined) world.setDynamicProperty(PRICE_FLOOR_KEY, 0);
  console.warn("[Dynamic Economy] Bedrock Script API prototype initialized.");
});
