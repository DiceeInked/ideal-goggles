# Drawing Adventure Game — Design Document

> **Status:** Early concept / living design document  
> **Last updated:** 2026-10-19  
> **Working title:** Not decided  
> **Naming note:** The merchant's name is **Yap** (Y-A-P). The PvP game mode is **Inkoff**.  
>
> This document consolidates the current concept. When ideas conflict, the newest design decision takes precedence. Numbers, economy formulas, and mechanics marked **TBD** are intentionally not finalized.

## 1. High concept

A 2D multiplayer social adventure built around drawing, exploration, color, and ink-powered weapons. Players gather colored ink in a hand-drawn fantasy world, then use it to customize their character, clothing, personal room, and other creations. Exploration provides resources; the resource economy powers both creative expression and combat.

The experience takes inspiration from the wonder and social exploration of *Sky: Children of the Light*, while establishing its own identity through player-created art, ink-powered melee weapons, the mysterious merchant Yap, and the cave-themed PvP mode Inkoff.

### Core pillars

1. **Create:** Draw character parts, clothing, rooms, and other art with an in-game drawing editor.
2. **Explore:** Visit daily islands, seasonal islands, and a large cave system whose layout changes weekly.
3. **Collect and specialize:** Gather ink and shards, mix custom colors, and choose ink affinities that complement a playstyle.
4. **Fight and traverse:** Use modular melee weapons with primary attacks and distinct secondary abilities.
5. **Share:** Meet other players, show off creations, visit spaces, and trade or gift equipment.

## 2. Drawing and customization

### Character creator

Players manually draw separate body parts: a head, torso, two arms, and two legs. Parts are assembled into an animated 2D character, with a simple skeletal animation system.

Helpful editor tools may include:
- Duplicate, mirror, and reuse body parts.
- Set joint/attachment points and rotation pivots.
- Preview basic animations before saving.
- Draw clothing as separate layers so outfits can change without redrawing the body.

The visual feel may be loose and expressive, with a deliberately playful silhouette. The game should enable non-artists to make something they enjoy, not require professional drawing skills.

### Material-based recoloring

The current direction is to build artwork using grayscale tones/materials, then use colored ink to recolor selected material types. The background is white; black and white ink availability is still undecided, with an earlier idea of providing a very large or effectively unlimited supply from the Sun.

The editor should distinguish **material identity** from **displayed gray value**. A player can assign different parts of a drawing to different grayscale/material types, even when they look similar. Applying a color to a material type recolors the artwork assigned to that type, including disconnected parts. This avoids making players connect areas with tiny pixels just to recolor them together.

The intended interaction is to drag a colored ink droplet onto the chosen material/color type. The exact ink cost for recoloring, whether recoloring can be free after an initial application, and how grouping works are **TBD**. Brush/freehand color tools may complement material recoloring for small details and patterns.

### Color mixing

Yap can help players mix inks into other colors, including lighter and darker variants and different saturation levels. The system aims to be a flexible color mixer rather than a small fixed palette. The exact recipe model and whether every possible color is craftable are **TBD**.

## 3. Ink colors and gameplay affinities

The four core gameplay inks are **red, blue, green, and yellow**. They are chosen for gameplay identity, not because they must correspond to one particular theory of primary colors.

| Core ink | Intended identity | Possible benefit |
|---|---|---|
| Red | Vitality | Healing or survivability |
| Blue | Power | Increased damage |
| Green | Rewards | Better resource/reward yield or chances of bonus drops |
| Yellow | Cooldown | Shorter ability cooldowns |

These are the latest intended roles. Exact percentages, scope of each bonus, and whether effects apply in every activity are **TBD**.

Seasonal islands add families of color variations. Current ideas include blue shades in winter; green and yellow shades in spring; red and orange shades in fall; and a bright, playful summer palette. Summer's exact color family remains **TBD** because yellow-focused and pink/party-color ideas have both been explored.

## 4. World and resource gathering

### Daily islands

