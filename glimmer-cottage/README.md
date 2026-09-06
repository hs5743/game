# 微光小屋：精靈的單字魔法

第一版為原創低多邊形 3D 第一人稱英語探索小品。使用 Godot 4.7.1、GDScript、Compatibility 渲染，完全離線。

## 開始遊玩

開啟上層 `Release` 資料夾，雙擊 `GlimmerCottage.exe`。請讓 `GlimmerCottage.pck` 保持在執行檔旁邊。

若要修改專案，用 Godot 匯入本資料夾的 `project.godot`，按 F6 或 F5 執行。場景、家具、角色和 UI 都由 `game.gd` 在執行時建立，所以編輯器內未執行時只有根節點。

## 操作

| 按鍵 | 功能 |
| --- | --- |
| WASD／方向鍵 | 移動 |
| 滑鼠 | 觀看 |
| E | 與準星指向、3 公尺內的物品互動 |
| H | 逐步提示：翻譯、地點、具體做法 |
| R | 重聽指向的單字；沒有目標時讀目前任務單字 |
| Tab | 開關單字圖鑑；點擊已發現的卡片聽發音 |
| Esc | 暫停、設定與返回 |

沒有跳躍、奔跑、鏡頭晃動、追逐、扣分或限時。視窗失去焦點時自動暫停。

## 內容

- 閱讀角：辨認 book、cup，依序放到魔法盤。
- 水晶工坊：依照任務辨認 red、blue、green、yellow。顏色附帶不同符號。
- 森林壁畫：辨認 cat、bird、apple、flower。
- 完成三枚印記自動取得 key；對 door 按 E，走進花園觸發結尾。
- 新單字操作後收進圖鑑，可重聽 12 個單字的美式英語發音。
- 選錯不清除已完成進度；錯放的杯子會回到原位。
- 完成後可留在花園散步，或回到開始畫面重玩。

## 存檔

每次改變謎題進度、拾取物品、開門及暫停時自動保存。再次開啟選「繼續上次的冒險」。恢復的是謎題、持有物品與圖鑑；人物從小屋入口重新出發。

一般執行時存在 `%APPDATA%/Godot/app_userdata/微光小屋：精靈的單字魔法/`；Godot 可能將名稱中的不合法路徑字元轉換。音量與靈敏度另存於 settings.cfg。重新開始會先要求確認。

## 素材

- 3D 模型、配色、角色露米、介面、音樂和提示音皆在本專案原創製作。
- `audio/*.wav` 單字由本機 Windows Microsoft Zira Desktop 語音產生，供本機離線試玩。
- `tests/create_audio.py` 使用 Python 標準函式庫產生原創背景旋律、鳥鳴與回饋音。
- 中文使用電腦已安裝的 Microsoft JhengHei 系統字體，未複製或散布字型檔。
- 使用寧靜日常奇幻的方向，沒有使用既有動漫角色、美術或配樂。
- Godot 引擎為 MIT 授權：https://godotengine.org/license/

## 驗證

在上層資料夾執行：

```powershell
& '.\Godot_v4.7.1-stable_win64_console.exe' --headless --path '.\GlimmerCottage' -- --smoke-test
```

測試涵蓋 13 個物理射線互動目標、關卡鎖定、錯誤答案、手持物品存檔還原、三組謎題、12 個單字、鑰匙、門與結尾。測試使用獨立 test-progress.json，結束後刪除，不覆蓋玩家存檔。

`--capture` 會以實際渲染輸出小屋、開始畫面、壁畫、圖鑑與花園的截圖，並自動離開。此模式不保存遊戲進度。

第一版採固定題目順序；沒有語音辨識或拼字輸入。遊玩時間依孩子閱讀與探索速度而異，尚未進行兒童使用者測試。

## Windows 打包

使用 `Windows Portable` 預設匯出 PCK。此電腦未安裝正式匯出範本，因此 Release 使用現有 Godot 4.7.1 Windows 引擎執行檔搭配同名 PCK，體積較正式匯出版大，但不需另外安裝 Godot。

