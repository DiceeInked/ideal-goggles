# Lattice of Greed

**Status:** Design concept plus an experimental, integrated Bedrock script build in `full-version/`. The source now attempts the main lattice, resource platforms, city towers, Tesseract/memory sequence, Biome Barrels, nightmares/daymares, restoration, Temi village, serpent, and ending. The build is not yet runtime-verified in Minecraft; some systems are scripted approximations and still need in-game testing and refinement.

## 1. Core vision

**Lattice of Greed** is a Minecraft Bedrock survival-world concept about scarcity, extraction, consequences, and the possibility of restoration. The player awakens in an enormous, unnaturally regular bedrock lattice suspended in a mostly empty gray abyss. Resources are scarce, the world feels as though it has already been damaged, and unusual structures offer tempting ways to acquire more.

The central message is not that taking resources is always evil. Survival requires taking things. The question is what the player does with what they take, whether they consider the effects on the world, and whether they try to give something back.

The world should communicate this through its mechanics and discoveries rather than through lectures or a visible morality meter. Players should still be able to enjoy the strange survival challenge even if they ignore the story.

Atmosphere: enormous, geometric, empty, lonely, surreal, and eerie, with occasional moments of warmth and hope. The visuals may have a colorful, stylized Minecraft-like quality that contrasts with the emptiness and damage.

## 2. The mysterious author

Signs, books, and environmental messages should feel as though they were written by **one consistent author**, not collected from unrelated people.

One possible story is that everyone is gone and the author is the spirit of someone who has not yet moved on. They believe there is still hope for the world and are trying to help the player repair it. The spirit does not need to appear directly or explain everything. Their presence can be felt through short notes, dreams, altered landscapes, and signs of recovery.

This identity is a strong narrative direction, but the spirit's exact nature, history, name, and ultimate fate are not decided.

Possible messages include:
- “Take what you need, but please use what you take.”
- “Who are you doing this for?”
- “Where do you think this is coming from?”
- “You can't just make something from nothing.”
- “Give back to the environment.”
- “You cannot give everything back. That doesn't mean you should give nothing.”
- “Survival requires taking. Living requires more than survival.”

Messages should be brief, optional, and discovered organically. Some may be comforting; others may be unsettling or ask questions rather than give instructions.

## 3. The main world and bedrock lattice

The main world is a three-dimensional bedrock grid with a spacing of four blocks along X, Y, and Z. There are three interior block positions between neighboring grid lines. The space around the grid is largely an empty abyss rather than ordinary terrain.

The current vertical lattice range is provisionally **Y = -32 through Y = 0**, inclusive, with horizontal layers at Y = 0, -4, -8, -12, -16, -20, -24, -28, and -32. There is no cap or roof at Y = 0. Vertical beams connect the layers. Keep this separate from the maximum height of city towers, which is a different design question.

Biomes and structures should align with the lattice. Biome boundaries follow whole grid cells and can form shapes made from those cells. Biomes do not overlap, but can touch. Multiple instances of a biome type may exist. Their size, shape, and frequency are randomized, and each type is generated independently of its neighbors.

A maximum biome area of **4096 lattice cells** was suggested as a provisional placeholder, not approved as a final value.

## 4. Survival and scarcity

- Players start with no items or resources.
- Ordinary mobs do not spawn in the main abyss world.
- Useful resources are unusually scarce.
- Players may cooperate, trade, form alliances, compete, or loot one another.
- The bedrock serpent is a special world creature/system rather than an ordinary naturally spawning mob.

Scarcity should create meaningful choices without making progress so frustrating that players abandon the world.

## 5. Tree biome and vegetation

A large tree biome contains exactly one main oak tree. The biome is usually larger than most other biomes, and its frequency is intended to be middle-of-the-road: neither common nor rare.

The tree sits on a 3 × 3 dirt foundation one block thick. The uppermost foundation layer is at Y = -1. The center position is bedrock, and an ordinary oak tree grows above it. A large exclusion zone prevents other structures from generating close to the tree; its exact size and shape are undecided.

A separate 3 × 3 dirt marker lies at Y = -64, directly below the tree's center. It is only a marker, not a floor.

Separate 3 × 3 dirt platforms may appear in eligible cells across a large area. Each has a randomly selected center block that can be obtained through ordinary survival, excluding bedrock and unobtainable technical blocks. They are exceptionally unlikely far away and become increasingly likely near the main tree, approaching nearly guaranteed occurrence in the nearest intended area. The exact distribution, vertical placement, eligible block pool, and probability curve are undecided.

