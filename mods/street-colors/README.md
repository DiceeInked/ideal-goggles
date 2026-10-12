# Street Colors

Street Colors adds 12 custom solid-color blocks to Minecraft Bedrock Edition:

- Red
- Orange
- Yellow
- Green
- Blue
- Purple
- Pink
- Black
- Dark Gray
- Gray
- Light Gray
- White

Each block gets a generated, flat RGB texture rather than a concrete texture recolor. Textures are 16×16 PNGs filled with a single RGB value.

## Generate the add-on

From the repository root, run:

```sh
python mods/street-colors/generate_pack.py
```

The script generates `behavior_pack/`, `resource_pack/`, and two importable `.mcpack` archives inside this folder. Import both archives into Minecraft Bedrock, then activate both packs in the world.

## Lighting limitation

Bedrock's ordinary custom-block rendering does not expose a reliable per-block shader switch that completely ignores world lighting. The generator uses the block light-emission component as a practical approximation, but that also emits light into the surroundings and is **not** a perfect fullbright shader. The intended final behavior is constant RGB appearance regardless of nearby light or darkness; achieving that exactly may require renderer/shader support beyond a standard add-on.

## RGB values

- Red `#FF0000`
- Orange `#FF8000`
- Yellow `#FFFF00`
- Green `#00FF00`
- Blue `#0000FF`
- Purple `#8000FF`
- Pink `#FF69B4`
- Black `#000000`
- Dark Gray `#404040`
- Gray `#808080`
- Light Gray `#C0C0C0`
- White `#FFFFFF`