- **Default island:** Contains a little of many ink colors. Its resource selection resets daily.
- **White island:** Looks almost entirely pale white until a player brings an ink droplet to the center and deposits it. The chosen color spreads across the island, transforming its appearance and making that color the island's focus/reward. It resets daily. Whether this is shared by all players or individualized per player is **TBD**.
- **Seasonal islands:** Follow a seasonal color family. They begin as mostly white/gray landscapes with shiny ore deposits. Mining an ore spreads its natural color into the surrounding environment and provides ink matching the ore.

The white island is a dramatic color-transformation experience; the seasonal islands are the main places to discover and mine season-specific ores.

### The Mines

The Mines are a large spiraling cave system with a generated layout that changes weekly. The generation can combine reusable handcrafted rooms, corridors, crystal chambers, and occasional rooms with extra gemstones.

- Upper levels are comparatively safe but less rewarding.
- Deeper levels contain stronger threats, including special monsters, and provide better rewards.
- Mining ore in the caves causes a visual ink splatter around the impact point, but does **not** recolor the cave environment.
- Gems and ore provide ink according to their reward rules.
- The risk/reward curve should encourage deeper exploration without making a failed expedition erase excessive progress.

### Mining is weapon-based

Weapons serve both combat and gathering purposes. A starter pickaxe may be provided by Yap; it deals very little damage and mines ore very slowly. It is a starter tool, not the separate identity of the entire mining system.

When mining seasonal-island ore, the ore determines the guaranteed ink reward. The currently infused weapon color may give the player a chance of bonus ink in that weapon's color, with the odds and reward influenced by weapon stats.

## 5. Ink-powered weapons

### Ink consumption and cooldown

Weapons are infused with a chosen ink color. Attacks consume ink in small amounts; each weapon's stats determine how many hits or uses its ink charge lasts. Secondary abilities generally use more ink than a basic attack.

When an ink charge runs out, the weapon enters a short cooldown/recharge window, whose duration depends on the weapon. The exact rule for consuming or replenishing the next ink charge during this process is **TBD**. The intended balance is to keep the interaction snappy while preserving the need to gather and manage ink.

Secondary abilities are typically more powerful or useful for movement, have their own short recharge (roughly a second as an initial idea), and should not be designed to be mindlessly spammed. Their actual balance will depend on ink cost, cooldown, range, and situation.

### Modular weapon construction

Weapons have two main components:

- **Blade:** Defines the primary attack, including its basic shape, reach, damage, and other primary characteristics.
- **Handle:** Defines the secondary ability, such as a grapple, projectile, grenade-like effect, or defensive movement.

Each blade and handle uses a standardized connection point. The assembly system aligns the two connection points, ensures their orientation is compatible, and joins the components into one weapon. Animations work by moving and rotating those same points. This lets many different drawings/models share the same assembly and animation conventions.

### Example weapon: The Steady

The Steady is a signature early weapon and a possible branding icon. Its silhouette is mostly a sword blade with a comically small handle. A line down the center of the blade changes color to match the equipped ink, with a dot as an additional design detail.

- **Primary:** A normal melee slash.
- **Secondary:** A grappling-hook throw. The hook attaches at a distance and pulls the player toward the target/location. It is mainly a traversal and repositioning tool. Contact may deal a very small amount of damage, but damage is not its main purpose.
- The grapple consumes more ink than basic slashes and has a brief recharge, limiting repetitive use.

The grappling hook is not intended to be a long-range attack that primarily damages opponents; its main identity is movement.

### Max-level custom weapon skins

After a weapon combination reaches its maximum upgrade level, the player can pay an additional currency cost to unlock custom skin editing for that weapon. The player can then replace its standard appearance with artwork they draw themselves.

To prevent invisible or unfairly hard-to-see weapons, the editor overlays required visibility markers on the blade and handle designs. These markers appear as 50%-transparent dots and lines. The center of every required marker must be covered by some form of artwork before the custom skin can be accepted. A design that leaves any required marker uncovered cannot be saved as a valid skin.

The marker system should preserve enough visible silhouette and contrast for opponents to recognize weapon positions and actions. The precise number and placement of markers, validation rules for thin strokes, and whether the player can preview the skin in combat lighting are **TBD**. Custom skins are cosmetic and should not grant gameplay advantages.

