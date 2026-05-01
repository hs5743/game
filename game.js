const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const dialog = document.querySelector("#dialog");
const quizPanel = document.querySelector("#quiz");
const quizQuestion = document.querySelector("#quizQuestion");
const quizOptions = document.querySelector("#quizOptions");
const questText = document.querySelector("#questText");
const shardsText = document.querySelector("#shards");
const heartsText = document.querySelector("#hearts");
const progressText = document.querySelector("#progress");
const restartButton = document.querySelector("#restart");
const chapterLabel = document.querySelector(".game-title span");
const placeTitle = document.querySelector(".game-title strong");
const toast = document.querySelector(".toast");
const cardImage = document.querySelector("#cardImage");
const cardName = document.querySelector("#cardName");
const cardHint = document.querySelector("#cardHint");
const quizCardImage = document.querySelector("#quizCardImage");
const quizCardMeta = document.querySelector("#quizCardMeta");
const collectionGrid = document.querySelector("#collectionGrid");

const TILE = 40;
const COLS = canvas.width / TILE;
const ROWS = canvas.height / TILE;

const cards = [
  { id: 1, type: "正向品格", zh: "誠實", en: "Honesty", role: "誠實獸", clue: "A truthful heart makes the inner light shine." },
  { id: 2, type: "正向品格", zh: "尊重", en: "Respect", role: "尊重獸", clue: "Every act of respect makes the world gentler." },
  { id: 3, type: "正向品格", zh: "責任", en: "Responsibility", role: "責任獸", clue: "Responsibility gives effort both direction and strength." },
  { id: 4, type: "正向品格", zh: "創造", en: "Creativity", role: "創造獸", clue: "Inspiration is light that brightens imagination." },
  { id: 5, type: "正向品格", zh: "勇氣", en: "Courage", role: "勇氣獸", clue: "Courage shines within and leads the way forward." },
  { id: 6, type: "正向品格", zh: "合作", en: "Cooperation", role: "合作獸", clue: "Things done together always hold more magic." },
  { id: 7, type: "正向品格", zh: "耐心", en: "Patience", role: "耐心獸", clue: "Steady steps take you farther." },
  { id: 8, type: "正向品格", zh: "感恩", en: "Gratitude", role: "感恩獸", clue: "Gratitude makes ordinary days shine." },
  { id: 9, type: "正向品格", zh: "自律", en: "Self-discipline", role: "自律獸", clue: "The moment of focus is the source of strength." },
  { id: 10, type: "正向品格", zh: "樂觀", en: "Optimism", role: "樂觀獸", clue: "Every morning hides a new hope." },
  { id: 11, type: "正向品格", zh: "關懷", en: "Caring", role: "關懷獸", clue: "Listening is the most powerful form of care." },
  { id: 12, type: "正向品格", zh: "恆毅", en: "Grit", role: "恆毅獸", clue: "Perseverance helps a tiny sprout grow into a great tree." },
  { id: 13, type: "情緒詞彙", zh: "開心", en: "Happy", role: "開心怪", clue: "Let's smile together - the sunshine will come out." },
  { id: 14, type: "情緒詞彙", zh: "生氣", en: "Angry", role: "生氣怪", clue: "I take a deep breath and let it go slowly." },
  { id: 15, type: "情緒詞彙", zh: "傷心", en: "Sad", role: "傷心怪", clue: "Tears can turn into shining stars." },
  { id: 16, type: "情緒詞彙", zh: "害怕", en: "Scared", role: "害怕怪", clue: "I'm scared, but I'll try anyway." },
  { id: 17, type: "情緒詞彙", zh: "驚訝", en: "Surprised", role: "驚訝怪", clue: "The world is more amazing than I thought." },
  { id: 18, type: "情緒詞彙", zh: "緊張", en: "Nervous", role: "緊張怪", clue: "I pat my chest to calm my heart." },
  { id: 19, type: "情緒詞彙", zh: "興奮", en: "Excited", role: "興奮怪", clue: "I'm so excited! I just want to shout yay!" },
  { id: 20, type: "情緒詞彙", zh: "害羞", en: "Shy", role: "害羞怪", clue: "I'm blushing, but I can still say hello." },
  { id: 21, type: "情緒詞彙", zh: "放鬆", en: "Relaxed", role: "放鬆怪", clue: "Such a nice breeze, even the clouds want to nap." },
  { id: 22, type: "情緒詞彙", zh: "自豪", en: "Proud", role: "自豪怪", clue: "I did it! I'll give myself a big clap." },
  { id: 23, type: "情緒詞彙", zh: "失望", en: "Disappointed", role: "失望怪", clue: "It didn't work, but I'll try again." },
  { id: 24, type: "情緒詞彙", zh: "感動", en: "Touched", role: "感動怪", clue: "My heart feels warm, like a hug of starlight." }
];

