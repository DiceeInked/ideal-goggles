#!/usr/bin/env python3
"""Generate the 1,000-color Straight Color Bedrock add-on using only Python's standard library."""

from pathlib import Path
import json
import shutil
import struct
import zlib
import uuid
import zipfile

ROOT = Path(__file__).resolve().parent
BLOCKS_PER_CHANNEL = 10
PACK_VERSION = [2, 0, 0]
MIN_ENGINE_VERSION = [1, 26, 0]
BLOCK_FORMAT_VERSION = "1.26.0"
NAMESPACE = "straight_color"

# Stable UUIDs keep the same pack identity between builds, so Bedrock can treat
# later builds as updates rather than unrelated packs.
def stable_uuid(label: str) -> str:
    return str(uuid.uuid5(
        uuid.NAMESPACE_URL,
        f"https://github.com/DiceeInked/ideal-goggles/straight-color/{label}",
    ))

BP_UUID = stable_uuid("behavior-pack")
BP_MODULE_UUID = stable_uuid("behavior-module")
RP_UUID = stable_uuid("resource-pack")
RP_MODULE_UUID = stable_uuid("resource-module")


def color_for(code: str) -> tuple[int, int, int]:
    """Convert a three-digit RGB code (0-9 per channel) to 8-bit RGB."""
    if len(code) != 3 or not code.isascii() or not code.isdigit():
        raise ValueError(f"Invalid color code: {code!r}")
    if any(digit not in "0123456789" for digit in code):
        raise ValueError(f"Invalid color code: {code!r}")
    return tuple(round(int(digit) * 255 / 9) for digit in code)  # type: ignore[return-value]


def png_solid(rgb: tuple[int, int, int]) -> bytes:
    """Create a valid 1x1 opaque RGB PNG without Pillow or other dependencies."""
    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return (
            struct.pack(">I", len(data))
            + body
            + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
        )

    raw_pixel = b"\x00" + bytes(rgb)  # PNG filter type 0, followed by RGB bytes.
    header = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(raw_pixel, 9))
        + chunk(b"IEND", b"")
    )


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def make_manifest(
    name: str,
    description: str,
    module_type: str,
    header_uuid: str,
    module_uuid: str,
) -> dict:
    manifest = {
        "format_version": 2,
        "header": {
            "name": name,
            "description": description,
            "uuid": header_uuid,
            "version": list(PACK_VERSION),
            "min_engine_version": list(MIN_ENGINE_VERSION),
        },
        "modules": [
            {
                "type": module_type,
                "uuid": module_uuid,
                "version": list(PACK_VERSION),
            }
        ],
    }
    if module_type == "data":
        manifest["dependencies"] = [
            {"uuid": RP_UUID, "version": list(PACK_VERSION)}
        ]
    return manifest


def make_block_definition(code: str, texture_id: str) -> dict:
    """Build one creative-only block definition; no recipe is created."""
    blue_group = int(code[2])
    return {
        "format_version": BLOCK_FORMAT_VERSION,
        "minecraft:block": {
            "description": {
                "identifier": f"{NAMESPACE}:{code}",
                "menu_category": {
                    "category": "construction",
                    "group": f"itemGroup.name.straight_color.blue_{blue_group}",
                },
            },
            "components": {
                "minecraft:display_name": code,
                "minecraft:geometry": "minecraft:geometry.full_block",
                "minecraft:material_instances": {
                    "*": {
                        "texture": texture_id,
                        "render_method": "opaque",
                        "ambient_occlusion": 0.0,
                        "face_dimming": False,
                    }
                },
                "minecraft:light_emission": 0,
                "minecraft:destructible_by_mining": {
                    "seconds_to_destroy": 1.5
                },
                "minecraft:destructible_by_explosion": {
                    "explosion_resistance": 6.0
                },
            },
        },
    }