The main tree is meant to feel lonely and valuable, not like an abundant renewable forest. The world may gradually lose vegetation as the player harvests trees and plants. Planting and successfully growing trees may help restore vegetation, but the exact tracking and recovery rules are undecided. The intent is not to scold the player for chopping wood: survival requires taking, but the world can remember whether the player also restores what they can.

## 6. City biome

The city biome is enormous and contains multiple towers and buildings that extend upward from the lattice. City structures are aligned to the grid and can reach the world's maximum build height, which remains to be specified.

Building footprints range from **8 × 8 to 32 × 32 lattice cells**. The city looks like a ruined, abandoned place with stone pathways and buildings of varying sizes and heights. Rooms are procedurally generated and may form maze-like layouts. Some empty lattice openings inside buildings may be filled with stone where needed for rooms.

Each floor has 1–3 holes in the exterior walls that act as entrances or exits, allowing players to enter or leave at different heights. Players **can break blocks from outside a building, but cannot break blocks once they have entered the building**. This is the current rule and supersedes the earlier idea that all block breaking inside the city would be prohibited.

Large, plain elevator rooms contain water flowing from one corner. Players climb the water to rise one floor at a time. Water is valuable and can be collected, which may affect the elevator's usefulness.

Treasure rooms are rare, with their probability increasing nearer the tops of towers. Each treasure room contains exactly one chest. Chests usually contain stone; ores are much rarer, with rough rarity inspired by vanilla ore generation. Each chest slot contains at most one item type. Near tower tops, chests may appear at certain vertices or edges to tempt players to climb.

When a player reaches a top floor and steps above it onto a stone block between bedrock lattice beams, that block and connected stone blocks extending infinitely downward break away. This can cause a fall into the void. It happens only once per visit or return to that top area.

Each building may contain a chest with a book, but whether this is guaranteed or merely frequent remains undecided. Books contain short messages from the mysterious author, such as “Who are you doing this for?” The city should tempt players to endure a long, dangerous climb for a possible reward without making every climb worthwhile.

Opening or taking resources from city Biome Barrels reduces the chance of unusual structures spawning in the Overworld. The exact trigger (opening the barrel versus actually taking its contents) needs to be standardized.

## 7. Tesseract biome

The Tesseract biome is an enormous, perfectly square structure containing a nested sequence of tesseracts, one inside another, continuing toward the center. A portal block sits at the center.

Entering the portal immediately transports the player to a muted version of the normal Overworld, like a flashback or temporary memory of the world.

The temporary dimension begins relatively intact. For about five seconds, no black concrete appears. Over roughly the next three seconds, one or two black concrete blocks appear. After that, black concrete spreads rapidly around the player and infects nearby blocks. Eventually, the infected blocks break, the player falls into the void, and they are returned to the original world.

Mobs may spawn in this temporary Overworld, giving a quick-moving player an opportunity to obtain useful drops before the place collapses. The original world is protected from this corruption.

Using the portal destroys the Tesseract structure and replaces it in the original world with one single block at the portal's location. Anything built inside the Tesseract and everything in the temporary dimension is erased, apart from that one remaining block.

A major temptation/exploit is that a player can place a block on the portal instead of entering it and mine that block infinitely, producing unlimited resources. Entering the portal accidentally or intentionally removes the Tesseract and ends this opportunity. The exploit is meant to tempt players into believing they have outsmarted the world.

Rarely, mining blocks in the Tesseract may reveal books with messages such as “Where do you think this is coming from?”, “You can't just make something from nothing,” or “You found a loophole. Not a miracle.” These quotes are examples, not finalized text.

Tesseract exploitation may make the world lose some vertical complexity over time, making terrain subtly flatter. Ordinary use should have subtle effects; extensive exploitation should make the change more noticeable. This should not simply cut off mountain tops or fill every valley.

## 8. Biome Barrels

Outside biomes, a rare structure consists of a lattice pillar extending four blocks higher than expected, with a barrel placed upright on top.

Opening a Biome Barrel reveals a two-dimensional slice of a randomly selected ordinary Minecraft biome and provides the resources from that slice. The exact presentation, selection rules, and contents are undecided.

A rare special barrel instead reveals an obsidian Nether portal structure. About one second after opening it, the barrel is destroyed and any items not collected are deleted. The player must quickly take the obsidian. This should feel ominous, as if the world briefly revealed something it was not meant to reveal.

Taking resources from ordinary Biome Barrels reduces the chance of unique biomes appearing, apart from plains. Over time, the world becomes less diverse and increasingly dominated by plains. The exact trigger (opening versus taking items), reduction curve, and minimum probability need to be decided.

