# Devlog

A running record of development discoveries, learning notes, and ideas that may later become tutorial material.

## 2026-10-20: Understanding Godot Nodes from a Scratch-Based Background

### The question

Coming from a game-making environment where the main ingredients are sprites, appearance editing, hitboxes, and code, Godot's large collection of node types can feel confusing. The natural question is: why use so many different nodes instead of building everything from a texture, a hitbox, and a script?

This is an important beginner-learning moment and a potential foundation for a future tutorial series about learning game development from scratch.

### The core idea

**Godot nodes are building blocks with different responsibilities.** Many nodes provide built-in functionality, but they are not all complete, ready-made game objects. A node usually specializes in one job, and nodes can be combined into a larger object or system.

A useful way to understand a node is to ask:

1. What does this node do automatically?
2. What would I need to implement myself if I did not use it?
3. Can I combine it with other nodes to make something more complex?

### Basic nodes and specialized nodes

- **`Node`**: A basic organizational node. It does not inherently draw a sprite, provide a 2D transform, or simulate physics. It can organize other nodes and run attached scripts.
- **`Node2D`**: Adds a 2D transform, including position, rotation, and scale.
- **`Sprite2D`**: Draws a texture. It does not automatically walk, fall, bounce, or respond physically.
- **`CollisionShape2D`**: Defines a shape used by a collision system. By itself, it does not make an object fall or decide how it should react to collisions.
- **`Area2D`**: Supports overlap detection, such as noticing when an object enters or leaves an area.
- **`RigidBody2D`**: Participates in Godot's physics simulation. The physics engine handles behavior such as gravity, momentum, and physical collision responses.
- **`CharacterBody2D`**: Provides movement and collision-handling tools suited to character-controlled motion. The game's movement logic still needs to be written.
- **`Camera2D`**: Provides camera behavior, such as following a target.
- **`Control`**: Provides UI-oriented layout, sizing, anchoring, and interface behavior.
- **`Timer`**: Counts time and emits a signal when its timer finishes.

The important distinction is that a node's name does not mean it is a whole game object. For example, a collision shape describes geometry, while a physics body participates in the physics system. A timer can do its job without a sprite or hitbox because it is a timekeeping tool, not a visible object.

### Example: a throwable 2D cube

A typical physics-based cube could use this hierarchy:

```text
RigidBody2D
├── Sprite2D
└── CollisionShape2D
```

- `RigidBody2D` handles physics simulation.
- `Sprite2D` supplies the cube's visible image.
- `CollisionShape2D` supplies its collision geometry, often a rectangle.

Making the cube respond to touch, follow a finger while being dragged, and launch when released still requires interaction logic. The physics body does not automatically know the desired touch-and-throw controls.

### Could we build the physics ourselves?

Yes. A custom object could use `Node2D`, a sprite, a collision shape, and a script. The script could implement gravity by changing vertical velocity and updating position every physics frame.

For example:

```gdscript
extends Node2D

var velocity := Vector2.ZERO
var gravity := 980.0

func _physics_process(delta: float) -> void:
    velocity.y += gravity * delta
    position += velocity * delta
```

This simple example accelerates the object downward. It does **not** automatically provide complete collision detection and response, realistic bouncing, or a full physics simulation. A `CollisionShape2D` alone does not supply those systems.

This demonstrates the trade-off:

- **Use a specialized node** when its built-in behavior is useful and saves work.
- **Build a custom system** when you need more control or want to learn how the behavior works internally.
- **Combine both approaches** when built-in systems handle the difficult foundation and custom scripts provide game-specific behavior.

For a throwable cube, `RigidBody2D` is usually a sensible starting point, with a script added for touch dragging and throwing.

### Tutorial takeaway

A beginner does not need to memorize every node type. It is more useful to learn what each node contributes and what it leaves for the developer to implement.

A possible teaching principle:

> Every node has a job. Some draw, some organize, some describe shapes, some detect overlaps, and some run specialized systems such as physics or UI layout. Choose nodes based on the work you want Godot to do for you.

This can become a tutorial chapter about the difference between **appearance, collision geometry, behavior, and built-in systems**, especially for learners arriving from simpler or scratch-based game engines.

### Xogot for iPhone note

When turning these notes into practical instructions, use the Xogot iPhone interface and touch-first workflow. Do not assume desktop Godot menus or editor layouts match Xogot. If an interface detail has not been confirmed, check the current Xogot documentation or ask for a screenshot rather than guessing.