def build_packs() -> tuple[Path, Path, Path]:
    behavior_pack = ROOT / "behavior_pack"
    resource_pack = ROOT / "resource_pack"
    behavior_mcpack = ROOT / "Straight-Color-1000-Behavior.mcpack"
    resource_mcpack = ROOT / "Straight-Color-1000-Resources.mcpack"
    addon_path = ROOT / "Straight-Color-1000.mcaddon"

    # Remove old generated output first so obsolete files cannot leak into builds.
    for path in (behavior_pack, resource_pack):
        if path.exists():
            shutil.rmtree(path)
    for path in (behavior_mcpack, resource_mcpack, addon_path):
        if path.exists():
            path.unlink()

    write_json(
        behavior_pack / "manifest.json",
        make_manifest(
            "Straight Color 1000 Behavior",
            "1,000 non-emissive RGB color blocks for the creative inventory.",
            "data",
            BP_UUID,
            BP_MODULE_UUID,
        ),
    )
    write_json(
        resource_pack / "manifest.json",
        make_manifest(
            "Straight Color 1000 Resources",
            "One-pixel RGB textures and creative group labels for Straight Color.",
            "resources",
            RP_UUID,
            RP_MODULE_UUID,
        ),
    )

    texture_data: dict[str, dict[str, str]] = {}

    for red in range(BLOCKS_PER_CHANNEL):
        for green in range(BLOCKS_PER_CHANNEL):
            for blue in range(BLOCKS_PER_CHANNEL):
                code = f"{red}{green}{blue}"
                texture_id = f"straight_color_{code}"
                texture_data[texture_id] = {
                    "textures": f"textures/blocks/{texture_id}"
                }

                texture_path = (
                    resource_pack / "textures" / "blocks" / f"{texture_id}.png"
                )
                texture_path.parent.mkdir(parents=True, exist_ok=True)
                texture_path.write_bytes(png_solid(color_for(code)))

                write_json(
                    behavior_pack / "blocks" / f"{code}.json",
                    make_block_definition(code, texture_id),
                )

    write_json(
        resource_pack / "textures" / "terrain_texture.json",
        {
            "resource_pack_name": "straight_color_1000",
            "texture_name": "atlas.terrain",
            "padding": 8,
            "num_mip_levels": 4,
            "texture_data": texture_data,
        },
    )

    languages = ["en_US"]
    write_json(resource_pack / "texts" / "languages.json", languages)
    labels = [
        f"itemGroup.name.straight_color.blue_{blue}=Blue value {blue}"
        for blue in range(BLOCKS_PER_CHANNEL)
    ]
    (resource_pack / "texts" / "en_US.lang").parent.mkdir(
        parents=True, exist_ok=True
    )
    (resource_pack / "texts" / "en_US.lang").write_text(
        "\n".join(labels) + "\n",
        encoding="utf-8",
    )

    # Each .mcpack is a zip whose root contains manifest.json and pack contents.
    for source_folder, archive_path in (
        (behavior_pack, behavior_mcpack),
        (resource_pack, resource_mcpack),
    ):
        with zipfile.ZipFile(
            archive_path, "w", compression=zipfile.ZIP_DEFLATED
        ) as archive:
            for file_path in sorted(source_folder.rglob("*")):
                if file_path.is_file():
                    archive.write(
                        file_path,
                        file_path.relative_to(source_folder).as_posix(),
                    )

    # A .mcaddon is a zip containing the two .mcpack files at its root.
    with zipfile.ZipFile(
        addon_path, "w", compression=zipfile.ZIP_DEFLATED
    ) as archive:
        archive.write(behavior_mcpack, behavior_mcpack.name)
        archive.write(resource_mcpack, resource_mcpack.name)

    return behavior_mcpack, resource_mcpack, addon_path


def validate_source_outputs() -> None:
    """Catch common mistakes before the generated pack is handed to the user."""
    block_files = list((ROOT / "behavior_pack" / "blocks").glob("*.json"))
    texture_files = list((ROOT / "resource_pack" / "textures" / "blocks").glob("*.png"))
    if len(block_files) != 1000:
        raise RuntimeError(f"Expected 1,000 block definitions, found {len(block_files)}")
    if len(texture_files) != 1000:
        raise RuntimeError(f"Expected 1,000 PNG textures, found {len(texture_files)}")

    for code in ("000", "900", "090", "009", "999"):
        block_path = ROOT / "behavior_pack" / "blocks" / f"{code}.json"
        definition = json.loads(block_path.read_text(encoding="utf-8"))
        block = definition["minecraft:block"]
        if block["description"]["identifier"] != f"{NAMESPACE}:{code}":
            raise RuntimeError(f"Wrong identifier in {block_path.name}")
        components = block["components"]
        if components["minecraft:light_emission"] != 0:
            raise RuntimeError(f"{code} emits light unexpectedly")
        material = components["minecraft:material_instances"]["*"]
        if material["face_dimming"] is not False or material["ambient_occlusion"] != 0.0:
            raise RuntimeError(f"Shading settings are not disabled for {code}")

    addon_path = ROOT / "Straight-Color-1000.mcaddon"
    with zipfile.ZipFile(addon_path) as archive:
        names = set(archive.namelist())
        if not {
            "Straight-Color-1000-Behavior.mcpack",
            "Straight-Color-1000-Resources.mcpack",
        }.issubset(names):
            raise RuntimeError("The combined .mcaddon is missing a pack archive")


def main() -> None:
    # Basic checks for the endpoint RGB values specified by the project.
    expected = {
        "000": (0, 0, 0),
        "900": (255, 0, 0),
        "090": (0, 255, 0),
        "009": (0, 0, 255),
        "999": (255, 255, 255),
    }
    for code, rgb in expected.items():
        if color_for(code) != rgb:
            raise RuntimeError(f"RGB mapping error for {code}: {color_for(code)}")

    behavior_mcpack, resource_mcpack, addon_path = build_packs()
    validate_source_outputs()
    print("Built and checked 1,000 Straight Color block definitions and textures.")
    print(f"Behavior pack: {behavior_mcpack}")
    print(f"Resource pack: {resource_mcpack}")
    print(f"Combined add-on: {addon_path}")
    print("No recipe files are generated.")
    print(
        "Lighting note: blocks emit no light, and ambient occlusion/face dimming "
        "are disabled. Bedrock world lighting can still darken textures; this "
        "does not provide renderer-level fullbright."
    )


if __name__ == "__main__":
    main()
