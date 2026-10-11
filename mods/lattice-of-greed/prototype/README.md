# Lattice of Greed: Bedrock Prototype

This is an early prototype focused on the dream/daymare sequence, not the full add-on.

## Implemented

- A separate void-based custom dimension, so dream terrain does not overwrite the player's Overworld.
- A generated, damaged landscape with a geometric Tesseract-like frame and a dark shaft at its center.
- Clue signs, including “Does the terrain look a bit flat to you?”
- Open-ended daymares: clues do not force an exit. Jump into the center shaft to return.
- Nightmares that begin at nightfall and return the player after about one minute.
- Empty inventory and mostly hidden HUD while dreaming, while retaining touch controls for mobile movement. Inventory, equipment, location, rotation, and prior HUD settings are restored on return.
- A basic world-memory system: breaking blocks increases extraction; planting flowers, saplings, leaves, moss, or vines increases restoration. These influence how damaged or restored the dream landscape appears next time.
- A temporary trigger: mining 64 obsidian or crying obsidian blocks in the Overworld starts a daymare. This stands in for the future Tesseract block.

## Install and test

1. Import Lattice-of-Greed-Prototype.mcpack into Minecraft Bedrock.
2. Create a new test world and activate the behavior pack.
3. Enable the Beta APIs experiment for that world. Custom dimensions currently require experimental scripting APIs.
4. Turn on cheats for testing.
5. Run /scriptevent lattice:daymare to start a daymare, or /scriptevent lattice:nightmare to test a timed nightmare.
6. Explore the landscape and signs. To return from a daymare, jump into the open shaft at the center of the Tesseract.

## Prototype notes

- This uses the experimental @minecraft/server beta API for custom dimensions, so compatibility may change between Bedrock releases.
- Test in a new world first. Do not apply it to a world you care about without a backup.
- The full bedrock lattice, biome generation, city, tree biome, Biome Barrels, Temi village, serpent, and ending are not implemented yet.
- The latest daymare design is open-ended: players can stay after finding clues and choose to leave by entering the Tesseract. Nightmares remain time-limited.
- Normal exits restore the original item stacks. If the game closes during a dream, a persistent emergency backup attempts to restore basic items, but custom item data or enchantments may not all survive that fallback.
- The source still needs an in-game compatibility test, especially around custom-dimension registration, sign text, and script API changes.
