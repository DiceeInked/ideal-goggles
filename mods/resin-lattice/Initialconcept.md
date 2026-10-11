# Concept for The Resin Lattice

**Status:** Design concept only. This document records the current intended behavior and distinguishes confirmed decisions from details that still need designing. It does not describe a finished or implemented add-on.

## Summary

The Resin Lattice is a Minecraft Bedrock Edition survival-world concept built around an unnaturally regular, three-dimensional resin grid. Almost everything between and around the grid is empty void. Players begin with no resources, ordinary mobs do not spawn, and useful resources are exceptionally scarce. A few unusual structures provide rare points of discovery, while a five-segment bedrock serpent moves through the void beneath the lattice and erases blocks near its body.

The intended atmosphere is enormous, geometric, empty, eerie, and slightly surreal. The world should still be playable as survival Minecraft, but exploration, scarcity, player alliances, competition, and player-versus-player looting are important parts of the experience.

This is a concept document, not an implementation specification for code. Some generation probabilities, distances, and technical details are intentionally left undecided rather than invented.

## 1. World layout

### The resin lattice

The lattice is a regular three-dimensional grid made from resin blocks or resin-like beams. Its spacing is four blocks from one beam line to the next along X, Y, and Z.

- The lattice occupies the vertical range from **Y = -32 through Y = 0**, inclusive.
- Horizontal grid layers occur at **Y = 0, -4, -8, -12, -16, -20, -24, -28, and -32**.
- Vertical beams align to the grid lines in X and Z and connect the horizontal layers.
- Grid intersections align to coordinates that are multiples of four.
- There is **no roof, cap, or platform at Y = 0**. The beams simply end there.
- The lattice's lowest horizontal layer is at Y = -32.
- The spaces between neighboring beam lines have **three interior block positions**, not four.

The exact resin block or block palette is not finalized. The current concept refers to the grid material as resin; its final in-game block choice and visual treatment remain design decisions.

### Grid cells and empty space

A grid cell is the space between adjacent lattice planes or beam lines, each separated by four blocks. A cell has a 4-block coordinate interval, with **3 × 3 × 3 interior block positions** between its bounding grid planes.

For example, between grid lines X = 0 and X = 4, the interior X positions are X = 1, 2, and 3. The same rule applies to Z. Between horizontal lattice layers at Y = -4 and Y = 0, the interior Y positions are Y = -3, -2, and -1.

This matters for structure generation: a 3 × 3 structure can fit exactly into the three-by-three interior footprint without replacing or intersecting the lattice beams. Structures should be aligned to these cell interiors rather than placed at arbitrary coordinates that could collide with the grid.

### Everything outside the lattice

The lattice is not ordinary terrain and does not sit on top of a normal world. There should be no naturally generated terrain filling the void above, below, or between its beams. The world consists of the lattice, deliberately generated structures and markers, and the special bedrock serpent.

The tree marker described later is placed at Y = -64. This is a marker location, not a declaration that a continuous solid floor exists at Y = -64.

## 2. Survival rules and resource scarcity

- **Players start with no items or resources.** The earlier idea of giving each player a starting oak plank has been removed.
- **Ordinary mobs do not spawn.**
- The world is intended to have very few naturally available resources.
- Player-versus-player combat and looting are expected to be major ways to acquire resources from other players. Cooperation, alliances, and trading may also emerge, but their detailed rules are not finalized.
- The bedrock serpent is a special world creature/system, not an ordinary naturally spawning mob. Its existence is compatible with the rule that ordinary mobs do not spawn.

The exact resource list, any additional structures, and the final survival progression are not yet designed.

## 3. Tree structure

### Frequency and footprint

Trees are currently intended to be **uncommon**. This is a provisional frequency setting, not a finalized numerical spawn rate.

Each tree structure is centered in a grid cell and fits inside the cell's three-by-three interior footprint.

- The foundation is a **3 × 3 dirt platform**, one block thick in the current concept.
- The uppermost layer of the foundation is at **Y = -1**.
- The foundation's center position is occupied by a **bedrock block** rather than dirt.
- An ordinary oak tree grows upward from the center, above the bedrock.
- The structure must be aligned to the grid-cell interior so the surrounding resin lattice remains untouched.

