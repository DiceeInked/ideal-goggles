import { system, world } from "@minecraft/server";

const VOID_DIMENSION_ID = "spam_start:void";
const LOBBY_SPAWN = { x: 0, y: 64, z: 0 };
const PLATFORM_Y = 63;
const MODERATOR_TAG = "spam_start_moderator";
const RETURN_TAG = "spam_start_return";
const RETURN_EVENT_ID = "spam_start:return";
const TRACK_INTERVAL_TICKS = 40;

const PROP_X = "spam_start:last_x";
const PROP_Y = "spam_start:last_y";
const PROP_Z = "spam_start:last_z";
const PROP_VALID = "spam_start:has_last_position";

let dimensionReady = false;
let platformBuilt = false;

system.beforeEvents.startup.subscribe((event) => {
  event.dimensionRegistry.registerCustomDimension(VOID_DIMENSION_ID);
});

world.afterEvents.worldLoad.subscribe(() => {
  try {
    const lobby = world.getDimension(VOID_DIMENSION_ID);
    buildSpawnPlatform(lobby);
    dimensionReady = true;
    world.sendMessage("§b[Spam Start] §fVoid lobby is ready.");
  } catch (error) {
    console.warn(`[Spam Start] Could not initialize the void lobby: ${error}`);
  }
});

function buildSpawnPlatform(dimension) {
  if (platformBuilt) return;

  // A small safe starting platform. Moderators can replace it after joining.
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      dimension.getBlock({ x, y: PLATFORM_Y, z })?.setType("minecraft:stone");
    }
  }

  platformBuilt = true;
}

function isLobbyDimension(dimension) {
  return dimension?.id === VOID_DIMENSION_ID;
}

function teleportToLobby(player) {
  if (!dimensionReady) {
    system.runTimeout(() => teleportToLobby(player), 20);
    return;
  }

  try {
    player.teleport(LOBBY_SPAWN, {
      dimension: world.getDimension(VOID_DIMENSION_ID),
      checkForBlocks: false,
    });
  } catch (error) {
    console.warn(`[Spam Start] Lobby teleport failed for ${player.name}: ${error}`);
  }
}

world.afterEvents.playerSpawn.subscribe((event) => {
  // initialSpawn is true for the join spawn, not ordinary death respawns.
  if (!event.initialSpawn) return;
  const player = event.player;
  system.run(() => teleportToLobby(player));
});

// Track the most recently observed Overworld position. Dynamic properties on the
// player persist with that player across leaving and rejoining the world.
system.runInterval(() => {
  let players;
  try {
    players = world.getPlayers();
  } catch {
    return;
  }

  for (const player of players) {
    if (player.dimension.id !== "minecraft:overworld") continue;

    try {
      const location = player.location;
      player.setDynamicProperty(PROP_X, location.x);
      player.setDynamicProperty(PROP_Y, location.y);
      player.setDynamicProperty(PROP_Z, location.z);
      player.setDynamicProperty(PROP_VALID, true);
    } catch (error) {
      console.warn(`[Spam Start] Could not save position for ${player.name}: ${error}`);
    }
  }
}, TRACK_INTERVAL_TICKS);

// Only moderators can edit blocks inside the lobby.
world.beforeEvents.playerBreakBlock.subscribe((event) => {
  if (!isLobbyDimension(event.block.dimension)) return;
  if (!event.player.hasTag(MODERATOR_TAG)) event.cancel = true;
});

world.beforeEvents.playerPlaceBlock.subscribe((event) => {
  if (!isLobbyDimension(event.block.dimension)) return;
  if (!event.player.hasTag(MODERATOR_TAG)) event.cancel = true;
});

// The void generator creates no natural terrain. Suppress entity spawning here as
// an additional guard against any spawn source that might otherwise create mobs.
world.beforeEvents.entitySpawn.subscribe((event) => {
  if (isLobbyDimension(event.dimension)) event.cancel = true;
});

world.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== RETURN_EVENT_ID) return;

  let candidates = [];
  try {
    candidates = world.getPlayers().filter((player) => player.hasTag(RETURN_TAG));
  } catch {
    return;
  }

  for (const player of candidates) {
    try {
      const overworld = world.getDimension("minecraft:overworld");
      const hasSavedPosition = player.getDynamicProperty(PROP_VALID) === true;
      const saved = hasSavedPosition
        ? {
            x: Number(player.getDynamicProperty(PROP_X)),
            y: Number(player.getDynamicProperty(PROP_Y)),
            z: Number(player.getDynamicProperty(PROP_Z)),
          }
        : world.getDefaultSpawnLocation();

      const destination = {
        x: Number.isFinite(saved.x) ? saved.x : 0,
        y: Number.isFinite(saved.y) ? saved.y : 80,
        z: Number.isFinite(saved.z) ? saved.z : 0,
      };

      player.removeTag(RETURN_TAG);
      player.teleport(destination, {
        dimension: overworld,
        checkForBlocks: false,
      });
      player.sendMessage(
        hasSavedPosition
          ? "§b[Spam Start] §fReturning you to your saved Overworld position."
          : "§b[Spam Start] §fNo saved position yet; sending you to the Overworld spawn."
      );
    } catch (error) {
      try {
        player.removeTag(RETURN_TAG);
      } catch {}
      console.warn(`[Spam Start] Return teleport failed: ${error}`);
    }
  }
});
