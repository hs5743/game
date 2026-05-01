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

const TILE = 40;
const COLS = canvas.width / TILE;
const ROWS = canvas.height / TILE;

const worldMaps = {
  village: {
    title: "學習村",
    chapter: "Chapter 1",
    hint: "北門通往森林，東門通往農田",
    theme: "village",
    spawn: { x: 11, y: 10 },
    tiles: [
      "##########EEEE##########",
      "#......TT.PPPP.TT......#",
      "#..HH..............HH..#",
      "#..HH....PPPPPP....HH..#",
      "#........P....P........#",
      "#....N...P.Q..P...N....#",
      "#........P....P........#",
      "#..PPPPPPP....PPPPPPP..#",
      "#..P................PE.#",
      "#..P...HH..K...HH...PE.#",
      "#..P...HH......HH...P..#",
      "#..PPPPPPP....PPPPPPP..#",
      "#........P....P........#",
      "#..HH....P....P....HH..#",
      "#..HH....PPPPPP....HH..#",
      "########################"
    ],
    exits: [
      { x: 10, y: 1, w: 4, h: 1, target: "forest", spawn: { x: 11, y: 13 }, label: "森林小徑" },
      { x: 22, y: 8, w: 1, h: 2, target: "farm", spawn: { x: 2, y: 8 }, label: "東邊農田" }
    ],
    npcs: [
      {
        id: "teacher",
        x: 4,
        y: 5,
        color: "#7f5af0",
        name: "林老師",
        lines: [
          "歡迎來到學習村。這裡會慢慢擴大成一個完整的學習 RPG 世界。",
          "先到村莊、森林、農田走走，收集 6 個知識碎片。"
        ]
      },
      {
        id: "mayor",
        x: 18,
        y: 5,
        color: "#f97316",
        name: "村長",
        lines: [
          "村莊太大時，不需要硬塞在同一張地圖。",
          "用出口連接多張地圖，玩家會覺得世界更大，也比較好維護。"
        ]
      }
    ],
    quizzes: [
      {
        id: "village_reading",
        x: 11,
        y: 5,
        question: "閱讀任務說明時，最好的第一步是什麼？",
        options: ["找出目標與關鍵線索", "直接亂走", "只看最後一個字"],
        answer: 0,
        reward: "任務理解碎片"
      },
      {
        id: "village_map",
        x: 10,
        y: 9,
        question: "大型 RPG 地圖通常如何避免畫面太擁擠？",
        options: ["把所有內容塞進一張圖", "拆成多張地圖並用出口連接", "讓玩家不能移動"],
        answer: 1,
        reward: "世界設計碎片"
      }
    ]
  },
  forest: {
    title: "北境森林",
    chapter: "Chapter 2",
    hint: "南邊回村莊，深處藏著探究題",
    theme: "forest",
    spawn: { x: 11, y: 14 },
    tiles: [
      "########################",
      "#TTTT....F......TTTTTT.#",
      "#T......TTT.........TT.#",
      "#T..PPPP....PPPP.......#",
      "#...P..T....T..P..Q....#",
      "#...P..........P.......#",
      "#...PPPP....PPPP..TT...#",
      "#......P....P..........#",
      "#..N...P.Q..P....TT....#",
      "#......P....P..........#",
      "#...PPPP....PPPP.......#",
      "#...P..........P..F....#",
      "#...P..TTTT..P.......T.#",
      "#...PPPPPPPPPP....TTTT.#",
      "#..........E...........#",
      "########################"
    ],
    exits: [
      { x: 10, y: 14, w: 4, h: 1, target: "village", spawn: { x: 11, y: 2 }, label: "回到學習村" }
    ],
    npcs: [
      {
        id: "ranger",
        x: 3,
        y: 8,
        color: "#22c55e",
        name: "森林守望者",
        lines: [
          "森林適合放探索、觀察、閱讀理解類任務。",
          "之後可以加入隱藏路線、採集道具、怪物遭遇或環境解謎。"
        ]
      }
    ],
    quizzes: [
      {
        id: "forest_observe",
        x: 15,
        y: 4,
        question: "做自然觀察時，哪一項最像可靠證據？",
        options: ["我覺得應該是", "記錄時間、地點與看到的變化", "朋友說一定是"],
        answer: 1,
        reward: "觀察碎片"
      },
      {
        id: "forest_strategy",
        x: 10,
        y: 8,
        question: "遇到困難題目時，哪個策略最有幫助？",
        options: ["拆成小問題", "立刻放棄", "只猜最長的選項"],
        answer: 0,
        reward: "探究策略碎片"
      }
    ]
  },
  farm: {
    title: "東風農田",
    chapter: "Chapter 3",
    hint: "西邊回村莊，田裡有合作與數感挑戰",
    theme: "farm",
    spawn: { x: 1, y: 8 },
    tiles: [
      "########################",
      "#....FFFFFFFFFFFF......#",
      "#....F..F..F..F.F..HH..#",
      "#....FFFFFFFFFFFF..HH..#",
      "#......................#",
      "#..N..PPPPPPPPPP..Q....#",
      "#.....P........P.......#",
      "#E....P..HHHH..P.......#",
      "#E....P..HHHH..P..Q....#",
      "#E....P........P.......#",
      "#.....PPPPPPPPPP.......#",
      "#..FFFFFFFFFFFFFFF.....#",
      "#..F..F..F..F..F.F.....#",
      "#..FFFFFFFFFFFFFFF..N..#",
      "#......................#",
      "########################"
    ],
    exits: [
      { x: 1, y: 7, w: 1, h: 3, target: "village", spawn: { x: 21, y: 8 }, label: "回到學習村" }
    ],
    npcs: [
      {
        id: "farmer",
        x: 3,
        y: 5,
        color: "#eab308",
        name: "阿禾",
        lines: [
          "農田可以放數學、生活科技、合作任務。",
          "例如計算收成、分配資源，或讓小組一起解決灌溉問題。"
        ]
      },
      {
        id: "builder",
        x: 20,
        y: 13,
        color: "#38bdf8",
        name: "工匠",
        lines: [
          "下一步可以做成任務鏈：先找 NPC，拿工具，再到另一張地圖完成挑戰。",
          "這樣教育內容會變成冒險流程，而不是孤立題目。"
        ]
      }
    ],
    quizzes: [
      {
        id: "farm_math",
        x: 18,
        y: 5,
        question: "農田有 4 排作物，每排 6 株，一共有幾株？",
        options: ["10", "24", "46"],
        answer: 1,
        reward: "數感碎片"
      },
      {
        id: "farm_collab",
        x: 18,
        y: 8,
        question: "小組分工時，哪一種做法最能提高效率？",
        options: ["每個人都做同一件事", "先確認目標，再分配角色", "不討論直接開始"],
        answer: 1,
        reward: "合作任務碎片"
      }
    ]
  }
};

