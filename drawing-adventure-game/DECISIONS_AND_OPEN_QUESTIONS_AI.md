# Design Status and Open Questions _AI

> Cross-document audit sheet for the Drawing Adventure Game. This is a navigation and consistency aid, not a replacement for the detailed design files. New creator decisions override this summary. Anything marked unresolved must not be silently promoted into canon.

## Current concept at a glance

A 2D multiplayer drawing adventure set on a large planet. Players begin at the Camp, explore a shared world and increasingly dangerous cave layers, gather ink and shards, assemble three-part weapons, draw custom appearances and freeform artwork, and encounter other players naturally along the way. Inkoff is the competitive mode with two victory routes: deliver enough gel to fill the team's base, or defeat the opposing Queen by taking all three of her lives.

## Current confirmed direction

### World and exploration
- The world is one large planet, not the earlier daily/seasonal island sequence. The Camp is the starting area.
- The first cave is sparse, with a small number of ores but no enemies or merchants. Deeper layers can introduce more mob types and merchants; merchant appearance chances increase with depth.
- Cave descent includes a drawing puzzle and a concealed transition between server/instance layers, intended to preserve the feeling of one continuous descent.
- Rare special cave biomes have been discussed as variations of the usual cave network. Their exact gameplay traits are not defined.
- Natural encounters with other players during exploration are a core social goal.

### Drawing and glitch artifact
- Drawing is central to the game. Players can draw character appearances, clothing, and artwork on drawing surfaces.
- The current editor concept uses black and shades of gray for drawing. White is the canvas/background, not a normal drawing ink.
- Applying an ink to a gray or filled region recolors matching areas. The exact region/fill algorithm still needs a precise implementation rule.
- Ink consumed by art depends on how much of each color is used. Ink should be common enough for drawing to remain enjoyable.
- A personal drawing board reached through a small glitchy portal at the Camp is persistent and does not reset.
- A separate drawing planet is reached by using the glitch artifact with a large antenna at the surface. The privacy and sharing model for that planet is undecided.
- The square glitch artifact is expected around the second or third cave level, although tutorial placement is still being considered. Its remote stash portal uses a roughly five-second chest hold, a cursor-driven wall opening, and a portal that lasts about 30 seconds unless replaced by another portal.

### Weapons, ink, and shards
- A weapon has three components: blade (primary attack), handle (secondary ability), and amulet (Queen projectile pattern in Inkoff plus passive advantages).
- Players can spend shards to lock a chosen combination. A locked weapon can be upgraded and used in modes such as Inkoff. Ordinary editing is blocked after locking; Trap's service is the designed exception.
- Players can carry effectively unlimited ink and shards. The stash is mainly for weapons and special artifacts.
- Ink is used both for combat and drawing. Weapons can also be used for mining.
- Red is intended to relate to healing/survivability, blue to increased damage, and green to luck/rewards. These are broad identities, not final numbers.
- YAP's original merchant note lists a locked weapon with a special tonic, plus one blade, one handle, and one amulet. Any ink color can summon YAP; shards are used for purchases.
- Trap can attempt to split a locked weapon into its separate components. The creator clarified that two successful challenge stages are required to split the three-part weapon.

### Inkoff
- Everyone starts with the same amount of ink and can mine ores during the match to replenish it.
- Running out of ink causes death. A Worker immediately respawns; a Queen loses one of three lives. Losing all three Queen lives loses the match.
- Each team's Queen is randomly selected. A Queen death has a clear indication and short delay before respawning at base.
- Gel delivery and Queen elimination are the two current victory routes. A worker carries gel visibly above their head and deposits it into the team's hexagon-style base holes. Dropped gel can be stolen by the opposing team.
- The Queen can fly and uses a gun-like form of their equipped sword. The amulet defines the Queen's projectile pattern. Queen-specific projectiles do not damage the opposing Queen; Queens can fight each other with melee. Friendly fire is off.
- Black ink must be presented as an explicitly harder optional choice with a clear warning. Its exact penalty is undecided.

### Social progression and Passions
- Players can encounter and pass one another naturally during exploration. A handshake reveals/views the other player's custom character skin.
- Adding someone as an acquaintance places them in the Connection Constellation and enables the classic handshake.
- Friendship progression includes optional unlocks such as holding hands, guiding, chatting, piggybacking, and other social actions.
- The social-action/emote system is called **Passions**. For paired actions, one player initiates and the other confirms by approaching and pressing the relevant button; no separate decline pop-up is specified.
- Becoming romantic partners is an optional short branch. Both players must accept the proposal/upgrade. Each player can have one romantic partner at a time but many ordinary friends.
- The romantic-partner path unlocks the special greeting immediately. The current proposed gesture order is special bow, hand-to-heart, hug, then kiss. Animation concepts are documented in `FRIENDSHIP_ACTIONS_AI.md`.
- Either partner can end the partnership after a confirmation prompt. After breakup, relevant nodes and gestures remain visible but greyed out for the former partner.
- When friendship reaches the threshold where the romantic option is available, both players' health gradually restores while nearby, even if they are not romantic partners. A heart icon appears on each chest and beats nearby.