The foundation therefore has a three-by-three footprint: eight dirt positions around a central bedrock position. The tree grows upward from that central position. The exact oak-tree height and canopy shape are not custom-defined at this stage; the current intent is an ordinary oak tree.

### Tree exclusion area

A generated tree creates a large surrounding exclusion area. Other structures must not generate inside that area. This helps keep trees meaningful landmarks and preserves the surrounding emptiness rather than allowing structures to crowd around them.

The exact exclusion radius or shape has **not** been chosen yet. It should be measured in grid cells or another clearly defined grid-aligned unit when the generation rules are finalized.

### Tree marker at Y = -64

Each tree has a marker directly beneath its center, at **Y = -64**.

- The marker is a flat **3 × 3 dirt patch**.
- Its horizontal center aligns with the tree's center in X and Z.
- The patch is placed at Y = -64.
- It identifies the tree's location from far below.
- It is a marker, not a second tree foundation and not a continuous floor.

This is the only confirmed marker design so far. Other structure types may use different marker shapes or materials, but those designs will be decided when those structures are created.

## 4. Additional dirt formations associated with trees

These formations are separate structures, **not literal roots** and not a branching dirt network connecting back to the tree.

### Shape and contents

Each formation is a separate **3 × 3 dirt platform** located in another eligible grid cell in the large void area associated with a tree.

- The platform uses dirt around its perimeter and across its other non-center positions.
- Its center position contains a randomly selected block that can be obtained through ordinary survival gameplay.
- **Bedrock is excluded** from the center-block selection.
- The center block does not have a tree growing from it by default.
- The formation is aligned to the grid and must not intersect the resin lattice.

The center block is intended to make these platforms worth discovering. The allowed block pool must exclude bedrock and other blocks that are not legitimately obtainable in survival. The final pool of eligible blocks has not yet been specified.

The exact vertical placement of these additional platforms within eligible cells still needs to be finalized. Their three-by-three footprint and cell-aligned placement are part of the current concept; arbitrary placement that overlaps the lattice is not.

### Distribution around a tree

The formations are associated with nearby trees through their generation probabilities, not through physical roots.

- Far from the tree, the chance of finding one is very low.
- At around **five grid cells away** from the tree, the chance begins to increase sharply.
- As the distance gets smaller, the chance continues to rise.
- Very close to the tree, the probability approaches or reaches effectively **100% for the intended nearest area around the tree's first cell**.

This is intended to create a gradient of discoverability: the farther a player travels from the tree, the less likely these extra platforms are to appear, while the area close to the tree is much more likely to contain them.

The precise probability curve, the definition of the “first cell” for the nearest-area rule, the maximum distance at which formations may appear, and whether probabilities are rolled per cell or per eligible position are **not finalized**. The phrase “around five cells” is the current design anchor, not a fully specified formula.

No separate marker design has been established for these additional dirt formations yet. The only confirmed marker is the tree's 3 × 3 dirt patch at Y = -64.

## 5. The bedrock serpent

### Body and movement

The bedrock serpent is a strange creature made of **five bedrock segments**. It behaves more like an AI-controlled chain of blocks than a conventional Minecraft mob.

- It has exactly **five segments** in a line-like, snake-shaped body.
- It moves only along the six cardinal directions: +X, -X, +Y, -Y, +Z, and -Z.
- It never moves diagonally.
- Each segment follows the exact path taken by the segment immediately ahead of it, creating a trail-following snake motion.
- The middle, third segment is considered to contain the serpent's brain in the world's lore.

The concept does not require the serpent to be implemented as five ordinary placed bedrock blocks. It is the behavior and appearance of five bedrock segments that matter; the eventual technical representation is an implementation decision.

### Targeting players

The serpent strongly prefers targeting players.

- When it pursues a player, its target is the **block beneath the player's feet**, rather than the player's body position.
- If there is no player target, it can target and consume blocks instead.
- Player targets take priority over block targets.
- The serpent does **not** directly damage players.

The serpent's behavior is dangerous because of what it removes from the environment, not because it attacks player health.

### The block-erasing field

Each segment has an invisible force field extending **two blocks outward in every direction** from that segment.

