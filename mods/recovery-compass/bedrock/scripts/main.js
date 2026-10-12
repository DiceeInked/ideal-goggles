import { world, system, ItemStack, EnchantmentTypes } from "@minecraft/server";

const COMPASS_ID = "minecraft:recovery_compass";
const VANISHING_IDS = ["minecraft:vanishing", "vanishing"];

function makeRecoveryCompass() {
  const compass = new ItemStack(COMPASS_ID, 1);
  const enchantable = compass.getComponent("minecraft:enchantable");
  let vanishing;
  for (const id of VANISHING_IDS) {
    try { vanishing = EnchantmentTypes.get(id); if (vanishing) break; } catch {}
  }
  if (!enchantable) throw new Error("This Bedrock version does not expose an enchantable component on a recovery compass.");
  if (!vanishing) throw new Error("Curse of Vanishing is not available through this version of the Script API.");
  const enchantment = { type: vanishing, level: 1 };
  if (!enchantable.canAddEnchantment(enchantment)) {
    throw new Error("This Bedrock version rejected Curse of Vanishing on a recovery compass.");
  }
  enchantable.addEnchantment(enchantment);
  if (!enchantable.hasEnchantment(vanishing)) {
    throw new Error("Curse of Vanishing could not be verified on the recovery compass.");
  }
  return compass;
}
function tell(player, message) {
  try { player.sendMessage("§b[Recovery Compass]§r " + message); } catch {}
}
function grantCompass(player) {
  try {
    const inventoryComponent = player.getComponent("minecraft:inventory");
    const container = inventoryComponent && inventoryComponent.container;
    if (!container) throw new Error("Could not access your inventory.");
    let compass;
    let enchantmentError;
    try {
      compass = makeRecoveryCompass();
    } catch (error) {
      enchantmentError = error instanceof Error ? error.message : String(error);
      compass = new ItemStack(COMPASS_ID, 1);
      console.warn("[Recovery Compass] Could not apply Curse of Vanishing: " + enchantmentError);
    }
    const leftover = container.addItem(compass);
    if (leftover) {
      player.dimension.spawnItem(leftover, player.location);
      tell(player, "Your inventory was full, so the compass dropped at your feet.");
    }
    if (enchantmentError) {
      tell(player, "You received a recovery compass, but Curse of Vanishing could not be applied: " + enchantmentError);
    } else if (!leftover) {
      tell(player, "You received a recovery compass enchanted with Curse of Vanishing.");
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[Recovery Compass] Could not grant compass: " + detail);
    tell(player, "I couldn't give you a recovery compass this time. Error: " + detail);
  }
}
world.afterEvents.playerSpawn.subscribe(function (event) {
  if (event.initialSpawn) return;
  const player = event.player;
  system.runTimeout(function () { grantCompass(player); }, 2);
});
world.afterEvents.worldLoad.subscribe(function () {
  console.warn("[Recovery Compass] Respawn compass initialized.");
});
