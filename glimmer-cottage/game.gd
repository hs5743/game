extends Node3D
## All art is procedural and original. Coordinates are metres; Y is up.

const SAVE_PATH = "user://progress.json"
const WORDS = ["book", "cup", "red", "blue", "green", "yellow", "cat", "bird", "apple", "flower", "key", "door"]
const CHINESE = ["書本", "杯子", "紅色", "藍色", "綠色", "黃色", "貓", "鳥", "蘋果", "花", "鑰匙", "門"]
const COLORS = [Color("dc7369"), Color("73a9cf"), Color("8aaa78"), Color("edc76c")]
const WOOD = Color("715343")
const CREAM = Color("f2e1b8")
const INK = Color("374b49")
const BUNDLED_FONT: Font = preload("res://fonts/NotoSansTC.ttf")

var player: CharacterBody3D
var camera: Camera3D
var pitch = 0.0
var elapsed = 0.0
var current_target: Node3D
var target_id = ""
var held = ""
var reading_step = 0
var color_step = 0
var mural_step = 0
var seals = [false, false, false]
var has_key = false
var door_open = false
var finished = false
var learned: Array = []
var hint_level = 0
var sensitivity = 0.0022
var volume = 0.6
var started = false
var menu_mode = "start"
var save_available = false
var toast_time = 0.0
var interactables: Dictionary = {}
var lamps: Array = []
var mural_icons: Array = []
var door: Node3D
var fairy: Node3D
var motes: Array = []
var voice: AudioStreamPlayer
var chime: AudioStreamPlayer
var music: AudioStreamPlayer
var ui: CanvasLayer
var hud: Control
var task_label: Label
var seal_label: Label
var prompt_label: Label
var toast_label: Label
var carry_label: Label
var overlay: ColorRect
var menu_panel: PanelContainer
var menu_box: VBoxContainer
var crosshair: Label
var place_book: Node3D
var place_cup: Node3D
var reading_sign: Label3D
var mural_sign: Label3D

func _ready() -> void:
	var cfg = ConfigFile.new()
	if cfg.load("user://settings.cfg") == OK:
		volume = clampf(float(cfg.get_value("audio","volume",0.6)),0,1)
		sensitivity = clampf(float(cfg.get_value("input","sensitivity",0.0022)),0.0007,0.004)
	_setup_inputs()
	_build_world()
	_build_player()
	_build_audio()
	_build_ui()
	save_available = FileAccess.file_exists(SAVE_PATH)
	_show_start()
	if "--smoke-test" in OS.get_cmdline_user_args():
		call_deferred("_smoke_test")
	if "--capture" in OS.get_cmdline_user_args():
		call_deferred("_capture_preview")

func _setup_inputs() -> void:
	var bindings = {"forward": [KEY_W, KEY_UP], "back": [KEY_S, KEY_DOWN], "left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT], "interact": [KEY_E], "journal": [KEY_TAB], "hint": [KEY_H], "repeat_word": [KEY_R]}
	for action in bindings:
		InputMap.add_action(action)
		for key in bindings[action]:
			var ev = InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)

func mat(color: Color, glow: float = 0.0) -> StandardMaterial3D:
	var m = StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.87
	if glow > 0.0:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = glow
	return m

func mesh(parent: Node3D, shape: Mesh, pos: Vector3, color: Color, glow: float = 0.0) -> MeshInstance3D:
	var n = MeshInstance3D.new()
	n.mesh = shape
	n.material_override = mat(color, glow)
	parent.add_child(n)
	n.position = pos
	return n

func box(parent: Node3D, pos: Vector3, size: Vector3, color: Color, solid: bool = false) -> MeshInstance3D:
	var shape = BoxMesh.new()
	shape.size = size
	var n = mesh(parent, shape, pos, color)
	if solid:
		var body = StaticBody3D.new()
		n.add_child(body)
		var collision = CollisionShape3D.new()
		var bounds = BoxShape3D.new()
		bounds.size = size
		collision.shape = bounds
		body.add_child(collision)
	return n

func sphere(parent: Node3D, pos: Vector3, size: Vector3, color: Color, glow: float = 0.0) -> MeshInstance3D:
	var shape = SphereMesh.new()
	shape.radial_segments = 16
	shape.rings = 8
	var n = mesh(parent, shape, pos, color, glow)
	n.scale = size
	return n

func cylinder(parent: Node3D, pos: Vector3, bottom: float, top: float, height: float, color: Color) -> MeshInstance3D:
	var shape = CylinderMesh.new()
	shape.bottom_radius = bottom
	shape.top_radius = top
	shape.height = height
	shape.radial_segments = 12
	return mesh(parent, shape, pos, color)

func ring(parent: Node3D, pos: Vector3, radius: float, color: Color) -> MeshInstance3D:
	var shape = TorusMesh.new()
	shape.inner_radius = radius * 0.73
	shape.outer_radius = radius
	return mesh(parent, shape, pos, color)

func sign_text(parent: Node3D, text: String, pos: Vector3, size: int = 40, color: Color = CREAM) -> Label3D:
	var label = Label3D.new()
	label.text = text
	label.font = _font()
	label.font_size = size
	label.pixel_size = 0.006
	label.modulate = color
	label.outline_size = 2
	label.outline_modulate = Color("514d42")
	parent.add_child(label)
	label.position = pos
	return label

func _font() -> Font:
	return BUNDLED_FONT

func interact(id: String, pos: Vector3, size: Vector3) -> Node3D:
	var root = Node3D.new()
	root.name = id
	add_child(root)
	root.position = pos
	var body = StaticBody3D.new()
	root.add_child(body)
	body.set_meta("interaction", id)
	var collision = CollisionShape3D.new()
	var shape = BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	interactables[id] = root
	return root