City Biome Barrels similarly reduce the chance of unusual structures appearing. These effects are expressions of extraction: the player gains resources, but the world loses variety.

## 9. Day, night, and the abyss

The normally gray abyss may have its own day/night cycle. At night, the abyss becomes nearly pitch-black, fog thickens dramatically, and visibility drops. This makes navigating the lattice more dangerous and raises the risk of falling. Every night also triggers a nightmare, described in the next section.

The darkness must be frightening but fair. If the fog completely hides every useful landmark, falls may feel arbitrary rather than tense. Potential navigation cues include faint lattice silhouettes, distant sounds, or rare lights. Whether sleeping is possible, difficult, costly, or unavailable remains undecided.

A possible transition into the dream sequence begins before or during nightfall: fog condenses, a blindness-like effect thickens, the screen becomes black, and the interface fades away. The player then snaps into a dream/flashback version of the Overworld. The precise relationship between the night cycle and the dream transition needs to be finalized.

## 10. Nightmares and daymares

Dreams are called **nightmares** when they occur during the ordinary night cycle, and **daymares** when they interrupt the player during the day. They show a strange, non-interactive version of the Overworld that reflects the world's condition and the player's actions.

### Nightmares

- A nightmare triggers every night.
- The player is transported to a dreamlike snapshot of the Overworld.
- The player has an empty inventory and no user interface. They cannot break or place blocks; they can only walk around and observe.
- The nightmare lasts roughly one minute, then returns the player to the abyss. The exact timing and how it aligns with the abyss's day/night cycle still need to be finalized.
- The dream world is already damaged by default: random dirt patches, cobblestone blocks, ruined or misplaced features, and other signs that the Overworld was damaged before the player's current actions.
- As the nightmare unfolds, the sky transitions from day toward night. The sky, terrain, plants, and structures may gradually improve if the player has performed restorative actions; harmful extraction may leave the dream more damaged.

Dream details can reflect the player's choices:
- Trees may look subtly wrong or partly submerged in the ground, echoing the special tree structure.
- If the player has cut down trees, a few recent-looking fallen trees may appear with their leaves still attached.
- If the player has exploited a Tesseract, the landscape may be unusually flat, and a Tesseract-like structure may appear with a sign such as “Does the terrain look a bit flat to you?”
- Mobs may appear much less frequently than usual. When they do appear, they may stare at the player even from far away, creating an uncanny sense of loneliness.
- Restorative actions may cause new flowers, structures, or villages to appear and the sky and landscape to return toward a more natural state.

### Daymares

Daymares are rarer interruptions that can occur during the day, potentially after especially heavy exploitation of a Tesseract, such as mining a stack of resources from it. A daymare abruptly transports the player into a similar dream-space.

The player must wander and discover something meaningful: for example, a Tesseract-like structure accompanied by a message that hints at the consequences of their actions. The dream-space may appear to end abruptly at a cut-off edge where the terrain and sky simply stop. There is no visible wall or ordinary border, but the player cannot walk beyond that edge. This should feel like reality has been cut short, not like the player has reached a conventional world boundary.

Possible signs include:
- A Tesseract-like structure with the message “Does the terrain look a bit flat to you?”
- A structure or sign that suggests the player has taken something away from the world.
- Other brief, contextual clues written in the mysterious author's consistent voice.

Daymares are open-ended. Finding a clue does not force the player out; the player can keep exploring for as long as they want. A few seconds after a clue is noticed, the moment can settle, but the daymare continues. The player returns by jumping into the Tesseract-like structure, which drops into a black abyss. Nightmares remain time-limited.

### Shared rules and design cautions

Nightmares and daymares are visions, not second resource dimensions. Dream blocks and structures are non-interactive, so players cannot farm resources or use a dream as a second survival world. Their purpose is to reveal consequences, hint at the story, and sometimes show that restoration is working.

The dream should be lonely and unsettling, but not uniformly miserable. Small signs of recovery should feel rare and meaningful. Daymares should be rare enough to remain surprising, and nightmares should not become repetitive cutscenes that interrupt play too aggressively.

## 11. The Temi village

A rare village inspired by the Temmie Village from *Undertale* may appear in the lattice when the world has recovered enough. It resembles a Minecraft village, but signs are placed frequently and express gratitude, for example: “You are the reason we get to be here. Thank you for all your help.”

Depending on how the player has helped restore the world, villagers may offer useful resources. The idea is to show that helping others and the environment can eventually benefit the player too.

