# Lattice of Greed: Lattice + Tree 1.1.0

This deliberately minimal behavior pack generates only two things:

- **Bedrock lattice:** grid beams spaced four blocks apart, spanning Y=-32 through Y=0.
- **One oak tree:** a small 3×3 island with grass on top and a bedrock center, located at the origin.

All city, tower, Tesseract, dream, barrel, serpent, and ending systems have been removed.

## Nearby-region generation

The script queues the region you're in first, then queues nearby regions outward in expanding square rings. It keeps doing this every half second and generates nearby regions in small batches.

The Bedrock Script API does not expose the exact render-distance setting selected by each player, so this release uses a configurable radius of **4 chunks in each direction** (up to a 9×9 square). This is a practical approximation, not a direct read of the device's render-distance setting. If a region at the edge isn't actually loaded on the device, that attempt is paused and retried later rather than permanently blocking other regions.

## Install and test

1. Deactivate older Lattice of Greed packs in the world's settings.
2. Import Lattice-of-Greed-Full-1.1.0.mcpack.
3. A new test world is recommended for a clean test.
4. Activate the behavior pack and join the world.
5. Stay in the area for a short time while the nearby regions generate.

## Diagnostics

- /function function_check confirms Minecraft loaded the function file.
- /function lattice_status reports the current region, number of regions built, queued work, and scan radius.
- /function lattice_recheck rebuilds your current region and queues nearby regions again.

Each block placement is checked before the script advances. Static validation can verify the JavaScript syntax and package structure, but only a live Minecraft test can confirm runtime behavior.
