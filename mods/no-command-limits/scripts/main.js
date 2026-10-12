import {
  system,
  BlockVolume,
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
} from "@minecraft/server";

const BATCH_SIZE = 16;
const MAX_BATCHES_PER_TICK = 1;

system.beforeEvents.startup.subscribe((event) => {
  const command = {
    name: "ncl:fill",
    description: "Fill a region in small batches. Format: /ncl:fill <from> <to> <block>",
    permissionLevel: CommandPermissionLevel.GameDirectors,
    cheatsRequired: true,
    mandatoryParameters: [
      { name: "from", type: CustomCommandParamType.Location },
      { name: "to", type: CustomCommandParamType.Location },
      { name: "block", type: CustomCommandParamType.BlockType },
    ],
  };

  event.customCommandRegistry.registerCommand(command, (origin, args) => {
    const [from, to, blockType] = args;
    const source = origin.sourceEntity;

    if (!source) {
      return {
        status: CustomCommandStatus.Failure,
        message: "Run this command in-game as an entity.",
      };
    }

    const min = {
      x: Math.floor(Math.min(from.x, to.x)),
      y: Math.floor(Math.min(from.y, to.y)),
      z: Math.floor(Math.min(from.z, to.z)),
    };
    const max = {
      x: Math.floor(Math.max(from.x, to.x)),
      y: Math.floor(Math.max(from.y, to.y)),
      z: Math.floor(Math.max(from.z, to.z)),
    };

    const dimension = source.dimension;
    const batchCountX = Math.ceil((max.x - min.x + 1) / BATCH_SIZE);
    const batchCountY = Math.ceil((max.y - min.y + 1) / BATCH_SIZE);
    const batchCountZ = Math.ceil((max.z - min.z + 1) / BATCH_SIZE);
    const totalBatches = batchCountX * batchCountY * batchCountZ;

    let batchIndex = 0;
    let filledBatches = 0;
    let skippedBatches = 0;

    source.sendMessage(
      `[No Command Limits] Starting ${max.x - min.x + 1}×${max.y - min.y + 1}×${max.z - min.z + 1} fill in ${totalBatches} small batches. Unloaded chunks may be skipped.`
    );

    const processNextBatches = () => {
      let processedThisTick = 0;

      while (batchIndex < totalBatches && processedThisTick < MAX_BATCHES_PER_TICK) {
        const xIndex = batchIndex % batchCountX;
        const yIndex = Math.floor(batchIndex / batchCountX) % batchCountY;
        const zIndex = Math.floor(batchIndex / (batchCountX * batchCountY));

        const batchMin = {
          x: min.x + xIndex * BATCH_SIZE,
          y: min.y + yIndex * BATCH_SIZE,
          z: min.z + zIndex * BATCH_SIZE,
        };
        const batchMax = {
          x: Math.min(batchMin.x + BATCH_SIZE - 1, max.x),
          y: Math.min(batchMin.y + BATCH_SIZE - 1, max.y),
          z: Math.min(batchMin.z + BATCH_SIZE - 1, max.z),
        };

        try {
          dimension.fillBlocks(new BlockVolume(batchMin, batchMax), blockType, {
            ignoreChunkBoundErrors: true,
          });
          filledBatches++;
        } catch (error) {
          skippedBatches++;
        }

        batchIndex++;
        processedThisTick++;
      }

      if (batchIndex < totalBatches) {
        system.run(processNextBatches);
        return;
      }

      source.sendMessage(
        `[No Command Limits] Finished. Batches attempted: ${totalBatches}; successful calls: ${filledBatches}; skipped/failed calls: ${skippedBatches}. Chunks that were not loaded cannot be force-loaded by this add-on.`
      );
    };

    system.run(processNextBatches);

    return {
      status: CustomCommandStatus.Success,
      message: "Fill job queued. Progress and final results will appear in chat.",
    };
  });
});
