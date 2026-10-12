# Dynamic Economy for Minecraft Bedrock

## Version 0.3.4: menu navigation, color categories, and faster trading

Hold a regular wooden stick and use/right-click to open the market. On touch devices, use the interact/use control while holding the stick.

The market has **Buy Items**, **Sell Items**, **Market Prices**, and **My Balance**. Buy and sell lists are searchable and paginated. After a trade, the menu returns to the list or item-details page you were using rather than sending you all the way back to the market home screen.

The buy menu sorts live prices from highest to lowest. Items with the same current price are sorted alphabetically. Buy quantity sliders start at **1**. The sell flow offers **Choose Quantity** and **Sell All**; the sell quantity slider starts at the maximum you can sell, up to **64** items.

Buy and sell lists include a **Browse by Color** category for all 16 dye colors. Colored categories include matching wool, beds, carpet, banners, concrete and concrete powder, terracotta, stained glass, candles, shulker boxes, dye, and other supported matching colored item types.

The shared world market price rises with purchases and falls with sales. Sales have a 10% tax. New players start with **$100.00**; existing saved balances are preserved.

To protect customized gear, the sell menu lists only plain items with no custom name, lore, enchantments, or durability damage.

## Install on iPhone/iPad

Import the `.mcpack` using the direct link below. If the file opens in a preview, use Share and choose Minecraft.

https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/dynamic-economy/bedrock/releases/DynamicEconomy_Bedrock_0.3.4.mcpack

## Source and testing note

The editable source is `scripts/main.js`. GitHub Actions checks JavaScript syntax, validates the manifest, and packages a versioned `.mcpack`. The pack still needs an in-game test in Minecraft itself; a successful build is not proof that every form interaction works identically on every device.
