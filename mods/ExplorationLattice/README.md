# Exploration Lattice v1.0.6 (Minecraft Bedrock)

Exploration Lattice is a Bedrock behavior-pack add-on that progressively removes terrain outside a repeating 3D block-beam lattice as players explore.

## Direct install

**[Download ExplorationLattice-v1.0.6.mcpack](https://raw.githubusercontent.com/DiceeInked/ideal-goggles/main/mods/ExplorationLattice/ExplorationLattice-v1.0.6.mcpack)**

Open the downloaded file with Minecraft to import it, then activate the Exploration Lattice behavior pack in a world's Behavior Packs settings. Test it in a disposable copy of your world first.

## How the lattice works

- The lattice repeats every 4 blocks on all axes.
- A block is preserved only when at least two of its world coordinates (X, Y, Z) are divisible by 4. This leaves one-block-thick beams running along the X, Y, and Z directions rather than three solid grid planes.
- The pattern uses absolute world coordinates, so it stays aligned across chunk boundaries. The three beam directions intersect at (0, 0, 0).
- The add-on checks a 9 x 9 chunk square centered on each player, only queues chunks Bedrock reports as loaded, and processes nearer chunks first.
- Instead of reading and changing each block through separate script calls, v1.0.6 builds small two-layer batches and uses Bedrock's native bulk-fill API. It processes just one batch per game tick to keep the workload bounded.
- Water and lava, waterlogged blocks, bedrock, and the listed gravity blocks are preserved. Waterloggable block types are identified gradually across ticks so the catalog check does not create one large startup spike.
- Gravity blocks themselves are preserved, but their supporting blocks are not specially protected. Nearby fluid blocks are not checked or preserved just because they are adjacent to a liquid.
- It uses each dimension's reported height range and works in the dimension where each player is exploring.

## Important warning

This add-on permanently changes terrain outside the lattice, including parts of structures and chests. The changes are not automatically reversible. Gravity blocks such as sand and gravel can remain floating if the blocks beneath them are removed. Make a copy of your world and test this in a disposable world first.

The first transformation of a loaded area can still affect performance because Minecraft must apply many block changes and update the world. This version limits the amount of work submitted in each tick; it cannot make large-scale terrain edits completely free of lag.

## Technical details

- Behavior-pack version: 1.0.6
- Script dependency: @minecraft/server 2.0.0
- Minimum engine version declared in the manifest: 1.21.90
- Bulk edits are divided into two-block-high batches, one batch per tick.
- Waterloggable block types are detected via the Script API and processed separately to avoid removing water from waterlogged blocks.

The source is checked for syntax and package structure before release. Actual in-game performance and behavior still need testing in the target Bedrock version because this environment cannot launch Minecraft.
