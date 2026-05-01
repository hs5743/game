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

const TILE = 40;
const COLS = canvas.width / TILE;
const ROWS = canvas.height / TILE;

const map = [
  "########################",
  "#..........F...........#",
  "#..TT..............TT..#",
  "#..T......####......T..#",
  "#.........#..#.........#",
  "#....N....#..#....Q....#",
  "#.........####.........#",
  "#......................#",
  "#...####.......####....#",
  "#...#..#..K....#..#....#",
  "#...####.......####....#",
  "#..........S...........#",
  "#..Q...............N...#",
  "#..........F...........#",
  "#......................#",
  "########################"
];

const npcs = [
  {
    id: "teacher",
    x: 5,
    y: 5,
    color: "#7f5af0",
    name: "林老師",
    lines: [
      "歡迎來到知識森林。今天的任務是找回 4 個知識碎片。",
      "靠近發亮的知識碑並按空白鍵，就能接受挑戰。答對越多，森林就越明亮。"
    ]
  },
  {
    id: "guide",
    x: 19,
    y: 12,
    color: "#f97316",
    name: "小隊長",
    lines: [
      "遇到困難時，先想：我已經知道什麼？還缺什麼線索？",
      "這也是學習策略喔。把問題拆小，通常就能往前一步。"
    ]
  }
];

const quizStones = [
  {
    id: "reading",
    x: 18,
    y: 5,
    question: "閱讀文章時，最能幫助理解主旨的是哪一個做法？",
    options: ["只看第一個字", "找出關鍵句並整理段落重點", "跳過不會的全部內容"],
    answer: 1,
    reward: "閱讀碎片"
  },
  {
    id: "science",
    x: 3,
    y: 12,
    question: "做科學觀察時，哪一項最重要？",
    options: ["記錄證據，再提出解釋", "先猜答案，不用驗證", "只相信最大聲的人"],
    answer: 0,
    reward: "探究碎片"
  },
  {
    id: "collab",
    x: 11,
    y: 9,
    question: "小組合作時，最好的溝通方式是？",
    options: ["輪流表達並回應彼此想法", "只讓一個人決定", "有不同意見就停止討論"],
    answer: 0,
    reward: "合作碎片"
  },
  {
    id: "digital",
    x: 11,
    y: 11,
    question: "在網路上看到新資訊，應該先做什麼？",
    options: ["立刻轉傳", "檢查來源與日期", "只看標題就相信"],
    answer: 1,
    reward: "媒體素養碎片"
  }
];

const keys = new Set();
const player = {
  x: 2,
  y: 2,
  px: 2 * TILE + TILE / 2,
  py: 2 * TILE + TILE / 2,
  speed: 3.2,
  facing: { x: 0, y: 1 },
  moving: false
};

let state = freshState();
let lastTime = 0;
let dialogTimer = 0;
let activeQuiz = null;

function freshState() {
  return {
    shards: new Set(),
    hearts: 3,
    started: false,
    finished: false,
    locked: false
  };
}

function resetGame() {
  state = freshState();
  player.px = 2 * TILE + TILE / 2;
  player.py = 2 * TILE + TILE / 2;
  player.facing = { x: 0, y: 1 };
  activeQuiz = null;
  hideDialog();
  quizPanel.classList.add("hidden");
  updateHud();
}

function tileAtPixel(px, py) {
  return {
    x: Math.floor(px / TILE),
    y: Math.floor(py / TILE)
  };
}

function isBlocked(tileX, tileY) {
  const cell = map[tileY]?.[tileX] ?? "#";
  return cell === "#" || cell === "T" || cell === "F";
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
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawObjects();
  drawPlayer();
  drawOverlay();
}

function drawMap() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = map[y][x];
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = cell === "#" ? "#35523d" : "#9ccf8d";
      ctx.fillRect(px, py, TILE, TILE);

      if (cell === "#") {
        ctx.fillStyle = "#263b2d";
        ctx.fillRect(px, py + 24, TILE, 16);
      }

      if (cell === "T") drawTree(px, py);
      if (cell === "F") drawFlower(px, py);
      if (cell === ".") {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(px + 2, py + 2, 3, 3);
      }
    }
  }
}

