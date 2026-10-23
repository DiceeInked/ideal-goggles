# Drawing Adventure Game — Comprehensive Summary

This document consolidates the current concept for the `drawing-adventure-game` folder into one place. It reflects the project’s current design direction, open questions, inspiration sources, and planned prototype roadmap.

## 1. High concept

`Drawing Adventure Game` is a 2D multiplayer social adventure built around drawing, exploration, color, and ink-powered combat. Players gather colored ink in a hand-drawn fantasy world, then use it to customize their characters, craft gear, and fight inside a deeper cave network.

The game blends:
- drawing and character creation,
- exploration across islands and caves,
- resource gathering and economies built around ink and shards,
- modular weapons with unique secondary abilities,
- social features like visiting homes, trading, and interacting with other players.

The design document emphasizes that it is still early-stage and intentionally leaves uncertain or experimental mechanics marked as TBD. Whenever newer ideas conflict with older brainstorms, the newest design decision takes precedence.

## 2. Core pillars

The current concept is built around five major pillars:

1. Create
   - Draw character parts, clothing, rooms, and other art with an in-game drawing editor.
2. Explore
   - Visit daily islands, seasonal islands, and a large cave system whose layout changes weekly.
3. Collect and specialize
   - Gather ink and shards, mix custom colors, and choose ink affinities that suit a playstyle.
4. Fight and traverse
   - Use modular melee weapons with primary attacks and secondary abilities.
5. Share
   - Meet other players, show off creations, visit spaces, and trade or gift equipment.

This makes the game feel like a social adventure with a strong creative component rather than a traditional action-only title.

## 3. Drawing and customization

### Character creator

Players manually draw separate body parts: a head, torso, two arms, and two legs. These are assembled into an animated 2D character with a simple skeletal animation system.

Possible editor tools include:
- duplicating, mirroring, and reusing parts,
- setting pivots and attachment points,
- previewing basic animations before saving,
- drawing clothing as separate layers so outfits can change independently from the body.

The intended visual style is loose, expressive, and playful. The game aims to allow non-artists to make something they enjoy instead of requiring professional drawing skill.

### Material-based recoloring

The current direction is to build art in grayscale/material-based layers, then use colored ink to recolor selected material types.

Important design ideas:
- the background is white,
- black and white ink availability is still unresolved,
- the editor should distinguish material identity from displayed gray value,
- a player can assign different parts of a drawing to different material groups even if they appear similar,
- recoloring is likely done by dragging a colored ink droplet onto a chosen material/color type.

Many exact rules remain TBD, such as:
- ink cost per recoloring,
- whether recoloring is free after an initial application,
- how material types are assigned and previewed,
- whether color changes are permanent or editable.

### Color mixing

Yap, the merchant, can help players mix inks into other colors, including lighter and darker variants and different saturation levels. The goal is a flexible color mixer rather than a small fixed palette.

## 4. Ink colors and gameplay affinities

The four core ink colors are:
- red
- blue
- green
- yellow

These are selected for gameplay identity rather than strict optical theory. The current intended roles are:

| Core ink | Intended identity | Possible benefit |
|---|---|---|
| Red | Vitality | Healing or survivability |
| Blue | Power | Increased damage |
| Green | Rewards | Better resource/reward yield or chance of bonus drops |
| Yellow | Cooldown | Shorter ability cooldowns |

Seasonal islands add new color families. Current ideas include:
- blue shades in winter,
- green and yellow shades in spring,
- red and orange shades in fall,
- bright summer palettes.

These are still evolving and not finalized.

## 5. World and resource gathering

### Daily islands

The world includes multiple types of islands:
- Default island: contains a little of many ink colors; resource selection resets daily.
- White island: mostly pale white until a player deposits a chosen ink color into a central area; the color then spreads across the island.
- Seasonal islands: begin as mostly white/gray landscapes with shiny ore deposits; mining ore spreads the ore’s natural color into the surrounding environment.

The white island is a dramatic transformation space, while seasonal islands are the main source of season-specific ore.

### The Mines

The Mines are a large spiraling cave system with a generated layout that changes weekly. The generation can mix handcrafted rooms, corridors, crystal chambers, and special encounters.

