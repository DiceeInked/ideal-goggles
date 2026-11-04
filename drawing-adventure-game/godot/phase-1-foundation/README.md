# DAG Godot: Phase 1 Foundation

This is the first playable foundation build for Drawing Adventure Game.

## Open the project

1. Open Godot 4.
2. Import this folder as a project by selecting its `project.godot` file.
3. Run the project.

The main scene is `scenes/main.tscn`.

## Current test room

The scene contains one closed rectangular room with four separate collision surfaces:

- Floor
- Ceiling
- Left wall
- Right wall

The room is deliberately empty so movement and collision behavior are easy to inspect.

## Controls

- **A / D:** Move left and right.
- **Space:** Jump.
- **Touchscreen:** On touch-capable devices, on-screen left, right, and jump buttons appear.

Jump uses hold-to-auto-jump: if jump remains held when the player lands, another jump starts immediately. It does not allow a second jump while airborne.

Air control is enabled. Ground and air acceleration are separate exported values so the movement feel can be tuned during testing.

## Placeholder character

The player is built from six separate Polygon2D pieces: head, torso, left arm, right arm, left leg, and right leg. The visual animation is separate from the movement controller.

## Deferred mechanic

The upward inertia boost from hitting ores or creatures while airborne is reserved for the mining and combat integration phase. This foundation keeps the player controller separate from future hit-response logic.

## Tuning

Movement values are exported in `scripts/player.gd`:

- `move_speed`
- `ground_acceleration`
- `air_acceleration`
- `gravity`
- `jump_velocity`

These are initial test values, not final locked game-balance values.

## Phase 1 testing checklist

- [ ] Walk left and right.
- [ ] Stop without excessive sliding.
- [ ] Jump and land.
- [ ] Hold jump through landing and confirm immediate repeated jumps.
- [ ] Release jump before landing and confirm auto-jump stops.
- [ ] Move left and right while airborne.
- [ ] Hit the ceiling and confirm upward movement is blocked.
- [ ] Hit each wall and confirm the player stays inside the room.
- [ ] Confirm the player stands on the floor without sinking.
- [ ] Repeat movement and collision checks using touchscreen controls.
