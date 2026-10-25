# Inkoff _AI

> AI-drafted documentation based on the creator's latest clarifications. The white-ore fallback and teammate ink-transfer idea are explicitly removed.

## Match entry and ink
Every player starts an Inkoff match with the same amount of ink. Each player chooses an ink color they have available before or at match start. During the match, players can mine ores to obtain more ink.

Running out of ink causes death, but the consequence depends on the player's role:
- **Worker:** The worker immediately respawns.
- **Queen:** The Queen loses one power/life. The Queen has three lives; losing all three means the opposing team wins by Queen elimination.

There is no emergency white ore, and no teammate ink-transfer mechanic. An earlier idea that slashing a teammate would give them ink has been rejected. The exact ink amount restored on worker respawn, if any, is not specified yet.

## Teams and victory routes
Inkoff is a team-based competitive mode with two victory routes:
1. **Gel economy:** Workers collect gel, carry it back to their own base, and deposit it into the base's holes. Filling all required holes wins the match.
2. **Queen elimination:** Each team has a Queen with three lives. Eliminating the opposing Queen by taking all three lives wins the match.

The Queen is randomly selected for each team. When the Queen dies, the death is clearly signaled, there is a short delay, and the Queen respawns at their own base while losing one life. Running out of ink also costs the Queen one power/life. Exact timing and protections remain open.

## Workers and gel
The exact source and spawn rules for gel have not been finalized. A worker slashes a gel once to collect it; it floats above their head so possession is visible. They carry it to their own base and jump into the base to deposit it. Each deposited gel fills one hole in the team's hexagon-style base layout. If a worker carrying gel is killed, the opponent can take the dropped gel.

## The Queen and amulets
The Queen can fly and uses a gun-like version of their equipped sword. The sword remains visually recognizable. The amulet determines the Queen's projectile pattern and damage behavior; it also provides passive advantages in the broader weapon system. The amulet is visible at the blade-handle connection on a normal weapon and is also displayed on the Queen's chest. The Queen's transformation includes wings and a crown, halo, or demon horns depending on the amulet's design.

The handle continues to determine the secondary ability, with Queen-specific enhancement or modification still to be specified. Queen-specific projectiles do not damage the opposing Queen; Queens can fight each other with melee sword attacks. Friendly fire is off.

## Black ink challenge
Black ink is a voluntary, explicitly harder challenge loadout. Choosing it must show a clear warning and impose a meaningful disadvantage. Earlier possible penalties included increased ink use, longer recharge, reduced damage, weaker abilities, and longer cooldowns. Exact penalties are not finalized. Any effect on end-of-match rewards has not been decided.

## Removed mechanics
- White emergency ore: removed.
- Teammate slashes transferring ink: rejected.
- Colored shards and unlock tokens: removed from the current economy.
- Old core-stone victory condition: superseded by gel delivery and Queen elimination.

## Open questions
- Does a worker who runs out of ink respawn with their starting ink, or without ink?
- Does running out of ink count as a death for score/reward purposes?
- How much ink does every player start with, and how much does each ore provide?
- Where and how does gel spawn, and how does it respawn after being collected?
- Can a player mine while under threat, and how are mining actions interrupted?
- Does the Queen lose one of their three lives immediately when ink depletion causes death? Current design notes say yes; exact sequencing is still to be defined.
