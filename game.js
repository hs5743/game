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
const namePrompt = document.querySelector("#namePrompt");
const nameForm = document.querySelector("#nameForm");
const playerNameInput = document.querySelector("#playerNameInput");
const playerNameLabel = document.querySelector("#playerNameLabel");
const virtueProgress = document.querySelector("#virtueProgress");
const emotionProgress = document.querySelector("#emotionProgress");
const lessonText = document.querySelector("#lessonText");
const collectionSummary = document.querySelector("#collectionSummary");

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

const scenarioQuestions = {
  1: {
    question: "午休時你看到同學的鉛筆盒掉出一張點數卡，沒有人發現。最符合 Honesty 誠實 的做法是什麼？",
    options: ["交還給同學或老師，說明在哪裡撿到", "先收起來，等同學問再說", "拿去跟別人交換貼紙"]
  },
  2: {
    question: "小組討論時，你和同學想法不同。最能表現 Respect 尊重 的回應是什麼？",
    options: ["先聽完對方想法，再說出自己的理由", "直接說對方一定錯了", "不理同學，自己完成全部內容"]
  },
  3: {
    question: "你負責帶海報紙，卻忘記放進書包。最符合 Responsibility 責任 的做法是什麼？",
    options: ["主動告訴組員並想補救辦法", "假裝不是自己的工作", "怪家人沒有提醒你"]
  },
  4: {
    question: "班上要設計品格標語，大家的句子都很像。你可以怎麼展現 Creativity 創造？",
    options: ["加入新的圖像、比喻或表演方式", "照抄網路上的標語", "放棄討論，說都一樣"]
  },
  5: {
    question: "老師邀請你上台分享，但你有點害怕。最接近 Courage 勇氣 的選擇是什麼？",
    options: ["深呼吸後嘗試分享一小段", "立刻說自己一定不行", "笑別人上台緊張"]
  },
  6: {
    question: "小組要完成任務，有人畫圖、有人查資料。最能表現 Cooperation 合作 的行動是什麼？",
    options: ["確認分工並互相支援", "只做自己喜歡的部分", "把工作全部丟給一個人"]
  },
  7: {
    question: "你練習英文句子好幾次都唸不順。最符合 Patience 耐心 的做法是什麼？",
    options: ["分成短句慢慢練，再請同學聽一次", "馬上把書闔起來", "說這個單字太難不用學"]
  },
  8: {
    question: "同學幫你整理掉在地上的學用品。最能表現 Gratitude 感恩 的回應是什麼？",
    options: ["真誠說謝謝，也找機會幫助別人", "覺得這是同學應該做的", "一句話都不說直接離開"]
  },
  9: {
    question: "你想玩遊戲，但今天還有閱讀任務。最符合 Self-discipline 自律 的安排是什麼？",
    options: ["先完成約定的閱讀，再安排休息時間", "一直玩到睡前", "把任務藏起來說忘了"]
  },
  10: {
    question: "比賽輸了，隊友都很失落。最能展現 Optimism 樂觀 的說法是什麼？",
    options: ["我們找到可以進步的地方，下次再試", "我們永遠都不會成功", "都是別人的錯"]
  },
  11: {
    question: "你發現朋友今天很安靜，好像不太開心。最接近 Caring 關懷 的行動是什麼？",
    options: ["溫和詢問需不需要陪伴或幫忙", "大聲逼他說原因", "當作沒看見"]
  },
  12: {
    question: "你種的植物一直沒有發芽。最能表現 Grit 恆毅 的做法是什麼？",
    options: ["查原因、調整方法並持續照顧", "立刻把盆栽丟掉", "說植物故意不長"]
  },
  13: {
    question: "你完成作品並得到同學鼓勵，心裡亮亮的、想微笑。這種感受最接近哪個英文？",
    options: ["Happy", "Angry", "Disappointed"]
  },
  14: {
    question: "有人插隊，讓你心裡熱熱的、眉頭皺起來。你可能感到哪個情緒？",
    options: ["Angry", "Relaxed", "Touched"]
  },
  15: {
    question: "好朋友轉學了，你想念他，心裡沉沉的。這種感受是什麼？",
    options: ["Sad", "Excited", "Proud"]
  },
  16: {
    question: "第一次進黑暗的表演後台，你心跳變快、想靠近老師。你可能感到什麼？",
    options: ["Scared", "Happy", "Gratitude"]
  },
  17: {
    question: "老師突然宣布你的作品被選上展覽，你睜大眼睛說：真的嗎？這是什麼感受？",
    options: ["Surprised", "Shy", "Grit"]
  },
  18: {
    question: "上台前你的手心冒汗，一直擔心會忘詞。這種情緒最接近哪個英文？",
    options: ["Nervous", "Relaxed", "Caring"]
  },
  19: {
    question: "明天要校外教學，你期待到睡前還一直想像行程。你可能感到什麼？",
    options: ["Excited", "Sad", "Scared"]
  },
  20: {
    question: "大家稱讚你的畫，你低下頭、小聲說謝謝，臉有點紅。這比較像哪個情緒？",
    options: ["Shy", "Angry", "Responsibility"]
  },
  21: {
    question: "你在樹下慢慢呼吸，覺得身體鬆下來、心也安靜。這是什麼感受？",
    options: ["Relaxed", "Nervous", "Disappointed"]
  },
  22: {
    question: "你努力練習後終於完成朗讀，心裡覺得：我做到了！這是什麼感受？",
    options: ["Proud", "Scared", "Sad"]
  },
  23: {
    question: "你期待被選進隊伍，但這次沒有成功，心裡有點落空。這種感受是什麼？",
    options: ["Disappointed", "Happy", "Surprised"]
  },
  24: {
    question: "同學悄悄幫你準備生日卡，你覺得心裡暖暖的、很想說謝謝。這是什麼感受？",
    options: ["Touched", "Angry", "Nervous"]
  }
};

