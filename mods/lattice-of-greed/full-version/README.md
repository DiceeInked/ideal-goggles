# Lattice of Greed: Lattice + Tree 1.0.9

This is a deliberately minimal behavior pack. It generates only:

- **The bedrock lattice:** grid beams spaced four blocks apart, spanning Y=-32 through Y=0. The lattice extends into new regions as players move.
- **One oak tree:** a small 3×3 island with grass on top and a bedrock center in the middle layer, located at the origin.

The city, towers, Tesseract, dreams, barrels, serpent, ending, and all other gameplay systems have been removed from this build.

## Install and test

1. Deactivate and remove older copies of Lattice of Greed from the Minecraft world and storage settings.
2. Import Lattice-of-Greed-Full-1.0.9.mcpack.
3. For the cleanest test, create a new world and activate this behavior pack.
4. Enable Beta APIs if your Bedrock build requires them for custom dimensions and Script API 2.8.0.
5. Join the world. The script attempts to place you in its custom void dimension, then builds the lattice in the region you're standing in. Stay in that region for a few seconds while the blocks are placed.
6. Walk into a new region to trigger its lattice generation.

## Diagnostics

- /function function_check confirms Minecraft loaded the function file.
- /function lattice_status reports the current region, build progress, automatic checks, and any generation error.
- /function lattice_recheck rebuilds the lattice in the region you're currently standing in. Stay there while it finishes, then run the status command again.

Generation no longer depends on saved completion markers or Script API ticking-area reservations. The script only edits a region while a player is physically standing in that region, processes block writes in small batches, and verifies each placement before advancing.

**Important:** static checks can verify the pack's structure and JavaScript syntax, but they cannot replace a test inside Minecraft. Back up important worlds before testing.