const blockedTiles = new Set(["#", "T", "H", "W"]);
const groundPalettes = {
  village: ["#6aa45e", "#72ad66", "#7ab86f"],
  forest: ["#3f8c4b", "#347a43", "#4a9a53"],
  farm: ["#9eb75a", "#b6c96b", "#8fb154"]
};

const keys = new Set();
const player = {
  x: 11,
  y: 10,
  px: 11 * TILE + TILE / 2,
  py: 10 * TILE + TILE / 2,
  speed: 3.2,
  facing: { x: 0, y: 1 },
  moving: false
};

let currentMapId = "village";
let state = freshState();
let lastTime = 0;
let dialogTimer = 0;
let activeQuiz = null;
let sceneTime = 0;
let screenFlash = 0;
let particles = [];
let floatingTexts = [];

const totalQuizCount = Object.values(worldMaps).reduce((sum, map) => sum + map.quizzes.length, 0);
const sparkleSeeds = Array.from({ length: 58 }, (_, index) => ({
  x: ((index * 137) % canvas.width),
  y: ((index * 83) % canvas.height),
  phase: index * 0.7,
  size: 1 + (index % 3)
}));

function freshState() {
  return {
    shards: new Set(),
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
  changeMap("village", worldMaps.village.spawn, false);
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
  if (announce) {
    showDialog(`你來到了「${currentMap().title}」。${currentMap().hint}`);
  }
}

function tileAtPixel(px, py) {
  return {
    x: Math.floor(px / TILE),
    y: Math.floor(py / TILE)
  };
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
}

function checkExit() {
  const exit = currentMap().exits.find((item) =>
    player.x >= item.x &&
    player.x < item.x + item.w &&
    player.y >= item.y &&
    player.y < item.y + item.h
  );
  if (exit) {
    changeMap(exit.target, exit.spawn);
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
  const center = map.theme === "forest" ? "#245a34" : map.theme === "farm" ? "#5f6f32" : "#326d49";
  const edge = map.theme === "farm" ? "#202914" : "#101820";
  const glow = ctx.createRadialGradient(canvas.width * 0.52, canvas.height * 0.44, 90, canvas.width * 0.52, canvas.height * 0.44, 600);
  glow.addColorStop(0, center);
  glow.addColorStop(0.55, "#18351f");
  glow.addColorStop(1, edge);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawMap() {
  const map = currentMap();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = map.tiles[y][x];
      drawTile(cell, x, y, map.theme);
    }
  }
  drawExits();
}

function drawTile(cell, x, y, theme) {
  const px = x * TILE;
  const py = y * TILE;
  const palette = groundPalettes[theme] ?? groundPalettes.village;
  const grassShift = (x * 11 + y * 7) % palette.length;
  ctx.fillStyle = palette[grassShift];
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
  if (cell === "P") drawPath(px, py);
  if (cell === "K") drawWell(px, py);
}

function drawWall(px, py) {
  ctx.fillStyle = "#23352d";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#162620";
  ctx.fillRect(px, py + 23, TILE, 17);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(px + 4, py + 5, 28, 4);
}

function drawPath(px, py) {
  ctx.fillStyle = "#c6a76f";
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
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(px + 5 + i * 8, py + 8, 4, 24);
  }
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

function drawWell(px, py) {
  ctx.fillStyle = "#65758a";
  ctx.fillRect(px + 9, py + 16, 22, 18);
  ctx.fillStyle = "#2f4f65";
  ctx.fillRect(px + 12, py + 19, 16, 8);
  ctx.fillStyle = "#d8b76a";
  ctx.fillRect(px + 7, py + 11, 26, 5);
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
  const map = currentMap();
  map.quizzes.forEach((stone) => {
    const completed = state.shards.has(stone.id);
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
    ctx.fillStyle = completed ? "#88a0a8" : "#42c6ff";
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 3 - pulse * 0.2);
    ctx.lineTo(px + 33, py + 20);
    ctx.lineTo(px + 20, py + 37 + pulse * 0.2);
    ctx.lineTo(px + 7, py + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = completed ? "#d6e2e5" : "#ffffff";
    ctx.fillRect(px + 18, py + 13, 4, 14);
  });

  map.npcs.forEach((npc) => {
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
  });

  drawSparkles();
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
  ctx.font = "700 34px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("任務完成：學習村的三張地圖都被點亮！", canvas.width / 2, 290);
  ctx.font = "20px Segoe UI, sans-serif";
  ctx.fillText("下一版可以加入背包、任務鏈、角色升級與更多建築室內地圖。", canvas.width / 2, 330);
  ctx.textAlign = "start";
}

function interact() {
  if (state.locked) return;

  const target = {
    x: player.x + player.facing.x,
    y: player.y + player.facing.y
  };

  const exit = currentMap().exits.find((item) =>
    target.x >= item.x &&
    target.x < item.x + item.w &&
    target.y >= item.y &&
    target.y < item.y + item.h
  );
  if (exit) {
    showDialog(`${exit.label}。直接走上發光出口就能切換地圖。`);
    return;
  }

  const nearNpc = currentMap().npcs.find((npc) => distanceTiles(player, npc) <= 1.4 || (npc.x === target.x && npc.y === target.y));
  if (nearNpc) {
    if (nearNpc.id === "teacher") state.started = true;
    showDialog(`${nearNpc.name}：${nearNpc.lines.join(" ")}`);
    addFloatingText("任務提示", nearNpc.x * TILE + 20, nearNpc.y * TILE, "#ffdc7b");
    updateHud();
    return;
  }

  const stone = currentMap().quizzes.find((item) => !state.shards.has(item.id) && (distanceTiles(player, item) <= 1.3 || (item.x === target.x && item.y === target.y)));
  if (stone) {
    openQuiz(stone);
    return;
  }

  showDialog("這裡暫時沒有可互動的東西。試著靠近 NPC、發光知識碑或地圖出口。");
}

function distanceTiles(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function showDialog(text) {
  dialog.textContent = text;
  dialog.classList.remove("hidden");
  dialogTimer = 4400;
}

function hideDialog() {
  dialog.classList.add("hidden");
  dialog.textContent = "";
}

function openQuiz(stone) {
  activeQuiz = stone;
  state.locked = true;
  quizQuestion.textContent = stone.question;
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
  quizPanel.classList.add("hidden");
  state.locked = false;

  if (correct) {
    state.shards.add(activeQuiz.id);
    showDialog(`答對了！你獲得「${activeQuiz.reward}」。`);
    burst(activeQuiz.x * TILE + 20, activeQuiz.y * TILE + 20, "#ffdc7b", 34);
    addFloatingText("+1 知識碎片", activeQuiz.x * TILE + 20, activeQuiz.y * TILE - 2, "#ffdc7b");
    screenFlash = 0.22;
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    showDialog("還差一點。勇氣少 1，但你可以再挑戰其他知識碑。");
    burst(player.px, player.py, "#ff6b6b", 18);
    addFloatingText("再試一次", player.px, player.py - 16, "#ffb4a8");
  }

  if (state.shards.size >= totalQuizCount) {
    state.finished = true;
    showDialog("所有地區的知識碎片都找回來了。任務完成！");
  }

  activeQuiz = null;
  updateHud();
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
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

function updateHud() {
  const map = currentMap();
  shardsText.textContent = `${state.shards.size} / ${totalQuizCount}`;
  heartsText.textContent = state.hearts;
  chapterLabel.textContent = map.chapter;
  placeTitle.textContent = map.title;
  toast.textContent = map.hint;

  if (state.finished) {
    questText.textContent = "三個區域的挑戰都完成了。下一步可以加入任務鏈、背包、室內地圖與角色成長。";
    progressText.textContent = "完成";
  } else if (!state.started) {
    questText.textContent = "和學習村的林老師對話，開始探索村莊、森林與農田。";
    progressText.textContent = map.title;
  } else if (state.hearts === 0) {
    questText.textContent = "勇氣用完了，但學習可以重來。按重新開始再挑戰一次。";
    progressText.textContent = "再試一次";
  } else {
    questText.textContent = `目前在「${map.title}」。探索 NPC、知識碑與發光出口，收集所有碎片。`;
    progressText.textContent = map.title;
  }
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
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }
  if (key === " ") interact();
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

restartButton.addEventListener("click", resetGame);

updateHud();
requestAnimationFrame(loop);
