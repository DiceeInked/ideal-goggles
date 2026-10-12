# Dynamic Economy: Cross-Edition Design Specification

**Specification version:** 1.0  
**Current Bedrock implementation:** Dynamic Economy v0.3.16  
**Source branch:** `feature/bedrock-dynamic-economy`  
**Purpose:** This is the canonical description of what the mod does and how its rules should be recreated in another edition, such as Minecraft Java Edition. Update this file whenever behavior, balance rules, data formats, or player-facing features change.

Implementation source lives in `mods/dynamic-economy/bedrock/`. This document describes the intended game rules separately from Bedrock-specific APIs so another implementation does not have to copy the same code.

## 1. Core idea and design rules

The mod is a shared, world-wide item market with a separate cash balance for each player. Every player affects the same global item prices by buying and selling. Prices respond to every item unit rather than treating a large stack as one market event.

The market deliberately does **not** automatically recover prices toward a default. If an item becomes expensive because players keep buying it, it stays expensive until later sales lower its score. If an item becomes cheap because players keep selling it, it stays cheap until later purchases raise its score. There is no mean reversion, scheduled reset, stock replenishment, or automatic price normalization.

Crafting, smelting, and other in-game conversions are allowed to create profitable strategies. For example, a player may buy materials, craft a more valuable product, and sell the product. This is not automatically considered an exploit; the market prices the item actually bought or sold, not the crafting recipe that produced it.

## 2. Currency and account rules

- Currency is displayed as dollars with two decimal places, such as `$12.34`.
- Internally, money is stored as integer cents to avoid floating-point balance drift.
- A player's starting balance is **$100.00**, assigned the first time the mod initializes a balance for that player.
- Player balances are separate. One player's purchase does not directly subtract money from another player's account.
- Market item scores and prices are shared across the world.
- A sale has a **50% sales tax**. Buying has no sales tax.
- Fractional tax cents are carried forward globally so that repeatedly splitting a sale into small transactions does not avoid the tax that a bulk sale would charge. This shared remainder means the rounded tax for one transaction may be affected by previous sales.

## 3. Price formula and trade order

Each item has its own integer market score, initially (s=0). All untraded items therefore start at **$1.00 per item**.

Price in cents at score (s):

```text
priceCents(s) = max(1, round(100 × 1.01^s))
```

The minimum unit price is one cent. The current implementation rejects unsafe calculations rather than allowing a price or balance to overflow JavaScript's safe-integer range.

### Buying

For a purchase of (q) units at starting score (s):

- Charge the sum of `priceCents(s + i)` for `i = 0` through `q - 1`.
- After the purchase succeeds, set the score to `s + q`.
- The price rises once per unit purchased.

### Selling

For a sale of (q) units at starting score (s):

- Gross proceeds are the sum of `priceCents(s - i)` for `i = 1` through `q`.
- Apply the global 50% sales tax to the total gross proceeds, carrying the fractional-cent remainder forward.
- Credit the player with gross proceeds minus tax.
- After the sale succeeds, set the score to `s - q`.
- The price falls once per unit sold.

For both directions, the UI must calculate and show the total before asking the player to confirm. If another player changes the same item's score while a quote is open, the old quote must not be accepted. Sell confirmations must also refresh if the shared tax-rounding remainder changed.

The price curve, growth multiplier (1.01), score change per unit (1), one-cent floor, and persistent high/low prices are intentional rules. Do not change them as a side effect of UI work.

## 4. Item eligibility and catalog

The market catalog is created from item types registered by the game. The current Bedrock implementation:
- Offers vanilla `minecraft:` items that can be created by the Script API.
- Excludes air, spawn eggs, non-vanilla namespaces, and a denylist of known creative-only, internal, or Education-only items such as bedrock, barriers, command blocks, structure blocks, mob spawners, chemistry items, and elements.
- Uses an explicit denylist because Bedrock Script API does not expose a universal, reliable "obtainable in Survival" flag. The list may need updates when Minecraft adds items.
- Supports searching by readable name or item identifier.
- Supports a browse-by-color filter for selected color families such as wool, carpets, beds, banners, terracotta, concrete, glass, candles, shulker boxes, and dyes.

If an item type cannot be created or priced safely, it is omitted from the purchase catalog. Normal inventory selling excludes renamed, enchanted, damaged, lore-bearing, dynamic-property-bearing, or Adventure-restricted stacks to avoid destroying special item data. Sell Barrel processing is more permissive, but if the Script API cannot resolve an item type, the item remains in the barrel with a warning.