const practiceMissions = {
  1: "今天找一個時刻練習說實話：可以是承認忘了帶東西，也可以是誠實說出自己的想法。",
  2: "今天和同學意見不同時，先用一句話重述對方的想法，再說自己的看法。",
  3: "挑一件你負責的事，寫下完成時間，完成後自己打勾。",
  4: "把一個普通答案改成更有創意的版本：加上圖像、動作、比喻或新的說法。",
  5: "選一件有點害怕但安全的事，先做一小步，例如舉手說一句話。",
  6: "在小組任務中主動問：我可以幫哪一部分？",
  7: "遇到卡住的題目時，先停十秒，再把它分成更小的步驟。",
  8: "向今天幫助你的人說出具體感謝：謝謝你幫我做了什麼。",
  9: "先完成一個小任務，再給自己五分鐘休息，練習安排順序。",
  10: "把一件不順利的事改寫成：我下一次可以嘗試什麼？",
  11: "觀察一位同學的需要，用不打擾的方式給一句關心或一個幫忙。",
  12: "選一件需要練習的事，記錄今天比昨天多努力的一小步。",
  13: "把開心的原因說清楚：我感到 happy，因為......",
  14: "生氣時先做三次慢呼吸，再說：我需要......",
  15: "傷心時找一個可信任的人說：我現在有點 sad，因為......",
  16: "害怕時說出你擔心的事，再找一個可以幫助自己的安全方法。",
  17: "驚訝時先觀察發生什麼，再用一句話描述：I am surprised because......",
  18: "緊張時把手放在胸口，慢慢吸氣吐氣各三次。",
  19: "興奮時把能量用在準備上：列出一件你可以先做好的事。",
  20: "害羞時不用逼自己一次說很多，先練習微笑或說一句 hello。",
  21: "找一分鐘安靜時間，放鬆肩膀，觀察自己的呼吸。",
  22: "完成一件努力過的事後，對自己說：I am proud because......",
  23: "失望時寫下：我原本期待......，下一步我可以......",
  24: "被感動時把溫暖傳出去：寫一句感謝或鼓勵給別人。"
};

