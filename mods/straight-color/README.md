# Straight Color

Straight Color adds twelve custom solid-color blocks to Minecraft Bedrock Edition: red, orange, yellow, green, blue, purple, pink, black, dark gray, gray, light gray, and white.

Each block uses a generated flat RGB texture, not a recolored concrete texture. RGB values are listed below:

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

## Build

Run `python mods/straight-color/generate_pack.py` from the repository root. It generates behavior and resource pack folders and `.mcpack` archives.

## Lighting caveat

The current implementation uses maximum block light emission as an approximation. This makes the blocks emit light and does not provide true light-independent fullbright rendering. That exact effect requires renderer/shader support beyond ordinary Bedrock add-on block definitions.