## 5. Player market menu (current Bedrock behavior)

The normal market menu is opened by using a wooden stick or any vanilla wooden, stone, iron, golden, diamond, or netherite sword. The main menu currently contains:
- **Buy Items**
- **Sell Items**
- **Market Prices**
- **My Balance**
- **Close**

Buy items are sorted by current buy price, highest first, then alphabetically. Sell items are sorted by quantity owned, highest first, then alphabetically. Trade quantities use a maximum of 64 in the quantity slider, but **Sell All** sells every eligible unit of the chosen item in the player's inventory, even when the total exceeds 64. Buy and sell confirmations show total cost or gross/tax/net amounts before the player confirms. Each submenu has a Back path to the previous context.

The current **Market Prices** page lists items whose scores have been tracked by trades. It is not yet a full catalog of every item at its default price.

### Planned UI redesign (not implemented in v0.3.16)

The redesigned menu is intended to have separate top-level sections:
1. **Buy** — normal purchases.
2. **Sell** — normal sales.
3. **Economy** — select an item and view its price history as a stock-market-style line graph.
4. **Oversaturated** — a discoverability list of items considered oversaturated/cheap.

The graph should plot a point after **each individual item unit** is bought or sold, including the score and price after that unit's market change. A bulk trade of 32 units therefore creates 32 ordered unit-price points, not one point for the bulk transaction. Players should be able to inspect different items' price histories from the start of the tracked timeline.

The Oversaturated section is a browsing aid only. It must not directly change a price, prevent a trade, or alter the market formula. Choosing an item through this section should allow the player to buy it; the section itself does not offer a sell action. The ordinary Sell section still controls normal selling.

**Still to decide:** the precise oversaturation threshold/rule and whether the graph should present in-game time, transaction index, or both on its horizontal axis. The backend history currently saves world ticks and transaction IDs, providing data for either presentation.

## 6. Sell Barrel

The Sell Barrel is a custom placeable block with a 27-slot inventory. Its crafting recipe follows the normal barrel layout, except the exact center slot contains a stick: planks occupy the six corner and left/right-middle positions, slabs occupy the top-middle and bottom-middle positions, and the stick occupies the center.

When a player closes a Sell Barrel, the mod attempts to sell all resolvable contents in groups by item type. Each group uses the current market score, applies sales tax, updates the shared item score per unit, and credits the player associated with that close event. Items that cannot be resolved are left in the barrel and reported to the player. Both the behavior pack and Sell Barrel resource pack are required.

### Personalized crafting name

When the Script API's `playerCraftRecipe` event reports a crafted Sell Barrel, the script attempts to set the crafted item's custom name to:

```text
<player username>'s Sell Barrel
```

This event is currently marked pre-release in the official Script API documentation, so the item-name behavior must be verified in the target Bedrock version. A personalized crafted item name is not, by itself, an ownership or access-control system. **The current implementation still credits the player who closes the barrel**, and does not yet prevent other players from opening it or redirecting its proceeds.

**Still to decide:** whether Sell Barrels should be protected personal machines, public machines that pay their owner, or public machines that pay the player who closes them. If ownership is added, placement, breaking, moving, explosion/piston behavior, and permission to open the inventory should be defined together.

## 7. Operator tool and permissions

A **Blaze Rod** is the operator-only tool. The script checks the player's Bedrock `PlayerPermissionLevel.Operator` permission; merely holding the rod is not sufficient. Non-operators are told that the tool is reserved for operators and do not receive the operator menu.

The current operator menu provides:
- **Recent Trade Records** — browse saved trades and inspect the details of a transaction.
- **Current Economy Rules** — view the current starting balance, tax rate, growth multiplier, score change, price floor, and quantity limit.
- A route back to the regular market.

The rules page is informational in v0.3.16. The list of settings that operators may edit has not yet been finalized, so this version intentionally does not offer buttons that silently change economy values.

## 8. Persistent transaction history and price-series data

History storage is world-level dynamic data, shared by all players. Each successful buy/sell trade is written as a transaction summary with an increasing transaction ID. Its record includes:
- Action (buy or sell) and source (normal market or Sell Barrel).
- Player name and stable player ID.
- Item ID and quantity.
- Market score before and after the transaction.
- Gross amount, tax amount, net amount, and the player's post-trade balance.
- Current world tick.