function drawTree(px, py) {
  ctx.fillStyle = "#67462d";
  ctx.fillRect(px + 17, py + 21, 7, 16);
  ctx.fillStyle = "#1f6d3a";
  ctx.beginPath();
  ctx.arc(px + 20, py + 18, 15, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(px, py) {
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(px + 20, py + 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3f8c4b";
  ctx.fillRect(px + 19, py + 27, 3, 9);
}

function drawObjects() {
  quizStones.forEach((stone) => {
    const completed = state.shards.has(stone.id);
    const px = stone.x * TILE;
    const py = stone.y * TILE;
    ctx.fillStyle = completed ? "#88a0a8" : "#42c6ff";
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 5);
    ctx.lineTo(px + 32, py + 20);
    ctx.lineTo(px + 20, py + 35);
    ctx.lineTo(px + 8, py + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = completed ? "#d6e2e5" : "#ffffff";
    ctx.fillRect(px + 18, py + 13, 4, 14);
  });

  npcs.forEach((npc) => {
    const px = npc.x * TILE + 20;
    const py = npc.y * TILE + 21;
    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(px, py - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 9, py, 18, 17);
  });
}

function drawPlayer() {
  const bounce = player.moving ? Math.sin(Date.now() / 80) * 2 : 0;
  ctx.fillStyle = "#2d6cdf";
  ctx.beginPath();
  ctx.arc(player.px, player.py - 9 + bounce, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f8d6b1";
  ctx.fillRect(player.px - 8, player.py + bounce, 16, 16);
  ctx.fillStyle = "#143a6b";
  ctx.fillRect(player.px - 11, player.py + 12 + bounce, 22, 7);
}

function drawOverlay() {
  if (!state.finished) return;
  ctx.fillStyle = "rgba(17, 32, 24, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("任務完成：知識森林恢復光亮！", canvas.width / 2, 290);
  ctx.font = "20px Segoe UI, sans-serif";
  ctx.fillText("你已收集 4 個知識碎片，可以重新開始或改寫題庫。", canvas.width / 2, 330);
  ctx.textAlign = "start";
}

function interact() {
  if (state.locked) return;

  const target = {
    x: player.x + player.facing.x,
    y: player.y + player.facing.y
  };

  const nearNpc = npcs.find((npc) => distanceTiles(player, npc) <= 1.4 || (npc.x === target.x && npc.y === target.y));
  if (nearNpc) {
    if (nearNpc.id === "teacher") state.started = true;
    showDialog(`${nearNpc.name}：${nearNpc.lines.join(" ")}`);
    updateHud();
    return;
  }

  const stone = quizStones.find((item) => !state.shards.has(item.id) && (distanceTiles(player, item) <= 1.3 || (item.x === target.x && item.y === target.y)));
  if (stone) {
    openQuiz(stone);
    return;
  }

  showDialog("這裡暫時沒有可互動的東西。試著靠近老師、同伴或發亮的知識碑。");
}

function distanceTiles(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function showDialog(text) {
  dialog.textContent = text;
  dialog.classList.remove("hidden");
  dialogTimer = 3600;
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
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    showDialog("還差一點。勇氣少 1，但你可以再挑戰其他知識碑。");
  }

  if (state.shards.size >= quizStones.length) {
    state.finished = true;
    showDialog("所有碎片都找回來了。任務完成！");
  }

  activeQuiz = null;
  updateHud();
}

function updateHud() {
  shardsText.textContent = `${state.shards.size} / ${quizStones.length}`;
  heartsText.textContent = state.hearts;

  if (state.finished) {
    questText.textContent = "任務完成！可以把題目改成你的課程內容，變成自己的 RPG 學習活動。";
    progressText.textContent = "完成";
  } else if (!state.started) {
    questText.textContent = "和村口的老師對話，開始今天的探索。";
    progressText.textContent = "開始";
  } else if (state.hearts === 0) {
    questText.textContent = "勇氣用完了，但學習可以重來。按重新開始再挑戰一次。";
    progressText.textContent = "再試一次";
  } else {
    questText.textContent = "探索森林，找出發亮的知識碑並完成挑戰。";
    progressText.textContent = "探索中";
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
