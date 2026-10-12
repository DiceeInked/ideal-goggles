# Exploration Lattice (Minecraft Bedrock)

Exploration Lattice is a separate Bedrock behavior-pack add-on that progressively removes terrain outside a repeating 3D block-beam lattice as players explore.

## How the lattice works

- The lattice repeats every 4 blocks on all axes.
- A block is preserved only when at least two of its world coordinates (X, Y, Z) are divisible by 4. This leaves one-block-thick beams running along the X, Y, and Z directions rather than three solid grid planes.
- The pattern uses absolute world coordinates, so it is stable across chunk boundaries. The three beam directions intersect at coordinates (0, 0, 0).
- The add-on checks a 9 x 9 chunk square centered on each player. It only queues chunks that Bedrock reports as loaded, then processes nearby chunks first.
- Chunks are processed gradually with a per-tick block budget to reduce lag. Newly loaded nearby chunks are discovered as players explore.
- It uses each dimension's reported height range and works in the dimension where each player is exploring.

## Important warning

This add-on deletes blocks outside the lattice, including structures, chests, fluids, and potentially bedrock if those blocks fall outside the pattern. The changes are not automatically reversible. Make a copy of your world and test this in a disposable world first.

The 9 x 9 chunk area represents up to 81 chunks. Each loaded chunk is scanned through its full height range, so the first transformation takes time and can affect performance.

## Install

The direct download is the ExplorationLattice.mcpack file in this directory. Open the file with Minecraft to import it, then activate the Exploration Lattice behavior pack in a world's Behavior Packs settings. Use a test world first.

If the direct link is opened in a browser that displays binary text or an error, use the GitHub file page and choose the download option.

## Validation notes

This project uses the stable @minecraft/server module version 2.0.0 and a Bedrock manifest. JSON and JavaScript syntax should be checked before releases. Actual in-game behavior still needs testing in the target Bedrock version because this environment cannot launch Minecraft.
