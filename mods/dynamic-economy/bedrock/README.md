# Dynamic Economy for Minecraft Bedrock

A first playable prototype of the global market concept in `Initialconcept.md`.

## Current implementation

- Global market scores persisted in a world dynamic property.
- Per-player balances persisted in world dynamic properties.
- Infinite-stock item buying and inventory-based selling.
- Prices calculated per unit along the score path.
- Base price $1.00; growth factor 1.01; one market-score point per item.
- 10% sales tax applied only to sale proceeds.
- Integer cents for balances and transaction totals, with safe-integer checks.
- Trade quantity capped at 64 per command.
- Basic inventory capacity / ownership checks and rollback attempts on failed updates.

## Commands

Type these in chat:

- `!economy` or `!help`
- `!balance`
- `!price minecraft:oak_log`
- `!buy minecraft:oak_log 8`
- `!sell minecraft:oak_log 8`
- `!market`

Use valid Bedrock item type IDs. Namespace can be omitted, for example `oak_log`.

## Install

1. Import or copy this `bedrock` folder as a behavior pack into the Bedrock development behavior-pack directory.
2. Ensure the manifest stays at the behavior-pack root and `scripts/main.js` stays at its declared path.
3. Activate the pack in a **test world copy** with cheats enabled and scripting supported by your Bedrock version.
4. Join and try `!economy`, then test a small buy/sell loop before using it on a server.

## Prototype limitations

- The pack targets `@minecraft/server` 2.0.0. If your Bedrock version does not support that API version, the dependency must be adjusted to a version available in your game.
- Chat interception uses `world.beforeEvents.chatSend`, which Microsoft currently marks as pre-release in its Script API reference. Command support should be tested against the exact Bedrock release you use.
- This is not yet a polished shop UI, admin configuration system, or release-ready economy. No player starts with money by default; starting balances and tax are configuration values in `scripts/main.js`.
- Currency uses integer cents, rather than the earlier exploratory 10^12 internal units per dollar, to keep balances safely within JavaScript's exact-integer range.
- The item catalog is open-ended: valid item IDs can be traded. The prototype does not yet block non-stackable, untradeable, or server-restricted item types.
- Inventory and dynamic-property operations are guarded and rollback is attempted, but Bedrock does not provide a database transaction primitive. Test thoroughly before a public-server rollout.
- Oversaturation is represented by the minimum price floor. A dedicated oversaturated-items interface and optional apocalypse/reset extension are not implemented.