func _build_world() -> void:
	var env_node = WorldEnvironment.new()
	var env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("b5cbbd")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("ffe7c2")
	env.ambient_light_energy = 0.48
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env_node.environment = env
	add_child(env_node)
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -32, 0)
	sun.light_color = Color("fff0d6")
	sun.light_energy = 0.35
	sun.shadow_enabled = true
	add_child(sun)
	# Floorboards and timber frame.
	box(self, Vector3(0,-0.2,0), Vector3(12.4,0.4,12.4), WOOD, true)
	for row in range(24):
		for col in range(4):
			var tint = Color("b48d67").lightened(float((row + col * 3) % 4) * 0.026)
			box(self, Vector3(-4.5 + col * 3, 0.008, -5.75 + row * 0.5), Vector3(2.975,0.018,0.477), tint)
	box(self, Vector3(-6,2.1,0), Vector3(0.22,4.2,12), Color("d9c9a8"), true)
	box(self, Vector3(6,2.1,0), Vector3(0.22,4.2,12), Color("d9c9a8"), true)
	box(self, Vector3(0,2.1,6), Vector3(12,4.2,0.22), Color("ded1b4"), true)
	for x in [-3.65,3.65]:
		box(self, Vector3(x,2.1,-6), Vector3(4.7,4.2,0.22), Color("e5d5b6"), true)
	box(self, Vector3(0,3.65,-6), Vector3(2.6,1.1,0.22), Color("e5d5b6"), true)
	box(self, Vector3(0,4.25,0), Vector3(12.3,0.2,12.3), Color("b99e7e"))
	for z in [-5.9,-2.0,2.0,5.9]:
		box(self, Vector3(0,4.04,z), Vector3(12,0.28,0.24), WOOD)
		for x in [-5.83,5.83]:
			box(self, Vector3(x,2.05,z), Vector3(0.24,4.1,0.25), WOOD)
	for x in [-5.85,5.85]:
		box(self, Vector3(x,0.22,0), Vector3(0.12,0.42,12), WOOD)
	# Inlaid rug.
	box(self, Vector3(0,0.025,0.8), Vector3(4.2,0.018,4.5), Color("759389"))
	box(self, Vector3(0,0.036,0.8), Vector3(3.95,0.015,4.25), Color("bfc5a1"))
	box(self, Vector3(0,0.047,0.8), Vector3(3.74,0.015,4.04), Color("7a9b91"))
	for x in [-1.7,1.7]:
		for z in [-0.9,0.2,1.3,2.4]:
			var diamond = box(self, Vector3(x,0.061,z), Vector3(0.16,0.012,0.16), CREAM)
			diamond.rotation.y = PI / 4
	# Painted window recesses and mullions.
	for side in [-1,1]:
		var w = Node3D.new()
		add_child(w)
		w.position = Vector3(side * 5.84,2.35,-0.2)
		w.rotation.y = -side * PI / 2
		box(w, Vector3.ZERO, Vector3(2.5,2.2,0.13), WOOD)
		box(w, Vector3(0,0,0.09), Vector3(2.26,1.96,0.04), Color("b9d7c3"))
		for i in range(7):
			cylinder(w, Vector3(-1.0 + i * 0.34,-0.35,0.14),0.24,0,0.85 + (i % 3)*0.18,Color("8aa992"))
		box(w, Vector3(0,0,0.22),Vector3(0.09,2,0.12),CREAM)
		box(w, Vector3(0,0,0.22),Vector3(2.3,0.09,0.12),CREAM)
		box(w, Vector3(0,-1.15,0.24),Vector3(2.8,0.14,0.6),WOOD)
		for cx in [-1.35,1.35]:
			box(w, Vector3(cx,0,0.2),Vector3(0.27,2.3,0.12),Color("b6a3ae"))
	# Door frame.
	for x in [-1.35,1.35]:
		box(self, Vector3(x,1.55,-5.83),Vector3(0.18,3.1,0.32),WOOD)
	box(self, Vector3(0,3.12,-5.83),Vector3(2.9,0.2,0.32),WOOD)
	door = interact("door",Vector3(0,1.5,-5.95),Vector3(2.48,3.0,0.2))
	box(door,Vector3.ZERO,Vector3(2.48,3.0,0.19),Color("6c9288"))
	for x in [-0.8,-0.4,0,0.4,0.8]:
		box(door,Vector3(x,0,0.11),Vector3(0.025,2.8,0.025),Color("50786f"))
	ring(door,Vector3(0,0.45,0.13),0.5,CREAM).rotation.x = PI/2
	sphere(door,Vector3(0.85,-0.1,0.2),Vector3(0.13,0.13,0.13),Color("e6c779"))
	sign_text(door,"GARDEN",Vector3(0,-0.65,0.14),30)
	sign_text(self,"微 光 花 園",Vector3(0,3.5,-5.77),32,WOOD)
	_build_reading()
	_build_colors()
	_build_mural()
	_build_decor()
	_build_garden()
	# A little floating friend, without resembling an existing character.
	fairy = Node3D.new()
	add_child(fairy)
	sphere(fairy,Vector3.ZERO,Vector3(0.42,0.46,0.4),Color("f6dd9b"),0.8)
	for x in [-0.11,0.11]:
		sphere(fairy,Vector3(x,0.06,0.18),Vector3(0.04,0.06,0.025),INK)
		sphere(fairy,Vector3(x*1.3,-0.025,0.175),Vector3(0.07,0.035,0.018),Color("e99b8d"))
	for x in [-0.3,0.3]:
		var wing = sphere(fairy,Vector3(x,0.1,0),Vector3(0.3,0.12,0.15),Color("e4efe0"),0.4)
		wing.rotation.z = sign(x)*0.5
	cylinder(fairy,Vector3(0,0.32,0),0.18,0.025,0.28,Color("93ab8f"))
	for i in range(28):
		var mote = sphere(self,Vector3(sin(i*7.1)*5,0.6+fmod(i*0.37,2.8),cos(i*3.7)*5),Vector3.ONE*0.025,Color("ffe6aa"),1.0)
		motes.append(mote)

func _table(pos: Vector3, width: float = 2.7) -> void:
	box(self,pos+Vector3(0,0.94,0),Vector3(width,0.16,1.25),Color("926e50"),true)
	box(self,pos+Vector3(0,1.035,0),Vector3(width-0.15,0.025,1.1),Color("c1a274"))
	for x in [-width/2+0.2,width/2-0.2]:
		for z in [-0.4,0.4]:
			box(self,pos+Vector3(x,0.45,z),Vector3(0.14,0.9,0.14),WOOD,true)

func _book(parent: Node3D, pos: Vector3, color: Color, upright: bool = false) -> Node3D:
	var n = Node3D.new()
	parent.add_child(n)
	n.position = pos
	box(n,Vector3.ZERO,Vector3(0.42,0.12,0.56),CREAM)
	for y in [-0.075,0.075]:
		box(n,Vector3(0,y,0),Vector3(0.46,0.035,0.6),color)
	box(n,Vector3(-0.215,0,0),Vector3(0.035,0.17,0.6),color)
	box(n,Vector3(0,0.097,0),Vector3(0.2,0.008,0.28),Color("d6be78"))
	if upright:
		n.rotation.z = PI/2
	return n

