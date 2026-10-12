# No Command Limits

A Minecraft Bedrock behavior pack prototype that adds a script-based `/ncl:fill` command for large region fills.

## Command

```text
/ncl:fill <from> <to> <block>
```

Example:

```text
/ncl:fill 0 64 0 80 70 80 stone
```

Use the coordinates and block identifier supported by Bedrock's custom-command parameter parser. The command is namespaced as `ncl:fill`, so it does **not** replace or modify vanilla `/fill`.

## What it does

- Splits a requested cuboid into 16×16×16 batches.
- Processes one batch per tick to reduce the chance of a single huge operation freezing the world.
- Uses the Script API's `Dimension.fillBlocks` and `ignoreChunkBoundErrors` option to fill portions that are inside loaded chunks without failing the entire batch solely because part of it crosses unloaded chunk bounds.
- Has no arbitrary total-volume cap in this script, but it is not literally infinite: world height/bounds, loaded chunks, device performance, and the engine still apply.

## Important Bedrock limitation

A behavior pack cannot patch the native `/fill` implementation or force arbitrary unloaded chunks to load. This command may skip unloaded chunks, and its result depends on the world and the version of Bedrock's Script API. It is a workaround for batching and partial loaded-chunk fills, not a true removal of engine limits.

## Installation

1. Import or copy this folder as a behavior pack.
2. Enable the pack in the target world.
3. Ensure the world version supports custom script commands and the declared `@minecraft/server` dependency.
4. Test with a small region first, then increase the region gradually.

## Safety and performance

Large fills can still cause lag, especially on phones, tablets, consoles, and multiplayer worlds. The batch size and one-batch-per-tick pacing are intentionally conservative.
