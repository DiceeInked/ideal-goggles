# Design Decisions and Open Questions

This is a quick reference for the current plan and the things that still need decisions. The detailed notes are in the linked files. The creator's latest decisions take priority.

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
- Players should naturally run into other players while exploring.

See [World and caves](WORLD_AND_CAVES_AI.md) and [Creatures](CREATURES_AI.md).

### Drawing and the glitch artifact
- Players can draw character appearances, clothes, and artwork.
- The editor starts with black and shades of gray. White is the canvas, not a normal ink color.
- Dragging ink onto a gray or filled region recolors matching areas. The exact fill rules still need to be worked out.
- Artwork uses ink based on how much of each color is used. Ink should be common enough that drawing stays fun.
- A small glitchy portal at the Camp opens a persistent personal drawing board.
- A square glitch artifact can open a temporary portal to the player's stash. It may appear around cave level two or three, but its tutorial placement is undecided.
- At the surface, the artifact can also be used with a large antenna to reach a separate drawing planet. The privacy settings for that planet are undecided.

See [Drawing and glitch artifact](DRAWING_AND_GLITCH_AI.md).

### Weapons, ink, and shards
- A weapon has three parts: a **blade** for the primary attack, a **handle** for the secondary ability, and an **amulet** that gives passive benefits and sets the Queen's projectile pattern in Inkoff.
- Players spend shards to lock a weapon combination. Locked weapons can be upgraded and used in modes such as Inkoff. They cannot normally be edited afterward.
- Trap is the exception: players can try to split a locked weapon apart by completing his challenge twice.
- Players can carry effectively unlimited ink and shards. The stash is mainly for weapons and special artifacts.
- Ink is used for both combat and drawing. Weapons can also mine ores.
- Red is linked to healing or survivability, blue to damage, and green to luck or rewards. Their exact effects and balance are still open. Yellow ink has no decided effect.
- YAP's original notes list a locked weapon with a special tonic, plus one blade, one handle, and one amulet. Players can summon YAP with any ink color and pay with shards.

See [Weapons and ink](WEAPONS_AND_INK_AI.md), [YAP](YAP_AI.md), and [Trap](TRAP_AI.md).

### Inkoff
- Everyone starts with the same amount of ink and can mine ores for more.
- Running out of ink causes death. Workers respawn; the Queen loses one of three lives. Losing all three Queen lives loses the match.
- Each team has a randomly selected Queen. A Queen's death is clearly shown, followed by a short delay before respawning at base.
- Workers collect gel, carry it above their heads, and deposit it into the holes in their team's hexagon-style base. Filling all holes wins. Dropped gel can be stolen.
- The Queen can fly and uses a gun-like version of their equipped sword. The amulet sets the projectile pattern. Queen projectiles do not hurt the opposing Queen, but Queens can fight in melee. Friendly fire is off.
- Black ink is an optional harder challenge and needs a clear warning. Its exact penalty is undecided.

There is no white emergency ore and no teammate ink transfer by slashing. The old core-stone win condition is no longer current.

See [Inkoff](INKOFF_AI.md).

### Friends and Passions
- Players can meet naturally while exploring. A handshake reveals the other player's custom character skin.
- Adding an acquaintance places them in the Connection Constellation and unlocks the classic handshake.
- Friendship can unlock actions such as holding hands, guiding, chatting, piggybacking, and special greetings.
- **Passions** is the name of the social-action menu. For paired actions, one player starts and the other confirms by approaching and pressing the button.
- The romantic-partner option is a short optional branch. Both players must agree, and each player can have only one romantic partner at a time.
- Becoming partners unlocks a special greeting. The planned order is special bow, hand-to-heart, hug, then kiss.
- Either partner can end the partnership after a confirmation prompt. Afterward, partner gestures stay visible but are greyed out for that former partner.
- When friendship reaches the romantic-option threshold, both players slowly regain health while nearby, even if they don't become partners. A heart appears on each player's chest and beats when they are close.
- **Heart Points** is a working name for a friendship currency. How it's earned and spent is not settled. The old idea of sending shard pieces as a daily gift is no longer the preferred plan; the replacement is undecided.

See [Social play](SOCIAL_AND_FRIENDSHIP_AI.md) and [Passions](FRIENDSHIP_ACTIONS_AI.md).

### Homes and PAL
Personal homes, props, badges, and PAL (Passionate Art Lineup) appeared in earlier notes, but their place in the current planet-and-Camp setup needs to be confirmed. PAL was described as a seasonal and yearly art event where winning art could be purchased and displayed in homes. Rules and payouts are undecided.

See [Homes and PAL](HOMES_AND_PAL_AI.md).

## Ideas that are no longer current
- The original daily, seasonal, and white islands.
- White emergency ore in Inkoff.
- Colored shards and item unlock tokens.
- Giving teammates ink by slashing them.
- The old core-stone-only Inkoff win condition.
- Custom-drawn weapon skins with transparent marker requirements.
- Treating weekly cave-layout changes as confirmed.
- Treating black ink's effect on match rewards as decided.

## Open questions

### World and caves
- Will cave layouts change weekly?
- What causes a rare biome to appear, and how does it change the cave?
- How do players return to the surface or stay with friends during server changes?
- How many players share a cave instance, and how are parties kept together?
- Is the separate drawing planet public, private, or shared with friends?

### Drawing
- How does the editor decide which regions are recolored by dragged ink?
- Will the special gray “alloy” color exist?
- Which surfaces and player-made objects can be edited, and how will connected-area exploits be prevented?

### Weapons and economy
- What does yellow ink do?
- What are the ink costs, hit/use counts, recharge times, and upgrade effects for each weapon?
- How are extra weapon parts unlocked or bought?
- Will YAP provide starter gear at the Camp? Is his tonic temporary or permanent? Is tipping still a thing?
- The original `MERCHANTS.md` mentions tonics, but their effects aren't defined in a separate spec.
- What penalty does black ink add, and does it affect match rewards?
- Is a starter pickaxe still part of the opening game?

### Inkoff
- How much ink does each player start with, and how much does each ore give?
- Where does gel spawn, and how does it respawn?
- Does a worker respawn with ink after running out?
- Does ink-depletion death affect score or rewards?
- Can attacks interrupt mining?
- What is the Queen's handle ability?
- Is the close-friend health effect disabled in Inkoff?

### Friendship and Passions
- Is Heart Points the final name? What earns it, and how much?
- What are the friendship thresholds and costs?
- Are later gestures bought with Heart Points, unlocked by progression, or both?
- What are the exact health-restoration rate and range?
- What happens if someone disconnects during a gesture, and which gestures can be cancelled by walking away?
- What replaces shard-piece gifts, and how are gifts accepted or claimed?
- How soon can someone form a new romantic partnership after a breakup?
- What are the menu controls, and how do gestures work across server transitions?

### Homes and merchants
- Are personal homes still planned, and where do they fit into spawning?
- Is PAL still planned, and how are submissions, judging, prices, credit, and payouts handled?
- What is Trap's exact clockwise/counterclockwise number rule?
- Does failing Trap's challenge always kill the player? What is lost?
- Are the respin cost (10 ink) and entry cost (2 shards) still correct?
- Does Trap split the weapon after each successful stage, and what happens if the second stage fails?

## Keeping these notes up to date
When a decision changes, update the relevant design file and this tracker. Keep guesses and inspiration separate from confirmed rules. Leave original files such as `MERCHANTS.md` untouched unless the creator asks for edits. Use **YAP** as the merchant's name in the current design.