func _cup(parent: Node3D, pos: Vector3) -> void:
	cylinder(parent,pos,0.14,0.18,0.28,Color("eee1c0"))
	cylinder(parent,pos+Vector3(0,0.145,0),0.14,0.14,0.008,Color("8c654c"))
	ring(parent,pos+Vector3(0.2,0,0),0.13,CREAM).rotation.x = PI/2

func _build_reading() -> void:
	_table(Vector3(-3.6,0,-4.45),3.1)
	box(self,Vector3(-3.6,2.62,-5.84),Vector3(3.0,1.05,0.1),WOOD)
	box(self,Vector3(-3.6,2.62,-5.76),Vector3(2.85,0.9,0.05),Color("afbeab"))
	sign_text(self,"01  /  閱讀角",Vector3(-3.6,2.82,-5.7),37,WOOD)
	sign_text(self,"A LITTLE EVERY DAY",Vector3(-3.6,2.44,-5.7),20,WOOD)
	var book = interact("book",Vector3(-4.5,1.17,-4.4),Vector3(0.58,0.32,0.7))
	_book(book,Vector3.ZERO,Color("a282a7"))
	var cup = interact("cup",Vector3(-2.55,1.22,-4.3),Vector3(0.52,0.38,0.5))
	_cup(cup,Vector3.ZERO)
	var pad = interact("reading_pad",Vector3(-3.55,1.1,-4.15),Vector3(0.9,0.15,0.85))
	cylinder(pad,Vector3.ZERO,0.44,0.44,0.05,Color("779b91"))
	ring(pad,Vector3(0,0.032,0),0.37,CREAM)
	reading_sign = sign_text(self,"Find the book.",Vector3(-3.55,1.7,-4.72),29)
	place_book = _book(self,Vector3(-3.55,1.24,-4.15),Color("a282a7"))
	place_book.visible = false
	place_cup = Node3D.new()
	add_child(place_cup)
	place_cup.position = Vector3(-3.1,1.23,-4.2)
	_cup(place_cup,Vector3.ZERO)
	place_cup.visible = false

func _build_colors() -> void:
	_table(Vector3(3.6,0,-4.45),3.4)
	box(self,Vector3(3.6,2.62,-5.84),Vector3(3.1,1.05,0.1),WOOD)
	box(self,Vector3(3.6,2.62,-5.76),Vector3(2.95,0.9,0.05),Color("c5b4c6"))
	sign_text(self,"02  /  水晶工坊",Vector3(3.6,2.82,-5.7),37,WOOD)
	sign_text(self,"LET YOUR COLORS SHINE",Vector3(3.6,2.44,-5.7),20,WOOD)
	for i in range(4):
		var x = 2.35+i*0.83
		var crystal = interact(WORDS[i+2],Vector3(x,1.35,-4.1),Vector3(0.57,0.65,0.57))
		cylinder(crystal,Vector3(0,-0.21,0),0.24,0.24,0.12,WOOD)
		cylinder(crystal,Vector3(0,0.04,0),0.18,0,0.45,COLORS[i])
		cylinder(crystal,Vector3(0,-0.16,0),0,0.18,0.15,COLORS[i])
		sign_text(crystal,["♥","◆","♣","★"][i],Vector3(0,0.45,0),28,COLORS[i])
		var lamp = sphere(self,Vector3(x,2.0,-5.5),Vector3.ONE*0.2,Color("8d8a76"))
		lamps.append(lamp)
		box(self,Vector3(x,1.92,-5.65),Vector3(0.34,0.05,0.32),WOOD)

func _icon(parent: Node3D, word: String, pos: Vector3, scale_factor: float = 1.0) -> Node3D:
	var n = Node3D.new()
	parent.add_child(n)
	n.position = pos
	n.scale = Vector3.ONE * scale_factor
	match word:
		"cat":
			sphere(n,Vector3(0,-0.1,0),Vector3(0.48,0.45,0.25),Color("ddb88b"))
			sphere(n,Vector3(0,0.17,0.01),Vector3(0.47,0.4,0.29),Color("ddb88b"))
			for x in [-0.15,0.15]:
				cylinder(n,Vector3(x,0.38,0),0.11,0,0.22,Color("ddb88b"))
				sphere(n,Vector3(x*0.6,0.2,0.15),Vector3(0.038,0.055,0.02),INK)
			sphere(n,Vector3(0,0.1,0.17),Vector3(0.05,0.035,0.02),Color("b77270"))
		"bird":
			sphere(n,Vector3(0,0,0),Vector3(0.5,0.36,0.25),Color("80b6c4"))
			sphere(n,Vector3(0.15,0.18,0),Vector3.ONE*0.26,Color("80b6c4"))
			var beak = cylinder(n,Vector3(0.31,0.17,0),0.075,0,0.19,Color("e9bb61"))
			beak.rotation.z = -PI/2
			sphere(n,Vector3(0.17,0.22,0.12),Vector3.ONE*0.035,INK)
			sphere(n,Vector3(-0.06,0,0.13),Vector3(0.28,0.16,0.07),Color("568ca5"))
		"apple":
			for x in [-0.09,0.09]:
				sphere(n,Vector3(x,0,0),Vector3(0.35,0.45,0.3),Color("da8271"))
			box(n,Vector3(0,0.28,0),Vector3(0.045,0.17,0.045),WOOD)
			var leaf = sphere(n,Vector3(0.12,0.28,0),Vector3(0.22,0.09,0.1),Color("8eab73"))
			leaf.rotation.z = 0.4
		"flower":
			box(n,Vector3(0,-0.13,0),Vector3(0.04,0.52,0.04),Color("84a27a"))
			for i in range(5):
				sphere(n,Vector3(sin(i*TAU/5)*0.18,0.15+cos(i*TAU/5)*0.18,0),Vector3(0.23,0.23,0.12),Color("c69cb3"))
			sphere(n,Vector3(0,0.15,0.06),Vector3.ONE*0.16,Color("f3d68a"))
	return n