- Blocks that the field reaches are deleted, regardless of their material.
- The field affects blocks, not player bodies.
- The serpent can erase blocks even when those blocks would normally be very difficult or impossible to break.
- The field must respect world-height limits.
- Its movement and field must stay beneath the resin lattice rather than entering or destroying the lattice.

The intended upper movement boundary is below the lattice: the highest segment position is **Y = -35**, allowing a two-block reach upward to Y = -33 while leaving the lattice's lowest layer at Y = -32 untouched. The serpent may descend to **Y = -64 inclusive**. At the lower build limit, its force field is clipped to the available world height rather than reaching below it.

The exact mathematical shape of the two-block field and the precise order in which overlapping fields erase blocks are technical details that still need a final implementation definition. The intended behavior is an invisible two-block reach around every segment, with no damage to players and no contact with the lattice.

### The middle segment and player interaction

The middle segment is the serpent's lore-defined brain. One behavior communicates this idea: when the player it is targeting stands on the middle segment, the serpent stops moving because it has reached that target.

There may be an exploitable interaction if a player crouches on the middle segment and moves toward one of its edges. The serpent may try to reach the player's position, potentially moving the rest of its body. This could allow a player to influence or ride the serpent by carefully positioning themselves on it.

That interaction is an intended possibility in the current concept, not a fully balanced or guaranteed control mechanic. Its exact behavior needs testing if the concept is implemented.

## 6. Structure placement and coordinate rules

The grid is the organizing system for world generation.

- The lattice itself is placed on the regular four-block coordinate spacing.
- Structures with a three-by-three footprint use the three interior X and Z positions of a cell.
- The tree foundation is specifically at Y = -1, centered inside a cell immediately below the Y = 0 lattice layer.
- Additional dirt formations are placed in other eligible grid cells and must not overlap the beams; their exact vertical placement remains undecided.
- The tree's marker is placed at Y = -64 and centered on the same X/Z position as the tree.
- Other structure types may have their own marker designs later.
- Structures should be generated in designated grid-cell positions rather than at arbitrary, unaligned coordinates.

The tree's exclusion area and the distance-based probabilities for additional dirt formations are measured relative to the grid. Their exact radii, eligible cell selection rules, and numerical probabilities remain to be specified.

## 7. Intended player experience

The lattice gives players a consistent geometric reference in an otherwise empty world. The three-by-three structures are small enough to fit precisely between beams, making their placement feel deliberate. A rare tree can become a major landmark, while the dirt platforms around it create a wider area of potential discoveries. The marker at Y = -64 offers a corresponding clue from below without creating a continuous ground plane.

With no starting resources and no ordinary mob spawns, each useful resource matters. The serpent adds a different kind of danger: it can erase the environment around itself while leaving player health alone. Players must treat the world, other players, and the serpent's movement as parts of the survival challenge.

The desired result is a world that feels vast and empty without being entirely featureless: regular geometry, rare signs of life, scarce resources, and one moving force that can remove almost anything in its path.

## 8. Open design questions

These details are intentionally unresolved and should be discussed before implementation:

1. **Resin material:** Which exact block or custom visual should form the lattice?
2. **Tree exclusion zone:** What radius and shape should prevent other structures from spawning near a tree?
3. **Additional platform height:** At which Y positions within eligible cells may the extra dirt formations appear?
4. **Formation probability curve:** What exact chance should apply at each distance, including the transition around five cells and the nearest-area rule?
5. **Eligible center blocks:** Which survival-obtainable blocks can appear in the center of extra platforms?
6. **Structure selection:** How are eligible cells selected, and how are collisions with other structures prevented?
7. **Other markers:** What marker designs should be used for future structure types?
8. **Serpent field geometry:** What exact block-volume shape does “two blocks outward in every direction” describe, and how should overlapping fields be processed?
9. **Serpent targeting and timing:** What are its detection range, target-switching rules, movement speed, and exact path-update timing?
10. **Middle-segment interaction:** Should standing or crouching on the middle segment remain an emergent exploit, or should it become a defined mechanic?
11. **Other survival rules:** Which additional structures or resource sources should exist, if any?

Until those decisions are made, this document should be treated as the current design record rather than a claim that all mechanics are fully specified or implemented.
