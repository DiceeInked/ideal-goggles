# Recovery Compass for Minecraft Bedrock

## Version 1.0.0

This separate behavior pack gives a player one recovery compass each time they respawn after dying. It does not give one on the player's first join.

The compass is enchanted with **Curse of Vanishing** when the installed Bedrock Script API allows that enchantment on a recovery compass. If that enchantment cannot be applied on a particular game build, the script still grants a regular recovery compass and displays a warning instead of silently pretending the curse worked.

If the player's inventory is full, the compass is dropped at their feet. A successful automated build checks the manifest, JavaScript syntax, and generated `.mcpack`; the behavior still needs to be tested in-game on your Minecraft version.

## Install on iPhone/iPad

Import the `.mcpack` using the direct link below. If the file opens in a preview, use Share and choose Minecraft.

https://raw.githubusercontent.com/DiceeInked/ideal-goggles/feature/bedrock-dynamic-economy/mods/recovery-compass/bedrock/releases/RecoveryCompass_Bedrock_1.0.0.mcpack

## Source

- Manifest: `manifest.json`
- Script: `scripts/main.js`