For price graphs, the code stores one price point per traded unit in series chunks of up to 32 points. Each point contains its unit index in the transaction, score after that unit, resulting unit price in cents when safely calculable, and world tick. This avoids storing one huge world property for a long transaction while preserving the order of each unit-level price change.

The transaction summary is written after its series chunks. Future readers should ignore series chunks whose transaction summary does not exist, because those chunks can remain if a history write fails partway through. A history write failure must not reverse a trade that has already completed; it must log a warning and notify the player/operator.

History is currently retained indefinitely and there is no pruning or export tool. Since one point is recorded for every traded unit, history size grows with activity; any future retention or export strategy must preserve the promised graph timeline or make the trade-off explicit.

**Migration note:** v0.3.16 begins recording detailed transactions and price points. For an existing world, previously persisted item scores and balances are preserved, but older individual trades cannot be reconstructed because the earlier versions did not record them. The graph timeline for an upgraded world therefore begins when detailed tracking is first enabled, while a brand-new world will have a complete timeline from its first recorded trade.

## 9. Persistent data and safe updates

The current Bedrock pack uses the namespace `diceyinked:economy`. Important data families include:
- Per-player balances: `diceyinked:economy:balance:<player-id>`.
- Per-item market score: `diceyinked:economy:score:<item-id>`.
- Shared tax rounding remainder: `diceyinked:economy:sales_tax_remainder`.
- Next transaction ID: `diceyinked:economy:history:next_tx`.
- Transaction summaries: `diceyinked:economy:history:tx:<transaction-id>`.
- Unit price-series chunks: `diceyinked:economy:history:series:<transaction-id>:<chunk-index>`.

The old single-JSON market property is migrated to per-item score properties on world load. A migration only removes the legacy value after the new scores have been written and verified. The behavior-pack header UUID, script-module UUID, balance-key format, score-key format, and price rules must remain stable across compatible updates. Always test upgrades against a copy of a world with existing balances and market scores.

Trading must be server-authoritative. Check funds, inventory space, quantity, and current score before changing anything. On successful purchase, grant the complete quantity, deduct funds, and raise the global score. On sale, remove the exact eligible items, credit net proceeds, lower the score, and persist the tax remainder. If a core write fails, restore the previous items, balance, score, and tax remainder as far as the APIs allow. Do not allow a stale UI quote to trade at an old price.

## 10. Java Edition porting notes

A Java port should recreate the **rules and persistence contract**, not attempt to reuse Bedrock JavaScript or Bedrock UI forms directly.

Recommended edition-independent model:
- `EconomyState`: global item scores, tax remainder, next transaction ID, transaction summaries, and per-unit price series.
- `PlayerAccount`: balance keyed by a stable player UUID.
- `MarketService`: shared formula and atomic buy/sell methods; independent from menu code.
- `SellBarrelService`: custom block/container logic, sales on the defined interaction event, and the ownership policy once finalized.
- `OperatorService`: permission-gated records and configuration.
- `HistoryService`: one transaction summary plus unit-level price points, which feeds the Economy graph.
- `CatalogService`: survival-eligibility rules appropriate to the target edition; do not blindly copy Bedrock's internal-item denylist to Java.

For Java, use the target platform's stable server-side APIs and native item/block/menu capabilities. Store player accounts against UUIDs, store world-wide market state and history in persistent server data, and keep the exact price and tax rules covered by shared test cases. Do not use client-only state to authorize trades or operator actions.

## 11. Decisions and change log

### v0.3.16
- Added saved transaction summaries and unit-level price-series history as the backend for the future Economy graph.
- Added operator-only Blaze Rod menu, recent trade records, and an informational current-rules page.
- Added a crafting-event hook to name a newly crafted Sell Barrel `<username>'s Sell Barrel`.
- Updated the Script API dependency to `@minecraft/server` 2.10.0 for the craft recipe event and permission-level API.
- Did not redesign the regular market UI. Economy graph and Oversaturated browsing remain planned UI work.
- Did not change the market formula, sales tax, price persistence, or starting balance.

### v0.3.15
- Added survival-item restrictions, 50% sales tax, and stick/sword access to the regular market menu.
- Kept existing player-balance and market-score persistence compatible; added safe migration from the old single-JSON market property.
- Added dedicated Sell Barrel behavior/resource pack details and safety checks.

### Rules for future edits
For every behavior change, update the corresponding section above and append a dated or versioned note to this change log. Mark features as implemented, planned, or awaiting a decision. Keep edition-independent rules separate from Bedrock API notes so this specification can serve as the blueprint for a Java Edition recreation.