Important cave progression ideas:
- upper levels are safer but less rewarding,
- deeper levels are more dangerous and contain stronger threats,
- deeper mining provides better rewards,
- ore and gems provide ink according to reward rules,
- risk/reward should encourage deeper exploration without punishing players too harshly.

Mining ore in caves causes ink splatter around the impact point but does not recolor the cave environment broadly.

### Mining is weapon-based

Weapons are not just for combat; they are also tools for gathering resources. A starter pickaxe is given by Yap early on; it deals little damage and mines slowly, as a beginner tool rather than a defining identity.

When mining seasonal-island ore, the ore determines the guaranteed ink reward. The currently infused weapon color may also grant a bonus chance of bonus ink in that color.

## 6. Ink-powered weapons

### Ink consumption and cooldown

Weapons are infused with a chosen ink color. Attacks consume ink in small amounts, and each weapon’s stats determine how long an ink charge lasts.

Secondary abilities generally use more ink than primary attacks and have their own short recharge. These abilities are intended to be powerful and situational, not mindless spam.

When the ink charge runs out, the weapon enters a short cooldown/recharge window. The exact refill logic remains TBD.

### Modular weapon construction

Weapons have two structural parts:
- Blade: defines primary attack behavior, shape, range, damage, and other core characteristics.
- Handle: defines the secondary ability, such as a grapple, projectile, grenade-like tool, or defensive movement.

Each weapon uses a standardized connection point. The assembly system aligns the points, ensures compatibility, and joins the parts into one weapon.

### Example weapon: The Steady

The Steady is a signature early weapon and possible branding icon. It is mostly a sword blade with a deliberately tiny handle. A line down the center of the blade changes color to match the weapon’s ink.

Its idea set:
- Primary: a normal melee slash.
- Secondary: a grappling-hook throw. It attaches at a distance and pulls the player toward a target or location.

The grapple is mainly a traversal/repositioning tool and not intended to be a long-range damage attack. It should consume more ink and have a brief recharge.

### Max-level custom weapon skins

Once a blade-and-handle build reaches max level, the player can pay an additional currency cost to unlock custom skin editing for that weapon. After that, they can replace its default art and create a unique appearance.

To prevent invisible or unreadable weapons, the editor overlays required visibility markers. These appear as partially transparent dots and lines to preserve silhouette and readability. The exact number and placement of these markers is still a development question.

### Securing combinations and upgrades

Players can experiment with different blade-and-handle combinations. Once a combination is liked, it can be secured by spending a meaningful amount of shards. A secured combination can later be upgraded, but the exact meaning of upgrades remains TBD.

Weapons are meant to be repeatable purchases with unlimited stock, while still retaining purchase costs. They may also be dropped or gifted to other players.

## 7. Yap, the merchant

Yap is a mysterious shadow-like figure with a shining eye. A sticky note covers where the other eye would be, and an orb on the note shifts through colors. His design and shop become more ominous as players go deeper into the caves.

The sticky-note symbol also changes with depth:
- a dot near the surface,
- lines deeper down,
- an X at greater depths.

### What Yap does

- Near the cave entrance, Yap provides starter gear, including a very slow, low-damage pickaxe.
- He helps with color mixing, including lighter/darker shades and saturation changes.
- His shops can appear in specific cave locations. A tip jar is present; adding ink to it summons him.
- Players can tip with any ink color, not only yellow.
- Shop offerings, equipment tiers, and costs change by depth.
- Tipping amount may influence shard rewards and offers, but the exact formula is TBD.

### Merchants and item services

The design doc includes a `MERCHANTS.md` note describing special merchant characters such as:
- Yap: sells a locked weapon with a special tonic, weapon parts, and amulet parts; accepts ink and shards.
- Trap: offers a machine to disassemble items or split them in a gamble-like ritual; accepts shards to play.

This suggests the game’s economy and NPC interactions may include more than simple shopkeepers; some merchants may sell services, item transformation, or risky mechanical processes.

### Shards, unlock tokens, and purchases

The current name for currency is `shards`. Shards can be mined and earned from tipping Yap, possibly connected to the color or amount of ink tipped.

