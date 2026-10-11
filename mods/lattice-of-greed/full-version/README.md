# Lattice of Greed: Full Version 1.0.4

**An experimental behavior pack.** The previous build relied on checking whether chunks were loaded, then gave up if Bedrock unloaded one midway through block placement. Version 1.0.4 adds temporary Script API ticking areas to keep each lattice or structure region loaded for the entire build. Automated checks still cannot prove in-game behavior, so use a brand-new test world.

## Install

1. Delete the old **Lattice of Greed: Prototype** behavior pack from Minecraft's storage / pack list if it is still imported.
2. Import `Lattice-of-Greed-Full-1.0.4.mcpack`.
3. Create a **new world**. Do not test this in a world you care about.
4. In world settings, activate **Lattice of Greed: Full Version** under Behavior Packs.
5. Enable **Beta APIs** under Experiments. Cheats are needed to run the test functions listed below; enabling them may disable achievements.
6. Create the world. The add-on moves players into its own custom void dimension; it does not replace normal Overworld terrain while the survival world is running.

The manifest uses newly generated UUIDs and targets `@minecraft/server` 2.8.0, which includes the ticking-area API used by this build. Use a Bedrock version that supports that module and enable Beta APIs. The custom dimensions use the `log:` namespace, not the old prototype's `lattice:dream` dimension ID.

## What this build attempts to implement

- **The abyss lattice:** a four-block-spaced bedrock grid from Y=-32 to Y=0, with no roof and open space between beams. Generation now queues nearby regions even before they are loaded, creates a temporary ticking area before placing blocks, and releases it after completion. A lightweight queue handles the lattice separately from heavier structures, so towers cannot hold up lattice extension. The player starts without items.
- **The single tree and resource platforms:** a main oak on a full 3×3×3 island, with grass on top and bedrock at the exact center of the middle layer, plus a separate lower marker. Other rare 3×3×3 islands have grass tops and a randomized center block in the middle layer: 50% ordinary stone, or 50% one of eight ordinary stone ores, with every ore equally likely. Platform spawn odds are weighted toward the tree.
- **Ruined city towers:** several sizes of tall buildings, openings, floor levels, water elevator shafts, treasure chests, clues, restricted block-breaking inside, and a one-time top-ledge collapse.
- **The nested Tesseract:** nested square frames, a protected central crying-obsidian portal block that the player deliberately interacts with to enter, a repeatable mining loophole on a block placed above it, a one-use entry that consumes the structure, and a temporary memory dimension.
- **The memory collapse:** an initially calm Overworld-like patch, then gradual black-concrete infection, block removal, and a return to the lattice. Mining 64 blocks during the memory can trigger a daymare.
- **Biome Barrels:** rare raised barrels with slice-like resource loot. Special barrels briefly reveal an obsidian-portal outline and remove remaining contents after a short window. Barrel usage affects the chance of later barrels being generated, a scripted approximation of the larger biome-diversity system.
- **Nightmares and daymares:** dream terrain responds to extraction/restoration. Nightmares are time-limited; daymares remain open-ended until the player jumps into the central shaft. Dream sessions clear and restore inventory, HUD settings, location, and game mode on normal exit, with a best-effort persistent backup if interrupted.
- **Restoration:** planting vegetation, successfully growing trees, and repairing lattice damage contribute to persistent restoration.
- **Temi village:** a small four-hut village with grateful signs and named villagers can appear after enough restoration.
- **Bedrock serpent:** a five-segment bedrock system that moves in cardinal directions and erases blocks around its segments within the intended lower vertical band.
- **Ending:** activating a Nether portal in the custom survival dimension, if Bedrock permits portal creation there, triggers an Overworld return and changes nearby surface blocks according to the world's accumulated state. `/scriptevent log:finish` is provided as a testing fallback.

## Testing functions

With cheats enabled, enter these commands in chat. **The function names contain no colons.**

- `/function lattice_status` shows the current region, chunk-loaded state, lattice/structure queue counts, ticking-area usage, generation failures, and the latest recorded error.
- `/function lattice_recheck` queues nearby ungenerated regions again. It does not deliberately reset regions already marked complete.
- `/function status` prints restoration, damage, and Tesseract counters.
- `/function daymare` starts an open-ended daymare.
- `/function nightmare` starts a timed nightmare.
- `/function memory` enters the temporary memory dimension and consumes the one-use Tesseract.
- `/function finish` triggers the ending and teleports the player to the Overworld.

These are developer test functions, not normal player progression. Use `finish` only when you intend to end the test run.

## Important limitations

This is the first broad, integrated script build. Some large world-generation systems are deliberately represented with compact procedural structures rather than a complete custom biome registry. Dream watchers are ordinary passive mobs, and tower clues use a renamed book with lore rather than multi-page written-book content. Exact sky/fog treatment, full biome-probability simulation, truly separate dreams for multiple players at once, and remaining edge cases still require in-game polish and testing. Minecraft's Script API and custom-dimension support can vary by Bedrock version; **the existence of this source and a valid manifest do not prove every mechanic works at runtime**.

Back up anything important. Use a fresh test world and report the first in-game error before testing on a world you care about.
