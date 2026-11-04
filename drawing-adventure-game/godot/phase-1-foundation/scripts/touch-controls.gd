extends Control

var active_actions: Array[StringName] = []


func _ready() -> void:
	if not DisplayServer.is_touchscreen_available():
		return

	_add_action_button("◀", "move_left", 0.03, 0.79, 0.12, 0.96)
	_add_action_button("▶", "move_right", 0.14, 0.79, 0.23, 0.96)
	_add_action_button("JUMP", "jump", 0.83, 0.78, 0.98, 0.96)


func _add_action_button(
	label: String,
	action: StringName,
	left: float,
	top: float,
	right: float,
	bottom: float
) -> void:
	var button := Button.new()
	button.text = label
	button.anchor_left = left
	button.anchor_top = top
	button.anchor_right = right
	button.anchor_bottom = bottom
	button.offset_left = 0.0
	button.offset_top = 0.0
	button.offset_right = 0.0
	button.offset_bottom = 0.0
	button.add_theme_font_size_override("font_size", 26)
	button.modulate = Color(1.0, 1.0, 1.0, 0.82)
	add_child(button)

	button.button_down.connect(_press_action.bind(action))
	button.button_up.connect(_release_action.bind(action))


func _press_action(action: StringName) -> void:
	if not active_actions.has(action):
		active_actions.append(action)
	Input.action_press(action)


func _release_action(action: StringName) -> void:
	Input.action_release(action)
	active_actions.erase(action)


func _exit_tree() -> void:
	for action in active_actions:
		Input.action_release(action)