A possible crafting idea:
- combine a blank/transparent shard with a selected ink color to create a colored shard,
- use colored shards for buying specific equipment.

The proposed purchase flow is two-stage:
1. Yap provides an unlock token for an item.
2. The player brings it to a station to unlock the item in their loadout or inventory.

This indicates a progression economy centered on item acquisition, custom gear, and resource loops rather than direct one-step shop purchases only.

## 8. Inkoff: team objective PvP mode

`Inkoff` is the team-based PvP mode for the same game. It evolved from a simple core-stone assault idea into a multi-objective mode inspired by several team games.

### Core mode structure

Each match has two teams. Each team has:
- one designated `Queen`,
- several ordinary workers.

The Queen is randomly selected before the round begins.

### Worker objective

Workers gather `gel` from pickups or stations and carry it back to their own base. Once deposited, the gel fills a slot in the base.

The base is laid out like a hexagon of empty holes. The first team to fill all required bases slots wins.

Workers can fight opposing workers. If a worker carrying gel is killed, the opponent may steal the dropped gel.

### Queen role and amulets

The Queen is a highly powered role. They can fly and use a gun-like version of their equipped sword. The handle still determines the secondary ability, but it is enhanced or modified for the Queen role.

The Queen also wears an amulet visibly on the chest, along with wings, a crown, halo, or demon horns depending on the amulet's design. This creates a strong transformation/identity signal.

### Queen combat and lives

Each Queen has three lives. When they die:
- a clear visual or audio cue plays,
- they respawn at their base after a short delay,
- one life is lost.

The exact respawn timing and protections remain TBD.

### Ink, match entry, and being inked off

Ink color is locked for the duration of an Inkoff match. A player cannot swap to another normal color mid-match.

Ink is a finite combat resource. The game also introduces `white ore` as a limited emergency fallback. It appears only during Inkoff and becomes visible when a player’s selected ink reaches zero.

A player who runs out of normal and white ink becomes `inked off`; the game shows this only at the end of the match or in a delayed way, encouraging a sense of threat and scarcity.

### Rewards and scoring

Victory conditions include:
- filling all gel slots in the base,
- or eliminating the opposing Queen by taking all three lives.

The project aims to make the game’s economy matter as much as kills. The exact reward weighting and scoring structure remain open questions.

### Black ink challenge mode

Black ink is a voluntary challenge loadout. Equipping it communicates that the player is choosing a harder route.

Proposed penalties include:
- increased ink consumption,
- longer reload or recharge time,
- reduced damage,
- weaker abilities,
- longer cooldowns.

Black ink is meant to be a visible challenge to others and to create high-risk combat choices without removing the incentive to compete.

### Why Inkoff matters

The mode is intended to reward more than raw kills. It encourages map movement, carrying objectives, defending a base, and outplaying an opposing Queen. This mirrors multi-objective team games and makes workers and Queens each matter to a different part of the strategy.

## 9. Homes, props, badges, and community art

### Player homes

Every player has a personal home, which is also their normal spawn location. Players can draw and customize the home itself, then decorate it with props and badges.

The home system supports:
- placing and moving decorations,
- showing off purchased artwork,
- displaying achievements or badges,
- potentially enabling visitation or privacy settings.

### Passionate Art Lineup (PAL)

The game includes a seasonal or yearly community art submission event called the `Passionate Art Lineup (PAL)`. Players submit original art, and selected pieces are featured for other players to buy and display.

The intended benefits are:
- creators receive in-game compensation,
- buyers receive a displayable artwork for their homes,
- the game creates a public recognition loop for user-made art,
- visual art becomes both collectible and decorative.

The project specifically emphasizes artist attribution and moderation controls, since arbitrary player-generated content can create issues with quality, safety, and ownership.

## 10. Inspiration and reference notes

The project’s design documents point to a broad set of inspiration sources, including:

- `Sky: Children of the Light`
  - social exploration,
  - world wonder,
  - crossing paths with strangers,
  - a peaceful but magical shared adventure.

- `Procreate`
  - direct drawing workflows,
  - layered art creation,
  - expressive creative tools.

- `Animal Company`
  - resource gathering,
  - deeper cave atmosphere,
  - progression through dangerous environments.

