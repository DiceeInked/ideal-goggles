# Lattice of Greed: Biome Islands & Rooms 1.3.0

This release deliberately returns to the **simple 1.1-style generation engine** and adds the old resource-islet idea, a full biome-themed island catalogue, underground rooms, and broader survival loot. It does not bring back the old towers, Tesseract, dreams, serpent, or other large side systems.

## The islands

- **Starter oak island:** the original 3×3 dirt-and-grass platform and oak tree remain at the origin.
- **Starter resource islets:** restored from the older design. Each is a tiny 3×3×3 dirt island with grass on top and a single resource block in its middle layer. They're very likely near the tree and become rarer farther away.
- **Biome clusters:** each generated 16×16 region outside the starter region gets one main island and eight smaller surrounding islets. The main island carries several themed resources; its satellites have fewer.
- **Biome catalogue:** 56 themed profiles cover the surface Overworld families plus lush caves, dripstone caves, deep dark, and sulfur-cave themes. This includes ocean depths, cold regions, forests, deserts, jungles, badlands, mountains, rivers, mushroom fields, the Pale Garden, and a Dappled Forest-inspired palette.

These are **miniature themed regions inside the custom lattice dimension**, not actual vanilla biome generation. Dappled Forest and Sulfur Caves use established blocks for their themed islands rather than depending on experimental block IDs. The catalogue is assigned in a repeatable cycle across coordinates so it does not rely on random luck to include a biome family.

## Structure rooms below the lattice

Each new region also has a small walk-in room around Y=-12. A block-step path connects its main island to the room. Rooms have a chest, crafting table, and furnace, with walls, floor, and accents styled after one of 21 structure types:

- Village cellar and abandoned mineshaft
- Stronghold chamber and dungeon room
- Trial chamber and ancient city
- Desert temple and jungle temple
- Ocean monument, ocean ruins, and shipwreck hold
- Buried treasure and ruined portal
- Igloo basement and witch hut
- Woodland mansion and pillager outpost
- Trail ruins, amethyst geode, fossil chamber, and abandoned camp

These are compact, manually built **lattice-room versions**, not full copies of the original structures or their mob encounters. The structure themes cycle across coordinates, so exploring reveals different room types.

## Survival resources and loot

Island resources and chest loot are meant to make a much larger share of survival materials obtainable without relying on ordinary Overworld terrain or natural mob spawning. The pools include wood and sapling types, crops, food, stone variants, sand and terracotta, ores and raw metals, ocean and cave materials, many animal and mob drops, armor-trim templates, pottery sherds, and loot associated with ancient cities, trial chambers, geodes, shipwrecks, and other structures.

The starter room includes a wooden pickaxe, bread, a torch, and an oak log among its starting supplies. Its crafting table and furnace are usable, helping players begin a normal crafting progression.

The item lists are broad rather than literally exhaustive. Some obscure, experimental, or newer-version item IDs may be rejected by an older game build and skipped by the chest filler. The core build and common resource routes still need a real-world survival test to confirm balance and availability.

## Generation and persistence

The script builds the region you are in first, then scans outward in expanding square rings. The configured radius is **4 chunks in each direction**, up to a 9×9 region square. Bedrock's Script API does not expose each player's exact render-distance setting, so this is an approximation.

Each region saves a world marker after its structures and chest finish generating. Leaving and returning will rebuild the lattice but will not intentionally respawn a mined island cluster or refill its chest. The `/function lattice_recheck` command also preserves already-generated structure loot.

## Install and test

1. **Back up any existing world first.** The new rooms and islands occupy space inside the lattice and may replace blocks in regions that have not yet been marked by this version.
2. For the cleanest start, create a new world.
3. Deactivate older Lattice of Greed behavior packs for that world.
4. Import `Lattice-of-Greed-Full-1.3.0.mcpack`.
5. Activate the behavior pack and enter the world.
6. Let nearby regions generate for a little while before sprinting into unexplored space.

## Diagnostics

- `/function function_check` confirms Minecraft loaded the function file.
- `/function lattice_status` reports the current region, its biome/structure theme, queue count, and scan radius.
- `/function lattice_recheck` rebuilds lattice blocks in the current region and queues the nearby region ring again. It does not intentionally regenerate already-marked islands or room loot.

The automated workflow checks the JavaScript syntax, required biome/structure catalogues, and importable package contents. **It cannot simulate Minecraft's live Script API or physics.** I have not yet tested this release inside a live Bedrock world, so the first in-game check should focus on spawn safety, the stairs into the rooms, chest access, and whether every block remains in place after a few minutes.
