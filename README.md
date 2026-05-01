# 知識森林 RPG

一個可直接在瀏覽器執行的 2D 教育 RPG 網頁遊戲原型。學生在知識森林中探索，和 NPC 對話，靠近知識碑答題並收集知識碎片。

## 目前功能

- 2D 地圖探索
- 鍵盤移動與互動
- NPC 對話
- 四個知識挑戰題
- 答對收集碎片
- 發光知識碑、粒子特效與答題回饋動畫
- 像素風森林場景與任務 HUD
- 任務進度、勇氣值與重新開始
- 不需要安裝套件，適合部署到 GitHub Pages

## 操作方式

- 方向鍵或 WASD：移動角色
- 空白鍵：互動
- 靠近發亮的知識碑後按空白鍵：開始答題

## 如何執行

直接用瀏覽器開啟 `index.html`。

若要用本機伺服器預覽，也可以在專案資料夾中執行：

```bash
python -m http.server 8080
```

再開啟 `http://localhost:8080`。

## 如何改成自己的課程

主要題庫在 `game.js` 的 `quizStones` 陣列中。可以修改：

- `question`：題目
- `options`：選項
- `answer`：正確選項的位置，從 0 開始
- `reward`：答對後獲得的碎片名稱

NPC 對話在 `game.js` 的 `npcs` 陣列中。

## 後續可擴充

- 加入多張地圖
- 加入角色選擇
- 加入背包與道具
- 加入老師後台題庫
- 加入多人連線房間
- 部署到 GitHub Pages

## GitHub Pages 部署

把本專案放到 GitHub repository 後，可以到 repository 的 Settings -> Pages，選擇從 `main` 分支的根目錄發布。發布後，`index.html` 會成為遊戲首頁。
