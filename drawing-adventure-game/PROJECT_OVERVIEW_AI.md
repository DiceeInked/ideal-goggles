# Project Overview

**Drawing Adventure Game (DAG)** is a 2D multiplayer drawing adventure for players who enjoy adventure and art. The tentative target audience is around ages 8–13+. The planned platforms are mobile and computer, with web as a possibility.

Players start at the Camp, enter the Mines, and explore cave Sections from A through Z. The world combines drawing, resource gathering, weapon-building, encounters with other players, creatures, and merchants.

## Main ideas

- Explore a large cave world that becomes stranger and scarier as players descend.
- Sections are lettered A–Z, with A highest and Z deepest. Levels within a Section run from 99 down through 01; 00 connects to the next Section. The run starts at A99.
- Draw character looks, clothes, and artwork using collected ink.
- Collect ink and shards by exploring and mining.
- Build weapons from a blade, handle, and amulet. The blade controls the main attack, the handle controls the secondary ability, and the amulet gives passive benefits and sets the Queen's projectile pattern in Inkoff.
- Meet other players naturally while exploring and use friendship actions.
- Play Inkoff, where teams can win by filling their base with gel or taking all three of the opposing Queen's lives.
- Meet merchants including YAP, Trap, Liv, and Que.
- Use Strongholds to earn a shard by drawing three symbols in under three seconds, then open a physical hole to jump into. Once opened, a Stronghold emits light and disables mob spawning, including shopkeepers, on that level.

## Camp and access points

The Camp is the starting area. Players can draw on it and other players can see those drawings. Camp instances have up to three randomly selected players. The Mines entrance is to the left of Camp, and The Pit entrance is to the right.

Liv lets players create and edit unlocked weapons. Que is a quest merchant in the caves; meeting Que unlocks The Pit, which is described as the entrance to Inkoff.

The latest notes also describe **The Grid**, a small round neon-circle planet with a merchant at the top and antennas for boards a player has joined. The merchant connects players to other boards and worlds. Multiplayer features such as Inkoff and shared boards are said to be accessed from the antenna planet, creating an unresolved access-route question because The Pit is also described as Inkoff's entrance.

{CLARIFY: Is The Grid a separate antenna hub or the same planet that contains Camp and the cave network?}
{CLARIFY: Does Inkoff start through The Pit, through The Grid, or does The Pit lead to The Grid first?}

## Cave layout and resets

Caves are randomly generated, do not use separate per-instance seeds, and have the same layout for all players. The reset frequency is unresolved: one filled answer says weekly, while another says bi-weekly.

The first cave has a few ores, no enemies, and no shopkeepers. The player cannot skip the tutorial but can replay it; failed drawing puzzles can be retried. Exact puzzle shapes and timing are not yet specified.

Water Caves can appear in levels A through D according to the PDF, are completely flooded and intended to look beautiful, and do not spawn merchants. The meaning of A–D relative to the A99–Z00 Section system needs clarification.

## Drawing and the Grid

The drawing editor starts with black and shades of gray; white is the canvas. Dragging ink onto a gray or filled region recolors matching areas. The exact fill rules are still being designed. The special gray “alloy” that can become any ink color remains an unconfirmed idea.

The small drawing board at the Camp is persistent. The Grid is described as the hub for shared boards and multiplayer features, but its relationship to the main cave planet remains unresolved.

## Weapons, ink, and shards

Weapons have a blade, handle, and amulet. Shards are used to lock a combination, which can then be upgraded. Locked weapons cannot normally be edited, but Trap can attempt to separate one through his two-stage challenge.

Ink is used for combat, mining, and art. Players can carry effectively unlimited ink and shards. Red is linked to healing or survivability, blue increases damage, and green improves luck or rewards. Yellow's effect is undecided.

YAP sells four items: a blade, handle, amulet, and completed weapon. The parts cannot have buffs; some completed weapons can have a tonic. YAP is summoned by tipping with any ink color, with a 10% chance per tip, and appears at A1 and lower. The exact meaning of “lower” depends on the level notation.

## Inkoff

Players begin with equal ink and can mine ores for more. Running out of ink causes death: Workers immediately respawn, while the Queen loses one of three lives. Workers collect gel and deposit it into the holes in their team's hexagon-shaped base. Filling every hole or eliminating all three of the other Queen's lives wins.

The Queen can fly and uses a gun-like version of their equipped sword. The amulet determines the projectile pattern. Queen projectiles do not damage the opposing Queen, but melee attacks work. Friendly fire is off.

## Social systems

The social-action menu is called **Passions**. Players can meet naturally, make friends, and unlock actions such as hand-holding, guiding, chatting, piggybacking, and custom greetings. The optional romantic-partner path requires both players to agree, and each player can have one partner at a time. The friendship currency **Heart Points** remains a working name.

## Source priority and open issues

The creator's latest explicit answers take priority, followed by the uploaded Games.pdf, then older repository notes. Do not guess when two direct answers conflict.

- Confirm whether the global cave reset is weekly or bi-weekly.
- Clarify whether The Grid is separate from the main cave planet.
- Clarify the access route between The Pit and The Grid for Inkoff.
- Specify the Stronghold hole's destination rule.
- Continue resolving the remaining prompts in the [Master Game Design Document](GAME_DESIGN_DOCUMENT.md).
