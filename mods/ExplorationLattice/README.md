# Exploration Lattice (Minecraft Bedrock)

Exploration Lattice is a separate Bedrock behavior-pack add-on that progressively removes terrain outside a repeating 3D block-beam lattice as players explore.

## Direct install

**[Download ExplorationLattice.mcpack](https://raw.githubusercontent.com/DiceeInked/ideal-goggles/main/mods/ExplorationLattice/ExplorationLattice.mcpack)**

Open the downloaded file with Minecraft to import it, then activate the Exploration Lattice behavior pack in a world's Behavior Packs settings. Use a test world first.

## How the lattice works

- The lattice repeats every 4 blocks on all axes.
- A block is preserved only when at least two of its world coordinates (X, Y, Z) are divisible by 4. This leaves one-block-thick beams running along the X, Y, and Z directions rather than three solid grid planes.
- The pattern uses absolute world coordinates, so it stays aligned across chunk boundaries. The three beam directions intersect at (0, 0, 0).
- The add-on checks a 9 x 9 chunk square centered on each player. It only queues chunks that Bedrock reports as loaded, then processes nearby chunks first.
- Work is spread across ticks using a per-tick block budget of 1,024 blocks, four times the previous version. It discovers newly loaded chunks as players explore and drops queued chunks that are no longer near a player, avoiding an ever-growing backlog.
- Source water/lava blocks and waterlogged blocks are skipped and are never replaced with air.
- It uses each dimension's reported height range and works in the dimension where each player is exploring.

## Important warning

This add-on deletes blocks outside the lattice, including structures, chests, fluids, and potentially bedrock if those blocks fall outside the pattern. The changes are not automatically reversible. Fluids and waterlogged blocks are preserved, but other blocks outside the lattice are still deleted. Make a copy of your world and test this in a disposable world first.

A 9 x 9 chunk area represents up to 81 chunks. Each loaded chunk is scanned through its full height range, so the first transformation takes time and can affect performance.

## Technical details

- Behavior-pack version: 1.0.2
- Script dependency: @minecraft/server 2.0.0
- Minimum engine version declared in the manifest: 1.21.90

JSON and JavaScript syntax are validated before packaging. Actual in-game behavior still needs testing in the target Bedrock version because this environment cannot launch Minecraft.