const cardById = new Map(cards.map((card) => [card.id, card]));
function cardSrc(cardId) {
  return window.CARD_ART?.[cardId] ?? `assets/cards/card-${String(cardId).padStart(2, "0")}.jpg`;
}

const cardImages = new Map(cards.map((card) => {
  const image = new Image();
  image.src = cardSrc(card.id);
  return [card.id, image];
}));

function makeQuestion(card, wrongA, wrongB) {
  return {
    id: `card_${card.id}`,
    cardId: card.id,
    question: `「${card.zh}」的英文是什麼？${card.role}說：${card.clue}`,
    options: [card.en, wrongA, wrongB],
    answer: 0,
    reward: `${card.role}加入你的字卡圖鑑`
  };
}

const quizBank = cards.map((card, index) => {
  const wrongA = cards[(index + 5) % cards.length].en;
  const wrongB = cards[(index + 11) % cards.length].en;
  return makeQuestion(card, wrongA, wrongB);
});

function createTiles(builder) {
  const grid = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 ? "#" : "."))
  );
  const rect = (x, y, w, h, value) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        if (grid[yy]?.[xx] !== undefined) grid[yy][xx] = value;
      }
    }
  };
  builder({ rect });
  return grid.map((row) => row.join(""));
}

const worldMaps = {
  villageCenter: {
    title: "學習村廣場",
    chapter: "Chapter 1",
    hint: "四個出口連到北村、南村、字卡館與農田。",
    theme: "village",
    spawn: { x: 11, y: 9 },
    tiles: createTiles(({ rect }) => {
      rect(10, 1, 4, 14, "P");
      rect(1, 7, 22, 3, "P");
      rect(2, 2, 2, 2, "H");
      rect(20, 2, 2, 2, "H");
      rect(2, 12, 2, 2, "H");
      rect(20, 12, 2, 2, "H");
      rect(11, 8, 2, 1, "K");
      rect(10, 1, 4, 1, "E");
      rect(10, 14, 4, 1, "E");
      rect(1, 8, 1, 1, "E");
      rect(22, 8, 1, 1, "E");
    }),
    exits: [
      { x: 10, y: 1, w: 4, h: 1, target: "northVillage", spawn: { x: 11, y: 13 }, label: "北村學院" },
      { x: 10, y: 14, w: 4, h: 1, target: "southVillage", spawn: { x: 11, y: 2 }, label: "南方情緒花園" },
      { x: 1, y: 8, w: 1, h: 1, target: "cardHall", spawn: { x: 21, y: 8 }, label: "雙語字卡館" },
      { x: 22, y: 8, w: 1, h: 1, target: "farm", spawn: { x: 2, y: 8 }, label: "合作農田" }
    ],
    npcs: [
      { id: "mayor", x: 11, y: 7, color: "#f97316", name: "村長", lines: ["歡迎來到雙語字卡學習村！", "收集 12 張品格字卡與 12 張情緒字卡，這座村莊就會越來越明亮。"] }
    ],
    quizzes: [
      { ...quizBank[0], x: 7, y: 5 },
      { ...quizBank[1], x: 16, y: 5 },
      { ...quizBank[2], x: 7, y: 11 },
      { ...quizBank[3], x: 16, y: 11 }
    ]
  },
  northVillage: {
    title: "北村學院",
    chapter: "Chapter 2",
    hint: "品格課在學院、工坊與小路之間展開。",
    theme: "academy",
    spawn: { x: 11, y: 13 },
    tiles: createTiles(({ rect }) => {
      rect(10, 1, 4, 14, "P");
      rect(3, 4, 18, 2, "P");
      rect(3, 10, 18, 2, "P");
      rect(3, 2, 4, 2, "H");
      rect(17, 2, 4, 2, "H");
      rect(3, 12, 4, 2, "H");
      rect(17, 12, 4, 2, "H");
      rect(6, 7, 3, 2, "T");
      rect(16, 7, 3, 2, "T");
      rect(22, 8, 1, 1, "E");
      rect(10, 14, 4, 1, "E");
    }),
    exits: [
      { x: 10, y: 14, w: 4, h: 1, target: "villageCenter", spawn: { x: 11, y: 2 }, label: "回到學習村廣場" },
      { x: 22, y: 8, w: 1, h: 1, target: "forestPath", spawn: { x: 2, y: 8 }, label: "晨光森林" }
    ],
    npcs: [
      { id: "teacher", x: 11, y: 4, color: "#7f5af0", name: "雙語老師", lines: ["品格詞彙不只是背單字。", "想一想：你今天在哪裡用到了勇氣、合作或感恩？"] }
    ],
    quizzes: [
      { ...quizBank[4], x: 8, y: 4 },
      { ...quizBank[5], x: 15, y: 4 },
      { ...quizBank[6], x: 8, y: 11 },
      { ...quizBank[7], x: 15, y: 11 }
    ]
  },
  cardHall: {
    title: "雙語字卡館",
    chapter: "Chapter 3",
    hint: "館內收藏專注、樂觀、關懷與恆毅的字卡。",
    theme: "hall",
    spawn: { x: 21, y: 8 },
    tiles: createTiles(({ rect }) => {
      rect(2, 2, 20, 12, "P");
      rect(4, 4, 3, 7, "R");
      rect(10, 4, 4, 2, "R");
      rect(17, 4, 3, 7, "R");
      rect(10, 10, 4, 2, "R");
      rect(22, 8, 1, 1, "E");
    }),
    exits: [
      { x: 22, y: 8, w: 1, h: 1, target: "villageCenter", spawn: { x: 2, y: 8 }, label: "回到學習村廣場" }
    ],
    npcs: [
      { id: "librarian", x: 11, y: 8, color: "#38bdf8", name: "字卡館員", lines: ["每張字卡都是一個角色，也是一個可以練習的生活能力。", "完成挑戰後，右側圖鑑會亮起來。"] }
    ],
    quizzes: [
      { ...quizBank[8], x: 8, y: 3 },
      { ...quizBank[9], x: 15, y: 3 },
      { ...quizBank[10], x: 8, y: 12 },
      { ...quizBank[11], x: 15, y: 12 }
    ]
  },
  southVillage: {
    title: "南方情緒花園",
    chapter: "Chapter 4",
    hint: "情緒詞彙在花園裡發光，先認出感受再練習表達。",
    theme: "garden",
    spawn: { x: 11, y: 2 },
    tiles: createTiles(({ rect }) => {
      rect(10, 1, 4, 14, "P");
      rect(2, 7, 20, 3, "P");
      rect(4, 3, 4, 2, "W");
      rect(16, 3, 4, 2, "W");
      rect(4, 12, 4, 2, "T");
      rect(16, 12, 4, 2, "T");
      rect(1, 8, 1, 1, "E");
      rect(10, 1, 4, 1, "E");
    }),
    exits: [
      { x: 10, y: 1, w: 4, h: 1, target: "villageCenter", spawn: { x: 11, y: 13 }, label: "回到學習村廣場" },
      { x: 1, y: 8, w: 1, h: 1, target: "emotionPond", spawn: { x: 21, y: 8 }, label: "心情池畔" }
    ],
    npcs: [
      { id: "counselor", x: 11, y: 8, color: "#ec4899", name: "心情引導員", lines: ["情緒沒有好壞，它們都在告訴我們一些事情。", "先說出感受，再想下一步怎麼照顧自己。"] }
    ],
    quizzes: [
      { ...quizBank[12], x: 6, y: 6 },
      { ...quizBank[13], x: 17, y: 6 },
      { ...quizBank[14], x: 6, y: 10 },
      { ...quizBank[15], x: 17, y: 10 }
    ]
  },
  forestPath: {
    title: "晨光森林",
    chapter: "Chapter 5",
    hint: "森林裡藏著驚訝、緊張、興奮與害羞。",
    theme: "forest",
    spawn: { x: 2, y: 8 },
    tiles: createTiles(({ rect }) => {
      rect(1, 7, 22, 3, "P");
      rect(6, 2, 3, 12, "T");
      rect(15, 2, 3, 12, "T");
      rect(10, 1, 4, 14, "P");
      rect(1, 8, 1, 1, "E");
      rect(22, 8, 1, 1, "E");
    }),
    exits: [
      { x: 1, y: 8, w: 1, h: 1, target: "northVillage", spawn: { x: 21, y: 8 }, label: "回到北村學院" },
      { x: 22, y: 8, w: 1, h: 1, target: "farm", spawn: { x: 2, y: 8 }, label: "穿過小徑到農田" }
    ],
    npcs: [
      { id: "ranger", x: 11, y: 5, color: "#22c55e", name: "森林守望者", lines: ["森林裡的聲音很多，有時會讓人驚訝或緊張。", "慢慢呼吸，觀察眼前發生了什麼。"] }
    ],
    quizzes: [
      { ...quizBank[16], x: 4, y: 5 },
      { ...quizBank[17], x: 19, y: 5 },
      { ...quizBank[18], x: 4, y: 11 },
      { ...quizBank[19], x: 19, y: 11 }
    ]
  },
  emotionPond: {
    title: "心情池畔",
    chapter: "Chapter 6",
    hint: "在安靜水邊練習放鬆、自豪、失望與感動。",
    theme: "pond",
    spawn: { x: 21, y: 8 },
    tiles: createTiles(({ rect }) => {
      rect(1, 7, 22, 3, "P");
      rect(9, 4, 6, 5, "W");
      rect(3, 2, 3, 3, "T");
      rect(18, 11, 3, 3, "T");
      rect(1, 8, 1, 1, "E");
      rect(22, 8, 1, 1, "E");
    }),
    exits: [
      { x: 22, y: 8, w: 1, h: 1, target: "southVillage", spawn: { x: 2, y: 8 }, label: "回到情緒花園" },
      { x: 1, y: 8, w: 1, h: 1, target: "farm", spawn: { x: 21, y: 8 }, label: "通往合作農田" }
    ],
    npcs: [
      { id: "pondGuide", x: 15, y: 9, color: "#14b8a6", name: "池畔夥伴", lines: ["有些心情需要安靜一點才聽得見。", "失望時可以再試一次，自豪時也可以好好肯定自己。"] }
    ],
    quizzes: [
      { ...quizBank[20], x: 6, y: 6 },
      { ...quizBank[21], x: 17, y: 6 },
      { ...quizBank[22], x: 6, y: 11 },
      { ...quizBank[23], x: 17, y: 11 }
    ]
  },
  farm: {
    title: "合作農田",
    chapter: "Chapter 7",
    hint: "農田會連回廣場、森林與池畔，適合之後擴充任務線。",
    theme: "farm",
    spawn: { x: 2, y: 8 },
    tiles: createTiles(({ rect }) => {
      rect(1, 7, 22, 3, "P");
      rect(4, 2, 5, 3, "F");
      rect(14, 2, 5, 3, "F");
      rect(4, 11, 5, 3, "F");
      rect(14, 11, 5, 3, "F");
      rect(10, 1, 4, 14, "P");
      rect(1, 8, 1, 1, "E");
      rect(22, 8, 1, 1, "E");
      rect(10, 1, 4, 1, "E");
    }),
    exits: [
      { x: 1, y: 8, w: 1, h: 1, target: "villageCenter", spawn: { x: 21, y: 8 }, label: "回到學習村廣場" },
      { x: 22, y: 8, w: 1, h: 1, target: "emotionPond", spawn: { x: 2, y: 8 }, label: "心情池畔" },
      { x: 10, y: 1, w: 4, h: 1, target: "forestPath", spawn: { x: 21, y: 8 }, label: "晨光森林" }
    ],
    npcs: [
      { id: "farmer", x: 11, y: 8, color: "#eab308", name: "農場老師", lines: ["這裡暫時沒有新字卡，之後可以加任務、道具、種植與商店。", "先把 24 張字卡主線完成，就是第一個可玩的章節。"] }
    ],
    quizzes: []
  }
};