### Securing combinations and upgrades

Players can experiment with blade-and-handle combinations. Once they find a combination they like, they can **secure** it by spending a meaningful amount of shards. A secured combination can be upgraded, but its component selection becomes locked: players can no longer edit that secured combination's blade/handle pairing. To try a different pairing, they obtain additional weapons.

The exact meaning and limits of upgrades (stats, visuals, abilities, or all three) are **TBD**. The lock-in should be made clear before a player spends the securing cost.

Weapons can be purchased repeatedly (stock is intended to be unlimited) and dropped/gifted to other players. Each item still has its own purchase cost; unlimited stock does not mean free items.

## 6. Yap, the merchant

Yap is a mysterious shadow-like figure with a shining eye. A sticky note covers where the other eye would be, and an orb on the note shifts through colors. His design and shop become more ominous as players descend into the Mines.

The sticky-note symbol changes with depth: a dot is common near the surface; lines (vertical or horizontal) may appear deeper down; an X can appear at still greater depth. The exact meaning of these symbols is deliberately unknown for now. Yap's deeper shops use a darker, more ominous atmosphere.

### What Yap does

- Near the cave entrance, Yap provides starter gear, including a very slow, low-damage pickaxe.
- He teaches or enables color mixing, including lighter/darker shades and saturation changes.
- His shops can appear in specific places in the Mines. A tip jar is present; adding ink to the jar summons him.
- Players can tip with **any ink color**, not only yellow.
- Shop offerings, item tiers, and costs are influenced by depth. Deeper shops can offer stronger/more unusual equipment at higher prices.
- Tip amount is intended to influence shard rewards and may affect his offers or pricing. The exact formula and relationship between tips and offers are **TBD**.

Yap's preferred tip colors may reflect the season: spring may emphasize green and yellow; fall red and yellow; winter blue and yellow; summer may emphasize yellow or additional yellow shades. These seasonal preferences are not a rule restricting which ink a player is allowed to tip with.

### Shards, unlock tokens, and purchases

Use **shards** as the current name for the currency/resource concept; earlier ideas about coins or crystals have been superseded.

- Shards can be mined and can also be earned when tipping Yap, with the amount linked to the tip.
- A possible crafting rule is to combine a blank/transparent shard with a selected ink color to create a colored shard.
- Colored shards are the proposed currency for buying particular equipment.

The current proposed purchase flow has two stages: Yap provides an oval, shallow-cylinder-shaped unlock token for an item; the player takes it to a machine at their station to unlock that item in an equipment catalog; then the player purchases the unlocked item using the appropriate shards. This flow and the currency needed for each step are **provisional** and may change.

## 7. Inkoff: team objective PvP mode

Inkoff is a separate game mode using the same ink-infused melee weapons. Its latest direction replaces the earlier idea of winning by covering as much floor as possible with ink. Ink coverage is **not** the primary victory condition.

The intended mode is a team assault/defense game set in a mineshaft-style map, inspired at a high level by Minecraft's Bridge-style objective progression.

### Objective

- Each team has a protected core stone surrounded by a force field.
- Three prerequisite stones are positioned around the map. The attacking team must destroy the required stones before it can destroy the opposing team's core stone.
- Destroying the enemy core wins the match.
- The precise placement, ownership, and respawn rules for the three prerequisite stones are **TBD**.

### Combat and rewards

- Players use ink-infused weapons, and attacks/secondary abilities consume ink.
- Eliminating opposing players adds score and contributes to end-of-match rewards.
- Winning gives shards and other planned rewards.
- The latest direction is **not** to automatically refund used ink or double the ink spent after a victory. Defeating an opponent also does not currently provide an automatic ink refund.
- Exact reward formulas, match length, respawning, team size, and objectives' health are **TBD**.

The mode should balance reaching and destroying objectives with defending teammates and fighting opponents. Weapon abilities such as the Steady's grapple should help players traverse the mineshaft, approach objectives, and reposition.

## 8. Homes, props, badges, and community art

### Player homes