func _build_mural() -> void:
	var wall = Node3D.new()
	add_child(wall)
	wall.position = Vector3(-5.7,1.9,2.8)
	wall.rotation.y = PI/2
	box(wall,Vector3.ZERO,Vector3(3.4,2.1,0.15),WOOD)
	box(wall,Vector3(0,0,0.1),Vector3(3.18,1.9,0.08),Color("acbdab"))
	sign_text(wall,"03  /  森林的記憶",Vector3(0,1.35,0.15),36,WOOD)
	for i in range(4):
		var word = WORDS[i+6]
		var local_pos = Vector3(-1.15+i*0.77,0.05,0.3)
		var icon_node = _icon(wall,word,local_pos,1.1)
		mural_icons.append(icon_node)
		var tile = interact(word,wall.position+wall.basis*local_pos,Vector3(0.6,0.85,0.6))
		tile.rotation.y = PI/2
		sign_text(wall,str(i+1),local_pos+Vector3(0,-0.65,0),24,CREAM)
	mural_sign = sign_text(wall,"Which one is the cat?",Vector3(0,-1.32,0.12),27,WOOD)

func _plant(pos: Vector3, scale_factor: float = 1.0) -> void:
	var n = Node3D.new()
	add_child(n)
	n.position = pos
	n.scale = Vector3.ONE * scale_factor
	cylinder(n,Vector3(0,0.24,0),0.22,0.29,0.48,Color("ba8770"))
	cylinder(n,Vector3(0,0.48,0),0.24,0.24,0.015,WOOD)
	for i in range(7):
		var angle = i*2.4
		var leaf = sphere(n,Vector3(sin(angle)*0.19,0.65+i*0.06,cos(angle)*0.19),Vector3(0.17,0.55,0.2),Color("7f9c79").lightened((i%3)*0.055))
		leaf.rotation.z = sin(angle)*0.55

func _build_decor() -> void:
	# Tall library behind the player.
	box(self,Vector3(3.8,1.7,5.65),Vector3(3.2,3.4,0.45),WOOD,true)
	for y in [0.25,1.05,1.85,2.65,3.3]:
		box(self,Vector3(3.8,y,5.24),Vector3(3.25,0.12,0.8),Color("9c7857"))
	for row in range(4):
		for i in range(9):
			var b = _book(self,Vector3(2.5+i*0.3,0.59+row*0.79,5.13),[Color("879d89"),Color("b18d9c"),Color("ccaf7b"),Color("7c9fa8")][(row+i)%4],true)
			b.scale = Vector3(1,1,0.8)
	# Bench and pillows.
	box(self,Vector3(-3.1,0.48,4.95),Vector3(3.4,0.3,1.0),WOOD,true)
	box(self,Vector3(-3.1,1.0,5.38),Vector3(3.4,0.75,0.17),WOOD,true)
	for x in [-4.1,-2.1]:
		sphere(self,Vector3(x,0.8,4.95),Vector3(0.85,0.32,0.7),Color("b6a5b1"))
	for p in [Vector3(-5.0,0,-2.2),Vector3(5.1,0,2.8),Vector3(-1.45,0,5.0)]:
		_plant(p,1.2)
	# Hanging warm lanterns.
	for p in [Vector3(-2.2,3.15,-1.8),Vector3(2.5,3.15,2.0)]:
		cylinder(self,p+Vector3(0,0.65,0),0.025,0.025,0.9,WOOD)
		cylinder(self,p,0.3,0.25,0.42,Color("e9c78d"))
		cylinder(self,p+Vector3(0,0.25,0),0.34,0.12,0.16,WOOD)
		var light = OmniLight3D.new()
		add_child(light)
		light.position = p-Vector3(0,0.2,0)
		light.light_color = Color("ffdda1")
		light.light_energy = 1.4
		light.omni_range = 7
	# Teacher's welcome letter.
	var letter = interact("letter",Vector3(0,0.78,2.6),Vector3(0.8,0.18,0.65))
	cylinder(self,Vector3(0,0.35,2.6),0.62,0.7,0.7,WOOD)
	box(letter,Vector3.ZERO,Vector3(0.65,0.03,0.48),CREAM)
	for i in range(4):
		box(letter,Vector3(0,0.02,-0.13+i*0.08),Vector3(0.43,0.01,0.018),Color("a28d72"))
	# Letter stays a physical object; interaction text appears in the HUD.

func _build_garden() -> void:
	box(self,Vector3(0,-0.22,-11),Vector3(16,0.4,10),Color("8da887"),true)
	for i in range(8):
		cylinder(self,Vector3(sin(i*0.7)*0.15,0.005,-6.8-i*0.65),0.55,0.55,0.06,Color("d5c9a7"))
	for side in [-1,1]:
		for i in range(5):
			var p = Vector3(side*(3.2+(i%2)*1.2),0,-7.5-i*1.8)
			cylinder(self,p+Vector3(0,1.0,0),0.22,0.14,2.0,WOOD)
			for h in range(3):
				cylinder(self,p+Vector3(0,2.0+h*0.7,0),1.25-h*0.24,0,1.8,Color("769783").lightened(h*0.025))
		for i in range(12):
			_icon(self,"flower",Vector3(side*(1.1+fmod(i*0.71,1.5)),0.4,-6.8-i*0.65),0.7)
	box(self,Vector3(0,1,-15.7),Vector3(16,2,0.2),Color("8da887"),true)
	for x in [-7.8,7.8]:
		box(self,Vector3(x,1,-11),Vector3(0.2,2,10),Color("8da887"),true)

func _build_player() -> void:
	player = CharacterBody3D.new()
	add_child(player)
	player.position = Vector3(0,0.1,4.0)
	var collision = CollisionShape3D.new()
	var shape = CapsuleShape3D.new()
	shape.radius = 0.25
	shape.height = 1.65
	collision.shape = shape
	collision.position.y = 0.825
	player.add_child(collision)
	camera = Camera3D.new()
	player.add_child(camera)
	camera.position.y = 1.55
	camera.fov = 75
	camera.near = 0.05
	camera.current = true

func _build_audio() -> void:
	voice = AudioStreamPlayer.new()
	add_child(voice)
	chime = AudioStreamPlayer.new()
	add_child(chime)
	music = AudioStreamPlayer.new()
	add_child(music)
	if ResourceLoader.exists("res://audio/ambience.wav"):
		music.stream = load("res://audio/ambience.wav")
		music.volume_db = -17
		music.finished.connect(func(): music.play())
		music.play()
	_apply_volume()

func _apply_volume() -> void:
	AudioServer.set_bus_volume_db(0,linear_to_db(maxf(volume,0.0001)))

func speak(word: String) -> void:
	var path = "res://audio/"+word+".wav"
	if ResourceLoader.exists(path):
		voice.stream = load(path)
		voice.play()

