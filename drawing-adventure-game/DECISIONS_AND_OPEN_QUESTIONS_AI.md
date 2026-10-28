# Design Decisions and Open Questions

This is the short decision tracker. For the complete design, use the [Master Game Design Document](GAME_DESIGN_DOCUMENT.md). Anything still undecided is marked with a curly-brace prompt there.

## Source priority
1. The creator's latest explicit clarification comes first.
2. The uploaded Games.pdf takes priority over older repository notes when the creator has not given a newer answer.
3. Repository notes fill in details not covered by the PDF.
4. If two direct creator answers conflict, ask the creator rather than choosing one. If authoritative notes are ambiguous or silent, keep a curly-brace prompt rather than guessing.

## Current overview

Drawing Adventure Game (DAG) is a 2D multiplayer drawing adventure for players who enjoy art and exploration. The tentative target age is around 8–13+. Mobile and computer are planned platforms, and web is a possibility.

Players begin at the Camp, enter the Mines, descend through cave Sections A–Z, collect ink and shards, build weapons from a blade, handle, and amulet, create custom drawings, meet other players, and encounter creatures and merchants. Inkoff is the competitive team experience, with gel delivery and Queen elimination as its two win conditions.

## Confirmed from the latest filled answers

### Camp and access
- Players can draw on the Camp, and other players can see the drawings.
- Camp servers host up to three randomly selected players.
- Liv lets players create and edit weapons as long as they are not locked.
- The Mines entrance is to the left of Camp.
- The Pit entrance is to the right of Camp, and is unlocked after the player meets Que, a quest merchant in the caves.
- Players cannot skip the tutorial, but can replay it. The drawing puzzle can be retried after failure.
- Players can leave a cave at any time by jumping into the Rift, a one-way exit to the surface/Camp that also moves items to the player's stash.

### Cave Sections and Strongholds
- Sections progress from A (highest) through Z (lowest/deepest).
- Each Section contains levels numbered 99 down through 01. Level 00 connects to the next deeper Section, such as A00 leading into B. A run starts at A99.
- Exact spawn and rarity rules by cave level are still TBD.
- A Stronghold resembles a shrine with a stone-like floor. Players hit it, then draw three symbols in under three seconds to receive one shard.
- An opened Stronghold emits light and disables mob spawning, including shopkeepers, on that level.
- Strongholds open a physical hole that players jump into individually. They do not take players shallower and do not move an entire party together.
- Strongholds can appear inside Water Caves and other special biomes.
- Cave layouts have no per-instance seeds and are the same for all players.

## Direct contradictions or questions that need the creator's answer

1. **Cave reset frequency:** one filled answer says the global layout resets weekly; another says bi-weekly. This cannot be resolved from the current notes.
2. **The Grid's identity:** The Grid is described as a small, round neon-circle planet with antennas for joined boards and a merchant at the top. The rest of the design describes the Camp and cave network on a large planet. Are these two planets, or is The Grid the main cave planet?
3. **Inkoff access:** The Pit to the right of Camp is described as the Inkoff entrance, unlocked after meeting Que. Other notes say all multiplayer features, including Inkoff and shared boards, are accessed through The Grid. Does The Pit lead to The Grid, is Inkoff entered through The Pit, or is one description outdated?
4. **Stronghold trigger and destination:** The latest answer says players hit a shrine-like Stronghold and draw three symbols; drawing them in under three seconds awards one shard. It also says the Stronghold opens a physical hole that players jump into and cannot take players shallower. Clarify whether the hole opens regardless of drawing speed or only after the symbol puzzle, then define where the hole leads. The PDF's earlier random-destination rule is not specific enough to resolve this.

## Other important open questions

- What exact shapes are drawn in the tutorial, how quickly must they be drawn, and how many attempts are allowed?
- Can a player opt out of random Queen selection, or is every team member eligible?
- Is the older “separate drawing planet” reached with the glitch artifact and large antenna the same place as The Grid, or a different location?
- Is the Rift the same object as the square glitch artifact, or a separate ability/item?
- How does a player get from The Grid to a specific shared board or another world?
- What day/time does the global cave reset happen, and what happens to players still inside caves?
- Does the reset regenerate ores and all cave features, or only terrain?
- What do the A–D Water Cave spawn labels mean relative to Sections A–Z and levels 99–00?
- What are the prices, exact tip amount, and tonic effects/durations for YAP?
- What are the exact creature, ore, merchant, and structure spawn rules at each cave level?
- What is the final ink-cost formula, what does yellow ink do, and what drawback does black ink apply?
- How do friendship levels, Heart Points, gifts, and gesture unlocks work?
- Are personal homes and PAL still planned?

## Reference links

- [Master Game Design Document](GAME_DESIGN_DOCUMENT.md)
- [World, Camp, and Caves](WORLD_AND_CAVES_AI.md)
- [Creatures and Cave Encounters](CREATURES_AI.md)
- [Drawing and Glitch Artifact](DRAWING_AND_GLITCH_AI.md)
- [Weapons, Ink, and Shards](WEAPONS_AND_INK_AI.md)
- [Inkoff](INKOFF_AI.md)
- [Merchant and Character Reference](MERCHANTS.md)
