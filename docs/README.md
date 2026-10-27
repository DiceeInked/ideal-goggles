# Repository organization guide

This repository is a collection of creative experiments rather than a single production app, so the structure is intentionally broad. The goal is to keep discoveries, game concepts, and prototypes easy to browse without losing the original work.

## Current layout

```text
ideal-goggles/
├── README.md                  # Main project index
├── devlog/                    # Development notes and learning writeups
├── drawing-adventure-game/    # Main game concept and design docs
├── Pod Game/                 # Legacy concept folder, still kept for record
├── games/                    # Browser prototypes and small experiments
├── mods/                     # Minecraft Bedrock ideas and versioned packs
├── docs/                     # Repo conventions and usage notes
├── LICENSE
├── .github/
└── ...
```

## Naming standards

For newly created content, prefer:

- lowercase folder names
- hyphenated names for multi-word entries
- `README.md` as the canonical entry point for each section

Examples:

- `drawing-adventure-game`
- `pod-game`
- `dynamic-economy`
- `exploration-lattice`

## Legacy folders

A few older folders were created before the repo had a standard naming pattern. Those are preserved intentionally for continuity. The new repo index is the readable source of truth for browsing.

## Recommended conventions

- Add a README to every major concept folder.
- Keep raw assets and packaged builds close to the concept they belong to.
- Store general documentation in `docs/` or the relevant concept folder rather than scattering notes across the root.
- Prefer clear category folders over one giant root directory.

