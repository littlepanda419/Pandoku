# CLAUDE.md — Panda Sudoku (React + TS + Vite)

> Quick-start guide for AI assistants. Keep in sync with the code.

## 📌 Project Snapshot

- **Stack**: React 19 SPA · Vite 8 · TypeScript 6 · Tailwind CSS 4 (PostCSS)
- **Sudoku engine**: [`@hackettyam/sudoku-tools`](https://github.com/hackettyam/sudoku-tools) v1.1 (pure TS)
- **Extra deps**: `react-icons`, `i18next`/`react-i18next`, `canvas-confetti`, Vitest (installed)
- **I18n**: 繁體中文 + English; default zh-TW; persisted in `localStorage`

### Source tree

```
src/
├── App.tsx              # orchestrator: state + effects + handlers + JSX wiring (thin)
├── index.css            # Tailwind + dark-mode variant + theme CSS variables
├── components/
│   ├── BoardCell.tsx     # one 9×9 cell (drag-drop, context-menu, candidates)
│   ├── BoardGrid.tsx     # grid + row/col/box completion-flash overlays
│   ├── NumberPicker.tsx  # fixed right-side 1-9 draggable buttons
│   ├── StatsPanel.tsx    # fixed top-left time + progress
│   ├── Toolbar.tsx       # difficulty select + New Game / Daily
│   ├── ActionButtons.tsx # Hint / Check
│   ├── Snackbar.tsx      # toast
│   ├── ConfirmDialog.tsx # modal (optional cancel)
│   ├── SettingsButton.tsx# gear button
│   └── Settings.tsx      # floating settings panel
├── types/sudokuTypes.ts  # Cell/Board types
├── constants/
│   └── gameInfo.ts       # app metadata: GAME_INFO.VERSION + GAME_INFO.PUBLISHED_DATE
├── i18n/                 # index.ts + zh-TW.ts + en.ts
└── utils/
    ├── sudokuUtils.ts    # engine<->UI bridge + save/restore + region detect
    ├── format.ts         # formatTime(sec), todayString()
    └── confetti.ts       # theme-aware confetti
```

## 🏗️ Architecture

- **Single source of truth**: the `SudokuPuzzle` instance (`current/original/readOnly/solution`).
- Local `Board` (in `types/sudokuTypes.ts`) is a **view model** rebuilt from the puzzle. `Cell.candidates` (drafts) are UI-only.
- **Separation of concerns**: `App.tsx` = orchestrator; `utils/*` = pure logic; `constants/*` = static app metadata (app version / publish date); `components/*` = presentational & stateless.
- **Immutability**: `puzzle.setCell` mutates internally, but `setGame` always gets a fresh object/spread so React re-renders. Rebuild the board after every mutation.

### Data flow

`createNewGame | createDailyPuzzle | restoreGame → SudokuPuzzle → boardFromPuzzle → Board → validateBoard → App state → BoardGrid(BoardCell×81) + picker/toolbar → user action → mutate puzzle → rebuild board → re-render`

## 🧩 Core Logic (`src/utils/sudokuUtils.ts`)

| Function                                                   | Purpose                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| `createNewGame(difficulty)`                                | New puzzle; builds `Board` from `puzzle.original`+`readOnly`. |
| `createDailyPuzzle(dateString)`                            | Deterministic daily puzzle (FNV-1a + mulberry32 seed).        |
| `boardFromPuzzle(puzzle, prevBoard?)`                      | Rebuild `Board` from `puzzle.current`, keep `candidates`.     |
| `applyAutoDrafts(puzzle, board)`                           | Fill candidates on empty cells via `getCandidates`.           |
| `clearDrafts(board)` / `cleanDrafts(board,r,c,v)`          | Clear all / erase peer candidates after placing `v`.          |
| `validateBoard(board)`                                     | Flag duplicates (rows/cols/3×3) as `isInvalid`.               |
| `getCompletedRegions(board)`                               | `CompletionRegion[]` (row/col/box) → completion flash.        |
| `persistSavedState` / `loadSavedState` / `clearSavedState` | localStorage save management (versioned, 9×9 validated).      |
| `restoreGame(save)` / `initAppState(today)`                | Rebuild `SudokuPuzzle` / boot (resume or daily).              |

Also exports `DIFFICULTY_VALUES` and `CompletionRegion`.

**Pattern**: after any `puzzle.setCell`, do `boardFromPuzzle(puzzle, prevBoard)` → (`cleanDrafts`) → `validateBoard`. `setCell` returns `false` for readOnly/given cells.
---

## 🎮 App.tsx — Orchestrator

**State**: `boot` (from `initAppState(todayString())`), `game{board,puzzle}`, `selectedCell`, `difficulty`, `isDaily`, `dailyCompleted[]`, `autoDraft`, `accent`, `darkMode`, `settingsOpen`, `flashRegions[]`, `confirm`, `snackbar`, `elapsed`/`gameSolved`.

**Effects**:

- darkMode → localStorage + `.dark` on `<html>`
- i18n → `<html lang>` + `document.title`
- timer (tick/sec unless solved)
- save-on-change (skip when solved; `elapsedRef`/`gameSolvedRef`)
- save-on-unload (`visibilitychange`/`pagehide`/`beforeunload`)
- flash-detect/clear (`getCompletedRegions`), snackbar-timeout (2.5s)
- keyboard (selected cell): `1-9` draft, `Delete`/`Backspace` clear, `Escape` deselect

**Handlers**: `handleNewGame`, `startDaily`, `handleSelectCell`, `handleDropValue` (same value clears), `toggleCandidate` (empty only), `clearCell`, `handleToggleAutoDraft`, `handleHint`, `handleCheckAnswer` (success→clear save+daily 打卡+confetti), `handleRequestClear`, `requestNewGame`.

**Renders**: `StatsPanel` → `Toolbar` → `ActionButtons` → `BoardGrid` → instructions → `NumberPicker` → `Snackbar` → `SettingsButton`+`Settings` → `ConfirmDialog`.

## 🧱 Components

- **BoardCell**: cell value or 3×3 candidate grid; `ring-inset` styling; drag/drop/context.
- **BoardGrid**: 81 `BoardCell`s + `region-flash` overlays (`pointer-events-none`, absolute).
- **NumberPicker**: draggable 1-9 → `text/plain`.
- **StatsPanel**: uses `formatTime`.
- **Toolbar**: options from `DIFFICULTY_VALUES`.
- **ActionButtons / Snackbar / ConfirmDialog / SettingsButton**: tiny; translate own labels; `ConfirmDialog`/`Snackbar` return `null` when message is null.
- **Settings**: language + dark + accent theme + auto-draft toggle + GitHub link.

## ⚙️ Workflow

```bash
npm install ; npm run dev ; npx tsc --noEmit ; npm run lint ; npm run build ; npm run preview
```

**Conventions**: relative imports (no alias); `import type` for types; `handle*`/`request*` naming; Tailwind `ring-inset` for highlights; comments/UI in Chinese (Traditional) mirrored in `src/i18n/*`. ESLint flat (js/tseslint/react-hooks/react-refresh); `noUnusedLocals/Parameters = false`.

## 🧪 Testing

Vitest + @testing-library installed but unused. Add `*.test.tsx` in `src/`. Good targets: `validateBoard`, `boardFromPuzzle`, `createDailyPuzzle` (determinism), `cleanDrafts`, `getCompletedRegions`, `handleDropValue`, `toggleCandidate`.

## 🐞 Gotchas

- Always `boardFromPuzzle` + `validateBoard` after any `setCell`.
- Don't change the daily PRNG seed (per-date determinism breaks).
- Solved games are cleared from the save so they don't resume.
- Completion flash uses `getCompletedRegions` + `region-flash` CSS (non-interactive overlays).
- Auto-draft is enabled via Settings (not commented out).
- The `createRoot(...)` entry is guarded by `if (rootEl)` so importing `App` in tests doesn't self-mount.
- App version / publish date live in `src/constants/gameInfo.ts` (single source). `Settings` reads `GAME_INFO` — update only that file on a new release.
