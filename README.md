# ideal-goggles

Minecraft mod ideas, design docs, prototypes, and experiment notes.

This repository mixes game design, Minecraft add-on experiments, web toy prototypes, and devlog notes. This README is the main index for the project.

> Note: a few older folders still use legacy names from early experiments. The documentation below standardizes the repo for browsing without removing history.

## Project index

### Game design and ideas
- [Drawing Adventure Game: Master Design Document](drawing-adventure-game/GAME_DESIGN_DOCUMENT.md) — the full design reference, with undecided details marked as fill-in prompts.
- [Drawing Adventure Game folder index](drawing-adventure-game/README.md) — supporting documents and project navigation.
- [Pod Game](Pod%20Game/README.md) — a separate space-exploration concept document.
- [devlog](devlog/README.md) — development notes and learning writeups.

### Language design
- [OneLine language documentation](oneline/README.md) — OneLine Core, OneLine Raw, syntax, translation model, and roadmap.

### Minecraft add-on experiments
- [mods](mods/README.md) — collection of Bedrock add-on prototypes, concepts, and packaged builds.

### Prototypes and small experiments
- [games](games/README.md) — browser-based toy projects and quick prototypes.

### Repository guide
- [docs](docs/README.md) — repo conventions, notes about structure, and organization guidance.

## Current repo structure

```text
ideal-goggles/
├── README.md
├── LICENSE
├── devlog/
├── drawing-adventure-game/
├── oneline/
├── Pod Game/
├── games/
├── mods/
├── docs/
└── .github/
```

## Quick orientation

- The largest active game design work is in [drawing-adventure-game](drawing-adventure-game/README.md), with the complete concept in its [master design document](drawing-adventure-game/GAME_DESIGN_DOCUMENT.md).
- The [oneline](oneline/README.md) folder documents the proposed programming language and its translation architecture.
- The [mods](mods/README.md) folder contains the Minecraft Bedrock experiments and their build artifacts.
- The [games](games/README.md) folder is for lighter web prototypes and mini-experiments.
- The [devlog](devlog/README.md) holds the project's learning notes and design reflections.

## Organization principles

- Prefer the folder READMEs as the canonical entry point for each section.
- Keep design documents, concept notes, and packaged builds separated where possible.
- Use consistent naming for new content so the repo stays easy to browse.
