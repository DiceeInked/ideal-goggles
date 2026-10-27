# Design Decisions and Open Questions

This is the short decision tracker. For the complete design, use the [Master Game Design Document](GAME_DESIGN_DOCUMENT.md). That document places curly-brace prompts beside the systems they refer to, so the creator can work through questions without needing a conversation.

The creator's latest explicit decisions take priority. When two documents conflict and no decision exists, leave both versions identified as unresolved rather than silently choosing one.

## The game in a nutshell

A 2D multiplayer drawing adventure set on a large planet. Players start at the Camp, explore caves, collect ink and shards, build weapons from three parts, draw their own characters and artwork, and meet other players along the way.

Inkoff is the competitive mode. Teams can win by filling their base with gel or by taking all three of the opposing Queen's lives.

## Current plan

### World and caves
- The old daily, seasonal, and white-island plan is scrapped. The game takes place on one large planet.
- The Camp is the starting area. The first cave has a few ores but no enemies or merchants.
- Deeper cave layers can have more creatures and merchants. Merchants become more likely the deeper players go.
- A drawing puzzle opens a long fall that moves the player into a new cave layer and server instance.
- Rare cave biomes may replace the normal cave network, but their special traits are not defined yet.
- The uploaded PDF adds proposed Water Caves, letter/number levels (A99–Z00), Strongholds, a possible weekly cave reset, and named creatures. The reset rule and level notation remain unresolved.

See [World and Caves](WORLD_AND_CAVES_AI.md), [Creatures](CREATURES_AI.md), and the full [Master Game Design Document](GAME_DESIGN_DOCUMENT.md).

### Drawing and the glitch artifact
- Players can draw character appearances, clothes, and artwork.
- The editor starts with black and shades of gray. White is the canvas, not a normal ink color.
- Dragging ink onto a gray or filled region recolors matching areas. The exact fill rules still need to be worked out.
- Artwork uses ink based on how much of each color is used. Ink should be common enough that drawing stays fun.
- A small glitchy portal at the Camp opens a persistent personal drawing board.
- A square glitch artifact can open a temporary portal to the player's stash. It may appear around cave level two or three, but its tutorial placement is undecided.
- At the surface, the artifact can be used with a large antenna to reach a separate drawing planet. Its privacy settings are undecided.

### Weapons, ink, and shards
- A weapon has three parts: a blade for the primary attack, a handle for the secondary ability, and an amulet that gives passive benefits and sets the Queen's projectile pattern in Inkoff.
- Players spend shards to lock a weapon combination. Locked weapons can be upgraded and used in modes such as Inkoff. They cannot normally be edited afterward.
- Trap is the exception: players can try to split a locked weapon apart by completing his challenge twice.
- Players can carry effectively unlimited ink and shards. The stash is mainly for weapons and special artifacts.
- Ink is used for combat and drawing. Weapons can also mine ores.
- Red is linked to healing or survivability, blue to damage, and green to luck or rewards. Yellow is undecided.
- The current YAP notes list a locked weapon with a tonic plus a blade, handle, and amulet; the PDF lists a fourth item as another blade.

### Inkoff
- Players start with the same amount of ink and can mine ores to refill it.
- Running out of ink causes death. Workers respawn; the Queen loses one of three lives.
- Each team has a randomly selected Queen. A Queen's death is clearly shown, followed by a short delay before respawning at base.
- Workers collect gel, carry it above their heads, and deposit it into the holes in their team's hexagon-style base. Filling all holes wins. Dropped gel can be stolen.
- The Queen can fly and use a gun-like version of their equipped sword. The amulet sets the projectile pattern. Queen projectiles do not hurt the opposing Queen, but melee works. Friendly fire is off.
- Black ink is an optional harder challenge and needs a clear warning. Its exact penalty is undecided.

### Friends and Passions
- Passions is the social-action/emote system. A paired action is started by one player and confirmed by the other by approaching and pressing the button.
- The romantic-partner option is optional, requires both players to agree, and allows one partner per player.
- Becoming partners unlocks a special greeting. The planned gesture order is special bow, hand-to-heart, hug, then kiss.
- Either partner can end the partnership after confirmation; partner gestures remain visible but greyed out for the former partner.
- At the friendship threshold where the partner option unlocks, nearby players slowly regain health whether or not they become partners. The exact range/rate and whether this works in Inkoff are undecided.
- Heart Points is the working name for a friendship currency. Its final name, earning rules, costs, and gift replacement are undecided.

### Homes and PAL
Personal homes, props, badges, and PAL (Passionate Art Lineup) appeared in earlier notes. They remain optional/unconfirmed until the creator decides how they fit into the current planet-and-Camp design.

## Important unresolved conflicts from the uploaded PDF

- **Cave reset:** the PDF says global terrain resets weekly. The previous tracker said this idea was not confirmed.
- **Layer notation:** the PDF says levels run A99–Z00 and separately mentions Water Caves at levels A–D. The relationship between these systems is unclear.
- **Stronghold rule:** the written random destination formula is unclear and needs examples.
- **YAP inventory:** the PDF's fourth item says a random blade; current notes say an amulet.
- **Trap challenge:** the original merchant notes describe five numbers, a 60-second limit, a revolver tick every 10 seconds, and a fatal shot. The PDF describes a six-slot barrel, 10 seconds of spinning, then shots every 3 seconds with a one-in-six chance to kill.
- **Creature roster:** the PDF names Scribble Spider, Phantom Jelly, and Box Jelly, but the current creature file has not fully specified them.

## Retired or non-current ideas
- The original daily, seasonal, and white-island world plan.
- White emergency ore in Inkoff.
- Colored shards and item unlock tokens.
- Giving teammates ink by slashing them.
- The old core-stone-only Inkoff win condition.
- Custom-drawn weapon skins with transparent marker requirements.
- Treating weekly cave-layout changes as confirmed.
- Treating black ink's effect on match rewards as decided.

## Workflow for finishing the design
1. Read the [Master Game Design Document](GAME_DESIGN_DOCUMENT.md).
2. Answer the {DECIDE: ...} prompts in any order.
3. Replace each prompt with the chosen rule, or mark it as intentionally omitted.
4. Update the relevant focused note when a rule changes.
5. Keep this tracker short; use the master document for the full questions and details.