func _sound(success: bool = true) -> void:
	var path = "res://audio/success.wav" if success else "res://audio/soft.wav"
	if ResourceLoader.exists(path):
		chime.stream = load(path)
		chime.play()

func _style(bg: Color, border: Color = Color("c4b799"), radius: int = 18) -> StyleBoxFlat:
	var s = StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(1)
	s.set_corner_radius_all(radius)
	s.content_margin_left = 22
	s.content_margin_right = 22
	s.content_margin_top = 16
	s.content_margin_bottom = 16
	return s

func _label(text: String, size: int, color: Color = INK) -> Label:
	var l = Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size",size)
	l.add_theme_color_override("font_color",color)
	return l

func _build_ui() -> void:
	ui = CanvasLayer.new()
	add_child(ui)
	var theme = Theme.new()
	theme.default_font = _font()
	theme.default_font_size = 18
	theme.set_stylebox("normal","Button",_style(Color("e5dbc2")))
	theme.set_stylebox("hover","Button",_style(Color("d1dfcb"),Color("91aa91")))
	theme.set_stylebox("pressed","Button",_style(Color("bbcdb8")))
	theme.set_stylebox("focus","Button",_style(Color(0,0,0,0),Color("718d76")))
	theme.set_color("font_color","Button",INK)
	var root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.theme = theme
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(root)
	hud = Control.new()
	root.add_child(hud)
	hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var top = PanelContainer.new()
	hud.add_child(top)
	top.position = Vector2(28,26)
	top.custom_minimum_size = Vector2(430,120)
	top.add_theme_stylebox_override("panel",_style(Color(0.96,0.93,0.84,0.94)))
	var topbox = VBoxContainer.new()
	top.add_child(topbox)
	topbox.add_child(_label("GLIMMER COTTAGE   /   微光小屋",14,Color("788d7d")))
	task_label = _label("",22)
	topbox.add_child(task_label)
	seal_label = _label("",15,Color("7b7764"))
	topbox.add_child(seal_label)
	var controls = _label("WASD 移動   ·   E 互動   ·   H 提示   ·   R 發音   ·   Tab 單字圖鑑   ·   Esc 暫停",16,CREAM)
	hud.add_child(controls)
	controls.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	controls.offset_top = -40
	controls.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	controls.add_theme_color_override("font_shadow_color",INK)
	controls.add_theme_constant_override("shadow_offset_x",1)
	controls.add_theme_constant_override("shadow_offset_y",1)
	crosshair = _label("·",36,CREAM)
	hud.add_child(crosshair)
	crosshair.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	crosshair.position -= Vector2(7,24)
	prompt_label = _label("",22,CREAM)
	hud.add_child(prompt_label)
	prompt_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	prompt_label.offset_left = -450
	prompt_label.offset_right = 450
	prompt_label.offset_top = -150
	prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_label.add_theme_color_override("font_shadow_color",INK)
	prompt_label.add_theme_constant_override("shadow_offset_y",2)
	carry_label = _label("",18,CREAM)
	hud.add_child(carry_label)
	carry_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	carry_label.offset_left = -310
	carry_label.offset_right = -30
	carry_label.offset_top = 32
	carry_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	toast_label = _label("",20,CREAM)
	hud.add_child(toast_label)
	toast_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	toast_label.offset_top = -102
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast_label.add_theme_color_override("font_shadow_color",INK)
	toast_label.add_theme_constant_override("shadow_offset_y",2)
	overlay = ColorRect.new()
	root.add_child(overlay)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.color = Color(0.13,0.21,0.20,0.34)
	menu_panel = PanelContainer.new()
	overlay.add_child(menu_panel)
	menu_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	menu_panel.offset_left = -340
	menu_panel.offset_right = 340
	menu_panel.offset_top = -325
	menu_panel.offset_bottom = 325
	menu_panel.add_theme_stylebox_override("panel",_style(Color("f3eddd"),Color("d9c9a5"),24))
	var scroll = ScrollContainer.new()
	menu_panel.add_child(scroll)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	menu_box = VBoxContainer.new()
	scroll.add_child(menu_box)
	menu_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu_box.add_theme_constant_override("separation",13)
	_update_hud()

func _clear_menu(mode: String) -> void:
	menu_mode = mode
	for child in menu_box.get_children():
		menu_box.remove_child(child)
		child.queue_free()
	overlay.show()
	hud.hide()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _paragraph(text: String, size: int = 18, color: Color = INK) -> void:
	var l = _label(text,size,color)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu_box.add_child(l)

func _button(text: String, callback: Callable) -> Button:
	var b = Button.new()
	b.text = text
	b.custom_minimum_size.y = 49
	b.pressed.connect(callback)
	menu_box.add_child(b)
	return b

func _show_start() -> void:
	_clear_menu("start")
	_paragraph("A SMALL ADVENTURE, A LITTLE MAGIC",14,Color("788d7d"))
	_paragraph("微光小屋",44)
	_paragraph("精靈的單字魔法",24,Color("8a8a70"))
	_paragraph("在森林深處，老師留下了一場溫柔的試煉。\n和光之精靈露米一起，找回三枚印記，\n讓通往花園的門再次亮起。",19)
	_paragraph("12 個英文單字  /  3 個魔法謎題  /  不限時間",16,Color("7e8e7a"))
	if save_available:
		_button("繼續上次的冒險  →",func(): _load_progress(); _resume())
	_button("開始新的冒險  →",func():
		if save_available: _confirm_new()
		else: _new_game())
	_button("操作與聲音設定",_settings)
	_button("離開遊戲",func(): get_tree().quit())
	_paragraph("WASD／方向鍵移動 · 滑鼠觀看 · E 互動\n建議戴上耳機，慢慢探索這座小屋。",15,Color("8a8a79"))

func _confirm_new() -> void:
	_clear_menu("confirm")
	_paragraph("重新開始這場冒險？",30)
	_paragraph("新的冒險會取代本機保存的通關進度。")
	_button("重新開始",_new_game)
	_button("返回",_show_start)

func _new_game() -> void:
	reading_step = 0
	color_step = 0
	mural_step = 0
	seals = [false,false,false]
	held = ""
	has_key = false
	door_open = false
	finished = false
	learned = []
	hint_level = 0
	player.position = Vector3(0,0.1,4.0)
	player.rotation.y = 0
	pitch = 0
	camera.rotation.x = 0
	_refresh_world()
	_save_progress()
	_resume()
	_toast("露米：你好，小小學徒！按 E 讀讀前方桌上的信吧。",7)