const blockedTiles = new Set(["#", "T", "H", "W", "R"]);
const groundPalettes = {
  village: ["#6aa45e", "#72ad66", "#7ab86f"],
  academy: ["#6f9f69", "#7eae75", "#8bbf7d"],
  hall: ["#b99862", "#c8a86e", "#a98555"],
  garden: ["#70a968", "#82b973", "#8dc883"],
  forest: ["#3f8c4b", "#347a43", "#4a9a53"],
  pond: ["#5d9b82", "#6daf92", "#7fc2a3"],
  farm: ["#9eb75a", "#b6c96b", "#8fb154"]
};

const keys = new Set();
const player = {
  x: 11,
  y: 9,
  px: 11 * TILE + TILE / 2,
  py: 9 * TILE + TILE / 2,
  speed: 3.2,
  facing: { x: 0, y: 1 },
  moving: false
};

let currentMapId = "villageCenter";
let state = freshState();
let lastTime = 0;
let dialogTimer = 0;
let activeQuiz = null;
let sceneTime = 0;
let screenFlash = 0;
let particles = [];
let floatingTexts = [];
let lastPreviewId = 1;

const totalQuizCount = cards.length;
const sparkleSeeds = Array.from({ length: 76 }, (_, index) => ({
  x: (index * 137) % canvas.width,
  y: (index * 83) % canvas.height,
  phase: index * 0.7,
  size: 1 + (index % 3)
}));

