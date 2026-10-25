# World, Camp, and Cave Progression _AI

> AI-drafted documentation based on the creator's latest clarifications. Unknown implementation details remain open questions.

## The planet and Camp
The world is a large planet, not a set of daily or seasonal islands. The former island plan is scrapped.

The Camp is the starting area. It is a place where players can talk to certain characters and primarily access their stash, where weapons can be stored. The Camp also contains a small glitchy portal that opens the player's persistent personal drawing board.

## Cave entry and early progression
The first cave area is deliberately sparse:
- A small number of ores can be found.
- No enemies appear in this initial cave area.
- No shopkeepers appear in this initial cave area.

After exploring for a while, the player can discover a passage that descends almost perfectly straight down. At this point, the player encounters a drawing puzzle.

## Descent puzzle and server transition
The player sees a shape and must draw it. Then a couple of additional shapes appear in quick succession and must also be drawn quickly. Solving the sequence opens the descent, causing the player to fall a long distance.

The fall is also a technical transition between cave layers:
1. The game disconnects the player from the current cave server/instance while the descent is in progress.
2. It loads or selects the terrain for the next cave layer.
3. The player is connected to the server/instance for that next layer.
4. The fall ends in the deeper cave area.

This is intended to make cave layers feel continuous even though the underlying terrain and server instance change.

## Deeper cave layers
As the player descends:
- More types of mobs gain a chance to appear.
- Merchants such as Yap and Trap gain a chance to appear.
- The chance of merchant appearances increases with depth.
- Cave biomes can rarely replace the usual cave system with a cave network that has special traits.

Exact spawn rates, layer counts, and biome probabilities are not established yet.

## Cave biomes
A cave biome is a rare variation in which the usual cave system is replaced by a special cave network with its own traits. It is not yet specified whether these traits are primarily visual, environmental, mechanical, or a combination.

## Open questions
- What determines when a cave biome replaces the ordinary cave layout?
- Are biome traits mostly visual, or do they change ores, mobs, movement, hazards, and rewards?
- How does the player return to the surface or reconnect with friends after a layer transition?
- How many players should share a cave server/instance, and how should parties be kept together?
- Does the cave terrain change weekly, or is that older detail no longer current? Do not treat this as confirmed until the creator reaffirms it.

## Multiplayer traversal
Players may join into cave exploration and be seen passing one another. The goal is a shared-travel feeling: other players appear naturally during an expedition rather than existing only in a lobby or match queue.

The descent transition should preserve the illusion of a continuous fall while moving the player to a different server and terrain. Exact networking implementation remains a technical decision to prototype.