func _resume() -> void:
	started = true
	menu_mode = ""
	overlay.hide()
	hud.show()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_update_hud()

func _pause() -> void:
	_save_progress()
	_clear_menu("pause")
	_paragraph("在小屋裡，歇一會兒。",30)
	_paragraph("進度已保存在這台電腦。\n魔法不需要趕時間。",19)
	_button("繼續探索",_resume)
	_button("單字圖鑑",_journal)
	_button("操作與聲音設定",_settings)
	_button("返回開始畫面",_show_start)
	_button("保存並離開",func(): get_tree().quit())

func _settings() -> void:
	var back_to = "pause" if started else "start"
	_clear_menu("settings")
	_paragraph("讓冒險更舒服",30)
	_paragraph("WASD／方向鍵：移動　　滑鼠：觀看\nE：互動　　H：逐步提示　　R：重聽單字\nTab：單字圖鑑　　Esc：暫停／返回",18)
	_paragraph("音量",18)
	var slider = HSlider.new()
	slider.min_value = 0
	slider.max_value = 1
	slider.step = 0.05
	slider.value = volume
	slider.custom_minimum_size.y = 28
	slider.value_changed.connect(func(v): volume = v; _apply_volume(); _save_settings())
	menu_box.add_child(slider)
	_paragraph("滑鼠靈敏度",18)
	var mouse_slider = HSlider.new()
	mouse_slider.min_value = 0.0007
	mouse_slider.max_value = 0.004
	mouse_slider.step = 0.0001
	mouse_slider.value = sensitivity
	mouse_slider.custom_minimum_size.y = 28
	mouse_slider.value_changed.connect(func(v): sensitivity = v; _save_settings())
	menu_box.add_child(mouse_slider)
	_paragraph("已關閉鏡頭晃動與動態模糊。\n沒有跳躍、追逐或倒數計時。",16,Color("788d7d"))
	_button("返回",func():
		if back_to == "pause": _pause()
		else: _show_start())

func _journal() -> void:
	_clear_menu("journal")
	_paragraph("我的單字圖鑑",30)
	_paragraph("已發現 %d / 12 個單字 · 點擊卡片聽發音" % learned.size(),17,Color("788d7d"))
	var grid = GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation",12)
	grid.add_theme_constant_override("v_separation",9)
	menu_box.add_child(grid)
	for i in range(WORDS.size()):
		var word = WORDS[i]
		var b = Button.new()
		b.text = word+"  /  "+CHINESE[i] if word in learned else "？ 尚未發現"
		b.disabled = word not in learned
		b.custom_minimum_size = Vector2(280,53)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func(): speak(word))
		grid.add_child(b)
	_button("回到小屋",_resume)

func _letter() -> void:
	_clear_menu("letter")
	_paragraph("給我親愛的小小學徒",30)
	_paragraph("我去森林採藥了。今天，請你試著喚醒小屋裡的單字魔法。\n\n① 閱讀角：將 book 和 cup 依序放到圓形魔法盤。\n② 水晶工坊：聽聽、讀讀顏色，點亮四盞燈。\n③ 森林壁畫：找出英文所描述的圖像。\n\n三枚印記會變成 key，讓你打開 door。\n花園裡有一份小小的驚喜等著你。\n\n不用急，露米會一直陪著你。\n—— 老師",19)
	_button("收好信，開始探索",_resume)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if menu_mode == "": _pause()
		elif menu_mode == "start": pass
		elif menu_mode == "settings" and not started: _show_start()
		elif menu_mode == "confirm": _show_start()
		else: _resume()
		return
	if menu_mode != "":
		if event.is_action_pressed("journal") and menu_mode == "journal": _resume()
		return
	if event is InputEventMouseMotion:
		player.rotation.y -= event.relative.x * sensitivity
		pitch = clampf(pitch-event.relative.y*sensitivity,-1.25,1.25)
		camera.rotation.x = pitch
	if event.is_action_pressed("interact") and target_id != "": _interact(target_id)
	if event.is_action_pressed("journal"): _journal()
	if event.is_action_pressed("hint"): _hint()
	if event.is_action_pressed("repeat_word"):
		if target_id in WORDS: speak(target_id)
		else: speak(_requested_word())

func _physics_process(delta: float) -> void:
	if not is_instance_valid(player): return
	if menu_mode == "":
		var input = Input.get_vector("left","right","forward","back")
		var direction = player.basis * Vector3(input.x,0,input.y)
		player.velocity.x = direction.x * 2.5
		player.velocity.z = direction.z * 2.5
		if not player.is_on_floor(): player.velocity.y -= 16*delta
		else: player.velocity.y = 0
		player.move_and_slide()
		_scan_target()
		if player.position.y < -3:
			player.position = Vector3(0,0.1,4)
		if door_open and player.position.z < -7.5 and not finished: _ending()

func _process(delta: float) -> void:
	elapsed += delta
	if is_instance_valid(fairy):
		fairy.position = Vector3(0.8+sin(elapsed*0.5)*0.25,1.8+sin(elapsed*1.7)*0.12,-2.3)
		if player: fairy.look_at(Vector3(player.position.x,fairy.position.y,player.position.z),Vector3.UP,true)
	for i in range(motes.size()):
		motes[i].position.y += sin(elapsed*0.6+i)*delta*0.035
	if toast_time > 0:
		toast_time -= delta
		if toast_time <= 0: toast_label.text = ""

func _scan_target() -> void:
	var origin = camera.global_position
	var query = PhysicsRayQueryParameters3D.create(origin,origin-camera.global_basis.z*3.0)
	query.exclude = [player.get_rid()]
	var hit = get_world_3d().direct_space_state.intersect_ray(query)
	target_id = ""
	if hit and hit.collider.has_meta("interaction"):
		target_id = hit.collider.get_meta("interaction")
	if target_id == "":
		prompt_label.text = ""
		crosshair.modulate = CREAM
	else:
		crosshair.modulate = Color("efcf7d")
		prompt_label.text = "[ E ]  " + _target_caption(target_id)

func _target_caption(id: String) -> String:
	match id:
		"reading_pad": return "放置物品" if held != "" else "閱讀魔法盤的提示"
		"letter": return "閱讀老師的信"
		"door": return "走向花園" if door_open else ("使用 key，打開 door" if has_key else "door · 門")
		"cat","bird","apple","flower": return "選擇這幅圖像  ·  " + str(WORDS.find(id)-5)
		_:
			var i = WORDS.find(id)
			return id+" · "+CHINESE[i] if i >= 0 else id

