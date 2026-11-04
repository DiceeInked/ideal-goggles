extends Node2D

@onready var player_body: CharacterBody2D = get_parent() as CharacterBody2D
@onready var left_arm: Polygon2D = get_node("left-arm")
@onready var right_arm: Polygon2D = get_node("right-arm")
@onready var left_leg: Polygon2D = get_node("left-leg")
@onready var right_leg: Polygon2D = get_node("right-leg")

var animation_time: float = 0.0
var facing: float = 1.0


func _process(delta: float) -> void:
	animation_time += delta

	var speed_ratio := clampf(absf(player_body.velocity.x) / player_body.move_speed, 0.0, 1.0)
	var stride := sin(animation_time * 12.0) * speed_ratio * 0.42

	left_leg.rotation = stride
	right_leg.rotation = -stride
	left_arm.rotation = -stride * 0.55
	right_arm.rotation = stride * 0.55


func set_facing(direction: float) -> void:
	if direction == 0.0:
		return

	facing = signf(direction)
	scale.x = facing
