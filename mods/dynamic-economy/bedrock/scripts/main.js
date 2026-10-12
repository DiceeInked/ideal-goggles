import { world, system, ItemStack, ItemTypes } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";

/*
 * Dynamic Economy: fully form-driven Bedrock UI.
 * Use a regular stick to open the market. Purchases and sales update one
 * shared world market. Currency is stored as integer cents.
 */
const CONFIG = Object.freeze({
  namespace: "diceyinked:economy",
  growthFactor: 1.01,
  scoreChangePerItem: 1,
  startingBalanceCents: 10000,
  salesTaxRate: 0.10,
  minimumPriceCents: 1,
  maximumTradeQuantity: 64,
  maximumSafeCents: Number.MAX_SAFE_INTEGER,
  pageSize: 7,
});

const MARKET_KEY = CONFIG.namespace + ":market";
const BALANCE_PREFIX = CONFIG.namespace + ":balance:";
const openCooldown = new Map();

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
    throw new Error("This item's market price is too high to trade safely.");
  }
  return Math.max(CONFIG.minimumPriceCents, Math.round(raw));
}
function itemType(itemId) {
  const normalized = itemId.indexOf(":") >= 0 ? itemId : "minecraft:" + itemId;
  if (!ItemTypes.get(normalized) || normalized === "minecraft:air") {
    throw new Error("That item is not available in this world.");
  }
  return normalized;
}
function prettyName(itemId) {
  return itemId.replace(/^[^:]+:/, "").split("_")
    .map(function (part) { return part.length ? part[0].toUpperCase() + part.slice(1) : part; })
    .join(" ");
}
function safePlainStack(stack) {
  if (!stack) return false;
  try {
    if (stack.nameTag) return false;
    if (stack.getLore().length > 0) return false;
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
function countTradableItem(container, typeId) {
  let count = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack && stack.typeId === typeId && safePlainStack(stack)) count += stack.amount;
  }
  return count;
}
function removeTradableItems(container, typeId, quantity) {
  if (countTradableItem(container, typeId) < quantity) return false;
  let remaining = quantity;
  for (let slot = 0; slot < container.size && remaining > 0; slot++) {
    const stack = container.getItem(slot);
    if (!stack || stack.typeId !== typeId || !safePlainStack(stack)) continue;
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
function totalSaleProceeds(startScore, quantity) {
  let gross = 0;
  for (let i = 1; i <= quantity; i++) {
    gross += unitPriceCents(startScore - i * CONFIG.scoreChangePerItem);
    if (!safeInteger(gross)) throw new Error("That sale is too large to price safely.");
  }
  const tax = Math.floor(gross * CONFIG.salesTaxRate);
  return { gross: gross, tax: tax, net: gross - tax };
}
function parseQuantity(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > CONFIG.maximumTradeQuantity) {
    throw new Error("Choose a quantity from 1 to " + CONFIG.maximumTradeQuantity + ".");
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

  if (balance < cost) throw new Error("You need " + money(cost) + "; your balance is " + money(balance) + ".");
  if (!canFit(inventory, typeId, quantity)) throw new Error("Make enough room in your inventory first.");

  let inserted = 0;
  try {
    inserted = addItems(inventory, typeId, quantity);
    if (inserted !== quantity) throw new Error("Your inventory could not accept all the items.");
    setBalance(player, balance - cost);
    market[typeId] = score + quantity * CONFIG.scoreChangePerItem;
    setMarket(market);
  } catch (error) {
    if (inserted > 0) {
      try { removeTradableItems(inventory, typeId, inserted); } catch {}
    }
    try { setBalance(player, balance); } catch {}
    throw error;
  }
  tell(player, "Bought " + quantity + " " + prettyName(typeId) + " for " + money(cost) +
    ". Balance: " + money(balance - cost) + ".");
}
function sell(player, rawItemId, rawQuantity) {
  const typeId = itemType(rawItemId);
  const quantity = parseQuantity(rawQuantity);
  const inventory = inventoryOf(player);
  if (countTradableItem(inventory, typeId) < quantity) {
    throw new Error("You don't have that many plain, undamaged " + prettyName(typeId) + " to sell.");
  }
  const market = getMarket();
  const score = getScore(market, typeId);
  const quote = totalSaleProceeds(score, quantity);
  const balance = getBalance(player);
  if (!safeInteger(balance + quote.net)) throw new Error("This sale would exceed the safe balance limit.");

  if (!removeTradableItems(inventory, typeId, quantity)) {
    throw new Error("Your inventory changed; the sale was cancelled.");
  }
  try {
    setBalance(player, balance + quote.net);
    market[typeId] = score - quantity * CONFIG.scoreChangePerItem;
    setMarket(market);
  } catch (error) {
    try { addItems(inventory, typeId, quantity); } catch {}
    try { setBalance(player, balance); } catch {}
    throw error;
  }
  tell(player, "Sold " + quantity + " " + prettyName(typeId) + ". Gross: " + money(quote.gross) +
    ", sales tax: " + money(quote.tax) + ", paid: " + money(quote.net) +
    ". Balance: " + money(balance + quote.net) + ".");
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
    if (typeof id !== "string" || id.indexOf("minecraft:") !== 0 || id === "minecraft:air" || seen.has(id)) continue;
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
    .sort(function (a, b) { return a.name.localeCompare(b.name); });
}
function showMainMenu(player) {
  const form = new ActionFormData()
    .title("Dynamic Economy")
    .body("Balance: " + money(getBalance(player)) +
      "\n\nOne shared market for the world. Buying raises an item's price; selling lowers it. Sales have a 10% tax.")
    .button("Buy Items")
    .button("Sell Items")
    .button("Market Prices")
    .button("My Balance")
    .button("Close");
  form.show(player).then(function (response) {
    if (response.canceled) return;
    if (response.selection === 0) showBuyMenu(player, "", 0);
    else if (response.selection === 1) showSellMenu(player, "", 0);
    else if (response.selection === 2) showMarketPrices(player, 0);
    else if (response.selection === 3) {
      tell(player, "Your balance is " + money(getBalance(player)) + ".");
      showMainMenu(player);
    }
  }).catch(function (error) {
    console.warn("[Dynamic Economy] Could not show main menu: " + error);
    tell(player, "The market menu could not open. Close other menus and try again.");
  });
}
function showSearchForm(player, mode, currentQuery) {
  const noun = mode === "buy" ? "items" : "your inventory";
  const form = new ModalFormData()
    .title("Search " + (mode === "buy" ? "Market" : "Inventory"))
    .textField("Search " + noun + " by name or item ID", "Example: oak log", { defaultValue: currentQuery })
    .submitButton("Search");
  form.show(player).then(function (response) {
    if (response.canceled || !response.formValues) {
      showMainMenu(player);
      return;
    }
    const query = String(response.formValues[0] || "").trim().toLowerCase();
    if (mode === "buy") showBuyMenu(player, query, 0);
    else showSellMenu(player, query, 0);
  }).catch(function () {
    tell(player, "The search form could not open. Try again.");
  });
}
function showBuyMenu(player, query, page) {
  const matches = getCatalog().filter(function (item) {
    return !query || item.id.toLowerCase().indexOf(query) >= 0 ||
      item.name.toLowerCase().indexOf(query) >= 0;
  });
  if (!matches.length) {
    tell(player, "No items matched that search. Try a shorter name or item ID.");
  }
  const maxPage = Math.max(0, Math.ceil(matches.length / CONFIG.pageSize) - 1);
  const safePage = Math.max(0, Math.min(page, maxPage));
  const form = new ActionFormData()
    .title("Buy Items")
    .body((query ? "Search: " + query + "\n" : "") +
      "Choose an item. Current prices are shown; the price rises with each unit bought.\n" +
      "Page " + (safePage + 1) + " of " + (maxPage + 1));
  const actions = [];
  const pageItems = matches.slice(safePage * CONFIG.pageSize, (safePage + 1) * CONFIG.pageSize);
  for (const item of pageItems) {
    form.button(item.name + "\n" + currentPriceLabel(item.id, "buy"));
    actions.push({ type: "item", id: item.id });
  }
  if (safePage > 0) {
    form.button("Previous Page");
    actions.push({ type: "previous" });
  }
  if (safePage < maxPage) {
    form.button("Next Page");
    actions.push({ type: "next" });
  }
  form.button("Search Items");
  actions.push({ type: "search" });
  if (query) {
    form.button("Clear Search");
    actions.push({ type: "clear" });
  }
  form.button("Back to Market");
  actions.push({ type: "back" });

  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    const action = actions[response.selection];
    if (!action) return;
    if (action.type === "item") showQuantityForm(player, "buy", action.id, CONFIG.maximumTradeQuantity);
    else if (action.type === "previous") showBuyMenu(player, query, safePage - 1);
    else if (action.type === "next") showBuyMenu(player, query, safePage + 1);
    else if (action.type === "search") showSearchForm(player, "buy", query);
    else if (action.type === "clear") showBuyMenu(player, "", 0);
    else if (action.type === "back") showMainMenu(player);
  }).catch(function () {
    tell(player, "The buy menu could not open. Close other menus and try again.");
  });
}
function showSellMenu(player, query, page) {
  const matches = getSellableInventory(player).filter(function (item) {
    return !query || item.id.toLowerCase().indexOf(query) >= 0 ||
      item.name.toLowerCase().indexOf(query) >= 0;
  });
  if (!matches.length) {
    tell(player, query ? "No sellable items matched that search." : "You don't have any plain, undamaged items to sell.");
    if (query) showSearchForm(player, "sell", query);
    else showMainMenu(player);
    return;
  }
  const maxPage = Math.max(0, Math.ceil(matches.length / CONFIG.pageSize) - 1);
  const safePage = Math.max(0, Math.min(page, maxPage));
  const form = new ActionFormData()
    .title("Sell Items")
    .body((query ? "Search: " + query + "\n" : "") +
      "Only plain, undamaged items are listed, to protect renamed or enchanted gear.\n" +
      "Page " + (safePage + 1) + " of " + (maxPage + 1));
  const actions = [];
  const pageItems = matches.slice(safePage * CONFIG.pageSize, (safePage + 1) * CONFIG.pageSize);
  for (const item of pageItems) {
    form.button(item.name + " x" + item.count + "\n" + currentPriceLabel(item.id, "sell"));
    actions.push({ type: "item", id: item.id, count: item.count });
  }
  if (safePage > 0) {
    form.button("Previous Page");
    actions.push({ type: "previous" });
  }
  if (safePage < maxPage) {
    form.button("Next Page");
    actions.push({ type: "next" });
  }
  form.button("Search Inventory");
  actions.push({ type: "search" });
  if (query) {
    form.button("Clear Search");
    actions.push({ type: "clear" });
  }
  form.button("Back to Market");
  actions.push({ type: "back" });

  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    const action = actions[response.selection];
    if (!action) return;
    if (action.type === "item") {
      const currentCount = countTradableItem(inventoryOf(player), action.id);
      showQuantityForm(player, "sell", action.id, Math.min(CONFIG.maximumTradeQuantity, currentCount));
    } else if (action.type === "previous") showSellMenu(player, query, safePage - 1);
    else if (action.type === "next") showSellMenu(player, query, safePage + 1);
    else if (action.type === "search") showSearchForm(player, "sell", query);
    else if (action.type === "clear") showSellMenu(player, "", 0);
    else if (action.type === "back") showMainMenu(player);
  }).catch(function () {
    tell(player, "The sell menu could not open. Close other menus and try again.");
  });
}
function showQuantityForm(player, mode, typeId, maximum) {
  if (maximum < 1) {
    tell(player, "You don't have that item available to sell.");
    showSellMenu(player, "", 0);
    return;
  }
  const score = getScore(getMarket(), typeId);
  let priceNote;
  try {
    priceNote = mode === "buy"
      ? "Current unit price: " + money(unitPriceCents(score)) + ". The price rises per item bought."
      : "First unit's estimated payout after tax: " + money(totalSaleProceeds(score, 1).net) + ". The price falls as you sell.";
  } catch (error) {
    tell(player, error instanceof Error ? error.message : "This item can't be traded right now.");
    return;
  }
  const max = Math.min(CONFIG.maximumTradeQuantity, maximum);
  const form = new ModalFormData()
    .title((mode === "buy" ? "Buy " : "Sell ") + prettyName(typeId))
    .label(priceNote)
    .slider("Quantity", 1, max, { defaultValue: Math.min(max, 8), valueStep: 1 })
    .submitButton(mode === "buy" ? "Review Purchase" : "Review Sale");
  form.show(player).then(function (response) {
    if (response.canceled || !response.formValues) return;
    const quantity = parseQuantity(Math.round(Number(response.formValues[0])));
    showTradeConfirmation(player, mode, typeId, quantity, score);
  }).catch(function () {
    tell(player, "The quantity form could not open. Try again.");
  });
}
function showTradeConfirmation(player, mode, typeId, quantity, quotedScore) {
  const currentScore = getScore(getMarket(), typeId);
  if (currentScore !== quotedScore) {
    tell(player, "The market price changed while you were choosing. Please review the new quote.");
    const max = mode === "buy" ? CONFIG.maximumTradeQuantity :
      Math.min(CONFIG.maximumTradeQuantity, countTradableItem(inventoryOf(player), typeId));
    showQuantityForm(player, mode, typeId, max);
    return;
  }
  let body;
  try {
    if (mode === "buy") {
      const total = totalBuyCost(quotedScore, quantity);
      body = "Buy " + quantity + " " + prettyName(typeId) + "?\n\nTotal: " + money(total) +
        "\nBalance: " + money(getBalance(player)) + "\n\nThis purchase raises the global item's price.";
    } else {
      const quote = totalSaleProceeds(quotedScore, quantity);
      body = "Sell " + quantity + " " + prettyName(typeId) + "?\n\nGross: " + money(quote.gross) +
        "\nSales tax (10%): " + money(quote.tax) + "\nYou receive: " + money(quote.net) +
        "\n\nThis sale lowers the global item's price.";
    }
  } catch (error) {
    tell(player, error instanceof Error ? error.message : "Couldn't calculate that trade.");
    return;
  }
  const form = new MessageFormData()
    .title(mode === "buy" ? "Confirm Purchase" : "Confirm Sale")
    .body(body)
    .button1(mode === "buy" ? "Confirm Purchase" : "Confirm Sale")
    .button2("Change Quantity");
  form.show(player).then(function (response) {
    if (response.canceled) return;
    if (response.selection === 1) {
      const max = mode === "buy" ? CONFIG.maximumTradeQuantity :
        Math.min(CONFIG.maximumTradeQuantity, countTradableItem(inventoryOf(player), typeId));
      showQuantityForm(player, mode, typeId, max);
      return;
    }
    if (response.selection !== 0) return;
    if (getScore(getMarket(), typeId) !== quotedScore) {
      tell(player, "The price changed before confirmation, so no trade was made. Review the fresh quote.");
      const max = mode === "buy" ? CONFIG.maximumTradeQuantity :
        Math.min(CONFIG.maximumTradeQuantity, countTradableItem(inventoryOf(player), typeId));
      showQuantityForm(player, mode, typeId, max);
      return;
    }
    try {
      if (mode === "buy") buy(player, typeId, quantity);
      else sell(player, typeId, quantity);
      system.runTimeout(function () {
        try { showMainMenu(player); } catch {}
      }, 5);
    } catch (error) {
      tell(player, error instanceof Error ? error.message : "Trade failed safely.");
      system.runTimeout(function () {
        try { showMainMenu(player); } catch {}
      }, 5);
    }
  }).catch(function () {
    tell(player, "The confirmation form could not open. No trade was made.");
  });
}
function showMarketPrices(player, page) {
  const market = getMarket();
  const tracked = Object.entries(market)
    .filter(function (entry) { return Number.isSafeInteger(entry[1]); })
    .map(function (entry) { return { id: entry[0], name: prettyName(entry[0]), score: entry[1] }; })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });
  if (!tracked.length) {
    new MessageFormData()
      .title("Market Prices")
      .body("The shared market is fresh. All items start at $1.00 per item.\n\nUse Buy Items or Sell Items to start trading.")
      .button1("Back to Market")
      .button2("Close")
      .show(player)
      .then(function (response) { if (!response.canceled && response.selection === 0) showMainMenu(player); })
      .catch(function () {});
    return;
  }
  const maxPage = Math.max(0, Math.ceil(tracked.length / CONFIG.pageSize) - 1);
  const safePage = Math.max(0, Math.min(page, maxPage));
  const form = new ActionFormData()
    .title("Market Prices")
    .body("Tracked items: " + tracked.length + "\nPrices are shared by every player.\nPage " +
      (safePage + 1) + " of " + (maxPage + 1));
  const actions = [];
  for (const entry of tracked.slice(safePage * CONFIG.pageSize, (safePage + 1) * CONFIG.pageSize)) {
    form.button(entry.name + "\n" + currentPriceLabel(entry.id, "buy") + "  |  score " + entry.score);
    actions.push("item");
  }
  if (safePage > 0) {
    form.button("Previous Page");
    actions.push("previous");
  }
  if (safePage < maxPage) {
    form.button("Next Page");
    actions.push("next");
  }
  form.button("Back to Market");
  actions.push("back");
  form.show(player).then(function (response) {
    if (response.canceled || response.selection === undefined) return;
    const action = actions[response.selection];
    if (action === "previous") showMarketPrices(player, safePage - 1);
    else if (action === "next") showMarketPrices(player, safePage + 1);
    else if (action === "back") showMainMenu(player);
    else if (action === "item") showMarketPrices(player, safePage);
  }).catch(function () {});
}
function requestMenu(player) {
  const tick = system.currentTick;
  const lastTick = openCooldown.get(player.id);
  if (lastTick !== undefined && tick - lastTick < 8) return;
  openCooldown.set(player.id, tick);
  system.run(function () {
    try { showMainMenu(player); }
    catch (error) {
      console.warn("[Dynamic Economy] Market menu error: " + error);
      tell(player, "The market menu couldn't open. Try using the stick again.");
    }
  });
}

