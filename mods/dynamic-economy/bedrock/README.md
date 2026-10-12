# Dynamic Economy for Minecraft Bedrock

## Version 0.3.14: Sell Barrel recipe-book and texture isolation fixes

Every ActionForm menu page except the first/main menu has a bottom **Back** button labelled exactly **Back**, and it returns to the previous menu context. Bedrock search and quantity slider forms only permit a single built-in submit button, so cancelling those input forms returns to their parent menu.

Every item's score is stored separately so the market no longer depends on one growing JSON dynamic property. Sales preserve the design rule of calculating each unit at the post-sale score. Fractional tax cents are carried forward globally, so splitting an identical score path across smaller sales does not erase tax through per-transaction rounding. Confirmation screens refresh if the item's score or the shared tax remainder changes while a player is deciding. Item stacks with dynamic properties or Adventure-mode place/destroy restrictions are excluded from ordinary plain-item selling, avoiding accidental loss of that metadata.

Buy items sort from highest price to lowest, then alphabetically for ties. Sell items sort by quantity owned, highest to lowest, then alphabetically. Buy sliders start at 1; sell sliders start at their maximum up to 64. **Sell All** sells the full quantity of a matching plain item in your inventory, even above 64. Only the quantity slider is capped at 64.

### Sell Barrel
Craft it using the normal barrel layout with a stick in the center slot: 6 planks at the corners and left/right middle, wooden slabs at top-middle and bottom-middle, and a stick in the exact center. Place it and put items inside. Closing it sells all item stacks the Script API can resolve, including renamed, enchanted, damaged, and custom-property stacks, at the current market price with 10% sales tax. If the API cannot resolve a custom item type, that stack remains inside with a warning.

The Sell Barrel requires both packs. It has an explicit placeable item definition linked to its block and a localized display name. The crafting catalog now uses format `1.26.50` for Minecraft Bedrock 26.52 and lists the barrel in the Items category; the recipe remains explicitly unlocked and keeps the original ingredient layout. The block uses format `1.26.40`, retains its 27-slot container, and uses the vanilla `wood` sound group. Both packs declare a minimum engine version of `1.26.50`. Mining hardness remains `2.5`, axes have a separate `0.5` mining value to make them more effective, and explosion resistance is `2.5`. The item-specific mining speed uses the `UpcomingFeatures` capability, so keep **Upcoming Creator Features** enabled in the world settings. The resource pack now includes the actual 16×16 vanilla barrel side, top, and bottom textures with every RGB color channel inverted while alpha is preserved. The combined `.mcaddon` bundles both packs:
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_SellBarrel_Bedrock_0.3.13.mcaddon

Behavior pack: https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_Bedrock_0.3.13.mcpack
Resource pack: https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/resource-pack/releases/SellBarrel_Resources_1.0.2.mcpack

After importing, enable Dynamic Economy under Behavior Packs and Sell Barrel Resources under Resource Packs. Back up the world before replacing packs.

### Existing world data
This version preserves the economy header UUID, script module UUID, and per-player balance keys. It migrates the prior single-JSON global market into separate per-item score properties during world load, then removes the legacy market key only after the scores have been written and verified. The migration keeps existing scores and balances; if any write fails, the old value is retained for a later retry. Replacing the pack in the same world should preserve market data and balances. Do not delete the world or switch to a pack with a different UUID.

### Testing
The pack targets the stable Creator API modules `@minecraft/server` 2.9.0 and `@minecraft/server-ui` 2.1.0. GitHub Actions validates JSON, checks JavaScript syntax, checks catalog/recipe/identifier consistency, validates the axe mining component and explosion resistance, decodes the texture sources, verifies PNG signatures and 16×16 dimensions, checks migration/tax-hardening code paths, and checks ZIP integrity. Minecraft itself is not available for runtime testing here, so the recipe-book listing, in-game mining speed, migration against a populated world, and long-term multiplayer behavior still need confirmation in Bedrock 26.52. Generated release archives are committed only after the source and ZIP checks pass.
