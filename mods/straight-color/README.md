# Straight Color: 1,000 RGB Blocks

Straight Color builds 1,000 custom solid-color blocks for Minecraft Bedrock Edition. Every block is named with exactly three digits, from 000 through 999. The digits mean red, green, and blue, respectively.

## Build

Requires Python 3.9 or newer. No third-party Python packages are needed.

Run from the repository root:

~~~sh
python mods/straight-color/generate_pack.py
~~~

On Windows, this also works when the Python launcher is installed:

~~~sh
py mods/straight-color/generate_pack.py
~~~

The generator creates these files beside this README:

- **Straight-Color-1000.mcaddon**: the combined add-on to open/import with Minecraft.
- **Straight-Color-1000-Behavior.mcpack**: the behavior pack by itself.
- **Straight-Color-1000-Resources.mcpack**: the resource pack by itself.
- **behavior_pack/**: generated block definitions and manifest.
- **resource_pack/**: generated one-pixel PNG textures, terrain atlas mapping, language labels, and manifest.

The script performs basic checks for the 1,000 generated blocks and textures, the key RGB endpoints, the non-emissive and shading settings, and the combined archive layout.

Important: the existing Straight-Color.mcaddon file in this repository is the older twelve-color build. Run the generator and use **Straight-Color-1000.mcaddon** for the 1,000-block version.

## Colors and creative inventory

Each digit is scaled to the full eight-bit channel range with round(digit × 255 / 9). Therefore:

- 000 is black.
- 900 is red.
- 090 is green.
- 009 is blue.
- 999 is white.

The blocks are placed in the Construction creative category and split into ten expandable groups by the third digit, which is the blue-channel value. Each group contains 100 blocks. The three-digit display names make the intended RGB channel values easy to identify.

No crafting recipes are generated. The blocks are obtained from the creative inventory (or by commands).

## Lighting

All blocks set light emission to zero. Their material instances set ambient occlusion to 0.0 and face dimming to false to remove those sources of shading.

These settings do **not** make custom blocks true fullbright. Bedrock can still darken their textures based on the world's block and sky lighting. Keeping the blocks bright in total darkness would require rendering support beyond these ordinary block-definition settings. Test the add-on in-game to confirm how the target Bedrock version renders it.

The material-instance properties are documented in the official [Minecraft Bedrock material instances reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances?view=minecraft-bedrock-stable).

## Generated files

The generated behavior and resource pack folders and the three archives are build outputs, not source files. The local .gitignore excludes them so they do not accidentally add thousands of generated files to a Git commit.