function makeQuestion(card) {
  const scenario = scenarioQuestions[card.id];
  return {
    id: `card_${card.id}`,
    cardId: card.id,
    question: scenario.question,
    options: scenario.options,
    answer: 0,
    reward: `${card.role}加入你的字卡圖鑑`,
    explanation: `這張卡是 ${card.zh} / ${card.en}。${card.role}提醒你：${card.clue}`,
    practice: practiceMissions[card.id]
  };
}

const quizBank = cards.map((card) => makeQuestion(card));

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
      { id: "mayor", x: 11, y: 7, color: "#f97316", name: "村長", lines: ["{player}，歡迎來到雙語字卡學習村！", "收集 12 張品格字卡與 12 張情緒字卡，這座村莊就會越來越明亮。"] }
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
      { id: "teacher", x: 11, y: 4, color: "#7f5af0", name: "雙語老師", lines: ["{player}，品格詞彙不只是背單字。", "想一想：你今天在哪裡用到了勇氣、合作或感恩？"] }
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
      { id: "librarian", x: 11, y: 8, color: "#38bdf8", name: "字卡館員", lines: ["{player}，每張字卡都是一個角色，也是一個可以練習的生活能力。", "完成挑戰後，右側圖鑑會亮起來。"] }
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
      { id: "counselor", x: 11, y: 8, color: "#ec4899", name: "心情引導員", lines: ["{player}，情緒沒有好壞，它們都在告訴我們一些事情。", "先說出感受，再想下一步怎麼照顧自己。"] }
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
      { id: "ranger", x: 11, y: 5, color: "#22c55e", name: "森林守望者", lines: ["{player}，森林裡的聲音很多，有時會讓人驚訝或緊張。", "慢慢呼吸，觀察眼前發生了什麼。"] }
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
      { id: "pondGuide", x: 15, y: 9, color: "#14b8a6", name: "池畔夥伴", lines: ["{player}，有些心情需要安靜一點才聽得見。", "失望時可以再試一次，自豪時也可以好好肯定自己。"] }
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
      { id: "farmer", x: 11, y: 8, color: "#eab308", name: "農場老師", lines: ["{player}，這裡暫時沒有新字卡，之後可以加任務、道具、種植與商店。", "先把 24 張字卡主線完成，就是第一個可玩的章節。"] }
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
let playerName = localStorage.getItem("eduRpgPlayerName") || "";
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
    locked: !playerName,
    lastLesson: ""
  };
}

function currentMap() {
  return worldMaps[currentMapId];
}

function resetGame() {
  state = freshState();
  state.locked = !playerName;
  changeMap("villageCenter", worldMaps.villageCenter.spawn, false);
  activeQuiz = null;
  particles = [];
  floatingTexts = [];
  screenFlash = 0;
  hideDialog();
  quizPanel.classList.add("hidden");
  namePrompt.classList.toggle("hidden", Boolean(playerName));
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
  if (announce) showDialog(`來到「${currentMap().title}」。${currentMap().hint}`, "系統");
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
    showDialog(`前方是「${exit.label}」，直接走上發光格就會換地圖。`, "系統");
    return;
  }

  const nearNpc = currentMap().npcs.find((npc) => distanceTiles(player, npc) <= 1.4 || (npc.x === target.x && npc.y === target.y));
  if (nearNpc) {
    state.started = true;
    showDialog(nearNpc.lines.map(formatLine).join(" "), nearNpc.name);
    addFloatingText("對話", nearNpc.x * TILE + 20, nearNpc.y * TILE, "#ffdc7b");
    updateHud();
    return;
  }

  const stone = currentMap().quizzes.find((item) => !state.collected.has(item.cardId) && (distanceTiles(player, item) <= 1.35 || (item.x === target.x && item.y === target.y)));
  if (stone) {
    openQuiz(stone);
    return;
  }

  showDialog("附近沒有可互動的對象。靠近 NPC、發光字卡或出口再試試。", "系統");
}

