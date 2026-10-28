# World, Camp, and Caves

## Project and world layout

Drawing Adventure Game (DAG) is a 2D multiplayer drawing adventure for players who enjoy art and exploration. The tentative target audience is around ages 8–13+. Mobile and computer are planned platforms; web is a possibility.

The main adventure has a Camp and a large cave network on a planet. The old daily, seasonal, and white-island structure is scrapped.

The latest filled answers also describe **The Grid**, a small, round neon-circle planet that players can walk around. A merchant stands at the top, and antennas represent boards the player has joined. The merchant lets players join other boards and worlds, and should feel mysterious, knowledgeable, and boastful about its capabilities.

{CLARIFY: Is The Grid a separate antenna hub, or is it the same planet that contains the Camp and cave network?}

## The Camp and its entrances

The Camp is the starting area. Players can draw on it, and other players can see those drawings. Camp instances run on servers like the caves and contain up to three randomly selected players.

A droplet character stands beside the antenna. Its name and purpose are not specified yet.

- **Liv:** a merchant who lets players create and edit weapons as long as they are not locked.
- **Mines entrance:** to the left of the Camp. Players start their cave journey by walking into the Mines.
- **The Pit:** to the right of the Camp. It leads to Inkoff and unlocks after the player meets **Que**, a quest merchant in the caves.

Current notes also say multiplayer features, including Inkoff and shared boards, are accessed through the antenna planet. That appears to conflict with The Pit also being described as the Inkoff entrance.

{CLARIFY: Does the player enter Inkoff through The Pit at Camp, through The Grid's antenna hub, or does The Pit lead to The Grid first?}

Other than the Mines and The Pit entrances, additional Camp/surface landmarks are not planned yet and may arrive in a later update. There is no world map or compass. A map beside the Mines shows the cave levels where the player has opened a Stronghold; signs identify areas.

## Starting the cave run and tutorial

The player enters the Mines by walking in. The tutorial comes first; after completing it, the new player is expected to explore the Mines.

Players cannot skip the tutorial but can replay it. If they fail the drawing puzzle, they can retry. The exact shapes, timing, and number of attempts have not been decided.

The first cave is intended to be quiet and mostly empty:
- A few ores are available.
- There are no enemies.
- There are no shopkeepers.

The first descent leads into a long fall while the game changes cave layer and server instance. The transition should feel continuous even though the terrain and server change.

{DECIDE: What does the player draw in the tutorial, how quickly must they draw it, and how many attempts are allowed?}

## Sections and cave levels

The cave world is divided into **Sections** lettered A through Z. **A is the highest Section** and **Z is the lowest/deepest**. Each Section contains cave levels numbered from 99 down through 01. Level 00 connects to the next deeper Section, such as A00 leading onward to Section B.

A new run starts at **A99**. Reaching Z00 from A99 should take at least 3–4 hours when moving as quickly as possible. Exact creature, ore, merchant, and structure spawn rates by cave level are TBD.

{DECIDE: Define the exact spawn and rarity rules for creatures, ores, merchants, and structures at each cave level.}

## Strongholds

A Stronghold looks like a shrine with a stone-like floor. The player hits it, then draws three symbols. Completing all three in under three seconds earns one shard. Whether the symbol puzzle is required to open the hole or only determines the shard reward is unresolved.

Once opened, a Stronghold emits light, making it easier to find after the player leaves for the surface and returns. Opening a Stronghold disables mob spawning, including shopkeepers, on that level. Strongholds can spawn inside Water Caves and all other special biomes.

A Stronghold opens a physical hole that players jump into. It does not take players to shallower areas and does not move an entire party together; players enter the hole individually.

{DECIDE: Does the hole open when the player hits the Stronghold or only after the symbol puzzle? Does puzzle success control the shard reward only, or also whether the hole opens? Where exactly does the hole lead: always to the next deeper Section or to a random deeper level? Give examples.}

## Random generation and resets

Cave terrain is randomly generated. There are no per-instance cave seeds, and the generated layout is the same for all players.

The filled-in answers conflict about how often the global cave layout resets: one says **weekly**, while another says **bi-weekly**. The interval is not finalized until this contradiction is resolved.

{CLARIFY: Is the shared global cave layout reset weekly or bi-weekly? The current answers specify both.}
{DECIDE: What happens to players who are still inside a cave when the reset occurs?}
{DECIDE: Does the reset regenerate all cave features and ores, or only terrain and layout?}
{DECIDE: Which terrain features are procedural, and which are hand-designed?}

Older notes also describe very large spiral caves, gems that can be mined for extra ink, special rooms with extra gems, and lower cave levels that can unexpectedly continue down through a portal. Those ideas have not been confirmed in the latest answers.

{DECIDE: Are spiral caves, gem deposits, extra-gem rooms, and surprise deeper portals still part of the cave design? If so, how do they work?}

## Cave biomes: Water Cave

The PDF describes a **Water Cave** as a passive cave type:
- It can spawn in levels A through D.
- It is completely flooded.
- Merchants cannot spawn there.
- It is intended to look beautiful.
- Phantom Jelly and Box Jelly are found there.

{DECIDE: How do levels A–D relate to the A99–Z00 Section/level system?}
{DECIDE: How do movement, breathing, combat, mining, and visibility work in a completely flooded cave?}
{DECIDE: Does flooding alter weapons, ink, movement, sound, or other mechanics?}
{DECIDE: What ores, exits, hazards, collectibles, and landmarks appear in Water Caves?}

Other rare biomes may replace the usual cave network with a special layout and traits, but Water Cave is the only one specified so far.

{DECIDE: What other rare biomes exist, what are their spawn rates, and what does each one change?}

## Player movement, multiplayer, and returning

The long cave descent is intended to hide a server change:
1. The game disconnects the player from the current cave instance.
2. It loads or selects the next layer's terrain.
3. The player connects to the next instance while falling.
4. The fall ends in the deeper cave.

Players should naturally see and pass other players while exploring, rather than only meeting in a lobby. The Camp has up to three randomly selected players per instance; the maximum size of cave instances is not specified.

Players can leave a cave at any time by jumping into the **Rift**, the portable stash portal. It is a one-way exit from that cave trip and returns the player to the surface/Camp. The Rift can also send items directly to the player's stash. Opened Strongholds emit light so a player can find a known route again after leaving and returning.

{DECIDE: How many players share each cave instance?}
{DECIDE: How are friends and parties kept together across server transitions?}
{DECIDE: What happens after a disconnect or if a friend loads into a different instance?}
{DECIDE: Can players deliberately join a friend's current cave level?}
{DECIDE: What happens if the next layer is slow to load?}

## Source priority

Use the creator's latest explicit clarifications first, then the uploaded Games.pdf, then older repository notes. If two direct creator answers conflict, leave the conflict marked and ask rather than choosing one.
