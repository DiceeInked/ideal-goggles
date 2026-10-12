# Spam Start Test Checklist

Run these checks in a separate test world with Beta APIs enabled.

- [ ] The behavior pack activates without manifest errors.
- [ ] The Content Log shows no errors while registering `spam_start:void`.
- [ ] A 7×7 stone platform appears at Y=63 in the void lobby.
- [ ] A joining player is teleported to (0, 64, 0) in `spam_start:void`.
- [ ] A normal player cannot break lobby blocks.
- [ ] A normal player cannot place lobby blocks.
- [ ] A player with the `spam_start_moderator` tag can build in the lobby.
- [ ] No entities spawn in the lobby.
- [ ] Weather and daylight rules remain unchanged.
- [ ] After spending time in the Overworld, `/function spam_start` returns the player to their last tracked Overworld position.
- [ ] If no position was saved, the function returns the player to the Overworld default spawn.
- [ ] Dying in the Overworld follows vanilla bed/world-spawn rules and does not teleport the player to the lobby.
- [ ] Rejoining sends the player to the lobby while retaining their saved Overworld position.

## Known behavior

Position snapshots are taken every 40 ticks (about 2 seconds). The stored location is therefore the most recently sampled Overworld position, not necessarily the exact block occupied at logout.
