# 🐼 Panda Sudoku 熊貓數獨

> 一款可完全離線遊玩的網頁數獨（React + TypeScript + Vite）。支援繁體中文／英文、深色模式、六種主題配色，與每日挑戰。

---

## 🎮 遊戲介紹（給玩家）

數獨是風行全球的邏輯填數字遊戲，在一張 **9 × 9** 的格子盤上，空格被分成 **9 個 3 × 3 的小九宮格**。目標是填入 **1～9**，讓每一「列」、每一「行」與每一「小宮格」**都不重複**地各含 1～9。看似規則簡單，但越到後面越燒腦——正是它的樂趣所在！

### 怎麼玩？

1. **選難度**：從「入門」到「專家」五種等級，等級越高，預先填好的格子越少、越困難。
2. **填數字**：點選一個空格後，再點右側的數字面板，或把右側數字**直接拖曳**到格子裡。也可以用鍵盤：選中格子後按 `1-9` 填入。
3. **用草稿記筆記**：每格都能記錄「可能的候選數字」。點空格後直接按 `1-9` 切換草稿（小字體顯示），是縮小範圍解題的關鍵工具。開啟「自動草稿」後系統會自動幫你列出每格的候選，填入一個數字時還會自動清除同行／同列／同宮內相同數字的候選。

## 🛠️ 技術說明（給開發者）

這是一個乾淨、型別安全的 SPA，核心數獨邏輯由 [`@hackettyam/sudoku-tools`](https://github.com/hackettyam/sudoku-tools) 提供，前端負責呈現與互動。

### 技術棧

| 層級     | 技術                                                                   |
| -------- | ---------------------------------------------------------------------- |
| 語言     | TypeScript 6（嚴格）（tsconfig 拆分 app / node）                       |
| UI       | React 19 + Tailwind CSS 4（PostCSS）                                   |
| 建置     | Vite 8（`react()` 外掛）                                               |
| 數獨引擎 | `@hackettyam/sudoku-tools` v1.1（零依賴、純 TS）                       |
| 國際化   | `i18next` + `react-i18next`（zh-TW / en）                              |
| 特效     | `canvas-confetti`（通關彩帶）                                          |
| 品質     | ESLint 10（flat config）+ TypeScript；Vitest + @testing-library 已安裝 |

### 架構（三層職責分離）

- **`App.tsx`（協調器）**：只負責狀態管理、`useEffect`、事件 handler，以及把展示元件組合在一起，沒有厚重的內嵌 DOM。
- **`src/utils/`（純邏輯）**：
  - `sudokuUtils.ts` — 引擎與 UI 之間的橋接、盤面重建／驗證、每日種子、localStorage 存檔與還原、完成區域偵測。
  - `format.ts` — `formatTime()`、`todayString()` 等純函式。
  - `confetti.ts` — 主題感知的彩帶特效。
- **`src/components/`（純展示）**：`BoardCell`、`BoardGrid`（含列／行／宮完成閃爍疊加層）、`NumberPicker`、`StatsPanel`、`Toolbar`、`ActionButtons`、`Snackbar`、`ConfirmDialog`、`SettingsButton`、`Settings`——全部**無狀態**，只接收 props 與 callback。
- **`src/constants/`（元資料）**：`gameInfo.ts` 集中管理版本號與發布日期（`GAME_INFO.VERSION` / `GAME_INFO.PUBLISHED_DATE`），`Settings` 面板底部據此顯示。

### 資料流

```
createNewGame | createDailyPuzzle  →  SudokuPuzzle（唯一真理源）
        → boardFromPuzzle → validateBoard（標記衝突）
        → App 狀態 → BoardGrid（81 格）＋ 工具列／數字面板
        → 玩家操作 → 變更 puzzle → 重建盤面 → 重新渲染
```

### 重點機制

- **自動草稿與智慧清除**：開啟自動草稿時以 `puzzle.getCandidates` 預填候選；每填一個數字會用 `cleanDrafts` 移除同行／同列／同宮相同候選。
- **每日挑戰種子**：`createDailyPuzzle(todayString())` 以日期當種子（FNV-1a + mulberry32），使當天盤面對全世界一致且可重現。
- **自動存檔**：盤面每次變動與關閉網頁時都會寫入 `localStorage`；已通關的存檔會被清除，避免接續已完成的盤面。
- **主題與深色模式**：配色寫在 `src/index.css` 的 CSS 變數（`--accent-*`、`--ui-*`），透過 `<html data-accent>` 與 `.dark` class 切換；`canvas-confetti` 會讀這些變數讓彩帶跟隨主題。
- **完成動畫**：`getCompletedRegions` 偵測剛完成的列／行／宮，配上 `index.css` 的 `region-flash` 系列關鍵影格產生閃爍。
- **版本資訊**：版本號與發布日期集中在 `src/constants/gameInfo.ts`（`GAME_INFO`），`Settings` 面板底部顯示；發布新版時只需更新該檔。

### 本地開發

```bash
npm install      # 安裝相依套件
npm run dev      # 啟動開發伺服器（HMR）
npx tsc --noEmit # 型別檢查
npm run lint     # 程式碼風格檢查
npm run build    # 型別檢查 + 生產建置
npm run preview  # 預覽生產版本
```

### 給貢獻者的建議

- 新增功能時依循「邏輯放 `utils/`、元資料放 `constants/`、呈現放 `components/`、狀態／流程放 `App.tsx`」的原則。
- 修改任何盤面後務必 `boardFromPuzzle(...)` ＋ `validateBoard(...)` 重建並驗證。
- 新增 UI 文案請同步更新 `src/i18n/zh-TW.ts` 與 `src/i18n/en.ts`；新增主題只需在 `src/index.css` 加一組 `[data-accent="..."]` 變數，並在 `Settings` 的 `THEMES` 與 i18n 加上對應名稱。
- 更詳細的架構與慣例請見 [`CLAUDE.md`](./CLAUDE.md)。

4. **清除錯誤**：**右鍵**格子即可清除內容；若格子有衝突會以紅色標示，右鍵可直接快速清除。
5. **卡關了**：按「💡 提示」會幫你在某個空格填入正確答案；隨時可「對答案」檢查是否已全對。
6. **通關**：全部填對時會有繽紛彩帶與完成動畫，為你慶祝！

### 特色功能

- 🗓️ **每日挑戰**：每天全世界玩家拿到同一盤固定數獨，適合與朋友比拼，完成後會自動打卡。
- 💾 **自動存檔**：進度即時儲存在瀏覽器，關掉網頁再回來也能接續上次的盤面。
- 🌗 **深色模式**與 🎨 **六種主題配色**（經典藍、森林綠、櫻花粉、陽光黃、活力橘、極簡黑白），樣式任你挑。
- 🌐 **雙語介面**：繁體中文與 English 可即時切換。
- 善用**相同數字高亮**：點選一個已填數字時，全盤相同數字與其候選會一起亮起，方便找衝突。

---