func _learn(word: String) -> void:
	if word not in learned: learned.append(word)

func _requested_word() -> String:
	if not seals[0]: return "book" if reading_step == 0 else "cup"
	if not seals[1]: return ["red","blue","green","yellow"][color_step]
	if not seals[2]: return ["cat","bird","apple","flower"][mural_step]
	return "door" if has_key else "key"

func _interact(id: String) -> void:
	match id:
		"letter": _letter(); return
		"book","cup":
			_learn(id)
			speak(id)
			if held != "":
				_toast("露米：先把手上的物品放到圓形魔法盤吧。")
				return
			if (id == "book" and reading_step > 0) or (id == "cup" and reading_step > 1): return
			held = id
			_set_item_active(id,false)
			_toast("拿到了 %s！把它放到桌上的圓形魔法盤。" % id)
		"reading_pad":
			if seals[0]: _toast("閱讀印記已亮起！前往水晶工坊吧。"); return
			var expected = "book" if reading_step == 0 else "cup"
			if held == "":
				speak(expected)
				_toast("Find the %s.  找到%s，放到圓形魔法盤。" % [expected,"書本" if reading_step == 0 else "杯子"])
				return
			if held != expected:
				_toast("露米：現在需要 %s。%s 已放回原位，再試試看！" % [expected,held])
				_set_item_active(held,true)
				held = ""
				_sound(false)
			else:
				reading_step += 1
				held = ""
				hint_level = 0
				_sound()
				if reading_step == 2: _award(0)
				else: _toast("Book！第一個成功了。接下來：Find the cup.")
		"red","blue","green","yellow":
			_learn(id)
			speak(id)
			if not seals[0]: _toast("露米：先完成閱讀角，水晶就會醒來囉！"); _save_progress(); return
			if seals[1]: _toast("四種顏色都亮起了！到森林壁畫找找看。"); return
			var expected = ["red","blue","green","yellow"][color_step]
			if id == expected:
				color_step += 1
				hint_level = 0
				_sound()
				if color_step == 4: _award(1)
				else: _toast("%s！燈亮了。接著找 %s。" % [id.capitalize(),["red","blue","green","yellow"][color_step]])
			else:
				_sound(false)
				_toast("這是 %s。現在找 %s；已點亮的燈會保留。" % [id,expected])
		"cat","bird","apple","flower":
			_learn(id)
			speak(id)
			if not seals[1]: _toast("露米：先點亮水晶工坊的四盞燈，再來修復壁畫吧！"); _save_progress(); return
			if seals[2]: _toast("森林的記憶已完整，帶著 key 前往花園門吧！"); return
			var expected = ["cat","bird","apple","flower"][mural_step]
			if id == expected:
				mural_step += 1
				hint_level = 0
				_sound()
				if mural_step == 4: _award(2)
				else: _toast("%s！圖像恢復了。接著找 %s。" % [id.capitalize(),["cat","bird","apple","flower"][mural_step]])
			else:
				_sound(false)
				_toast("這是 %s。找找看 %s 在哪裡，可以按 H 看提示。" % [id,expected])
		"door":
			_learn("door")
			speak("door")
			if has_key:
				door_open = true
				_sound()
				_toast("The door is open! 門開了，走進花園吧。",7)
			else: _toast("這是 door，門。集滿三枚印記，就能獲得 key！")
	_refresh_world()
	_update_hud()
	_save_progress()

func _award(index: int) -> void:
	seals[index] = true
	_toast(["閱讀印記亮起！接著到右側的水晶工坊找 red。","色彩印記亮起！接著到左側牆上的森林壁畫找 cat。","三枚印記變成了 key！帶著鑰匙，打開花園的 door。 "][index],8)
	if index == 2:
		has_key = true
		_learn("key")
		speak("key")

func _set_item_active(id: String, active: bool) -> void:
	var node: Node3D = interactables[id]
	node.visible = active
	for child in node.get_children():
		if child is StaticBody3D:
			child.collision_layer = 1 if active else 0

func _refresh_world() -> void:
	_set_item_active("book",reading_step == 0 and held != "book")
	_set_item_active("cup",reading_step < 2 and held != "cup")
	place_book.visible = reading_step >= 1
	place_cup.visible = reading_step >= 2
	reading_sign.text = "Well done!" if seals[0] else ("Find the book." if reading_step == 0 else "Find the cup.")
	mural_sign.text = "The forest remembers!" if seals[2] else "Which one is the %s?" % ["cat","bird","apple","flower"][mural_step]
	for i in range(4):
		lamps[i].material_override = mat(COLORS[i] if i < color_step else Color("8d8a76"),0.8 if i < color_step else 0.0)
		mural_icons[i].scale = Vector3.ONE*(1.2 if i < mural_step else 1.1)
	_set_item_active("door",not door_open)

func _update_hud() -> void:
	if not task_label: return
	if door_open: task_label.text = "走進花園，迎接你的第一場冒險"
	elif has_key: task_label.text = "Use the key.  打開花園的門"
	elif not seals[0]: task_label.text = "01  閱讀角  /  Find the %s." % ("book" if reading_step == 0 else "cup")
	elif not seals[1]: task_label.text = "02  水晶工坊  /  Find %s." % ["red","blue","green","yellow"][color_step]
	else: task_label.text = "03  森林壁畫  /  Find the %s." % ["cat","bird","apple","flower"][mural_step]
	seal_label.text = "%s 閱讀    %s 色彩    %s 森林     ·     單字 %d / 12" % ["●" if seals[0] else "○","●" if seals[1] else "○","●" if seals[2] else "○",learned.size()]
	carry_label.text = "手上："+held if held != "" else ("持有 key · 魔法鑰匙" if has_key else "")

func _toast(text: String, duration: float = 5.0) -> void:
	toast_label.text = text
	toast_time = duration