This should not feel like a simple reward for filling a hidden morality meter. The village should be rare, warm, and a natural sign that the world is becoming more livable. The exact conditions, villager behavior, and resource rewards are undecided. The inspiration should remain a reference point rather than copying *Undertale*'s characters or dialogue wholesale.

## 12. Restoration and world memory

The world should respond to extraction and restoration over time. There should be no simplistic good/bad score shown to the player. Instead, different actions influence different parts of the world.

Possible extraction effects:
- Taking from Biome Barrels makes unique biomes rarer and plains more dominant.
- Taking from city Biome Barrels makes unusual structures rarer.
- Exploiting Tesseracts reduces the world's vertical complexity.
- Harvesting trees and vegetation makes plant life rarer.
- The world may already be damaged before the player arrives, so consequences are not presented as entirely the player's fault.

Possible restorative actions:
- Planting and successfully growing trees helps vegetation return.
- Repairing holes or damage in the lattice helps restore the world's stability.
- Building and maintaining things may contribute to a world that feels inhabited again.
- Helping others may make villages and other signs of life more likely.

Restoration should reverse some consequences but not automatically erase every cost. Different actions should repair different kinds of damage. The player should not be punished for ordinary survival, and repair should feel meaningful rather than like a hidden checklist.

## 13. Possible ending

An endgame idea is that the player eventually obtains enough obsidian through rare discoveries to build or enter a Nether portal. Instead of taking the player to the Nether, the portal returns them to the Overworld as an ending. The Overworld reflects the cumulative effects of their actions: it may be damaged, recovering, or a mixture of both.

The ending should not simply label the player good or bad. A mixed landscape can tell a more honest story about taking, repairing, and living with consequences. The exact portal behavior, ending sequence, and whether the player can continue afterward are undecided.

## 14. Design principles

1. **Consequences without a lecture.** Let the player notice what changed instead of explaining every change in text.
2. **Taking is part of survival.** The game should not condemn ordinary resource use.
3. **The world remembers.** Extraction and restoration should leave persistent, visible traces.
4. **Restoration is possible, not effortless.** Helpful actions can bring back life without erasing every consequence.
5. **Loneliness needs contrast.** Rare warmth, life, and gratitude are more powerful against emptiness than constant misery.
6. **Mystery needs fairness.** Unsettling mechanics should not make basic survival feel arbitrary or impossible.
7. **The story is optional.** Players who ignore the messages should still have a compelling survival experience.

## 15. Open questions and contradictions to resolve

- Is the main lattice's final material definitely bedrock? This document records bedrock as the current direction, replacing the older Resin Lattice concept, but the older concept file remains separate and unchanged.
- What are the final biome dimensions, probabilities, and tree exclusion area?
- What is the maximum city height, and how does it relate to Minecraft's build-height limits?
- Are books guaranteed in every city building, or simply common?
- Do Biome Barrel effects trigger when opened or only when resources are taken?
- How exactly are the night cycle, abyss darkness, and nightmare transition connected?
- Should daymare clues have additional visual or audio cues, or remain entirely environmental?
- Can the player sleep, and if so, what does sleeping cost or change?
- How does the game track extraction and restoration without a visible morality meter?
- How often can flash nightmares occur without becoming annoying?
- How much can the Temi village reward players, and what qualifies the world for its appearance?
- What happens to player inventory, health, location, and elapsed time when a dream ends?
- How are the dream snapshots generated without allowing interaction or resource farming?
- How does the bedrock serpent fit into the updated bedrock lattice, and what are its final movement, targeting, and block-erasing rules?
- How do the nightly dream and the temporary Tesseract Overworld relate narratively? They can both be visions of the Overworld, but should have clearly different purposes and rules.

## 16. Current scope

This document captures the concept phase. Spawn rates, algorithms, precise structure layouts, item tables, dream transition timing, and Bedrock add-on implementation details should remain open until the gameplay design is agreed upon. Do not treat provisional numbers or example messages as final specifications.


## Prototype implementation note (2026-10-11)

An initial Bedrock behavior-pack prototype now exists under `mods/lattice-of-greed/prototype/`. It implements a generated dream landscape in a separate void dimension, a Tesseract-like structure with a fall-through exit, clue signs, timed nightly nightmares, a temporary obsidian-mining trigger for daymares, and a basic extraction/restoration influence on the dream terrain. The custom-dimension and scripting APIs are experimental, so the prototype still requires in-game testing. The first version does not implement the full bedrock lattice or the other major biomes.
