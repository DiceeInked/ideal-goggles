# Dynamic Economy for Minecraft Bedrock

## Version 0.3.0: form-based market

This release replaces the chat-command prototype with actual in-game forms. Hold a regular wooden stick and use/right-click to open the market. On touch devices, use the interact/use control while holding the stick.

The menu contains **Buy Items**, **Sell Items**, **Market Prices**, and **My Balance**. Buy and sell screens use searchable, paginated item lists. Each trade opens a quantity slider, shows a price quote, then asks for confirmation. The shared world market price rises with purchases and falls with sales. Sales have a 10% tax.

New players start with **$100.00**. That starter amount is used only if the player has no saved economy balance yet; existing saved balances are preserved.

To protect customized gear, the sell menu lists only plain items with no custom name, lore, enchantments, or durability damage. The menu will not intentionally sell named or enchanted items.

## Install on iPhone/iPad

Import the `.mcpack` using the direct link below. If the file opens in a preview, use Share and choose Minecraft.

https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_Bedrock_0.3.0.mcpack

## Source and testing note

The editable source is `scripts/main.js`. GitHub Actions checks the JavaScript syntax, validates the manifest, and packages a versioned `.mcpack`. The package still needs an actual in-game test in the target Bedrock version; a successful archive/syntax check is not proof that every interaction event fires identically on every device.
