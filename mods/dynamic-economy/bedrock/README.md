# Dynamic Economy for Minecraft Bedrock

## Version 0.3.20: modern market navigation and price history

A shared market for Minecraft Bedrock. Every item starts at $1.00. Buying raises its global price once per unit; selling lowers it once per unit. Prices do not automatically drift back toward their starting value. Sales have 50% tax, and each player has an individual balance starting at $100.00.

This update keeps BUY, SELL, and ECONOMY inside one workspace, with a section selector, live item search, paginated item lists, recent trade-history pages, and per-item price-trend graphs built only from saved trades.

**Canonical design and Java-port specification:** [`mods/dynamic-economy/DESIGN_SPEC.md`](../DESIGN_SPEC.md). Update that file whenever the mod's rules or behavior change.

### Market access

Hold and use a wooden stick or any vanilla wooden, stone, iron, golden, diamond, or netherite sword to open the market. The market opens on a single workspace. Use the MARKET SECTION selector to switch between BUY, SELL, and ECONOMY without leaving the workspace. Each section keeps its own search field immediately above a paginated item list, and typing filters that list live. Selecting a BUY item opens quantity selection and purchase confirmation; selecting a SELL item opens quantity selection and sale confirmation; selecting an ECONOMY item opens its saved price-history graph. Returning from an action restores the same section, search, and page.

This release targets the manifest-version ceiling accepted by Bedrock 1.26.52 and uses stable `@minecraft/server-ui` 2.1.0. The true horizontal `multiButtonRow` method is only available in a newer preview API, so this compatible build uses a single-screen section selector instead. The workspace still keeps browsing, searching, and pagination on one screen, without a Back button between BUY, SELL, and ECONOMY. Keep **Upcoming Creator Features** enabled for the existing Sell Barrel mining behavior when required by your game build. The item lists use vanilla item names/icons and do not replace vanilla item textures.

### Texture approach

The pack keeps Minecraft's built-in look wherever possible. Item listings use vanilla item identifiers/icons; there is no large AI-generated texture set. The only dedicated art is the Sell Barrel's three 16×16 faces, adapted from the vanilla barrel texture so the custom block fits Minecraft's pixel-art style while remaining distinct.

### Sell Barrel ownership

Each crafted Sell Barrel is named **`<username>'s Sell Barrel`** and stores the crafter's owner ID on its unstackable item. When placed, that owner identity is saved against the block's location. The owner follows the item if the barrel is broken and picked up, and **all proceeds go to the saved owner**, not to whoever opens or closes the container. Any player can use the barrel; opening it does not transfer ownership.

A barrel from an older version with no saved owner will not sell its contents to whoever opens it. Ask an operator to break and replace it with an owner-tagged barrel; a newly placed untagged/command-created barrel is assigned to the player who places it. This avoids letting a passerby claim someone else's old barrel.

### Hopper support and auto-selling

The Sell Barrel has a 27-slot inventory and a script tick every 20 game ticks. While no player has the container open, the script checks its contents and sells resolvable item stacks to the owner. If more than 64 items of one type are present, it processes that type in multiple transactions of at most 64 items each, so a full barrel does not become stuck at the market's per-transaction limit. That supports hoppers feeding items into the barrel without requiring the owner to be online. If a player opens the container, automated processing pauses until the container closes, then resumes. This lets players deposit items by hand without having items disappear while the menu is open.

The behavior pack uses a registered custom block component for owner recording, ticking, and owner-tagged item drops. Sell Barrels are unstackable because their owner identity is stored on each item. Both the behavior pack and Sell Barrel resource pack are required.

### Operator tools and records

Hold and use a **Blaze Rod** to open operator tools. The script checks the Bedrock player permission level; only players with Operator permission can open it. The menu provides recent transaction records and a view of the current economy rules. The rules screen is informational for now; which settings operators should be allowed to change has not been finalized.

Successful market trades and automated Sell Barrel sales create persistent transaction summaries and price-series data. A summary records the owner/player, item, quantity, source, market score before/after, gross, tax, net, balance afterward, and world tick. The corresponding price history records one point for each unit traded, stored in chunks of up to 32 points. This is the data foundation for the future stock-market-style Economy graph.

Detailed history begins when v0.3.16 or later is installed. Old balances and item scores are preserved, but earlier individual trades cannot be reconstructed. History is retained indefinitely, so its size increases with trading activity.

### Price and item rules

- Price in cents at market score `s`: `max(1, round(100 × 1.01^s))`.
- A successful purchase of `q` items raises the score by `q`; a sale lowers it by `q`.
- Buy costs use the price for each unit before that unit's score increase; sale proceeds use the post-sale score for each sold unit.
- Fractional sales-tax cents are carried forward globally.
- The market offers vanilla item types and rejects spawn eggs, non-vanilla namespaces, and known creative-only/internal/Education items. Bedrock does not expose one universal Survival-obtainability flag, so the denylist may need maintenance.
- Normal inventory sales exclude renamed, enchanted, damaged, lore-bearing, dynamic-property-bearing, or Adventure-restricted stacks. The Sell Barrel can sell customized stacks if the Script API resolves their type.
- Market scores and player balances persist in the same world. The v0.3.15 migration from the older global JSON market property is retained.

### Combined download

Combined installer (contains both importable `.mcpack` files):
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/dynamic-economy-modern-market-ui/mods/dynamic-economy/bedrock/releases/DynamicEconomy_SellBarrel_Bedrock_0.3.20.mcaddon

Behavior pack:
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/dynamic-economy-modern-market-ui/mods/dynamic-economy/bedrock/releases/DynamicEconomy_Bedrock_0.3.20.mcpack

Resource pack:
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/dynamic-economy-modern-market-ui/mods/dynamic-economy/resource-pack/releases/SellBarrel_Resources_1.0.3.mcpack

The latest download links only work after the automated build passes and commits the release archives. Enable Dynamic Economy under Behavior Packs and Sell Barrel Resources under Resource Packs. Keep Upcoming Creator Features enabled for the existing item-specific Sell Barrel mining behavior. The current Microsoft Script API docs mark the crafting-recipe event and custom block-break callback as pre-release, so enable the Beta APIs experiment too when available for your game version. The script handles an unavailable crafting listener without crashing, but in that case a newly crafted barrel may fall back to the player who places it as the owner instead of the original crafter. Test crafting, placing, breaking, re-placing, and hopper payouts in a copied world before using this on a world you care about.

### Build and test status

GitHub Actions validates manifests and JSON files, checks JavaScript syntax, runs the market math and regression tests, verifies the pack links/recipe/texture assets, validates the owner/tick data and stale-open cleanup, packages the behavior and resource packs, and checks ZIP integrity. Minecraft itself is not available to this workflow for runtime testing. In particular, verify crafted-item owner metadata, ownership across breaking and re-placing, operator permission gating, offline owner payouts, hopper transfers, manual deposit behavior, and upgrades against a copied world in Bedrock before relying on this version.
