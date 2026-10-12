# Spam Start — Initial Concept

## Summary

Spam Start is a Minecraft Bedrock Edition add-on for version 26.52 that sends players to a genuine script-registered void dimension whenever they join a world. The lobby is centered at X=0, Y=64, Z=0 and is intended to be a moderator-built waiting area.

## Core Rules

- Register a custom void dimension named `spam_start:void` through the experimental Custom Dimension Script API.
- On each player's initial spawn after joining a session, teleport them to the lobby at (0, 64, 0).
- Build a small, safe starting platform at Y=63. Moderators can reshape or replace it.
- Suppress entity spawning in the lobby.
- Only players tagged `spam_start_moderator` can place or break blocks in the lobby. Operators can assign the tag with `/tag <player> add spam_start_moderator` and remove it with `/tag <player> remove spam_start_moderator`.
- Do not change the global daylight cycle or weather settings.
- Track each player's latest known Overworld position while they are in the Overworld.
- Provide `/function spam_start` as the recommended exit mechanism. It returns the nearby player to their saved Overworld position; if no saved position exists, it uses the world's default spawn.
- Dying in the Overworld must follow normal Minecraft respawn rules. A death respawn is not treated as a new join and must not send the player to the lobby.
- Saved location data persists on the player across sessions.

## Important Implementation Notes

- Custom Dimensions are currently exposed through experimental Script API functionality and require the world's Beta APIs experiment.
- A Bedrock function cannot directly call a JavaScript function, so `functions/spam_start.mcfunction` tags the nearest player and emits a script event. The script handles the actual saved-location lookup and teleport.
- The function is suitable for a command block button in the lobby. Place the command block so the player pressing the button is the nearest player to it.
- The saved position is updated periodically while the player is in the Overworld, so it is the latest tracked location rather than a guaranteed exact logout-tick snapshot.
- Daylight and weather are intentionally not frozen. No global gamerules are changed.

## Not Included Yet

- A moderator management UI.
- A custom resource pack or lobby artwork.
- Per-dimension weather/daylight controls.
- Automatic installation or enabling of Beta APIs in an existing world.

## Test Plan

1. Enable the behavior pack in a test world with Beta APIs enabled.
2. Join and verify the custom dimension is registered and a platform appears.
3. Join as a normal player and verify the player is moved to (0, 64, 0).
4. Verify normal players cannot break or place lobby blocks.
5. Tag a trusted moderator and verify they can build in the lobby.
6. Use a command block with `function spam_start` and verify it returns the nearby player to their saved Overworld position.
7. Die in the Overworld and verify normal bed/world-spawn behavior.
8. Leave and rejoin; verify the player returns to the lobby and their saved Overworld position remains available.
