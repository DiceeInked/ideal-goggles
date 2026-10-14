# Pod Game

> Working title: **Pod Game**. This is a separate game concept from the Minecraft add-on ideas in `Mobs/`. The title can change later.

## High concept

A space exploration and action RPG inspired by the feeling of discovering a vast, procedurally varied universe, but with a central twist: **the player is the spaceship**. The ship is called a **pod**. There is no pilot character to leave behind and no walking around outside the pod. The pod is the player's body, identity, transport, and customizable build.

Instead of ordinary planets to land on and mine, the universe contains strange, procedurally assembled **system entities**: miniature space bosses made from combinations of categories, subcategories, and smaller traits. Defeating them earns currency, metals, and sometimes rare parts.

## Core gameplay loop

1. Travel through a constellation-like map of connected space regions.
2. Discover a system entity and learn its threat level and traits.
3. Fight it using the pod's movement abilities and weapons.
4. Collect currency, ranked materials, and occasional rare parts.
5. Visit a station without leaving the pod to sell loot, tune the build, and install upgrades.
6. Decide whether to remain within the law or risk visiting a black market.
7. Explore further, encounter new hyper-energy effects, and grow the pod's capabilities.

The intended controls and moment-to-moment rules should stay approachable even as the build choices and world generation become deep.

## The pod

The pod is the player character. It can be customized with metals, components, and rare parts earned through exploration and combat.

Possible upgrades include:
- Short dashes and other movement techniques.
- Teleportation.
- Large cannons.
- Lasers.
- Other abilities unlocked by particular parts or combinations.

The goal is to make pods visually distinctive, potentially allowing a wide variety of silhouettes and configurations. Stations have docking spaces where the player can access shops, speak to NPCs, and modify the pod without ever exiting it.

## Procedural system entities

These entities may be casually called **planets** during early design, but they are not conventional planets. They are closer to compact, boss-like encounters.

### Generation approach

Build each entity by selecting from a hierarchy:
1. A main category.
2. A subcategory within that category.
3. A further subcategory or trait set.
4. A selection of additional traits, behaviors, attacks, materials, and visual features.

Not every feature needs to use the same hierarchy. Some can be selected independently, while others should depend on earlier choices to keep combinations coherent.

For example, three independent feature groups with ten options each produce 1,000 combinations before accounting for any further traits. Many categories and layered choices could create a huge variety of entities without hand-authoring every possible combination.

**Design principle:** randomness should create surprising combinations, not nonsense. Use compatibility rules, weighted choices, and threat-level constraints so each generated encounter feels intentional and beatable.

Potential generation dimensions:
- Body shape and scale.
- Material or energy composition.
- Movement pattern.
- Defensive behavior.
- Attack style.
- Weaknesses and resistances.
- Environmental or hyper-energy effects.
- Loot profile and rarity.
- Visual effects and sound identity.
- Encounter difficulty.

These are candidate dimensions, not a finalized list of one hundred categories.

## Rewards and item ranks

Defeating system entities pays currency and can drop metals or special parts. More dangerous encounters can have better chances of yielding rare or valuable rewards.

Loot uses four ranks:

| Rank | Intended value |
| --- | --- |
| C | Low |
| B | Average |
| A | High |
| S | High baseline value, with special black-market potential |

A and S are both good-value ranks in ordinary selling. S-ranked items are especially valuable when sold through the black market. The rank primarily communicates selling value, not necessarily combat power.

The ordinary shop should make selling and upgrading simple. Detailed inventory management should not overwhelm the main loop.

## Stations and legal shops

Stations are safe or relatively safe places spread throughout the universe. The pod can dock at a designated spot to:
- Sell ordinary loot to the government or legal merchants.
- Buy, install, and swap upgrades.
- Customize the pod's appearance.
- Talk to NPCs and access services.
- Review visible attribute meters and status effects.

The government generally pays low prices for restricted goods. Legal selling is the safer, simpler option.

## The black market

Rare, unstable portals can appear in space and lead to a hidden black-market area. The black market accepts items that legal vendors will not buy and pays much more for them.

