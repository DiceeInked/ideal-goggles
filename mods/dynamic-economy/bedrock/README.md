# Dynamic Economy for Minecraft Bedrock

## Version 0.3.16

A shared market for Minecraft Bedrock. Every item starts at $1.00. Buying raises its global price once per unit; selling lowers it once per unit. Prices do not automatically drift back toward their starting value. Sales have 50% tax, and each player has an individual balance starting at $100.00.

**Canonical design and Java-port specification:** [`mods/dynamic-economy/DESIGN_SPEC.md`](../DESIGN_SPEC.md). Update that file whenever the mod's rules or behavior change.

### Market access

Hold and use a wooden stick or any vanilla wooden, stone, iron, golden, diamond, or netherite sword to open the regular market menu. The existing menu supports buying, selling, item search, color browsing, quantity selection, confirmation, market-price inspection, and balance display. The cleaner UI with separate Buy, Sell, Economy, and Oversaturated sections is planned for a later redesign and is not included in v0.3.16.

### Operator tools and records

Hold and use a **Blaze Rod** to open operator tools. The script checks the Bedrock player permission level; only players with Operator permission can open it. The menu provides recent transaction records and a view of the current economy rules. The rules screen is informational for now; which settings operators should be allowed to change has not been finalized.

Successful market and Sell Barrel sales now create persistent transaction summaries and price-series data. A summary records the player, item, quantity, source, market score before/after, gross, tax, net, balance afterward, and world tick. The corresponding price history records one point for each unit traded, stored in chunks of up to 32 points. This is the data foundation for the future stock-market-style Economy graph.

Detailed history begins when v0.3.16 is installed. Old balances and item scores are preserved, but earlier individual trades cannot be reconstructed. History is retained indefinitely, so its size increases with trading activity.

### Sell Barrel

Craft a Sell Barrel using the normal barrel layout with a stick in the exact center: planks fill the six corner and left/right-middle positions, slabs go at top-middle and bottom-middle, and the stick goes in the center. Both the behavior pack and Sell Barrel resource pack are required.

The script attempts to personalize a newly crafted Sell Barrel to `<username>'s Sell Barrel` using Bedrock's `playerCraftRecipe` event. That event is currently marked pre-release in the official Script API documentation, so the personalized name needs in-game verification on the target Bedrock version.

Place the Sell Barrel and add items. When a player closes it, the mod attempts to sell its contents in item-type groups, applying the current global price and 50% sales tax. If an item type cannot be resolved, those items stay inside with a warning.

**Important current behavior:** the player who closes the barrel receives its payout. The personalized item name is not an ownership lock. Owner-based access and payouts remain undecided and are documented in the design specification.

### Price and item rules

- Price in cents at market score `s`: `max(1, round(100 × 1.01^s))`.
- A successful purchase of `q` items raises the score by `q`; a sale lowers it by `q`.
- Buy costs use the price for each unit before that unit's score increase; sale proceeds use the post-sale score for each sold unit.
- Fractional sales-tax cents are carried forward globally.
- The market offers vanilla item types and rejects spawn eggs, non-vanilla namespaces, and known creative-only/internal/Education items. Bedrock does not expose one universal Survival-obtainability flag, so the denylist may need maintenance.
- Normal inventory sales exclude renamed, enchanted, damaged, lore-bearing, dynamic-property-bearing, or Adventure-restricted stacks. The Sell Barrel can sell more customized stacks if the Script API resolves their type.
- Market scores and player balances persist in the same world. The v0.3.15 migration from the older global JSON market property is retained.

### Combined download

Combined behavior/resource pack:  
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_SellBarrel_Bedrock_0.3.16.mcaddon

Behavior pack:  
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_Bedrock_0.3.16.mcpack

Resource pack:  
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/resource-pack/releases/SellBarrel_Resources_1.0.3.mcpack

The latest download links only work after the automated build passes and commits the release archives. Enable Dynamic Economy under Behavior Packs and Sell Barrel Resources under Resource Packs. Keep Upcoming Creator Features enabled for the existing item-specific Sell Barrel mining behavior. Back up the world before replacing packs.

### Build and test status

GitHub Actions validates manifests and JSON files, checks JavaScript syntax, runs the market math and regression tests, verifies the pack links/recipe/texture assets, packages the behavior and resource packs, and checks ZIP integrity. Minecraft runtime behavior is not tested by that workflow. In particular, verify the craft event's custom-name behavior, operator permission gating, record persistence, Sell Barrel processing, and upgrades against a copied world in Bedrock before relying on this version.