Every player has a personal home, and the home is their normal spawn location. Players can draw and customize the home itself, then decorate it with placeable props and badges. Homes should act as personal galleries and gathering spaces where visitors can get a sense of the player's art and accomplishments.

The home system should support placing, moving, and removing decorations, while making it easy to show off purchased artwork and earned badges. Whether homes are always visitable, invite-only, or controlled by privacy settings is **TBD**.

### Passionate Art Lineup (PAL)

Every season and every year, the game runs the **Passionate Art Lineup (PAL)**, a community art submission event. Players submit original art pieces; selected winning art is featured for other players to purchase.

When a player buys a featured piece, the creator receives coins as compensation. The buyer receives a displayable version of the artwork that can be placed in their home. Visitors can click the displayed art to open a full-screen view showing the piece, its title, and its author.

PAL artwork can therefore be both a collectible and a home decoration, while also giving creators recognition and a way to earn in-game currency from their work. The number of winners, submission rules, judging or voting method, pricing, creator payout, and whether a piece remains available after its event are **TBD**.

The game should clearly credit the artist and preserve attribution when artwork is displayed or opened full-screen. Submission and moderation rules should be established before public launch.

Players can also draw and customize clothing and character parts, visit one another's spaces, and show off personal style. Because players can create and share arbitrary artwork, a public release will need reporting, blocking, visibility settings, and sensible controls for shared player-made content.

Because players can create arbitrary artwork and share it, any public release will need reporting, blocking, visibility settings, and sensible controls for shared player-made content.

## 9. Current open questions

These are intentionally unresolved, not accidental omissions:

1. What is the game's final title?
2. Are black and white ink unlimited, replenished daily, or subject to another rule?
3. Does the white island operate per player or as one shared island?
4. What exactly triggers weapon reloading, and is a new ink charge consumed automatically?
5. What are the numerical ink costs, charge lengths, ability cooldowns, and weapon stat ranges?
6. Does recoloring consume one droplet per material application, per part, or according to another rule?
7. How are material types assigned, grouped, and previewed in the editor?
8. What are the final seasonal color families, especially summer?
9. How do blank shards become colored shards, and which currencies are required for unlock tokens versus actual equipment?
10. How do tips affect Yap's shard payout, inventory, and prices?
11. Are the three prerequisite stones shared objectives, team-specific objectives, or another layout?
12. How do secured combination upgrades work, and what exactly becomes permanently locked?
13. What rewards are granted for match participation, kills, and victory?
14. What are the exact max-level requirements and extra cost for unlocking custom weapon skins?
15. How many mandatory visibility markers do weapon skins need, and how is marker coverage validated?
16. What are PAL's submission, selection, pricing, and creator-payout rules?
17. What home privacy and visitor controls should players have?

## 10. Suggested prototype order

1. **Drawing prototype:** Create separate body parts, connect them using pivots, preview basic animation, and test material-based recoloring.
2. **Ink prototype:** Add colored ink inventory, weapon infusion, hit-based charge usage, and a working cooldown/reload loop.
3. **Small mining area:** Add several ores, guaranteed ore-color rewards, optional bonus ink from weapon color, and a basic safe-versus-dangerous depth progression.
4. **Weapon assembly prototype:** Implement standardized blade/handle connection points and test two blades with two handles.
5. **Yap and economy prototype:** Add shard pickups, tipping, one shop tier, and a simple unlock token/station interaction.
6. **Inkoff test arena:** Test the core-stone objective and prerequisite stones before making a full procedural map.
7. **Social and content expansion:** Add islands, seasonal variants, personal homes, props and badges, sharing, trading/gifting, and richer cave generation.
8. **Creator economy and cosmetic skins:** Prototype weapon-skin visibility validation, home art displays, and a small PAL event with clear artist attribution and creator rewards.

The priority is to prove that drawing, weapon use, and gathering ink are satisfying in a tiny playable slice before building every island, weapon, shop tier, and multiplayer feature.

---

*This is a living concept document. New decisions should update the relevant section, and later decisions override earlier brainstorms wherever they conflict.*
