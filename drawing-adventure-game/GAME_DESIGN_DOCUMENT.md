# Drawing Adventure Game: Master Game Design Document

**Working title:** Drawing Adventure Game (DAG)  
**Design owner(s) named in the source notes:** DiceeInked and DinosaurTornado  
**Document purpose:** The main, all-in-one reference for the current game concept.  
**Status:** Living design document. A detail is not final just because it appears here.

> **How to use this document:** Anything inside curly braces is a task for the creator to answer, revise, or explicitly mark as not applicable. For example, {DECIDE: What platforms will the game support?}. These prompts are intentionally left in the text so the document can be worked through without needing a conversation. When a decision is made, replace the prompt with the decision and update the relevant supporting note if needed.

## Source-of-truth rules

1. **The creator's latest explicit clarification wins.** A direct correction from the creator overrides older notes and the uploaded PDF.
2. **The uploaded Games.pdf is the authoritative source when it conflicts with older repository documents.** Use the PDF's version of a rule instead of an older conflicting version in a repository file.
3. **Repository notes fill in details the PDF does not address.** If the PDF itself is ambiguous or does not specify a detail, leave a curly-brace prompt rather than inventing an answer.

The PDF's separate-game material is outside this document's scope.

## 1. The game at a glance

Drawing Adventure Game is a 2D multiplayer drawing adventure set on a large planet. Players begin at the Camp, explore a huge network of caves, collect ink and shards, mine resources, encounter creatures and merchants, assemble weapons from three parts, draw their own character looks and artwork, and naturally cross paths with other players.

The game mixes four main activities:
- **Explore:** descend through cave layers, find ores and unusual locations, solve drawing puzzles, and discover what is deeper underground.
- **Create:** draw and recolor character appearances, clothes, and artwork with the inks found in the world.
- **Build and fight:** combine a blade, handle, and amulet into a weapon, then use ink-powered attacks and abilities.
- **Connect:** meet players during exploration, build friendships, and use paired gestures and other social actions.

**Inkoff** is the competitive team mode. Each team has a Queen and Workers. A team can win by filling every hole in its base with gel, or by taking all three of the opposing Queen's lives.

The intended feeling is a shared journey: other players should appear along the route and sometimes travel nearby, rather than every social interaction requiring a lobby invitation. The drawing system is a central identity feature, not a side activity.

### Project details

**Title and abbreviation:** Drawing Adventure Game (DAG).

**Audience and target age:** Players who enjoy adventure and art; the tentative target age is around 8–13+.

**Platforms:** Mobile and computer are planned; web is a possibility. {DECIDE: Which engine, input methods, and release target will be used?}

**Design emphasis:** Social features should be present everywhere, even subtly. Exploration is important, especially through cave biomes and resets. Horror should grow stronger deeper underground, but the game should not become too horror-focused. Combat is very important because players carry weapons for most of the adventure. Drawing is also a major part of the experience.

### Core design pillars

1. **Drawing matters.** Player-made art and custom character appearances are part of the identity of the game.
2. **Exploration changes as you descend.** The first cave is quiet and safe; deeper areas can introduce creatures, merchants, stranger biomes, and increasing danger.
3. **Ink is both creative material and gameplay resource.** It is spent on drawing, combat, abilities, and mining-related gameplay.
4. **Players meet naturally.** The world should feel shared, with server transitions disguised by continuous movement where possible.
5. **Weapons allow personal play styles.** A weapon is assembled from three parts with different jobs.
6. **Competition has multiple routes to victory.** Inkoff supports both resource delivery and Queen elimination.
7. **Originality matters.** Inspiration from other games is for broad feelings or systems, not copying their characters, assets, maps, sounds, writing, or interface.

## 2. Player experience and overall loop

### Main adventure loop

The intended broad loop is:

1. Start at the Camp.
2. Prepare, talk to available characters, and access the stash.
3. Enter the first cave and collect a small amount of ore.
4. Explore, find and activate a Stronghold, draw its three symbols in under three seconds to earn a shard, then open a hole and jump into a deeper cave level.
5. Continue gathering ink and shards, discovering creatures, merchants, structures, and biomes.
6. Use resources to create or recolor art, buy or build weapons, and improve gear.
7. Encounter other players naturally, optionally travel with them, and use social actions.
8. Return to the surface or Camp, use the stash or drawing areas, and decide whether to explore again or enter another mode.

The cave descent is designed to feel continuous even though the game may disconnect the player from one server instance, load another layer, and reconnect during the fall.

**Starting and leaving a cave:** Players start by walking into the Mines. They can leave a cave at any time by jumping into the Rift (the portable stash portal), but using it is a one-way exit from that cave trip.
**Returning to the surface:** Players use the Rift. It can also send items directly to the player's stash.
**Quests and objectives:** A challenge board may be added, but a conventional quest or narrative-objective system is not currently planned.
**Cave-run length and returning to a known route:** Reaching Z00 from A99 should take at least 3–4 hours when moving as quickly as possible. Run length depends on the cave-reset schedule, which has conflicting answers elsewhere in these notes. Once activated, a Stronghold emits light so it is easier to find after leaving for the surface and returning. Opening a Stronghold disables mob spawning, including shopkeepers, on that level.
**First five minutes:** Complete the tutorial, then explore the Mines.

### Modes

- **Planet and caves:** The main exploration experience.
- **Inkoff:** Competitive team combat with gel delivery and Queen lives.
- **Personal drawing board:** Persistent space at the Camp for drawing.
- **Antenna hub/shared boards:** The latest answers call this planet The Grid and say it provides access to Inkoff and shared boards. Whether The Grid is separate from the main cave planet remains unresolved.
- **Personal homes and PAL:** Earlier ideas that need confirmation before being treated as current features.

**Connected areas:** These are areas within one connected experience, not completely separate modes. Multiplayer features such as Inkoff and shared boards are accessed from the antenna planet. The personal drawing board at the Camp is a tiny physical board. The Grid's identity and the Inkoff access route remain open questions in Section 3.
**Menus and interaction:** Aside from the start menu, interfaces are represented by in-world merchants or robots. Players generally need to walk up to them to interact rather than opening a conventional interface from anywhere.

## 3. World and setting

### The planet

The main adventure is a large planet with the Camp and a cave network. The old daily, seasonal, and white-island structure is scrapped.

The filled-in notes also describe **The Grid**, a small, round neon-circle planet that players can walk around. A merchant stands at the top, with antennas corresponding to boards the player has joined. The merchant lets players join other boards and worlds, and should feel mysterious, knowledgeable, and boastful about its capabilities. The answer says The Grid is a planet, but the notes also describe an antenna planet that hosts multiplayer features. Its relationship to the main cave planet is not yet clear.

{CLARIFY: Is The Grid a separate antenna hub, or is it the same planet that contains the Camp and cave network?}

Other surface landmarks are not currently planned and may be added in a later update. The described round planet is small enough to walk around, and a player becomes upside down when walking around the bottom.

There is no world map or compass. A map beside the Mines shows the cave levels where a player has opened a Stronghold, and signs identify areas.

### The Camp

The Camp is the starting area. Players can draw there, and those drawings are visible to other players. The Camp is divided into servers like the caves, with up to three randomly selected players in each instance.

