extends CharacterBody2D

@export var move_speed: float = 280.0
@export var ground_acceleration: float = 1800.0
@export var air_acceleration: float = 1100.0
@export var gravity: float = 1500.0
@export var jump_velocity: float = 520.0

@onready var player_visual: Node2D = get_node("player-visual")


func _physics_process(delta: float) -> void:
	var direction := Input.get_axis("move_left", "move_right")
	var acceleration := ground_acceleration if is_on_floor() else air_acceleration

	velocity.x = move_toward(velocity.x, direction * move_speed, acceleration * delta)

	if not is_on_floor():
		velocity.y += gravity * delta
	elif velocity.y > 0.0:
		velocity.y = 0.0

	# Holding jump repeats the jump as soon as the player lands.
	if is_on_floor() and Input.is_action_pressed("jump"):
		velocity.y = -jump_velocity

	move_and_slide()

	if direction != 0.0:
		player_visual.call("set_facing", direction)