// Air-use listener, plus block/entity interaction listeners for touch and controller input.
world.afterEvents.itemUse.subscribe(function (event) {
  if (event.itemStack && event.itemStack.typeId === "minecraft:stick") requestMenu(event.source);
});
world.afterEvents.playerInteractWithBlock.subscribe(function (event) {
  if (event.isFirstEvent === false) return;
  const held = event.beforeItemStack || event.itemStack;
  if (held && held.typeId === "minecraft:stick") requestMenu(event.player);
});
world.afterEvents.playerInteractWithEntity.subscribe(function (event) {
  const held = event.beforeItemStack || event.itemStack;
  if (held && held.typeId === "minecraft:stick") requestMenu(event.player);
});

world.afterEvents.playerSpawn.subscribe(function (event) {
  if (!event.initialSpawn) return;
  const player = event.player;
  system.runTimeout(function () {
    tell(player, "Dynamic Economy loaded. Hold a wooden stick and use/right-click to open the market.");
    tell(player, "Starting balance: " + money(getBalance(player)) + ". All item prices start at $1.00.");
  }, 20);
});
world.afterEvents.worldLoad.subscribe(function () {
  if (world.getDynamicProperty(MARKET_KEY) === undefined) setMarket({});
  console.warn("[Dynamic Economy] Form-based market initialized.");
});