function distanceTiles(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatLine(text) {
  return String(text).replaceAll("{player}", playerName || "冒險者");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showDialog(text, speaker = "") {
  const safeSpeaker = speaker ? escapeHtml(speaker) : "";
  const safeText = escapeHtml(formatLine(text));
  dialog.innerHTML = safeSpeaker ? `<strong>${safeSpeaker}</strong><span>${safeText}</span>` : `<span>${safeText}</span>`;
  dialog.classList.remove("hidden");
  dialogTimer = 6200;
}

function hideDialog() {
  dialog.classList.add("hidden");
  dialog.innerHTML = "";
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
    state.lastLesson = `${card.zh} / ${card.en}：${activeQuiz.practice}`;
    lastPreviewId = activeQuiz.cardId;
    showDialog(`答對了，${playerName || "冒險者"}！${activeQuiz.reward}。${activeQuiz.explanation} 生活任務：${activeQuiz.practice}`, card.role);
    burst(activeQuiz.x * TILE + 20, activeQuiz.y * TILE + 20, "#ffdc7b", 34);
    addFloatingText(`+ ${card.en}`, activeQuiz.x * TILE + 20, activeQuiz.y * TILE - 2, "#ffdc7b");
    screenFlash = 0.22;
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    state.lastLesson = `${card.zh} / ${card.en}：先回到情境，想想哪個選項最能照顧自己或幫助別人。`;
    showDialog(`再想想看，${playerName || "冒險者"}。${card.role}提示：${card.clue}`, card.role);
    burst(player.px, player.py, "#ff6b6b", 18);
    addFloatingText("再試一次", player.px, player.py - 16, "#ffb4a8");
  }

  if (state.collected.size >= totalQuizCount) {
    state.finished = true;
    showDialog(`恭喜 ${playerName || "冒險者"}！24 張雙語字卡都收集完成，學習村的第一章完成了。`, "村長");
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
  const virtueCount = cards.filter((card) => card.type === "正向品格" && state.collected.has(card.id)).length;
  const emotionCount = cards.filter((card) => card.type === "情緒詞彙" && state.collected.has(card.id)).length;
  playerNameLabel.textContent = playerName || "冒險者";
  shardsText.textContent = `${state.collected.size} / ${totalQuizCount}`;
  collectionSummary.textContent = `${state.collected.size} / ${totalQuizCount}`;
  virtueProgress.textContent = `${virtueCount} / 12`;
  emotionProgress.textContent = `${emotionCount} / 12`;
  heartsText.textContent = state.hearts;
  chapterLabel.textContent = map.chapter;
  placeTitle.textContent = map.title;
  toast.textContent = map.hint;
  progressText.textContent = map.title;
  updateCardPreview(lastPreviewId, state.collected.has(lastPreviewId) ? "已收集。點圖鑑可查看其他字卡。" : undefined);
  lessonText.textContent = state.lastLesson || "完成字卡挑戰後，這裡會留下可以在生活中練習的小任務。";

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

document.querySelectorAll("[data-touch-key]").forEach((button) => {
  const key = button.dataset.touchKey;
  const press = (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    keys.add(key);
    button.classList.add("pressed");
  };
  const release = (event) => {
    event.preventDefault();
    keys.delete(key);
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", () => {
    keys.delete(key);
    button.classList.remove("pressed");
  });
});

document.querySelectorAll("[data-touch-action='interact']").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.classList.add("pressed");
    interact();
  });
  const release = () => button.classList.remove("pressed");
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

restartButton.addEventListener("click", resetGame);

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const typedName = playerNameInput.value.trim().slice(0, 12);
  playerName = typedName || "冒險者";
  localStorage.setItem("eduRpgPlayerName", playerName);
  namePrompt.classList.add("hidden");
  state.locked = false;
  updateHud();
  showDialog(`${playerName}，歡迎來到雙語字卡學習村。先找村長對話，開始收集 24 張字卡。`, "系統");
});

buildCollectionGrid();
updateHud();
namePrompt.classList.toggle("hidden", Boolean(playerName));
if (playerName) {
  state.locked = false;
  showDialog(`${playerName}，歡迎回到雙語字卡學習村。找村長對話，開始收集 24 張字卡。`, "系統");
} else {
  playerNameInput.focus();
}
requestAnimationFrame(loop);