function freshState() {
  return {
    collected: new Set(),
    hearts: 3,
    started: false,
    finished: false,
    locked: false
  };
}

function currentMap() {
  return worldMaps[currentMapId];
}

function resetGame() {
  state = freshState();
  changeMap("villageCenter", worldMaps.villageCenter.spawn, false);
  activeQuiz = null;
  particles = [];
  floatingTexts = [];
  screenFlash = 0;
  hideDialog();
  quizPanel.classList.add("hidden");
  updateHud();
}

function changeMap(mapId, spawn, announce = true) {
  currentMapId = mapId;
  const point = spawn ?? worldMaps[mapId].spawn;
  player.px = point.x * TILE + TILE / 2;
  player.py = point.y * TILE + TILE / 2;
  player.x = point.x;
  player.y = point.y;
  player.facing = { x: 0, y: 1 };
  particles = [];
  floatingTexts = [];
  screenFlash = 0.18;
  updateHud();
  if (announce) showDialog(`來到「${currentMap().title}」。${currentMap().hint}`);
}

function tileAtPixel(px, py) {
  return { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
}

function tileAt(tileX, tileY) {
  return currentMap().tiles[tileY]?.[tileX] ?? "#";
}

function isBlocked(tileX, tileY) {
  return blockedTiles.has(tileAt(tileX, tileY));
}

function canMoveTo(px, py) {
  const margin = 13;
  const points = [
    [px - margin, py - margin],
    [px + margin, py - margin],
    [px - margin, py + margin],
    [px + margin, py + margin]
  ];
  return points.every(([x, y]) => {
    const tile = tileAtPixel(x, y);
    return !isBlocked(tile.x, tile.y);
  });
}

function update(dt) {
  sceneTime += dt;
  screenFlash = Math.max(0, screenFlash - dt * 0.04);
  updateParticles(dt);
  if (state.locked) return;

  let vx = 0;
  let vy = 0;
  if (keys.has("arrowleft") || keys.has("a")) vx -= 1;
  if (keys.has("arrowright") || keys.has("d")) vx += 1;
  if (keys.has("arrowup") || keys.has("w")) vy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) vy += 1;

  const length = Math.hypot(vx, vy);
  player.moving = length > 0;
  if (length > 0) {
    vx /= length;
    vy /= length;
    player.facing = { x: Math.round(vx), y: Math.round(vy) };
  }

  const step = player.speed * dt;
  const nextX = player.px + vx * step;
  const nextY = player.py + vy * step;

  if (canMoveTo(nextX, player.py)) player.px = nextX;
  if (canMoveTo(player.px, nextY)) player.py = nextY;

  player.x = Math.floor(player.px / TILE);
  player.y = Math.floor(player.py / TILE);
  checkExit();
  updateNearbyPreview();
}