### Homes and PAL
- Personal homes/spawn areas, props, badges, and the Passionate Art Lineup (PAL) exist in earlier design notes, but they have not been reconfirmed within the revised planet/Camp structure. Treat them as tentative until the creator confirms their current place.
- PAL's earlier concept is seasonal and yearly art submissions, with selected winning art shown for purchase and displayed in homes. Award rules and creator payout are not finalized.

## Retired or explicitly not current
- The original daily/default island, seasonal island, and white island color-source system.
- White emergency ore as an Inkoff fallback.
- Colored shards. The current currency name is simply **shards**.
- Item unlock tokens.
- Transferring ink to teammates by slashing them.
- The earlier core-stone-only Inkoff victory design. Current routes are gel delivery and Queen elimination.
- Custom-drawn weapon skins with transparent marker constraints.
- The old daily shard-piece friendship gift proposal as the preferred plan. The replacement gift mechanic is undecided.
- Treating weekly cave-layout changes as a confirmed feature. The idea has been discussed, but needs reconfirmation.
- A claim that black ink does not reduce end-of-match rewards. No reward rule has been confirmed.

## Open decisions by area

### World and cave structure
- Does cave terrain/layout change weekly, or was that earlier idea dropped?
- What makes a rare biome appear, and do biome traits change ores, mobs, movement, hazards, or rewards?
- How do players return to the surface, reconnect with friends, or stay grouped during a server-layer transition?
- How many players share an instance, and how are parties kept together?
- Is the separate drawing planet public, shared with friends, or private?

### Drawing
- What exact selection or region-matching rule determines which gray/filled areas are recolored by a dragged ink?
- Will the special gray “alloy” mechanic exist, allowing a region to take any chosen ink color?
- Which drawing surfaces and player-created objects are editable, and what safeguards prevent connected-area exploits?

### Weapons and economy
- What will yellow ink do? Shorter cooldowns and extra crystals/rewards were discussed as possibilities, not final choices.
- What are the ink costs, use counts, recharge timing, and upgrade effects for each weapon?
- How are additional blade, handle, and amulet parts unlocked or purchased?
- Does YAP provide starter gear at the Camp? Is the special tonic temporary or permanent? Is tipping a current mechanic?
- The preserved `MERCHANTS.md` mentions `TONICS`, but there is no standalone tonic design file in this folder. Define tonic effects and decide whether a separate spec is needed.
- Does black ink increase ink use, extend recharge, reduce damage, weaken abilities, or impose another penalty? What, if anything, happens to match rewards?
- Is a starter pickaxe part of the current opening progression?

### Inkoff
- How much ink does a player start with, and how much does each ore provide?
- Where and how does gel spawn, and how does it respawn after being collected?
- Does a Worker respawn with their starting ink, some ink, or none after running out?
- Does ink-depletion death affect score or rewards?
- How does mining work under pressure, and can attacks interrupt it?
- How does the Queen's handle ability behave in Queen form?
- Is proximity-based health regeneration disabled in Inkoff, or can it operate without being tied to romantic status?

### Friendship, Passions, and gifts
- Is **Heart Points** the final currency name? Which actions award it and how much?
- What are friendship thresholds, prices, and rules for individual nodes and gestures?
- Are later gestures purchased with Heart Points, earned by progression, or both?
- What is the exact health-regeneration range and rate for close friends?
- What happens if someone disconnects during a paired gesture, and which gestures cancel when a player walks away?
- What replaces shard-piece gifts? What are the rules for accepting, declining, and claiming gifts?
- How soon can someone form a new romantic partnership after ending one?
- What are the exact Passions controls, and how do gestures persist through server transitions?

### Homes, PAL, and merchants
- Are personal homes still part of the current game, and are they the normal spawn location alongside the Camp?
- Is PAL still planned? How are art submissions selected, priced, attributed, and paid out?
- What is Trap's exact clockwise/counterclockwise number rule? Does failure always kill the player, what is lost, and is the respin/entry cost still 10 ink/2 shards?
- Does each successful Trap stage visibly split the weapon immediately, and what happens on a failed second stage?

## Consistency rules for future edits
- Update the relevant detailed document and this tracker when the creator makes a decision.
- Mark uncertain proposals as possibilities or open questions, not as current rules.
- Keep creator-authored source files such as `MERCHANTS.md` untouched unless asked. AI-written expansions can clarify but should not silently overwrite the original notes.
- Use **YAP** as the current stylized merchant name. The original `MERCHANTS.md` uses title case in its heading and is preserved as source material.
- Keep inspiration notes separate from current rules; an inspiration is not automatically a confirmed mechanic.