func _hint() -> void:
	hint_level = mini(hint_level+1,3)
	var word = _requested_word()
	speak(word)
	var idx = WORDS.find(word)
	if hint_level == 1:
		_toast("露米：這次的單字是 %s，意思是「%s」。" % [word,CHINESE[idx]],7)
	elif hint_level == 2:
		var zone = "前方左邊的閱讀桌" if not seals[0] else ("前方右邊的水晶工坊" if not seals[1] else ("左側牆壁的森林壁畫" if not seals[2] else "兩張工作桌中間的綠色門"))
		_toast("露米：到%s找找看，靠近後按 E。" % zone,7)
	else:
		var clues = {"book":"拿起紫色書本，對準圓形魔法盤按 E。","cup":"拿起右邊的奶油色杯子，放到圓形魔法盤。","red":"選擇最左邊、愛心符號下的紅色水晶。","blue":"選擇左邊第二個、菱形符號下的藍色水晶。","green":"選擇左邊第三個、梅花符號下的綠色水晶。","yellow":"選擇最右邊、星星符號下的黃色水晶。","cat":"在壁畫選擇有尖耳朵的貓咪（1）。","bird":"在壁畫選擇有尖嘴巴的藍色小鳥（2）。","apple":"在壁畫選擇紅色蘋果（3）。","flower":"在壁畫選擇粉紫色花朵（4）。","door":"靠近前方綠色門，按 E 使用鑰匙。","key":"三枚印記會自動合成鑰匙。"}
		_toast("露米："+clues[word],8)

func _save_progress() -> void:
	if "--capture" in OS.get_cmdline_user_args(): return
	var data = {"version":1,"reading":reading_step,"colors":color_step,"mural":mural_step,"held":held,"door":door_open,"finished":finished,"learned":learned}
	var file = FileAccess.open(_save_path(),FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		save_available = true
	else: _toast("目前無法保存進度；可以繼續遊玩。")

func _save_settings() -> void:
	var cfg = ConfigFile.new()
	cfg.set_value("audio","volume",volume)
	cfg.set_value("input","sensitivity",sensitivity)
	cfg.save("user://settings.cfg")

func _load_progress() -> void:
	var file = FileAccess.open(_save_path(),FileAccess.READ)
	if not file: _new_game(); return
	var data = JSON.parse_string(file.get_as_text())
	if not data is Dictionary: _new_game(); return
	reading_step = clampi(int(data.get("reading",0)),0,2)
	color_step = clampi(int(data.get("colors",0)),0,4) if reading_step == 2 else 0
	mural_step = clampi(int(data.get("mural",0)),0,4) if color_step == 4 else 0
	seals = [reading_step == 2,color_step == 4,mural_step == 4]
	has_key = seals[2]
	door_open = bool(data.get("door",false)) and has_key
	finished = bool(data.get("finished",false)) and door_open
	held = str(data.get("held",""))
	if held not in ["book","cup"] or (held == "book" and reading_step > 0) or (held == "cup" and reading_step == 2): held = ""
	learned = []
	if data.get("learned",[]) is Array:
		for word in data.get("learned",[]):
			if word in WORDS and word not in learned: learned.append(word)
	player.position = Vector3(0,0.1,3.8)
	player.rotation.y = 0
	pitch = 0
	camera.rotation.x = 0
	_refresh_world()
	_update_hud()

func _ending() -> void:
	finished = true
	_save_progress()
	_sound()
	_clear_menu("ending")
	_paragraph("THE GARDEN REMEMBERS YOU",14,Color("788d7d"))
	_paragraph("每一個單字，\n都是一點新的魔法。",34)
	_paragraph("花園的風輕輕吹來，露米在你身旁畫了一個光圈。\n「你做到了！老師一定會很開心。」",20)
	_paragraph("閱讀、色彩、森林：三枚印記全部完成\n本次發現 %d / 12 個英文單字" % learned.size(),18,Color("788d7d"))
	_button("聽聽我的單字收藏",_journal)
	_button("留在花園散步",_resume)
	_button("回到開始畫面",_show_start)

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		if started: _save_progress()
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and started and menu_mode == "": _pause()

func _smoke_test() -> void:
	_new_game()
	await get_tree().physics_frame
	await get_tree().physics_frame
	# Verify all actual raycast targets can be reached from walkable floor.
	for id in ["book","cup","reading_pad","red","blue","green","yellow","cat","bird","apple","flower","door","letter"]:
		var target: Node3D = interactables[id]
		if id in ["cat","bird","apple","flower"]:
			player.position = target.position + Vector3(1.8,-target.position.y+0.1,0)
		else:
			player.position = target.position + Vector3(0,-target.position.y+0.1,1.8)
		camera.look_at(target.global_position)
		await get_tree().physics_frame
		_scan_target()
		assert(target_id == id,"Raycast failed for %s, hit %s" % [id,target_id])
	print("RAYCAST PASS: all 13 objects reachable from walkable floor")
	_interact("red")
	assert(color_step == 0,"Locked puzzle advanced")
	_interact("cup")
	_interact("reading_pad")
	assert(reading_step == 0 and held == "","Wrong object was not returned")
	_interact("book")
	_save_progress()
	held = ""
	_load_progress()
	assert(held == "book" and not interactables["book"].visible,"Held object did not survive reload")
	_interact("reading_pad")
	assert(reading_step == 1)
	_interact("cup")
	_interact("reading_pad")
	assert(seals[0])
	_interact("blue")
	assert(color_step == 0)
	for word in ["red","blue","green","yellow"]: _interact(word)
	assert(seals[1])
	_interact("flower")
	assert(mural_step == 0)
	for word in ["cat","bird","apple","flower"]: _interact(word)
	assert(has_key)
	_interact("door")
	assert(door_open and learned.size() == 12)
	_save_progress()
	reading_step = 0
	has_key = false
	_load_progress()
	assert(seals == [true,true,true] and has_key and door_open and learned.size() == 12,"Completed progress did not survive reload")
	print("SAVE PASS: held item and completed progress survive reload")
	_ending()
	assert(finished and menu_mode == "ending")
	print("SMOKE PASS: gating, wrong answers, 3 puzzles, 12 words, key, door, ending")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(_save_path()))
	get_tree().quit()

func _save_path() -> String:
	return "user://test-progress.json" if "--smoke-test" in OS.get_cmdline_user_args() else SAVE_PATH

func _capture_preview() -> void:
	_new_game()
	player.position = Vector3(0,0.1,3.5)
	await get_tree().process_frame
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://preview.png")
	_show_start()
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/start.png")
	_resume()
	player.position = Vector3(-2.7,0.1,2.8)
	camera.look_at(Vector3(-5.7,1.9,2.8))
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/mural.png")
	learned.assign(WORDS)
	_journal()
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/journal.png")
	_resume()
	seals = [true,true,true]
	door_open = true
	finished = true
	_update_hud()
	toast_label.text = ""
	player.position = Vector3(0,0.1,-8)
	camera.look_at(Vector3(0,1.5,-14))
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/garden.png")
	print("CAPTURE SAVED")
	get_tree().quit()

