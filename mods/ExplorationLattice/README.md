# Exploration Lattice v1.0.6 (Minecraft Bedrock)

Exploration Lattice is a Bedrock behavior-pack add-on that progressively removes terrain outside a repeating 3D block-beam lattice as players explore.

## Direct install

**[Download ExplorationLattice-v1.0.6.mcpack](https://raw.githubusercontent.com/DiceeInked/ideal-goggles/main/mods/ExplorationLattice/ExplorationLattice-v1.0.6.mcpack)**

Open the downloaded file with Minecraft to import it, then activate the Exploration Lattice behavior pack in a world's Behavior Packs settings. Test it in a disposable copy of your world first.

## How the lattice works

- The lattice repeats every 4 blocks on all axes.
- A block is preserved only when at least two of its world coordinates (X, Y, Z) are divisible by 4. This leaves one-block-thick beams running along the X, Y, and Z directions rather than three solid grid planes.
- The pattern uses absolute world coordinates, so it stays aligned across chunk boundaries. The three beam directions intersect at (0, 0, 0).
- The add-on checks a 5 x 5 chunk square centered on each player and only queues chunks Bedrock reports as loaded. It gives nearby chunks priority and drops queued chunks that leave the nearby area.
- Instead of reading and changing every block through separate script calls, the add-on builds small location lists and uses Bedrock's native bulk-fill API. Each batch is four blocks high, and at most two batches are attempted per game tick.
- Water and lava, waterlogged blocks, bedrock, and the listed gravity blocks are preserved. Waterloggable block types are identified gradually over multiple ticks so the catalog check does not create one large startup spike.
- Gravity blocks themselves are preserved, but the blocks beneath them are not specially protected. Nearby blocks are not checked just because they touch water or lava.
- It uses each dimension's reported height range and works in the dimension where each player is exploring.

## Important warning

This add-on permanently changes terrain outside the lattice, including parts of structures and chests. The changes are not automatically reversible. Gravity blocks such as sand and gravel can remain floating if the blocks beneath them are removed. Make a copy of your world and test this in a disposable world first.

The smaller scan area and bounded batches are intended to reduce lag spikes, but they cannot make large-scale terrain edits free. Actual performance depends on the device, world, and Bedrock version.

## Technical details

- Behavior-pack version: 1.0.6
- Script dependency: @minecraft/server 2.0.0
- Minimum engine version declared in the manifest: 1.21.90
- Scan radius: 2 chunks in each horizontal direction, up to 25 chunks per player.
- Batch size: at most 4 x 16 x 16 block positions; 2 batches per tick.
- The bulk fill excludes protected block types. Waterloggable types are checked separately so waterlogged blocks are not erased by the fill.

The source is checked for syntax and package structure before release. Actual in-game performance and behavior still need testing in the target Bedrock version because this environment cannot launch Minecraft.