function checkExit() {
  const exit = currentMap().exits.find((item) =>
    player.x >= item.x &&
    player.x < item.x + item.w &&
    player.y >= item.y &&
    player.y < item.y + item.h
  );
  if (exit) changeMap(exit.target, exit.spawn);
}

function updateNearbyPreview() {
  const nearest = currentMap().quizzes
    .filter((item) => !state.collected.has(item.cardId))
    .map((item) => ({ item, distance: distanceTiles(player, item) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (nearest && nearest.distance <= 5) {
    lastPreviewId = nearest.item.cardId;
    updateCardPreview(nearest.item.cardId, "靠近發光字卡，按 Space 開始挑戰。");
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSkyGlow();
  drawMap();
  drawObjects();
  drawPlayer();
  drawParticles();
  drawVignette();
  drawOverlay();
}

function drawSkyGlow() {
  const map = currentMap();
  const centers = {
    village: "#326d49",
    academy: "#496d51",
    hall: "#6d5130",
    garden: "#437842",
    forest: "#245a34",
    pond: "#246b73",
    farm: "#5f6f32"
  };
  const center = centers[map.theme] ?? centers.village;
  const edge = map.theme === "hall" ? "#241a14" : "#101820";
  const glow = ctx.createRadialGradient(canvas.width * 0.52, canvas.height * 0.44, 90, canvas.width * 0.52, canvas.height * 0.44, 600);
  glow.addColorStop(0, center);
  glow.addColorStop(0.58, "#18351f");
  glow.addColorStop(1, edge);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawMap() {
  const map = currentMap();
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) drawTile(map.tiles[y][x], x, y, map.theme);
  }
  drawExits();
}

function drawTile(cell, x, y, theme) {
  const px = x * TILE;
  const py = y * TILE;
  const palette = groundPalettes[theme] ?? groundPalettes.village;
  ctx.fillStyle = palette[(x * 11 + y * 7) % palette.length];
  ctx.fillRect(px, py, TILE, TILE);

  if (cell !== "#") {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(px + 4, py + 5, 9, 3);
    ctx.fillRect(px + 25, py + 27, 7, 3);
  }

  if (cell === "#") drawWall(px, py);
  if (cell === "T") drawTree(px, py);
  if (cell === "F") drawCrop(px, py);
  if (cell === "H") drawHouse(px, py);
  if (cell === "P") drawPath(px, py, theme);
  if (cell === "K") drawFountain(px, py);
  if (cell === "W") drawWater(px, py);
  if (cell === "R") drawShelf(px, py);
}

function drawWall(px, py) {
  ctx.fillStyle = "#23352d";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#162620";
  ctx.fillRect(px, py + 23, TILE, 17);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(px + 4, py + 5, 28, 4);
}

function drawPath(px, py, theme) {
  ctx.fillStyle = theme === "hall" ? "#dfc18a" : "#c6a76f";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "rgba(86, 54, 28, 0.18)";
  ctx.fillRect(px + 4, py + 25, 13, 4);
  ctx.fillRect(px + 23, py + 10, 10, 4);
}

function drawTree(px, py) {
  ctx.fillStyle = "rgba(4, 20, 12, 0.28)";
  ctx.beginPath();
  ctx.ellipse(px + 20, py + 32, 19, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#67462d";
  ctx.fillRect(px + 17, py + 21, 7, 16);
  ctx.fillStyle = "#145b36";
  ctx.beginPath();
  ctx.arc(px + 20, py + 18 + Math.sin(sceneTime * 0.04 + px) * 1.2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2fa35d";
  ctx.beginPath();
  ctx.arc(px + 14, py + 12, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrop(px, py) {
  ctx.fillStyle = "#72512d";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#8bc34a";
  for (let i = 0; i < 4; i += 1) ctx.fillRect(px + 5 + i * 8, py + 8, 4, 24);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(px + 9, py + 14, 5, 5);
  ctx.fillRect(px + 25, py + 20, 5, 5);
}

function drawHouse(px, py) {
  ctx.fillStyle = "rgba(4, 20, 12, 0.28)";
  ctx.fillRect(px + 2, py + 29, 36, 7);
  ctx.fillStyle = "#8b5e3c";
  ctx.fillRect(px + 6, py + 17, 28, 19);
  ctx.fillStyle = "#d94f45";
  ctx.beginPath();
  ctx.moveTo(px + 3, py + 18);
  ctx.lineTo(px + 20, py + 4);
  ctx.lineTo(px + 37, py + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffe3a3";
  ctx.fillRect(px + 15, py + 24, 8, 12);
}

function drawFountain(px, py) {
  ctx.fillStyle = "#65758a";
  ctx.fillRect(px + 8, py + 18, 24, 16);
  ctx.fillStyle = "#6ee7f9";
  ctx.beginPath();
  ctx.arc(px + 20, py + 18, 10 + Math.sin(sceneTime * 0.08) * 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater(px, py) {
  ctx.fillStyle = "#277f9f";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.strokeStyle = "rgba(193, 246, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 4, py + 20 + Math.sin(sceneTime * 0.05 + px) * 2);
  ctx.quadraticCurveTo(px + 20, py + 12, px + 36, py + 20);
  ctx.stroke();
}

function drawShelf(px, py) {
  ctx.fillStyle = "#6f4328";
  ctx.fillRect(px + 5, py + 4, 30, 32);
  ctx.fillStyle = "#f5c45d";
  ctx.fillRect(px + 9, py + 8, 4, 22);
  ctx.fillStyle = "#8de0c1";
  ctx.fillRect(px + 16, py + 8, 4, 22);
  ctx.fillStyle = "#f78ca2";
  ctx.fillRect(px + 23, py + 8, 4, 22);
}

function drawExits() {
  currentMap().exits.forEach((exit) => {
    const pulse = 0.45 + Math.max(0, Math.sin(sceneTime * 0.08)) * 0.3;
    ctx.fillStyle = `rgba(255, 220, 123, ${pulse})`;
    ctx.fillRect(exit.x * TILE, exit.y * TILE, exit.w * TILE, exit.h * TILE);
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fillRect(exit.x * TILE + 8, exit.y * TILE + 8, exit.w * TILE - 16, Math.max(4, exit.h * TILE - 16));
  });
}

function drawObjects() {
  currentMap().quizzes.forEach((stone) => drawCardStone(stone));
  currentMap().npcs.forEach((npc) => drawNpc(npc));
  drawSparkles();
}

function drawCardStone(stone) {
  const completed = state.collected.has(stone.cardId);
  const px = stone.x * TILE;
  const py = stone.y * TILE;
  const pulse = completed ? 0 : Math.sin(sceneTime * 0.08 + stone.x) * 4;
  if (!completed) {
    const aura = ctx.createRadialGradient(px + 20, py + 20, 2, px + 20, py + 20, 34 + pulse);
    aura.addColorStop(0, "rgba(94, 234, 212, 0.55)");
    aura.addColorStop(1, "rgba(94, 234, 212, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(px - 24, py - 24, 88, 88);
  }
  const img = cardImages.get(stone.cardId);
  ctx.save();
  ctx.translate(px + 20, py + 19 - pulse * 0.2);
  ctx.rotate(Math.sin(sceneTime * 0.02 + stone.cardId) * 0.08);
  ctx.fillStyle = completed ? "#a8b8ad" : "#fff3bf";
  roundRect(-14, -18, 28, 36, 4);
  ctx.fill();
  if (img?.complete) ctx.drawImage(img, -11, -15, 22, 30);
  ctx.strokeStyle = completed ? "#d6e2e5" : "#ffffff";
  ctx.lineWidth = 2;
  roundRect(-14, -18, 28, 36, 4);
  ctx.stroke();
  ctx.restore();
}

function drawNpc(npc) {
  const px = npc.x * TILE + 20;
  const py = npc.y * TILE + 21;
  ctx.fillStyle = "rgba(4, 20, 12, 0.3)";
  ctx.beginPath();
  ctx.ellipse(px, py + 15, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = npc.color;
  ctx.beginPath();
  ctx.arc(px, py - 8 + Math.sin(sceneTime * 0.05 + npc.x) * 1.3, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(px - 9, py, 18, 17);
  ctx.fillStyle = "#fff2c6";
  ctx.fillRect(px - 4, py - 11, 3, 3);
  ctx.fillRect(px + 4, py - 11, 3, 3);
}

function drawPlayer() {
  const bounce = player.moving ? Math.sin(Date.now() / 80) * 2 : 0;
  ctx.fillStyle = "rgba(4, 20, 12, 0.34)";
  ctx.beginPath();
  ctx.ellipse(player.px, player.py + 19, 17, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d6cdf";
  ctx.beginPath();
  ctx.arc(player.px, player.py - 9 + bounce, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f8d6b1";
  ctx.fillRect(player.px - 8, player.py + bounce, 16, 16);
  ctx.fillStyle = "#143a6b";
  ctx.fillRect(player.px - 11, player.py + 12 + bounce, 22, 7);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.px - 4, player.py - 12 + bounce, 3, 3);
  ctx.fillRect(player.px + 4, player.py - 12 + bounce, 3, 3);
  ctx.fillStyle = "#ffdc7b";
  ctx.fillRect(player.px - 14, player.py + 2 + bounce, 5, 11);
}

function drawSparkles() {
  sparkleSeeds.forEach((spark) => {
    const alpha = 0.08 + Math.max(0, Math.sin(sceneTime * 0.035 + spark.phase)) * 0.34;
    ctx.fillStyle = `rgba(255, 237, 148, ${alpha})`;
    ctx.fillRect(spark.x, spark.y, spark.size, spark.size);
  });
}

function updateParticles(dt) {
  particles = particles
    .map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt }))
    .filter((p) => p.life > 0);
  floatingTexts = floatingTexts
    .map((item) => ({ ...item, y: item.y - 0.55 * dt, life: item.life - dt }))
    .filter((item) => item.life > 0);
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
  floatingTexts.forEach((item) => {
    ctx.globalAlpha = Math.max(0, item.life / item.maxLife);
    ctx.font = "800 18px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = item.color;
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 4;
    ctx.strokeText(item.text, item.x, item.y);
    ctx.fillText(item.text, item.x, item.y);
  });
  ctx.globalAlpha = 1;
  ctx.textAlign = "start";
}

function drawVignette() {
  const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 180, canvas.width / 2, canvas.height / 2, 570);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (screenFlash > 0) {
    ctx.fillStyle = `rgba(255, 244, 169, ${screenFlash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawOverlay() {
  if (!state.finished) return;
  ctx.fillStyle = "rgba(17, 32, 24, 0.52)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 34px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("24 張雙語字卡收集完成！", canvas.width / 2, 292);
  ctx.font = "20px Segoe UI, sans-serif";
  ctx.fillText("下一版可以加入任務線、背包、角色等級與更多村莊地圖。", canvas.width / 2, 330);
  ctx.textAlign = "start";
}

function interact() {
  if (state.locked) return;
  const target = { x: player.x + player.facing.x, y: player.y + player.facing.y };
  const exit = currentMap().exits.find((item) =>
    target.x >= item.x &&
    target.x < item.x + item.w &&
    target.y >= item.y &&
    target.y < item.y + item.h
  );
  if (exit) {
    showDialog(`前方是「${exit.label}」，直接走上發光格就會換地圖。`);
    return;
  }

  const nearNpc = currentMap().npcs.find((npc) => distanceTiles(player, npc) <= 1.4 || (npc.x === target.x && npc.y === target.y));
  if (nearNpc) {
    state.started = true;
    showDialog(`${nearNpc.name}：${nearNpc.lines.join(" ")}`);
    addFloatingText("對話", nearNpc.x * TILE + 20, nearNpc.y * TILE, "#ffdc7b");
    updateHud();
    return;
  }

  const stone = currentMap().quizzes.find((item) => !state.collected.has(item.cardId) && (distanceTiles(player, item) <= 1.35 || (item.x === target.x && item.y === target.y)));
  if (stone) {
    openQuiz(stone);
    return;
  }

  showDialog("附近沒有可互動的對象。靠近 NPC、發光字卡或出口再試試。");
}

function distanceTiles(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function showDialog(text) {
  dialog.textContent = text;
  dialog.classList.remove("hidden");
  dialogTimer = 4600;
}

function hideDialog() {
  dialog.classList.add("hidden");
  dialog.textContent = "";
}

function openQuiz(stone) {
  const card = cardById.get(stone.cardId);
  activeQuiz = stone;
  state.locked = true;
  quizQuestion.textContent = stone.question;
  quizCardImage.src = cardSrc(card.id);
  quizCardImage.alt = `${card.role} ${card.en}`;
  quizCardMeta.textContent = `${card.type} / ${card.role}`;
  document.querySelector("#quizTitle").textContent = `${card.zh} ${card.en}`;
  quizOptions.innerHTML = "";
  stone.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => answerQuiz(index));
    quizOptions.appendChild(button);
  });
  quizPanel.classList.remove("hidden");
}

function answerQuiz(index) {
  if (!activeQuiz) return;
  const correct = index === activeQuiz.answer;
  const card = cardById.get(activeQuiz.cardId);
  quizPanel.classList.add("hidden");
  state.locked = false;

  if (correct) {
    state.collected.add(activeQuiz.cardId);
    lastPreviewId = activeQuiz.cardId;
    showDialog(`答對了！${activeQuiz.reward}。${card.zh} = ${card.en}`);
    burst(activeQuiz.x * TILE + 20, activeQuiz.y * TILE + 20, "#ffdc7b", 34);
    addFloatingText(`+ ${card.en}`, activeQuiz.x * TILE + 20, activeQuiz.y * TILE - 2, "#ffdc7b");
    screenFlash = 0.22;
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    showDialog(`再想想看。${card.role}提示：${card.clue}`);
    burst(player.px, player.py, "#ff6b6b", 18);
    addFloatingText("再試一次", player.px, player.py - 16, "#ffb4a8");
  }

  if (state.collected.size >= totalQuizCount) {
    state.finished = true;
    showDialog("恭喜！24 張雙語字卡都收集完成，學習村的第一章完成了。");
  }

  activeQuiz = null;
  updateHud();
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 0.8 + (i % 7) * 0.18;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 28 + (i % 8),
      maxLife: 36,
      size: 3 + (i % 3),
      color
    });
  }
}

function addFloatingText(text, x, y, color) {
  floatingTexts.push({ text, x, y, color, life: 70, maxLife: 70 });
}

function updateCardPreview(cardId, hint) {
  const card = cardById.get(cardId);
  cardImage.src = cardSrc(card.id);
  cardImage.alt = `${card.role} ${card.en}`;
  cardName.textContent = `${card.en} ${card.zh}`;
  cardHint.textContent = hint ?? card.clue;
}

function buildCollectionGrid() {
  collectionGrid.innerHTML = "";
  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = card.id;
    button.title = `${card.zh} ${card.en}`;
    button.addEventListener("click", () => {
      lastPreviewId = card.id;
      updateCardPreview(card.id, `${card.role}：${card.clue}`);
    });
    collectionGrid.appendChild(button);
  });
}

function updateHud() {
  const map = currentMap();
  shardsText.textContent = `${state.collected.size} / ${totalQuizCount}`;
  heartsText.textContent = state.hearts;
  chapterLabel.textContent = map.chapter;
  placeTitle.textContent = map.title;
  toast.textContent = map.hint;
  progressText.textContent = map.title;
  updateCardPreview(lastPreviewId, state.collected.has(lastPreviewId) ? "已收集。點圖鑑可查看其他字卡。" : undefined);

  [...collectionGrid.children].forEach((button, index) => {
    button.classList.toggle("collected", state.collected.has(index + 1));
  });

  if (state.finished) {
    questText.textContent = "24 張雙語字卡都已完成。下一步可以擴充主線任務、角色成長、道具與更多地圖。";
  } else if (!state.started) {
    questText.textContent = "先找廣場上的村長對話，再探索每個發光字卡。目標是收集 12 張品格字卡與 12 張情緒字卡。";
  } else if (state.hearts === 0) {
    questText.textContent = "勇氣心用完也沒關係，可以繼續練習。按重新開始可從頭挑戰。";
  } else {
    questText.textContent = `目前在「${map.title}」。找發光字卡完成挑戰，或踩上出口前往下一張地圖。`;
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function loop(time) {
  const elapsed = time - lastTime;
  const dt = Math.min(elapsed / 16.67, 2);
  lastTime = time;
  if (dialogTimer > 0) {
    dialogTimer -= elapsed;
    if (dialogTimer <= 0) hideDialog();
  }
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)) event.preventDefault();
  if (key === " ") interact();
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

restartButton.addEventListener("click", resetGame);

buildCollectionGrid();
updateHud();
showDialog("歡迎來到雙語字卡學習村。找村長對話，開始收集 24 張字卡。");
requestAnimationFrame(loop);