- `DOORS`
  - escalating danger in deeper spaces,
  - uncanny mood and environmental tension.

- `Killer Queen Black`
  - team objective structures,
  - Queen role with lives,
  - base-filling economic objective.

- `Stick Fight: The Game`
  - transformation spectacle,
  - memorable character shifts,
  - dramatic combat identity.

- `Minecraft Bridge-style community minigames`
  - objective pressure,
  - competitive map flow,
  - advancing through contested territory.

- `PHIGHTING!`
  - menu and interface personality,
  - stylized character-focused UX.

These influence the project at a concept level rather than as direct copied mechanics.

## 11. Current open questions

The design document intentionally leaves several major questions unresolved. Examples include:

1. The final title of the game.
2. Whether the white island is per-player or shared.
3. How weapon reloading/ink refills actually work.
4. Exact ink costs, charge lengths, cooldowns, and stat ranges.
5. How recoloring costs are calculated.
6. How material types are assigned and previewed.
7. The final seasonal color families.
8. How blank shards become colored shards and what currencies are required.
9. How tips affect Yap’s payouts and prices.
10. Team sizes and Queen respawn timing.
11. How many gel slots each base contains and how quickly they respawn.
12. Exactly what counts as becoming “inked off.”
13. How much white ore is available and how long it takes to mine.
14. The precise black-ink penalty system.
15. Reward balancing between kills and objective progress.
16. The max-level requirement and extra cost for custom weapon skins.
17. The rules for PAL submissions, curation, and payouts.
18. The privacy controls for homes and visitor access.
19. How server instances keep friends together while allowing strangers to encounter one another naturally.
20. How deep cave visuals can remain readable while the world grows more 3D-looking.

These questions are central to implementation and must be answered in future iteration.

## 12. Suggested prototype order

The design document lays out a prioritized prototype roadmap:

1. Drawing prototype
   - body part assembly,
   - animation previews,
   - material recoloring.
2. Ink prototype
   - colored ink inventory,
   - weapon infusion,
   - hit-based charge usage,
   - cooldown/reload loop.
3. Small mining area
   - multiple ores,
   - guaranteed color rewards,
   - optional bonus ink from weapon color,
   - safe-to-dangerous depth progression.
4. Weapon assembly prototype
   - standardized blade/handle attachment,
   - test a small set of combinations.
5. Yap and economy prototype
   - shard pickups,
   - tips,
   - shop inventory,
   - unlock token workflow.
6. Inkoff prototype
   - base objective,
   - gel collection,
   - Queen role,
   - amulet-based mechanics,
   - respawn and inked-off state.
7. Social cave prototype
   - portal-linked cave levels,
   - server-managed shared area,
   - natural interaction between players.
8. Social and content expansion
   - islands,
   - seasonal variants,
   - personal homes,
   - accessories and sharing features.
9. Creator economy and cosmetic skins
   - weapon skins,
   - home art,
   - PAL event setup,
   - artist attribution.

The overall priority is to prove that drawing, gathering, and weapon use are satisfying in a small playable slice before expanding to every island, shop, and multiplayer feature.

## 13. Summary of the project’s identity

At its core, `Drawing Adventure Game` is a concept for a colorful, social, hand-drawn adventure with three major layers:

- Creative expression through drawing and customization.
- Exploratory progression through islands, caves, and resource gathering.
- Competitive and cooperative action through modular weapon combat and team objectives.

The concept is intentionally broad and experimental, but its strongest identity is clear: it aims to make art, exploration, and action feel connected parts of one fantasy world rather than separate systems.

## 14. Final notes

This design is still in an early, living-document phase. The project has a strong artistic and social identity, but many mechanics are deliberately provisional. The design philosophy emphasizes creativity, player expression, shared world presence, and progression through color and resource systems.

The most important next step is not to build every feature at once, but to validate the central loop of:
- drawing,
- collecting ink,
- mining and traversing caves,
- using modular weapons,
- interacting socially and competitively in the world.

That loop is the foundation of the game, and the rest of the concept grows from it.

---

This summary is based on the current contents of `drawing-adventure-game`, including the living game design document, the inspirations file, merchant notes, and the cave/feature overview.
