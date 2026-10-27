# World, Camp, and Caves

## The planet and Camp
The game takes place on one large planet, not the old daily and seasonal islands. The Camp is the starting area, where players can talk to certain characters, access their stash, and use a small glitchy portal to reach their personal drawing board. The stash is mainly for weapons and special artifacts.

## Starting the cave run
The first cave is meant to feel safe and mostly empty:
- A few ores are available.
- There are no enemies.
- There are no shopkeepers.

After exploring, players can find a passage that drops almost straight down. Before descending, they must solve a drawing puzzle: copy one shape, then quickly draw a couple more shapes as they appear. Solving it opens a long fall into the next cave layer.

## Cave levels
The uploaded PDF describes a letter-and-number level system:
- A run starts at A99.
- The level range is A99–Z00.
- The level helps determine what can spawn and how rare it is.
- Strongholds can change the player's layer.

The full order of the labels, especially how number 00 relates to the next letter, needs clarification. The PDF is authoritative over older repository notes when rules conflict, but unclear wording still needs to be resolved.

{DECIDE: Define the order and depth of A99, A01, A00, B99, B01, B00, and Z00.}  
{DECIDE: Specify the spawn and rarity rules that depend on cave level.}

## Random generation and weekly reset
Cave terrain is randomly generated and the layout resets globally for all players once per week, as specified in the uploaded PDF. This replaces older repository notes that treated weekly resets as unconfirmed.

{DECIDE: What day and time does the weekly reset occur, and what happens to players who are still in a cave?}  
{DECIDE: Does the weekly reset regenerate all cave features and ores, or only terrain and layout?}

## Strongholds
The PDF describes a Stronghold as a passive structure that spawns in every cave and changes the player's layer when entered. It chooses a random destination according to a rule based on the current letter and floor. The PDF wording says that if the 00 floor is selected, a random number from 99 to 01 is selected and the floor letter decreases by one, giving A to B as an example. That letter-direction example is unclear.

{DECIDE: Give a precise formula for Stronghold destination selection and at least three examples.}  
{DECIDE: What does a Stronghold look like and how does a player activate it?}  
{DECIDE: Can a Stronghold move a player shallower, and does it move the whole party together?}

## Water Caves
The uploaded PDF describes Water Caves as a passive cave type:
- They can spawn in levels A through D.
- They are completely flooded.
- Merchants cannot spawn inside them.
- They are intended to look beautiful.
- Phantom Jelly and Box Jelly are found in Water Caves.

{DECIDE: How do levels A–D relate to the A99–Z00 level system?}  
{DECIDE: How do movement, breathing, combat, mining, and visibility work in a completely flooded cave?}

## Other deeper cave areas
More creature types may appear as players descend. Merchants such as YAP and Trap become more likely deeper underground. Rare cave biomes may replace the regular cave network with a special layout and traits, but Water Cave is the only biome described in the uploaded source so far.

Older notes mention large spiral caves, gems that yield extra ink, special extra-gem rooms, and lower cave levels that can unexpectedly continue down through a portal. Treat these as unconfirmed unless they are explicitly confirmed again.

{DECIDE: Are spiral caves, extra-gem rooms, and surprise deeper portals still part of the design?}  
{DECIDE: What other rare biomes exist, and what does each change?}

## Server transitions and shared exploration
The descent transition is intended to hide a server change:
1. The game disconnects the player from the current cave instance.
2. It loads or selects the next layer's terrain.
3. The player connects to the next instance while falling.
4. The fall ends in the deeper cave.

Players should naturally see and pass other players while exploring, rather than only meeting in a lobby.

{DECIDE: How many players share a cave instance?}  
{DECIDE: How are friends and parties kept together across server transitions?}  
{DECIDE: How can players return to the surface or Camp?}  
{DECIDE: What happens after a disconnect or when a friend loads into a different instance?}

## Source priority
For specific rules, use the creator's latest explicit clarification first, then the uploaded PDF, then older repository notes.
