#!/usr/bin/env python3
"""Generate the Street Colors Minecraft Bedrock add-on and .mcpack files."""
from pathlib import Path
import json, struct, zlib, uuid, zipfile

ROOT = Path(__file__).resolve().parent
COLORS = {
    "red": (255, 0, 0), "orange": (255, 128, 0), "yellow": (255, 255, 0),
    "green": (0, 255, 0), "blue": (0, 0, 255), "purple": (128, 0, 255),
    "pink": (255, 105, 180), "black": (0, 0, 0), "dark_gray": (64, 64, 64),
    "gray": (128, 128, 128), "light_gray": (192, 192, 192), "white": (255, 255, 255)
}

def png_solid(rgb, size=16):
    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xffffffff)
    raw = (b"\x00" + bytes(rgb) * size) * size
    return (b"\x89PNG\r\n\x1a\n" +
            chunk(b"IHDR", struct.pack(">2I5B", size, size, 8, 2, 0, 0, 0)) +
            chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")

def manifest(name, desc, kind):
    return {"format_version": 2, "header": {"name": name, "description": desc,
        "uuid": str(uuid.uuid4()), "version": [1, 0, 0], "min_engine_version": [1, 26, 0]},
        "modules": [{"type": kind, "uuid": str(uuid.uuid4()), "version": [1, 0, 0]}]}

def main():
    bp, rp = ROOT / "behavior_pack", ROOT / "resource_pack"
    write_json(bp / "manifest.json", manifest("Street Colors Behavior", "Twelve solid-color blocks.", "data"))
    write_json(rp / "manifest.json", manifest("Street Colors Resources", "Textures for Street Colors.", "resources"))
    terrain = {}
    for name, rgb in COLORS.items():
        tex = f"street_colors_{name}"
        terrain[tex] = {"textures": f"textures/blocks/{tex}"}
        img = rp / "textures" / "blocks" / f"{tex}.png"
        img.parent.mkdir(parents=True, exist_ok=True)
        img.write_bytes(png_solid(rgb))
        write_json(bp / "blocks" / f"{name}.json", {
            "format_version": "1.26.0",
            "minecraft:block": {
                "description": {"identifier": f"street_colors:{name}",
                                "menu_category": {"category": "construction"}},
                "components": {
                    "minecraft:geometry": "minecraft:geometry.full_block",
                    "minecraft:material_instances": {"*": {"texture": tex, "render_method": "opaque"}},
                    "minecraft:light_emission": 1.0,
                    "minecraft:destructible_by_mining": {"seconds_to_destroy": 1.5},
                    "minecraft:destructible_by_explosion": {"explosion_resistance": 6.0}
                }
            }
        })
    write_json(rp / "textures" / "terrain_texture.json", {
        "resource_pack_name": "street_colors", "texture_name": "atlas.terrain",
        "padding": 8, "num_mip_levels": 4, "texture_data": terrain})
    for folder, filename in ((bp, "Street-Colors-Behavior.mcpack"), (rp, "Street-Colors-Resources.mcpack")):
        target = ROOT / filename
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
            for file in folder.rglob("*"):
                if file.is_file():
                    archive.write(file, file.relative_to(folder).as_posix())
        print(f"Created {target}")
    print("Import both .mcpack files and enable both packs in a world.")
    print("Lighting note: light_emission is only an approximation, not shader-level fullbright.")

if __name__ == "__main__":
    main()
