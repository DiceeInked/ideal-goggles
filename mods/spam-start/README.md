# Spam Start

A Minecraft Bedrock behavior-pack prototype for version 26.52. Spam Start registers a real script-created void dimension and uses it as a join lobby.

## Features

- Registers `spam_start:void` through the experimental Custom Dimension API.
- Sends players to `(0, 64, 0)` in the lobby on each join.
- Creates a small starting platform at Y=63 so the spawn point is safe.
- Removes entities in the mob family from the lobby while leaving players and decorative entities alone.
- Restricts lobby block placement and breaking to players tagged as moderators.
- Tracks each player's latest known Overworld position using persistent player dynamic properties.
- Adds `/function spam_start` as a command-block-friendly return mechanism.
- Leaves global weather and daylight settings unchanged.
- Leaves ordinary Overworld death and respawning unchanged.

## Requirements

- Minecraft Bedrock Edition 26.52 or a compatible version.
- A world with the **Beta APIs** experiment enabled, because the Custom Dimension API is experimental.
- Cheats/command access for setup and the return function.
- The behavior pack enabled in the world.

## Install

1. Copy or import this folder as a behavior pack.
2. Enable it in a test world.
3. Enable the **Beta APIs** experiment for that world.
4. Start the world and inspect the Content Log for script errors.
5. The add-on creates a small platform at the lobby spawn. Build your lobby around it.

## Moderator permissions

Spam Start uses a vanilla entity tag for moderator access. An operator can grant a player building access with:

```mcfunction
/tag <player> add spam_start_moderator
```

Remove access with:

```mcfunction
/tag <player> remove spam_start_moderator
```

Only tagged players can place or break blocks inside `spam_start:void`. The tag does not grant operator permissions elsewhere.

## Return function

Create a command block in the lobby and set it to **Impulse** or **Repeat** as appropriate, with **Needs Redstone** if you want a button. Enter:

```mcfunction
function spam_start
```

The function tags the nearest player and sends a script event. Spam Start returns the tagged player to their latest saved Overworld location. If they have not yet had a position recorded, it uses the world's default spawn.

For reliable button behavior, place the command block close enough that the player pressing the button is the nearest player to it.

Players may also run `/function spam_start` directly if they have command permission.

## Position tracking and respawning

The add-on periodically saves each player's position while they are in the Overworld. The saved point is the most recently tracked position, so it may be a few seconds behind the exact moment the player disconnects. Location data is stored on the player and persists between sessions.

The lobby teleport only runs on the initial spawn event for a joining session. Death respawns are not sent to the lobby, so vanilla bed and world-spawn behavior remains in control.

## Important limitations

- Custom Dimensions currently require the experimental Beta APIs scripting surface and may change between Minecraft releases.
- The add-on cannot enable Beta APIs for a world automatically.
- Daylight cycle and weather are not changed. These are intentionally left alone.
- This is a source behavior-pack folder, not a prebuilt `.mcaddon` archive yet.
- Test in a copy of your world first. Back up important worlds before enabling experimental add-ons.
