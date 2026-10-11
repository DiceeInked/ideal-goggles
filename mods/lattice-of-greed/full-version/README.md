# Lattice of Greed: Full Version 1.0.6

**An experimental behavior pack.** Version 1.0.5 fixed the Script API event listener, but automatic region checking was still coupled to the larger time-of-day and dream loop. Version 1.0.6 moves automatic generation into its own repeating loop. It also rebuilds city towers as lattice-aligned stone rooms with walkable openings, small corner water climbs, and a bedrock Tesseract wireframe made from two connected cubes with a stone center. Static checks still cannot prove in-game behavior, so test carefully.

## Install

1. Delete the old **Lattice of Greed: Prototype** behavior pack from Minecraft's storage / pack list if it is still imported.
2. Import `Lattice-of-Greed-Full-1.0.6.mcpack`.
3. For the cleanest test, create a **new world**. Versioned region markers also let you revisit an existing test world, but old structures are rebuilt gradually as you approach their chunks.
4. In world settings, activate **Lattice of Greed: Full Version** under Behavior Packs.
5. Enable **Beta APIs** under Experiments. Cheats are needed to run the test functions listed below; enabling them may disable achievements.
6. Create the world. The add-on moves players into its own custom void dimension; it does not replace normal Overworld terrain while the survival world is running.

The manifest uses newly generated UUIDs and targets `@minecraft/server` 2.8.0, which includes the ticking-area API used by this build. Use a Bedrock version that supports that module and enable Beta APIs. The custom dimensions use the `log:` namespace, not the old prototype's `lattice:dream` dimension ID. Region-completion properties are versioned in 1.0.6, so nearby areas can be regenerated using the new geometry.

## What this build attempts to implement

- **The abyss lattice:** a four-block-spaced bedrock grid from Y=-32 to Y=0, with no roof and open space between beams. Nearby regions are queued automatically by a dedicated repeating loop, independent of the dream/time-of-day systems. Generation creates a temporary ticking area before placing blocks and releases it afterward. Lattice work is handled separately from heavier structures. The player starts without items.
- **The single tree and resource platforms:** a main oak on a full 3×3×3 island, with grass on top and bedrock at the exact center of the middle layer, plus a separate lower marker. Other rare 3×3×3 islands have grass tops and a randomized center block in the middle layer: 50% ordinary stone, or 50% one of eight ordinary stone ores, with every ore equally likely. Platform spawn odds are weighted toward the tree.
- **Ruined city towers:** the existing grid extends straight upward in bedrock. Every 4×4×4 lattice cell becomes a room with regular-stone floors and wall fillers, walkable internal doorways, and one or two randomly omitted outside wall cells per floor. A narrow water climb appears in a different corner room on each storey. Chests and clues remain. Tower walls are currently breakable while the layout is tested.
- **The Tesseract:** a bedrock wireframe with an outer cube, a smaller inner cube, and continuous staircase connectors joining their eight corresponding corners. A regular stone block sits in the center and can be interacted with to enter. The block above it is the repeatable mining loophole. Entry consumes the structure and leaves one obsidian marker, and the trip uses the temporary memory dimension.
- **The memory collapse:** an initially calm Overworld-like patch, then gradual black-concrete infection, block removal, and a return to the lattice. Mining 64 blocks during the memory can trigger a daymare.
- **Biome Barrels:** rare raised barrels with slice-like resource loot. Special barrels briefly reveal an obsidian-portal outline and remove remaining contents after a short window. Barrel usage affects the chance of later barrels being generated, a scripted approximation of the larger biome-diversity system.
- **Nightmares and daymares:** dream terrain responds to extraction/restoration. Nightmares are time-limited; daymares remain open-ended until the player jumps into the central shaft. Dream sessions clear and restore inventory, HUD settings, location, and game mode on normal exit, with a best-effort persistent backup if interrupted.
- **Restoration:** planting vegetation, successfully growing trees, and repairing lattice damage contribute to persistent restoration.
- **Temi village:** a small four-hut village with grateful signs and named villagers can appear after enough restoration.
- **Bedrock serpent:** a five-segment bedrock system that moves in cardinal directions and erases blocks around its segments within the intended lower vertical band.
- **Ending:** activating a Nether portal in the custom survival dimension, if Bedrock permits portal creation there, triggers an Overworld return and changes nearby surface blocks according to the world's accumulated state. `/scriptevent log:finish` is provided as a testing fallback.

## Testing functions

With cheats enabled, enter these commands in chat. **The function names contain no colons.** Start with `/function function_check`; it uses only a native Bedrock `tellraw` command and does not depend on JavaScript. The other functions print their own confirmation before sending a script event.

- `/function function_check` confirms the Bedrock function folder itself is being loaded.
- `/function lattice_status` shows the current region, chunk-loaded state, lattice/structure queue counts, ticking-area usage, generation failures, and the latest recorded error.
- `/function lattice_recheck` queues nearby regions again. It is also a manual fallback if automatic generation is interrupted.
- `/function status` prints restoration, damage, and Tesseract counters.
- `/function daymare` starts an open-ended daymare.
- `/function nightmare` starts a timed nightmare.
- `/function memory` enters the temporary memory dimension and consumes the one-use Tesseract.
- `/function finish` triggers the ending and teleports the player to the Overworld.

These are developer test functions, not normal player progression. Use `finish` only when you intend to end the test run.

## Important limitations

This is the first broad, integrated script build. Some large world-generation systems are deliberately represented with compact procedural structures rather than a complete custom biome registry. Dream watchers are ordinary passive mobs, and tower clues use a renamed book with lore rather than multi-page written-book content. Exact sky/fog treatment, full biome-probability simulation, truly separate dreams for multiple players at once, and remaining edge cases still require in-game polish and testing. Minecraft's Script API and custom-dimension support can vary by Bedrock version; **the existence of this source and a valid manifest do not prove every mechanic works at runtime**.

Back up anything important. Use a fresh test world and report the first in-game error before testing on a world you care about.
