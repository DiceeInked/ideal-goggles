# Recovery Compass

**Minecraft Bedrock Edition · Version 1.0.0**

A behavior pack that gives a player one recovery compass each time they respawn after dying. It does not grant one on the player's first join.

## Download

[**Recovery Compass V1.0.0.mcpack**](releases/Recovery%20Compass%20V1.0.0.mcpack)

## Behavior

- Grants one recovery compass after each respawn following death.
- Applies **Curse of Vanishing** when the installed Bedrock Script API supports it for recovery compasses.
- If the enchantment is unavailable, grants a regular recovery compass and displays a warning.
- If the inventory is full, drops the compass at the player's feet.

The pack's manifest and JavaScript can be checked automatically, but the in-game behavior still needs testing on the Minecraft version you use.

## Install on iPhone or iPad

Open the download link above. If iOS shows a file preview, use **Share** and choose **Minecraft** to import the pack.

## Source files

- `manifest.json`: pack metadata and Script API dependency.
- `scripts/main.js`: respawn and compass-granting behavior.
- `releases/Recovery Compass V1.0.0.mcpack`: versioned import package.
