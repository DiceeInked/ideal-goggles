# Exploration Lattice (Minecraft Bedrock)

A new, separate Bedrock behavior-pack project. It converts explored terrain into a coordinate-anchored 3D lattice by replacing blocks with air except where at least one coordinate lies on the repeating four-block grid.

## Grid rules

- Lattice spacing: 4 blocks.
- Keep a block when X, Y, or Z is divisible by 4; remove it otherwise.
- The grid is anchored to world origin (0, 0, 0), so the three central grid planes meet there.
- As players explore, the script queues the surrounding 9x9 chunk region and processes it gradually.
- The first pass scans Y=-64 through Y=319. This is a destructive terrain-editing add-on: test it in a new creative world and keep a backup.

## Install

These are source files, not a ready-to-import archive. Package the behavior_pack folder as a .mcpack, or combine it into a .mcaddon.

## Current status

Prototype source only. Static source checks cannot confirm live behavior in every Bedrock version. The script rate-limits work to reduce lag, but a 9x9-chunk scan still touches many blocks and can take time. Enable scripting support if your Bedrock version asks for it.
