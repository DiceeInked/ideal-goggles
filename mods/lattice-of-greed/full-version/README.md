# Lattice of Greed: Biome Islands & Rooms 1.3.1

This release returns to the **simple 1.1-style generation engine** and restores the old tiny resource-islet design. It then adds a repeating catalogue of biome-themed island clusters, decorative landmarks, miniature structure rooms underneath the lattice, and much broader survival loot. It does not bring back the old towers, Tesseract, dreams, serpent, or other large side systems.

## The islands

- **Starter oak island:** the original 3×3 dirt-and-grass platform and oak tree remain at the origin.
- **Starter resource islets:** each is a tiny 3×3×3 dirt island with grass on top and one resource in its middle layer. They're extremely common near the tree and become rarer farther away.
- **Biome clusters:** each generated 16×16 region outside the starter region gets one main island and eight smaller surrounding islets. The main island carries several themed resources; its satellites have fewer.
- **Surface landmarks:** the biome islands are now decorated with tiny trees, flowers, cacti, snow, rock formations, mushrooms, prismarine, or cave-themed blocks where appropriate. Decorations are kept inside each 3×3 islet so the clusters still read as separate little islands.
- **Biome catalogue:** 56 themed profiles cover surface Overworld biome families plus lush caves, dripstone caves, deep dark, and sulfur-cave themes. This includes ocean depths, cold regions, forests, deserts, jungles, badlands, mountains, rivers, mushroom fields, the Pale Garden, and a Dappled Forest-inspired palette.

These are **miniature themed regions inside the custom lattice dimension**, not actual vanilla biome generation. Dappled Forest and Sulfur Caves use an established-block palette rather than relying on experimental block IDs. Biome selection is coordinate-based, and the nearby pattern is arranged so all 56 profiles appear in a 9×9 region neighbourhood.

## Structure rooms below the lattice

Every region also has a small walk-in room around Y=-12. A block-step path connects its main island to the room. Rooms have a chest, crafting table, and furnace, with walls, floor, and accents styled after 21 structure types:

- Village cellar and abandoned mineshaft
- Stronghold chamber and dungeon room
- Trial chamber and ancient city
- Desert temple and jungle temple
- Ocean monument, ocean ruins, and shipwreck hold
- Buried treasure and ruined portal
- Igloo basement and witch hut
- Woodland mansion and pillager outpost
- Trail ruins, amethyst geode, fossil chamber, and abandoned camp

These are compact, manually built **lattice-room versions**, not full copies of original structures and not full mob encounters. Each structure theme recurs as you explore. The rooms are intended as an attainable route to resources that would otherwise be extremely difficult to obtain in a void map.

## Survival resources and loot

The item pools cover a broad progression range: wood and sapling types, crops, food, stone variants, sand and terracotta, ores and raw metals, buckets, tools, boats, basic redstone components, dyes and wool colours, ocean and cave materials, many animal and mob drops, armor-trim templates, pottery sherds, and loot associated with strongholds, ancient cities, trial chambers, geodes, shipwrecks, and other structure families. Rare loot pools also include examples of harder-to-reach Nether, End, and structure rewards.

The starter room includes a wooden pickaxe, bread, a torch, and an oak log. Its crafting table and furnace give players a starting point for ordinary crafting progression. A bucket and other utility items can appear in the ongoing loot pool, supporting more recipes and survival routes.

The pools are **broad, not literally exhaustive**. Very obscure, experimental, or newer-version item IDs may be rejected by an older game build; the chest filler skips an item when Minecraft refuses it. The core resource routes still need a real survival playtest to check balance and availability.

## Generation and persistence

The script builds the region you are in first, then scans outward in expanding square rings. The configured radius is **4 chunks in each direction**, up to a 9×9 region square. Bedrock's Script API does not expose each player's exact render-distance setting, so this is an approximation.

Each region saves a world marker after its island cluster, room, and chest finish generating. Leaving and returning will rebuild the lattice but will not intentionally respawn a mined island cluster or refill its chest. The `/function lattice_recheck` command also preserves already-generated structure loot.

## Install and test

1. **Back up any existing world first.** The new rooms and islands occupy space inside the lattice and may replace blocks in regions that have not yet been marked by this version.
2. For the cleanest start, create a new world.
3. Deactivate older Lattice of Greed behavior packs for that world.
4. Import `Lattice-of-Greed-Full-1.3.1.mcpack`.
5. Activate the behavior pack and enter the world.
6. Let nearby regions generate for a little while before sprinting into unexplored space.

## Diagnostics

- `/function function_check` confirms Minecraft loaded the function file.
- `/function lattice_status` reports the current region, its biome/structure theme, queue count, and scan radius.
- `/function lattice_recheck` rebuilds lattice blocks in the current region and queues the nearby region ring again. It does not intentionally regenerate already-marked islands or room loot.

The automated workflow checks JavaScript syntax, catalogue counts and coverage, expected generation helpers, and importable package contents. **It cannot simulate Minecraft's live Script API or physics.** I have not yet tested this release inside a live Bedrock world, so check spawn safety, surface decorations, the stairs into the rooms, chest access, and block stability in-game.