A droplet character is positioned beside the antenna. {DECIDE: What is the droplet's name and purpose?}

Liv is a merchant who lets players create and edit weapons as long as those weapons are not locked. The Mines entrance is to the left of the Camp. The Pit entrance is to the right; it leads to Inkoff and unlocks after the player meets Que, a quest merchant, in the caves.

The notes also say that multiplayer features such as Inkoff and shared boards are accessed from the antenna planet. The relationship between that hub and The Pit needs clarification before the access route can be finalized.

Players use the Rift (portable stash portal) to leave the cave and return to the surface/Camp. This is a one-way exit for that cave trip, though the Rift can also send items directly to the player's stash.

## 4. Caves, levels, structures, and transitions

### The starting cave

The first cave is intended to be quiet and mostly empty:
- It contains a few ores.
- It has no enemies.
- It has no shopkeepers.
- It introduces the player to cave exploration and resource collection.

Players enter by walking into the Mines. The tutorial comes first, after which new players are expected to explore the Mines. Players cannot skip the tutorial but can replay it. If they fail the drawing puzzle, they can retry. The exact shapes to draw, timing, and allowed attempts are still unspecified.

The first descent leads into a long fall while the game changes cave layer and server instance. The precise puzzle instructions remain to be decided.

### Sections and cave levels

The world is divided into Sections lettered **A through Z**. **A is the highest Section** and **Z is the lowest/deepest**. Each Section contains cave levels numbered from **99 down through 01**. Level **00** connects to the next deeper Section, such as A00 leading onward to Section B. A run starts at **A99**.

A Section is a group of cave levels; the letter identifies the Section and the number identifies a level within it. Exact creature, ore, merchant, and structure spawn rules by cave level are TBD.

### Strongholds

A Stronghold looks like a shrine with a stone-like floor. To activate it, the player hits it and then draws three symbols. If all three symbols are drawn in under three seconds, the player receives one shard.

Once opened, a Stronghold emits light, making it easier to find after leaving for the surface and returning. Opening a Stronghold disables mob spawning, including shopkeepers, on that level. Strongholds can spawn inside Water Caves and all other special biomes.

A Stronghold opens a physical hole that players jump into. It does not take players to a shallower area and does not move an entire party together; players enter the hole individually. The exact destination for the hole is unresolved. The earlier PDF described a random layer destination, while the latest filled answer describes the physical hole but does not specify a destination formula.

{DECIDE: Where exactly does the hole lead? Does it always lead to the next deeper Section, or can it lead to a random deeper level? Provide examples.}

Cave layouts do not use per-instance seeds. The generated layout is the same for all players.

### Cave generation and resets

The cave terrain is randomly generated, and the new layout is shared globally by all players. There are no per-instance cave seeds.

The filled-in answers conflict about the reset interval: one says **weekly**, while another says **bi-weekly**. The interval is not finalized until that contradiction is resolved.

Older notes also describe very large spiral-like cave spaces, gems that can be mined for extra ink, special rooms with extra gems, and lower cave levels that can unexpectedly continue down through a portal. Their current status is unclear, so they are preserved here as ideas to confirm rather than guaranteed features.

{CLARIFY: Is the global cave reset weekly or bi-weekly? The current answers specify both.}
{DECIDE: What happens to players who are still in a cave when the reset occurs?}
{DECIDE: Does the reset regenerate all cave features and ores, or only terrain and layout?}
{DECIDE: Which terrain features are procedural, and which are hand-designed?}
{DECIDE: Can players leave drawings, build structures, or otherwise change cave terrain permanently?}
{DECIDE: Are giant spiral caves, gem deposits, extra-gem rooms, and surprise deeper portals still part of the cave design? If so, how do they work?}

### Cave biomes: Water Cave

The PDF describes a **Water Cave** as a passive cave type:
- It can spawn in levels A through D.
- It is completely flooded.
- Merchants cannot spawn there.
- It is intended to look beautiful.
- Phantom Jelly and Box Jelly are specifically associated with Water Caves in the creature notes.

The precise meaning of levels A through D, and how this fits with A99–Z00, needs clarification.

{DECIDE: Are A through D depth letters, biome tiers, or a different level system from A99–Z00?}  
{DECIDE: How do players move and breathe in a completely flooded cave?}  
{DECIDE: Does flooding alter weapons, ink, movement, visibility, sound, or mining?}  
{DECIDE: What ores, exits, hazards, collectibles, and landmarks appear in Water Caves?}  
{DECIDE: Can players encounter other players there, and can the biome generate in any party's instance?}

### Other rare biomes

The current docs mention rare cave biomes that might replace the normal cave network with a special layout, but their traits are not decided.

{DECIDE: List each planned rare biome, its appearance, spawn depth, probability, unique rule, hazards, creatures, ores, and rewards.}  
{DECIDE: Can a rare biome replace the whole cave network, or only a single layer?}  
{DECIDE: Are there rare biomes beyond Water Cave?}

### Server transitions and shared exploration

The intended descent transition is:
1. The game disconnects the player from the current cave instance.
2. It loads or selects the next layer's terrain.
3. The player connects to the next instance while falling.
4. The fall ends in the deeper cave.

The transition should feel like one continuous descent. Players should naturally see and pass other players while exploring instead of only meeting in lobbies.

{DECIDE: How many players can share one cave instance?}  
{DECIDE: How are groups kept together when a server change occurs?}  
{DECIDE: What happens if a player disconnects, reconnects, or reaches a different instance from a friend?}  
{DECIDE: Can players deliberately join a friend's current layer?}  
{DECIDE: What network-lag or loading screen appears if the next layer is slow to load?}

## 5. Drawing and color system

Drawing is a central mechanic. Players can create their own character appearances, clothes, and artwork.

### Basic editor behavior

The described starting editor uses black and shades of gray. White is the canvas/background, not a normal drawing ink. The player can drag an ink onto a gray or filled region to recolor matching areas. Example: dragging red onto a gray circle can turn that circle red.

The fill system must prevent players from joining separate areas together in order to recolor more than intended. Artwork uses ink based on how much of each color is used. Ink should be common enough that players do not have to worry too much about drawing.

A special gray color called **alloy** has been discussed. It would be a gray region that can be recolored into any chosen ink color, but it is not confirmed.

{DECIDE: Is drawing pixel-based, vector-based, freehand raster, or a combination?}  
{DECIDE: What tools exist in the editor: brush, eraser, fill, line, shapes, selection, move, resize, undo, redo, layers, zoom, and color picker?}  
{DECIDE: How does the system identify matching or connected regions for fill/recoloring?}  
{DECIDE: Does recoloring change only the selected connected region, every region of the same gray shade, or something else?}  
{DECIDE: What stops players from exploiting tiny gaps, disconnected shapes, hidden marks, or huge filled regions?}  
{DECIDE: What is the ink cost formula, including how coverage, color, undo, erasing, and saving affect cost?}  
{DECIDE: Is there an ink cost preview before committing an artwork?}  
{DECIDE: Is alloy part of the final color palette? If yes, how is it obtained and used?}  
{DECIDE: What art resolution, dimensions, file size, layer count, and color limits apply?}  
{DECIDE: Can players duplicate, export, share, copy, or report artwork?}

### Where players can draw

Three drawing destinations are currently described:

1. **Character and clothing editor:** Lets players draw their character's appearance and clothes.
2. **Personal drawing board at the Camp:** Opened through a small glitchy portal/Rift. It is a tiny physical board, and artwork saved here is persistent and does not reset. This board is distinct from the shared boards accessed through the antenna planet; The Grid's relationship to the main cave world still needs confirmation.
3. **Separate drawing planet:** Reached from the surface by using the glitch artifact with a large antenna-like object. Players can draw on boards and similar surfaces there.

Custom-drawn weapon skins were an older idea and are not part of the current plan.

{DECIDE: Which in-world surfaces can be drawn on, and what happens to each drawing after the player leaves?}  
{DECIDE: Are character, clothing, and art canvases different sizes or use different rules?}  
{DECIDE: Can players draw on the terrain in the main world or only on designated boards?}  
{DECIDE: Does the separate drawing planet reset, and can players save drawings there permanently?}  
{DECIDE: What is the final name of the drawing planet and the antenna?}  
{DECIDE: Is the drawing planet public, private, invite-only, or shared with friends?}  
{DECIDE: Can strangers edit, erase, or cover another player's artwork?}  
{DECIDE: What moderation, reporting, and privacy tools are required for player-made art?}

### Character construction and animation

Gesture notes say characters have separate head, arm, leg, and torso parts, with outfits attached to those body parts. Gestures should animate these parts so clothing follows naturally. Paired gestures need enough room, and hugs or kisses require players to stand close before the animation starts.

{DECIDE: What are the exact character body parts, rig, drawing slots, outfit slots, animation rules, and customization limits?}  
{DECIDE: Can body proportions or silhouettes change, or are only surface drawings customizable?}  
{DECIDE: How are character skins displayed to other players before and after a handshake?}  
{DECIDE: What happens if custom art is too large, unreadable, flashing, or visually disruptive?}

## 6. Glitch artifact, stash portal, and drawing planet

### Glitch artifact

A square, glitchy artifact may be found around the second or third cave level. It may instead appear as part of the tutorial, but that placement is undecided. Older notes describe using the artifact with a large antenna at the surface to reach a separate drawing planet. The latest answers name The Grid and describe it as the hub for multiplayer and shared boards; the relationship between The Grid and the main cave planet remains unresolved.

{DECIDE: Is the artifact guaranteed, random, tutorial-only, or a reusable permanent item?}  
{DECIDE: Does it occupy an inventory slot, and can it be lost, dropped, stolen, or destroyed?}  
{DECIDE: What is its name, appearance, audio cue, and lore?}  
{DECIDE: Can one artifact be used by a whole party or only its owner?}

### Opening a stash portal

The current described sequence is:
1. Hold the character's chest for about five seconds. The character starts panting.
2. A glitch effect appears at the cursor.
3. Move the cursor into a wall to open a portal.
4. The portal stays open for about 30 seconds, unless another portal is opened first.
5. Throw items through the portal to send them directly to the player's stash.

The stash mainly holds weapons and special artifacts. Ink and shards can be carried in effectively unlimited amounts and do not need to be stored.

{DECIDE: Does the portal always need a wall, and what walls or surfaces can accept it?}  
{DECIDE: Can the player move, attack, or be interrupted while opening a portal?}  
{DECIDE: Does opening another portal close the first one immediately, even across different players or locations?}  
{DECIDE: Does the 30-second timer pause while an item is thrown?}  
{DECIDE: What happens if an item cannot be stored, the stash is full, or the throw misses the portal?}  
{DECIDE: Is the stash one persistent inventory for each player across all servers and modes?}  
{DECIDE: Can the stash be opened or accessed by another player?}

### Antenna planet and shared boards

The latest notes describe The Grid as a small, round neon-circle planet with a merchant at the top and antennas for boards the player has joined. The player can talk to the merchant to join other boards and worlds. The Grid is described as the access point for multiplayer features such as Inkoff and shared boards. Its relationship to the main cave planet needs confirmation; see the question in Section 3.

{DECIDE: How does the player return from the drawing planet?}  
{DECIDE: Is the drawing planet an explorable social area or only a drawing room?}  
{DECIDE: How are players grouped, and can they visit a specific person's board?}  
{DECIDE: Is player art visible to the public by default or only with permission?}

## 7. Resources and economy

### Ink

Ink is a primary resource. It is used for:
- Drawing and recoloring artwork.
- Weapon attacks and secondary abilities.
- Mining and interactions tied to weapons or ores.
- Other color-linked effects, depending on the player's selected ink and mode.

Ink should be sufficiently common that drawing remains fun instead of feeling too expensive. Players can carry effectively unlimited ink in the current concept.

{DECIDE: How is ink collected outside Inkoff, and is the amount held per color or as one total meter?}  
{DECIDE: Do ores have fixed colors, random colors, or selectable yields?}  
{DECIDE: What are the exact mining times, tool requirements, drops, and respawn rules?}  
{DECIDE: Can ink be traded or gifted, even though teammate slashing-transfer is no longer planned?}

### Shards

Shards are the current currency. Colored shards and separate item unlock tokens are no longer part of the plan. Shards are used to lock weapon combinations and may also be used for shop purchases and upgrades. A possible cost of one shard for adding a friend appeared in earlier notes, but it is not confirmed.

{DECIDE: How are shards earned, what are the expected rates, and which systems spend them?}  
{DECIDE: Are shards shared across exploration and Inkoff or kept in separate mode economies?}  
{DECIDE: Can players lose shards on death?}  
{DECIDE: Are purchases permanent, refundable, tradeable, or account-bound?}

### Heart Points

Heart Points is the current working name for a friendship currency separate from shards. Helping others, such as healing them, has been suggested as a way to earn it. The eligible actions, amounts, and uses are not decided.

{DECIDE: Is Heart Points the final name?}  
{DECIDE: How can it be earned and spent, and can it be farmed or transferred between players?}

### Other currency or drops

The creature notes say Phantom Jelly drops some shards when it sees a player. The details of other creature drops, ore drops, merchant prices, match rewards, and art-sale currency are not finalized.

{DECIDE: Are there any additional currencies, rare materials, crafting components, or collectibles?}  
{DECIDE: What are the standard, rare, and guaranteed reward rates?}

## 8. Ink colors and their effects

The four ink colors discussed are red, blue, green, and yellow. These are broad role goals, not final balanced stats.

- **Red:** linked to healing or survivability.
- **Blue:** increases damage.
- **Green:** improves luck or rewards.
- **Yellow:** no confirmed effect. Extra crystals or rewards and shorter cooldowns have both been suggested, but neither idea is final.
- **Black:** an optional harder challenge. It needs a clear warning and a real disadvantage, but the penalty is not decided.
- **White:** white is the drawing canvas/background, not a normal drawing ink. The old white emergency ore idea in Inkoff is scrapped.

{DECIDE: Are red, blue, green, and yellow the only regular ink colors?}  
{DECIDE: Does a color change every ability, only selected abilities, or one passive stat?}  
{DECIDE: What is the exact effect and numerical strength of red, blue, green, and yellow?}  
{DECIDE: What does black ink penalize: ink use, cooldown, damage, ability strength, rewards, or something else?}  
{DECIDE: Does the black-ink warning appear every time, only on first use, or in another way?}  
{DECIDE: Can a player change ink colors during exploration or a match? How?}  
{DECIDE: Do the visual color choices meet color-blindness and readability needs?}

## 9. Weapons, parts, upgrades, and mining

### Weapon parts

A weapon has three parts:

- **Blade:** determines the primary attack.
- **Handle:** determines the secondary ability.
- **Amulet:** provides passive benefits and determines the Queen's projectile pattern in Inkoff.

The amulet is a real weapon part, not only a Queen accessory. In the normal weapon, it sits where the blade meets the handle. In Inkoff, it also appears on the Queen's chest and influences projectile behavior.

### Locking a weapon

Players choose a blade, handle, and amulet, then spend shards to lock that combination. A locked weapon can be upgraded and used in modes such as Inkoff, but its parts cannot normally be edited afterward. Trap can attempt to split a locked weapon apart by completing his challenge twice.

{DECIDE: What is the exact shard cost to lock a weapon?}  
{DECIDE: What is the weapon inventory limit, and can players own duplicate combinations?}  
{DECIDE: How are new blades, handles, and amulets acquired?}  
{DECIDE: What stats exist on each part, and which parts influence damage, range, cooldown, mining speed, movement, and ink consumption?}  
{DECIDE: How many upgrade levels exist, what currency is spent, and which stats change at each level?}  
{DECIDE: Can a locked weapon be renamed, repaired, reset, or permanently lost?}  
{DECIDE: Does locking permanently bind the combination, or can it later be changed through another system?}

### Example weapon: The Steady

The Steady is an early weapon concept:
- It is shaped mostly like a blade, with a comically small handle.
- A line down the blade changes to match the player's ink color, with a dot as an additional detail.
- Its primary attack is a normal melee slash.
- Its secondary ability is a grappling hook that attaches to a distant point and pulls the player toward it.
- The grapple is mainly for movement, not long-range damage, although it may deal a tiny amount of damage on contact.
- It uses more ink than a normal slash and has a short recharge.

{DECIDE: Is The Steady a confirmed weapon or only an example?}  
{DECIDE: What range, travel speed, collision rules, damage, ink cost, and cooldown does its grapple use?}  
{DECIDE: What happens if the target point is invalid, an enemy blocks the hook, or the player is interrupted mid-pull?}

### Ink consumption and recharging

Attacks use ink. Earlier notes suggested weapon stats determine how many hits or uses a charge lasts and that secondary abilities usually cost more ink than primary attacks. When a charge runs out, the weapon briefly recharges. Exact ink use, refill rules, and upgrade effects are not decided.

{DECIDE: Is ink spent per hit, per attack, per projectile, or through a continuous meter?}  
{DECIDE: What does “charge” mean in the final system, and how many uses are available before recharging?}  
{DECIDE: Can a player recharge while moving, mining, drawing, carrying gel, or being attacked?}  
{DECIDE: How are attack hitboxes, hit-stun, invulnerability, knockback, and damage numbers determined?}  
{DECIDE: Can attacks damage terrain, other players, creatures, ores, and structures, and under what rules?}

### Mining

Weapons can also mine ores. A very slow, low-damage starter pickaxe was suggested, but whether it remains part of the opening game or is provided by YAP at the Camp is unclear.

{DECIDE: Is mining done with the equipped weapon, a dedicated tool, or both?}  
{DECIDE: Are different ores resistant to different blades or abilities?}  
{DECIDE: Can enemies interrupt mining, can mining attract creatures, and can mined resources be stolen?}  
{DECIDE: Does ore respawn on a timer, when players change layers, or during cave resets?}

### Custom weapon skins

Custom-drawn weapon skins with transparent marker requirements appeared in older notes but are explicitly not part of the current plan. The older concept required art to cover the center of every transparent marker on the weapon and handle editor. Do not treat this as a planned feature unless it is deliberately reinstated.

## 10. Merchants

Merchants are special characters players can interact with to buy items or services. The original notes say all merchants know each other, although it is not clear whether they want to talk about that. The current notes also name **Liv**, who lets players create and edit unlocked weapons, and **Que**, a quest merchant whose meeting unlocks The Pit. An unnamed merchant stands at the top of The Grid and connects players to other boards and worlds; it should seem mysterious, knowledgeable, and boastful about its capabilities. A droplet character is positioned beside the antenna, but its name and purpose are not specified.

The current direction says deeper layers are more likely to contain merchants, while the first cave has none. When the PDF provides a specific spawn rule that differs from an older repository note, use the PDF's rule.

### YAP

**Appearance:** The original merchant description gives YAP a plus sign over his right eye and a sticky note marked with an X over his left eye.

**YAP's four shop items:**
- One random blade with no tonic or other buff.
- One random handle with no tonic or other buff.
- One random amulet with no tonic or other buff.
- One completed weapon. Some completed weapons can have a tonic applied; a tonic is a buff. The separate blade, handle, and amulet items cannot have buffs.

Players tip YAP with any color of ink to try to summon him. Each tip has a 10% chance to spawn him. The PDF says he appears at A1 and lower; what “lower” means must follow the level-numbering rules. Items are bought with shards. The tonic effects and duration are not described.

{DECIDE: What amount of ink counts as one tip?}  
{DECIDE: Does YAP appear at A1 and lower, and what does “lower” mean in the level numbering system?}  
{DECIDE: What are the prices for the completed weapon, blade, handle, and amulet?}  
{DECIDE: What do tonics do, how are they applied to a completed weapon, and do they expire?}  
{DECIDE: Does YAP sell starter gear at the Camp, and does he interact with the player before the first cave?}  
{DECIDE: What are his dialogue, personality, animation, sound, and relationship with Trap and other merchants?}

### Trap

Trap offers a risky service to separate a locked weapon into its three parts. The original description gives him a bright smile with sharp teeth and a sticky note covering his left eye, marked with a target.

The player puts a locked weapon into a machine, clamps it into place, signs a contract, and begins a challenge. The machine holds the weapon on both sides of its handle. The amulet is shown on one side and the other weapon part on the other. The machine resembles a revolver. The player must win twice to fully separate the weapon into three parts. The two-stage challenge is intentional.

The authoritative PDF version of the challenge is:
1. A six-slot barrel is shown with a glowing marker in the top slot.
2. The barrel spins, and five numbers appear one after another in a light-blue glowing font.
3. The player uses the sequence to work out the answer: move the first number clockwise from the top, then the next number counterclockwise from that position, and continue alternating in this fashion.
4. The player can choose to respin or guess the top or bottom barrel. The older repository notes specify that respinning costs 10 ink; that cost is retained because the PDF does not contradict it.
5. The revolver points at the player and spins for 10 seconds, then fires every three seconds with a one-in-six chance of killing the player.
6. Entering the challenge costs 2 shards.
7. The player must win twice to separate the weapon into three parts.

Use this PDF timing and six-slot layout instead of the older repository version, which described a 60-second deadline, five revolver ticks ten seconds apart, and a guaranteed fatal shot. The exact number of shots, stopping condition, and a worked example of the alternating-number puzzle are not fully specified.

The PDF says Trap appears at G and lower. Current repository notes only say deeper cave layers, with merchants more likely farther down.

{DECIDE: What is Trap's exact spawn threshold, and does he spawn in Water Caves?}  
{DECIDE: What are the exact five displayed numbers, and what does the clockwise/counterclockwise rule ask the player to calculate? Give a solved example.}  
{DECIDE: After the initial 10-second spin, how many shots can occur, what ends the challenge, and can the player continue guessing between shots?}  
{DECIDE: How does the one-in-six death chance work in practice, and what happens if the player survives the shot sequence?}  
{DECIDE: What does failure cost beyond the 2-shard entry fee: the weapon, shards, ink, time, or nothing else?}  
{DECIDE: What does a successful first stage split or change? What happens if the player wins once but fails the second stage?}  
{DECIDE: Is the 10-ink respin cost still correct, and can the player respin more than once?}  
{DECIDE: What does signing the contract mean in gameplay and story terms?}

## 11. Creatures and cave encounters

The first cave has a few ores but no enemies or shopkeepers. More creature types may appear as players go deeper. Creature spawn frequency, full behavior, and difficulty scaling remain unfinished.

### Scribble Spider

**Source level:** Creature level 3.  
**Behavior and tone described in the PDF:**
- Incredibly dangerous and fidgety.
- Runs away when damaged too much, so it is not recommended to kill.
- Can hang from almost anywhere as long as it is holding on with one limb.
- Stalks the player.
- Has a horror-oriented feel.

{DECIDE: What are the spider's exact movement, attack, health, damage, detection range, and escape behavior?}  
{DECIDE: What happens if it is killed, escapes, or loses track of a player?}  
{DECIDE: What are its loot, spawn depths, frequency, audio cues, warning cues, and counterplay?}  
{DECIDE: Is level 3 a creature difficulty tier, a cave level, or something else?}

### Phantom Jelly

**Source level:** Creature level 4, labeled passive in the PDF.  
**Behavior described in the PDF:**
- Found in Water Caves.
- When it sees the player, it drops some shards.

{DECIDE: What makes the Phantom Jelly notice a player, and does it drop shards once per encounter, per player, or on a timer?}  
{DECIDE: Can players attack, touch, or scare it?}  
{DECIDE: What does its appearance, glow, movement, sound, rarity, and shard drop amount look like?}  
{DECIDE: Why is it level 4 if it is passive, and what does the level number mean?}

### Box Jelly

**Source level:** Creature level 1, labeled passive in the PDF.  
**Behavior described in the PDF:**
- Spawns in Water Caves.
- Does nothing.
- Glows and looks cool.
- The notes explicitly say it is **not** based on the real-world box jellyfish; it is based on an immortal jellyfish.

{DECIDE: Does the Box Jelly have any gameplay interaction beyond being a glowing ambient creature?}  
{DECIDE: Can players collect, touch, move, photograph, or otherwise interact with it?}  
{DECIDE: What do its art style, movement, glow, rarity, and sound look like?}

### Additional creatures

The current creature overview leaves the full roster open, including which creatures are friendly, neutral, or hostile, their depth bands, and whether special biomes contain their own creatures.

{DECIDE: List the full intended creature roster and give each creature a level/tier, behavior, danger rating, spawn rule, loot, and counterplay.}  
{DECIDE: Can creatures attack one another or merchants?}  
{DECIDE: Do creatures respawn after being defeated or after players change layers?}  
{DECIDE: What happens to difficulty if players return to an earlier cave layer?}

## 12. Inkoff: competitive team mode

Inkoff is a team competition with two ways to win: fill the team's base with gel or take all three lives of the opposing Queen. The older core-stone-only win condition is no longer current.

### Teams, roles, and Queen selection

Each team has a Queen and Workers. The Queen is randomly selected. Everyone starts the match with the same amount of ink. Players can mine ores during a match to get more ink.

The Queen has three lives. When a Queen dies, the game clearly indicates the death, waits a short time, then respawns the Queen at their base and removes one life. Losing all three Queen lives causes the team to lose.

{DECIDE: How many players are on a team, and how many teams are in a match?}  
{DECIDE: Is Queen selection random from the whole team, or does the player opt in or opt out?}  
{DECIDE: Can a Queen change roles, leave the match, or disconnect?}  
{DECIDE: What is the match length, arena size, team balancing method, matchmaking method, and tie rule?}  
{DECIDE: What are the Queen death delay, respawn animation, and temporary protection period?}  
{DECIDE: What happens when a player disconnects or the team is uneven?}

### Worker ink depletion

Running out of ink causes death:
- **Worker:** immediately respawns.
- **Queen:** loses one of three lives.

Workers respawn after ink depletion, but whether a Worker respawns with ink is undecided. The Queen's ink-depletion death consumes a Queen life.

No white emergency ore is planned, and slashing a teammate does not transfer ink.

{DECIDE: Does a Worker respawn with zero, partial, or full ink?}  
{DECIDE: Does running out of ink count as an elimination for score, rewards, statistics, or streaks?}  
{DECIDE: Does a Queen respawn after ink depletion follow the same delay and protection rules as other deaths?}  
{DECIDE: What prevents spawn camping?}

### Gel delivery victory

Workers collect gel by slashing a piece of gel once. The gel floats above the carrier's head so other players can see who has it. The Worker carries it back and jumps into the team's base to fill a hole. Each deposited gel fills one hole. Filling all holes in the base is enough to win the match. If a carrier is killed, their dropped gel can be stolen.

The base is hexagon-style and contains multiple holes. The gel is the delivery resource, not ink.

{DECIDE: How many holes does each base have?}  
{DECIDE: Where does gel spawn, how much appears, how quickly does it respawn, and can the opposing team steal it before pickup?}  
{DECIDE: Can a player carry more than one gel?}  
{DECIDE: Can gel be dropped voluntarily, destroyed, or blocked from pickup?}  
{DECIDE: What happens if gel is carried when the match ends or the carrier disconnects?}  
{DECIDE: Can an attack interrupt mining or gel pickup?}  
{DECIDE: Does depositing gel trigger an animation, sound, score event, or team notification?}

### Queen combat and appearance

The Queen can fly and uses a gun-like version of their equipped sword. The amulet sets the projectile pattern and damage behavior. The Queen version of the weapon includes the amulet on the chest. The Queen's look includes wings and a crown, halo, or demon horns depending on the amulet.

Queen projectiles do not damage the opposing Queen. Queens can fight each other using melee sword attacks. Friendly fire is off.

The handle still determines the secondary ability, but the Queen version of that ability is not yet designed.

{DECIDE: How does flight work, including acceleration, stamina or duration, turning, and landing?}  
{DECIDE: What are the Queen's projectile speed, damage, spread, range, ink cost, and cooldown?}  
{DECIDE: How do the amulet's passive bonus and projectile pattern interact?}  
{DECIDE: What is the Queen's handle ability, and how does it differ from the Worker version?}  
{DECIDE: Can Workers damage their own Queen, and can the Queen damage their own team through effects or knockback?}  
{DECIDE: What are the exact melee rules for Queen versus Queen?}

### Black ink in Inkoff

Black ink is an optional harder challenge and needs a clear warning. The penalty is not decided. Possible penalties mentioned in the notes include higher ink use, longer recharge, lower damage, or weaker abilities. Whether it affects match rewards is undecided.

{DECIDE: What black-ink penalty applies in Inkoff?}  
{DECIDE: Is the penalty visible to opponents, and do opponents receive any reward for facing a black-ink player?}

### Scoring and rewards

Eliminations are intended to give more score or rewards. The exact scoring system is not specified.

{DECIDE: What actions award points, currency, statistics, or post-match rewards?}  
{DECIDE: How are gel deposits, Queen damage, Queen eliminations, Worker eliminations, mining, and support actions scored?}  
{DECIDE: Are rewards shared across the team or individually assigned?}  
{DECIDE: Is there a ranking, rating, season, or casual queue?}  
{DECIDE: How are ties, match abandonment, and repeated matchmaking abuse handled?}

### Inkoff maps and resources

Players can mine ores to refill ink, and the match is expected to begin with equal ink. The quantity of starting ink, ore yields, ore distribution, mining speed, and respawn rules have not been decided.

{DECIDE: What are the arena layout, routes, vertical platforms, spawn locations, base distance, and map rotation?}  
{DECIDE: How many ores exist, where do they spawn, and how long do they take to mine?}  
{DECIDE: Can a player keep mining while taking damage?}  
{DECIDE: Is close-friend health regeneration disabled in Inkoff?}  
{DECIDE: Which exploration weapons, colors, abilities, and upgrades are allowed or adjusted in Inkoff?}

## 13. Social play, friendship, and Passions

### Natural encounters

Players may meet, pass one another, or continue traveling together during cave exploration. The social flow is inspired by the feeling of sharing a journey in Sky: Children of the Light, but the game is a 2D planet-and-cave game with player-drawn characters and its own systems. The intent is inspiration, not an exact copy.

A handshake can show or reveal another player's custom character skin. Adding someone as an acquaintance places them in the **Connection Constellation** and unlocks the classic handshake.

{DECIDE: What exact interaction is required to add an acquaintance, and must both players agree?}  
{DECIDE: Can players hide, block, mute, report, or avoid other players?}  
{DECIDE: How does the Connection Constellation look and work?}  
{DECIDE: Are there limits on friends, acquaintances, recent players, or blocked users?}

### Friendship progression

Friendship uses a branching tree. Costs and level requirements are not final.

The currently described friendship path includes:
- **Friend:** add someone to a friends list. A one-shard cost was suggested but is not confirmed.
- **Acquaintance:** add someone to the Connection Constellation and unlock the classic handshake.
- **Friendship actions:** possible unlocks include hand-holding, guiding, chatting, piggybacking, and custom greetings.
- **Shared upgrades:** both players must agree before a shared friendship-tree upgrade takes effect.
- **Romantic partners:** a short, optional friendship-tree branch that requires both players to agree. Each player can have one romantic partner at a time, and any number of ordinary friends.

{DECIDE: What are all friendship levels, branches, costs, and unlock requirements?}  
{DECIDE: Is becoming a Friend different from becoming an Acquaintance, and what can each status do?}  
{DECIDE: Are friendship upgrades shared, individual, or a mix?}  
{DECIDE: How are friendship upgrades reset, revoked, or restored after a breakup or block?}

### Passions menu and paired actions

**Passions** is the name of the social-action and emote system. One player starts a paired action from the Passions menu. The other player confirms by approaching and pressing the relevant button. There is no separate accept/decline popup. If the other player does not approach and confirm, the paired action does not happen.

Players can choose a special greeting in settings. When meeting their romantic partner, they can walk up and start the greeting so both players' custom skins are shown. The other player approaches and presses confirm before the paired gesture plays. The player may be able to customize the greeting with a chosen gesture and a short flourish.

Possible actions include handshake, holding hands, guiding, chatting, piggybacking, special greetings, and other gestures.

{DECIDE: What are the exact controls, interaction distance, action duration, confirmation window, and cancel behavior?}  
{DECIDE: Can a paired action be declined without an explicit popup, and how is that shown respectfully?}  
{DECIDE: What happens if either player moves away, gets attacked, changes layer, or disconnects during an action?}  
{DECIDE: Which actions are available to strangers, acquaintances, friends, and partners?}  
{DECIDE: Can players customize gesture timing, flourishes, or access shortcuts?}

### Romantic-partner path

The partner option is an optional branch. Both players must agree to the proposal or upgrade, and each player can have one romantic partner at a time.

Becoming partners unlocks the special greeting immediately. Planned gesture order:
1. **Special bow:** the first gesture, available when the partnership starts.
2. **Hand-to-heart:** unlocked later.
3. **Hug:** unlocked later.
4. **Kiss:** unlocked after the others.

Either partner can end the partnership after a confirmation prompt. The other person's partner-related gestures and upgrades remain visible but become greyed out and unusable for the former partner. The rules for starting a new partnership after a breakup are not set.

{DECIDE: What unlocks each gesture and are later gestures bought with Heart Points, progression, or both?}  
{DECIDE: Is there a cooldown or waiting period after a breakup?}  
{DECIDE: What happens to shared unlocks if one partner removes the other, blocks them, or deletes their account?}  
{DECIDE: Are partner status and the gestures purely social, with no other gameplay rewards?}

### Gesture animation concepts

These are ideas, not final animation specs:
- **Special bow:** a distinct bowing pose, with no extra particles.
- **Hand-to-heart:** the character places a hand over their chest; a hand-drawn heart pulses once.
- **Hug:** both characters move into an embrace. A few ink droplets orbit them once, using both players' ink colors.
- **Kiss:** the characters lean together. A heart-shaped ink mark appears between their faces, floats upward, and fades.

Nearby players can see the effects. Colors should blend the two players' inks. Effects may become more noticeable as friendship grows, but the amount is undecided. The bow may last about one second and the kiss about four seconds. These are rough ideas only.

{DECIDE: Are these animation concepts still part of the plan?}  
{DECIDE: What are final animation timings, camera behavior, sound effects, and accessibility options?}  
{DECIDE: Which gestures can be cancelled by walking away, and what happens if someone disconnects mid-gesture?}

### Health when friends are close

When two players reach the friendship level where the romantic-partner option unlocks, both slowly regain health while nearby, whether or not they become partners. A heart appears on each player's chest and beats while the players are close. Romantic-partner status itself is not meant to affect Inkoff, but it is undecided whether this close-friend healing effect works in Inkoff.

{DECIDE: What is the healing rate, distance, cooldown, and maximum benefit?}  
{DECIDE: Is the effect active in caves, all modes, and Inkoff?}  
{DECIDE: Can players receive the effect from several friends at once?}

### Gifts

The earlier idea of sending shard pieces as a daily gift is no longer preferred. A replacement gift system is undecided, and direct gifts must be accepted by the recipient.

{DECIDE: What can be gifted, how often, and at what cost?}  
{DECIDE: Can gifts be refused, returned, or blocked?}  
{DECIDE: Is the gift system separate from Heart Points?}

## 14. Homes, props, badges, and PAL

These features appeared in earlier notes, but whether they are still planned in the current world structure needs confirmation.

### Player homes

An older concept gave each player a personal home that also served as the normal spawn point. Players could draw on it, place props and badges, and show artwork and achievements to visitors.

{DECIDE: Are personal homes still planned?}  
{DECIDE: Are homes separate instances, rooms on the planet, or part of the Camp?}  
{DECIDE: Do homes replace the Camp as a normal spawn, or are they optional?}  
{DECIDE: Can players visit friends' homes, invite specific people, or make a home public?}  
{DECIDE: What can be drawn, placed, rearranged, saved, or removed in a home?}  
{DECIDE: What privacy, moderation, and visitor controls are needed?}

### Passionate Art Lineup (PAL)

**PAL** stands for **Passionate Art Lineup**. The older idea was a seasonal and yearly art event in which players submit art. Selected winners' work could be offered for purchase and displayed in player homes. Opening a display would show the artwork, title, and artist's name. The artist might receive in-game currency when the work sells.

The judging/voting method, winner count, prices, payout, submission periods, and availability are undecided.

{DECIDE: Is PAL still planned?}  
{DECIDE: Who can submit, how is artwork reviewed, and how are winners selected?}  
{DECIDE: How are artist credit, pricing, sales, currency payouts, copyright, and moderation handled?}  
{DECIDE: Are events seasonal, yearly, or another schedule?}  
{DECIDE: Can winners' art be displayed or purchased outside the event period?}  
{DECIDE: What safeguards prevent offensive art, copied art, impersonation, or manipulation of votes?}

## 15. User interface, audio, accessibility, and safety

The existing notes do not yet specify a complete interface, sound system, accessibility plan, or player-safety system. These are important design areas to complete before implementation.

### Interface and controls

{DECIDE: What are the keyboard, controller, touchscreen, cursor, and mobile controls?}  
{DECIDE: What HUD elements exist in exploration, drawing, shops, friendship interactions, and Inkoff?}  
{DECIDE: How are ink amounts, cooldowns, health, shards, gel, Queen lives, friendship status, and objectives shown?}  
{DECIDE: Are menus diegetic/in-world, conventional menus, or a combination?}  
{DECIDE: What settings exist for remapping controls, interface scale, subtitles, motion, flashing effects, and visual clarity?}

### Audio and visual direction

Current notes reference blue static and a revolver cue for Trap, panting and glitch effects for the stash portal, a heart beat for close-friend healing, creature sounds, and colorful ink effects. The inspirations notes also propose that deeper scenery might become more 3D-looking while the player remains 2D; this is a visual direction idea, not a confirmed requirement. The overall sound and art bible is not defined.

{DECIDE: What is the overall art direction, line style, animation style, lighting, and color palette?}  
{DECIDE: What is the sound direction for the Camp, caves, Water Caves, Strongholds, drawing, mining, combat, creatures, merchants, and Inkoff?}  
{DECIDE: Which effects need intensity controls or reduced-flashing settings?}  
{DECIDE: Will there be music, voice acting, environmental storytelling, or text-only dialogue?}

### Accessibility

{DECIDE: What accessibility options are required for color blindness, hearing, motor control, reading, motion sensitivity, and low vision?}  
{DECIDE: Can players adjust text size, contrast, animation speed, effects, and timing-sensitive puzzles?}  
{DECIDE: Is the drawing system usable with keyboard, controller, touchscreen, and assistive input?}

### Player safety and moderation

Player-made art, public drawings, social interactions, paired gestures, and direct gifts will need rules and player controls.

{DECIDE: What reporting, blocking, muting, privacy, and anti-harassment tools exist?}  
{DECIDE: What art content is prohibited, and how is it moderated?}  
{DECIDE: How are names, chat, public boards, private boards, and user-generated content filtered?}  
{DECIDE: Can users opt out of romantic-partner features or specific gestures?}  
{DECIDE: How are account data, saved art, and private spaces protected?}

## 16. Progression, saving, and accounts

The current notes do not describe a complete progression or account system. Weapon locking and upgrades, cave depth, friendship trees, and resource collection imply several forms of progression, but how they connect is not settled.

{DECIDE: Is progression mostly account-wide, character-specific, per-run, or mode-specific?}  
{DECIDE: What persists after dying, leaving a cave, switching servers, or ending an Inkoff match?}  
{DECIDE: Which items, resources, drawings, relationships, and upgrades are saved to the player's account?}  
{DECIDE: How does the game save, restore, or version a player's drawings?}  
{DECIDE: What happens if save data becomes corrupted or two devices make conflicting changes?}  
{DECIDE: Are there levels, ranks, achievements, badges, titles, quests, or unlock tracks?}  
{DECIDE: Are there account names, profiles, privacy settings, and cross-platform accounts?}

## 17. Monetization and live operations

The existing design notes do not specify monetization, subscriptions, paid cosmetics, advertising, downloadable content, or a business model. Do not assume any of these are planned.

{DECIDE: Is the game free, paid once, or supported by another model?}  
{DECIDE: Will there be any paid items, cosmetics, currency, DLC, or other purchases?}  
{DECIDE: If purchases exist, how will the design avoid pay-to-win effects and protect younger players?}  
{DECIDE: Is the world updated on a schedule, and who creates or reviews seasonal content?}  
{DECIDE: What schedule governs PAL events, and how does the global cave reset interact with live operations?}

## 18. Technical and production requirements

The concept depends on multiplayer servers, procedural or randomized caves, drawing tools, saved user-generated content, transitions between server instances, and competitive networking. Technical choices have not yet been documented.

{DECIDE: Which engine, scripting language, backend, database, hosting approach, and networking model will be used?}  
{DECIDE: What is the target player count per cave instance and per Inkoff match?}  
{DECIDE: How are cave seeds generated, stored, versioned, and synchronized?}  
{DECIDE: How are players kept together across layer transitions and how is loading hidden?}  
{DECIDE: How are drawing data compressed, validated, moderated, saved, and synchronized?}  
{DECIDE: What is the target frame rate, resolution, minimum device specification, and network-latency tolerance?}  
{DECIDE: What is the plan for anti-cheat, server authority, exploits, backups, and service outages?}  
{DECIDE: What are the first prototype milestones and the minimum playable version?}

## 19. Inspirations and originality rules

These references are recorded as sources of broad inspiration, not permission or a plan to copy their content.

| Reference | Broad design inspiration | Distinction for this game |
|---|---|---|
| Sky: Children of the Light | Shared travel, calm exploration, wonder, meeting strangers, environmental storytelling, character customization | A 2D planet and cave network built around player-drawn characters and ink |
| Procreate | Direct drawing, color, detail, layers, revisions | Drawing is integrated into a multiplayer game and ink economy |
| Animal Company | Dangerous underground exploration, resource gathering, equipment progression, hub-to-adventure flow | A 2D cave world with ink, weapon parts, and original merchants |
| DOORS | Escalating tension through lighting, sound, uncertainty, and deeper areas | Original cave layouts, creatures, names, and scares |
| Killer Queen Black | Queen with three lives, worker deliveries, multiple victory conditions | Gel delivery and Queen elimination, without the snail objective |
| Stick Fight: The Game | Readable 2D combat and temporary transformation/flight | Queen design and abilities are tied to this game's weapon and amulet systems |
| Minecraft Bridge-style minigames | Compact routes and pressure toward an enemy side | Inkoff emphasizes gel, Queen lives, ink-powered abilities, and its own maps |
| PHIGHTING! | Menus connected to world and character personality | Original ink/cave visual language and clear accessible menus |

Keep characters, maps, levels, creature designs, assets, sound, writing, interface, and other expressive details original. The design target is to learn from broad mechanics and feelings, not to reproduce another game.

{DECIDE: Are there any inspirations to add, remove, or clarify?}  
{DECIDE: What visual or mechanical elements must be specifically avoided to keep the game distinct?}

## 20. Retired, parked, or historical ideas

The following ideas appear in older notes. Explicitly scrapped ideas are not part of the current plan unless deliberately restored; less certain older ideas are kept here so their details are not lost.

### Older island and color-source plan (scrapped)

- The old default island was meant to contain a little of every ink color and reset daily for each player.
- The old seasonal island was meant to change its main color by season and reset daily: winter used blue shades, fall used orange/red, spring used green/yellow, and summer used pink or party colors.
- The old white island began pale white. Dropping a chosen ink into its center caused that color to spread and become the island's primary color, making the island a source of extra amounts of that ink.
- This entire island-based resource structure is scrapped in favor of the large planet and cave system.

### White emergency ore in Inkoff (scrapped)

An older idea said a white gemstone/ore would appear only when a player's Inkoff ink reached zero. It would be visible only at that moment, and mining it would switch the player's ink to white. White could not later be equipped normally, and the player would receive no ink return or end-of-match ink reward for it. This emergency fallback is not part of the current plan.

### Older weapon skin idea (not current)

An earlier idea let players pay extra money to use their own drawn weapon design after the weapon or set reached maximum level. The editor would show 50%-transparent dots or lines over the weapon and handle, and the center of every marker had to be covered by the player's art to prevent invisible skins. Custom-drawn weapon skins are not part of the current plan.

### Earlier Inkoff stone objective (not current)

An older objective used protected stones: each team had a final stone behind a force field and three other stones around the map. The outer stones had to be destroyed first, then the final stone could be attacked to win. The current plan instead uses gel deposits to fill the team's base or eliminate all three of the opposing Queen's lives.

Other retired rules include:
- Daily, seasonal, and white islands as the main world structure.
- White emergency ore in Inkoff, including the old rule that it only appears when ink reaches zero and cannot later be equipped normally.
- Colored shards and separate item-unlock tokens.
- Giving teammates ink by slashing them.
- The old core-stone-only Inkoff win condition.
- Custom-drawn weapon skins using transparent marker requirements.
- Treating black ink's effect on match rewards as decided.
- The old idea that the player makes a custom weapon skin after reaching maximum level.
- The previous island-based color-source and daily reset systems.

{DECIDE: Is anything else from an older document explicitly scrapped, or should any retired idea be reconsidered?}

## 21. High-priority decisions checklist

Work through these first if the goal is to make the design implementable.

### World and cave rules
- {DECIDE: Define the exact destination rule for the physical hole opened by a Stronghold.}
- {CLARIFY: Confirm whether the shared global cave reset is weekly or bi-weekly, and what happens to players currently in caves.}
- {DECIDE: Define how players return to the surface and stay together across server changes.}
- {DECIDE: Define Water Cave movement and the meaning of its A–D spawn levels.}

### Drawing rules
- {DECIDE: Specify editor tools, layers, undo/redo, saving, resolution, and input methods.}
- {DECIDE: Specify exact fill/recolor behavior and how connected-region exploits are prevented.}
- {DECIDE: Specify the ink-cost formula and whether alloy exists.}
- {DECIDE: Define public/private drawing rules and user-generated content moderation.}

### Economy, weapons, and merchants
- {DECIDE: Define exact ink and shard sources, rates, costs, and persistence.}
- {DECIDE: Define each ink color's exact effect, including yellow and black.}
- {DECIDE: Define weapon stats, ink consumption, cooldowns, upgrades, and part acquisition.}
- {DECIDE: Confirm whether the starter pickaxe exists and where it comes from.}
- {DECIDE: Define YAP's tip amount, item prices, and tonic effects/duration.}
- {DECIDE: Define Trap's exact puzzle answer method, shot sequence end condition, failure penalties, and two-stage result.}

### Creatures
- {DECIDE: Specify full Scribble Spider behavior and its attack/counterplay.}
- {DECIDE: Define how Phantom Jelly detects players and drops shards.}
- {DECIDE: Decide if Box Jelly has any gameplay interaction.}
- {DECIDE: List the planned creature roster, depth bands, and spawn probabilities.}

### Inkoff
- {DECIDE: Specify match size, map layout, team selection, spawn protection, and match timing.}
- {DECIDE: Specify starting ink, ore values and respawn, Worker ink after respawn, and gel spawn/respawn.}
- {DECIDE: Specify Queen flight, weapon stats, handle ability, and exact life-loss rules.}
- {DECIDE: Define scoring, rewards, and whether friendship healing works in Inkoff.}

### Social and optional systems
- {DECIDE: Define friendship levels, Heart Points, gesture unlocks, gifts, and breakup cooldown.}
- {DECIDE: Confirm or retire homes and PAL; if kept, define privacy, judging, payouts, and moderation.}
- {DECIDE: Define UI/controls, accessibility options, player safety, technical targets, progression, saving, and release scope.}

## 22. Supporting documents and how to use them

This master document is the main readable specification. Supporting notes provide focused detail:
- [Project Overview](PROJECT_OVERVIEW_AI.md): short system overview.
- [World and Caves](WORLD_AND_CAVES_AI.md): world, Camp, layer transitions, and exploration.
- [Creatures](CREATURES_AI.md): creature and biome reference.
- [Drawing and Glitch Artifact](DRAWING_AND_GLITCH_AI.md): editor, artifact, stash portal, and drawing planet.
- [Weapons and Ink](WEAPONS_AND_INK_AI.md): parts, colors, weapons, mining, and economy.
- [Inkoff](INKOFF_AI.md): competitive mode.
- [Social and Friendship](SOCIAL_AND_FRIENDSHIP_AI.md): player encounters and friendship progression.
- [Passions and Gestures](FRIENDSHIP_ACTIONS_AI.md): paired actions and animation ideas.
- [Homes and PAL](HOMES_AND_PAL_AI.md): optional older home and art-event concepts.
- [YAP](YAP_AI.md): YAP merchant notes.
- [Trap](TRAP_AI.md): Trap merchant challenge.
- [Inspirations](INSPIRATIONS_AI.md): reference games and originality guidance.
- [Design Decisions and Open Questions](DECISIONS_AND_OPEN_QUESTIONS_AI.md): shorter decision tracker.
- [Merchant Reference](MERCHANTS.md): current summary of YAP and Trap, using the PDF and latest creator clarifications.

When the master document and an older supporting note disagree, follow the source-of-truth rules at the beginning of this document: the creator's latest explicit clarification comes first, followed by the uploaded PDF, then older repository notes. Keep curly-brace prompts only where the authoritative material does not specify the answer.