- S-ranked items can produce a major profit.
- Saturated A-, B-, and C-ranked items can also sell for substantially more.
- Selling ordinary items there does not automatically grant a bonus just for using the black market.
- The player risks being flagged as a lawbreaker and attracting police attention.

This creates a choice between safe, predictable income and a risky opportunity for much larger returns.

### Portal history and lore

The black market was originally accessed through a major portal. Authorities eventually contained that portal and used its **unsaturated energy** to develop a way of identifying vehicles that had broken the law.

After the main portal was contained, others discovered that **white energy**, found by mining certain floating ores, could be used with expensive energy accelerators to open portals elsewhere. Recreating a stable connection required both white energy and unsaturated energy.

An attempt to establish a new connection used far too much white energy while the old portals were still open. The resulting event permanently linked the routes in an unstable way. Now, black-market portals can open unpredictably across the universe. Attempts to deliberately create a portal with the same machinery tend to end in an explosion.

This history explains why black-market access is possible but rare, dangerous, and difficult to control.

## Saturation and law enforcement

**Saturation** is a visible player attribute related to the government's ability to identify illegal activity. Police use unsaturated energy derived from the contained original portal as a detection system. They can inspect pods and attempt to arrest those carrying too much unsaturated energy.

The black market has a complicated relationship with saturation:
- Passing through black-market portals can reduce the pod's saturation.
- Saturation can also cause items in the player's inventory to become saturated.
- Saturated items are worth considerably more when sold illegally.
- This makes repeated black-market visits a trade-off: potential item profits versus increased legal risk.

The exact direction, terminology, and thresholds of the saturation meter need a final rules pass. The core intended tension is that the player can gain profitable contraband opportunities while becoming easier for law enforcement to target.

## Hyper energy and attributes

Hyper energy is a universe-wide force that can permanently change the pod when it enters certain regions or encounters particular phenomena. Effects can be beneficial or harmful.

Attributes should be visible as simple meters that rise or fall after clear actions or discoveries. All attributes begin at zero unless a later design decision changes this.

### Lightness

Lightness affects the efficiency of movement abilities rather than acting as a simple unlock requirement. Higher or lower lightness can improve or weaken abilities such as:
- Dashes.
- Teleports.
- Other movement-oriented techniques.

Lightness may change when the pod enters a light-associated region or discovers and activates light energy.

### Saturation

Saturation affects legal detection and interacts with item value:
- It is part of the law-enforcement system.
- Black-market travel can change it.
- It can influence whether items become saturated.
- Saturated items gain value when sold illegally.

### Future attribute candidates

Additional attributes may be added later, but should only be introduced if they create clear, understandable choices. The game should avoid a pile of invisible statistics that players cannot reason about.

## Design pillars

1. **You are the pod.** No pilot avatar and no leaving the ship.
2. **A vast universe from reusable rules.** Procedural combinations should create meaningful variety.
3. **Simple core loop, deep builds.** Fighting, selling, and upgrading should be easy to understand.
4. **Risk has a price.** Black-market profit competes with legal safety.
5. **Changes persist.** Hyper-energy encounters can permanently influence the pod.
6. **Make the player feel ownership.** Visual customization and upgrade choices should make each pod feel personal.

## Open questions for future design

- What is the game's final name?
- What are the exact movement, aiming, and combat controls?
- How does a pod take damage, recover, or get defeated?
- How does the constellation map reveal new regions?
- Which generation categories and compatibility rules are needed first?
- How are difficulty and rewards balanced across generated encounters?
- What precisely counts as saturation versus unsaturated energy on the pod's meter?
- How does police detection work, and what happens after an arrest or pursuit?
- How do permanent hyper-energy changes work, and can any of them be reversed?
- What limits the number of installed weapons and movement abilities?
- How are stations, NPCs, and docking represented without leaving the pod?
- What keeps black-market access rare without making it frustrating?

## Current scope

This document records the concept and its intended systems. It is **design documentation only**, not a playable implementation. Unresolved mechanics are deliberately marked as questions rather than silently decided.
