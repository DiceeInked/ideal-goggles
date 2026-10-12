# Dynamic Economy for Minecraft Bedrock

## Version 0.3.9: back navigation and Sell Barrel

Every ActionForm menu page except the first/main menu has a bottom **Back** button labelled exactly **Back**, and it returns to the previous menu context. Bedrock search and quantity slider forms only permit a single built-in submit button, so cancelling those input forms returns to their parent menu.

Buy items sort from highest price to lowest, then alphabetically for ties. Sell items sort by quantity owned, highest to lowest, then alphabetically. Buy sliders start at 1; sell sliders start at their maximum up to 64. **Sell All** sells the full quantity of a matching plain item in your inventory, even above 64. Only the quantity slider is capped at 64.

### Sell Barrel
Craft it using the normal barrel layout with a stick in the center slot: 6 planks at the corners and left/right middle, wooden slabs at top-middle and bottom-middle, and a stick in the exact center. Place it and put items inside. Closing it sells all item stacks the Script API can resolve, including renamed, enchanted, damaged, and custom-property stacks, at the current market price with 10% sales tax. If the API cannot resolve a custom item type, that stack remains inside with a warning.

The Sell Barrel requires both packs. Its block definition uses the current Bedrock block format 1.26.40 and the block-entity container component. The **Upcoming Creator Features** experiment must be enabled in the world settings for this custom block inventory. This is an experimental Bedrock feature, not an optional optimization. The combined `.mcaddon` bundles the behavior and resource packs:
https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_SellBarrel_Bedrock_0.3.9.mcaddon

Behavior pack: https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_Bedrock_0.3.9.mcpack
Resource pack: https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/resource-pack/releases/SellBarrel_Resources_1.0.0.mcpack

After importing, enable Dynamic Economy under Behavior Packs and Sell Barrel Resources under Resource Packs. Back up the world before replacing packs.

### Existing world data
This version preserves the current economy header UUID, script module UUID, market property key, and per-player balance keys. Replacing the pack in the same world should preserve existing market data and balances. Do not delete the world or switch to a pack with a different UUID.

### Testing
The pack targets the current stable Creator API modules `@minecraft/server` 2.9.0 and `@minecraft/server-ui` 2.1.0. GitHub Actions validates JSON, checks JavaScript syntax, checks key cross-file identifiers and dependencies, and packages releases. Minecraft itself is not available for runtime testing here, so custom block inventory, close-event timing, texture mapping, and persistence still need in-game verification.
