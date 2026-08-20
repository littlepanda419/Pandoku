import { useState, useCallback, useEffect, useRef, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  Difficulty,
  type CellValue,
  type DifficultyType,
} from "@hackettyam/sudoku-tools";
import type { Board } from "./types/sudokuTypes";
import {
  createNewGame,
  validateBoard,
  boardFromPuzzle,
  applyAutoDrafts,
  cleanDrafts,
  clearDrafts,
  createDailyPuzzle,
  initAppState,
  persistSavedState,
  clearSavedState,
  getCompletedRegions,
  type CompletionRegion,
} from "./utils/sudokuUtils";
import { formatTime, todayString } from "./utils/format";
import { BoardGrid } from "./components/BoardGrid";
import { NumberPicker } from "./components/NumberPicker";
import { MobileNumpad } from "./components/MobileNumpad";
import { Settings } from "./components/Settings";
import { StatsPanel } from "./components/StatsPanel";
import { Toolbar } from "./components/Toolbar";
import { ActionButtons } from "./components/ActionButtons";
import { Snackbar } from "./components/Snackbar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { SettingsButton } from "./components/SettingsButton";
import { triggerSideConfetti } from "./utils/confetti";
import "./i18n";
import { useTranslation } from "react-i18next";

// App.tsx 只保留「狀態管理 + effect + 事件 handler + 元件組合」；
// 純邏輯（數獨引擎橋接 / 格式化）在 utils/，純展示在 components/。

export default function App() {
  const { t, i18n } = useTranslation();

  // ---- 啟動狀態：有存檔則接續上一局，否則開今日每日挑戰 ----
  const [boot] = useState(() => initAppState(todayString()));
  // 持有整個遊戲（board + SudokuPuzzle 實例）
  const [game, setGame] = useState(() => boot.game);
  const { board, puzzle } = game;
  // 統計資料（對齊套件 getProgress）
  const stats = puzzle.getProgress();

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [difficulty, setDifficulty] = useState<DifficultyType>(Difficulty.Easy);
  const [confirm, setConfirm] = useState<{
    message: string;
    onConfirm: () => void;
    single?: boolean;
  } | null>(null);
  const [autoDraft, setAutoDraft] = useState(false);
  // 手機版底部虛擬鍵盤的「草稿/鉛筆模式」開關（預設關閉＝填正式答案）
  const [draftMode, setDraftMode] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // ---- 計時器 ----
  const [elapsed, setElapsed] = useState(() => boot.elapsed);
  const [gameSolved, setGameSolved] = useState(false);

  // ---- 相同數字高亮 ----
  const [highlightNumber, setHighlightNumber] = useState<number | null>(null);

  // ---- 每日挑戰 ----
  const [isDaily, setIsDaily] = useState(() => boot.isDaily);
  const [dailyCompleted, setDailyCompleted] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dailyCompleted") || "[]");
    } catch {
      return [];
    }
  });

  // ---- 自訂主題色彩 ----
  const [accent, setAccent] = useState(
    () => localStorage.getItem("accent") || "blue",
  );

  // ---- 網格完成動畫（以「區域」為單位：row / col / box 各一獨立疊加層，互不衝突、可同時出現）----
  const [flashRegions, setFlashRegions] = useState<CompletionRegion[]>([]);
  const prevCompleteRef = useRef<Set<string>>(new Set());

  // ---- 深色模式 + 設定面板開合 ----
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 深色模式：更新 localStorage + 切換 <html> 的 dark class
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 語言變更 / 每日挑戰狀態變更時同步 <html> 的 lang 與頁面標題
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = t("app.title");
  }, [i18n.language, t, isDaily]);

  // ---- 計時器：未完成時每秒累加 ----
  useEffect(() => {
    if (gameSolved) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [gameSolved]);

  // elapsed / gameSolved 的 ref：供存檔即時取得最新值，避免 depend on elapsed 觸發每秒存檔
  const elapsedRef = useRef(elapsed);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);
  const gameSolvedRef = useRef(gameSolved);
  useEffect(() => {
    gameSolvedRef.current = gameSolved;
  }, [gameSolved]);

  // ---- 存檔：盤面變動時即時儲存（含已放置數字與草稿） ----
  useEffect(() => {
    if (gameSolvedRef.current) return; // 已通關則不存檔（由通關時清除存檔處理）
    persistSavedState(game.puzzle, game.board, {
      elapsed: elapsedRef.current,
      isDaily,
      autoDraft,
    });
  }, [game, isDaily, autoDraft]);

  // ---- 存檔：關閉網頁（分頁隱藏 / 卸載）時儲存最新狀態；用 ref 持有最新閉包，事件監聽只註冊一次 ----
  const persistOnCloseRef = useRef<() => void>(() => {});
  useEffect(() => {
    persistOnCloseRef.current = () => {
      if (gameSolvedRef.current) return;
      persistSavedState(game.puzzle, game.board, {
        elapsed: elapsedRef.current,
        isDaily,
        autoDraft,
      });
    };
  });
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persistOnCloseRef.current();
    };
    const onUnload = () => persistOnCloseRef.current();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  // ---- 主題色：同步到 localStorage 與 <html data-accent> ----
  useEffect(() => {
    localStorage.setItem("accent", accent);
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  // ---- 網格完成動畫：偵測剛完成的列 / 行 / 3x3 宮格並觸發閃爍 ----
  useEffect(() => {
    const complete = new Set<string>();
    getCompletedRegions(board).forEach((reg) =>
      complete.add(`${reg.type[0]}${reg.index}`),
    );
    const fresh: typeof flashRegions = [];
    complete.forEach((key) => {
      if (prevCompleteRef.current.has(key)) return;
      const type = key[0] === "r" ? "row" : key[0] === "c" ? "col" : "box";
      fresh.push({ type, index: Number(key.slice(1)) });
    });
    prevCompleteRef.current = complete;
    if (fresh.length) setFlashRegions(fresh);
  }, [board]);

  // 閃爍動畫結束後清除
  useEffect(() => {
    if (flashRegions.length === 0) return;
    const timer = setTimeout(() => setFlashRegions([]), 1000);
    return () => clearTimeout(timer);
  }, [flashRegions]);

  // 提示訊息自動消失
  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => setSnackbar(null), 2500);
    return () => clearTimeout(timer);
  }, [snackbar]);

  // ---- 語言切換：透過 i18n.changeLanguage 切換，並記憶到 localStorage ----
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  // ---- 開始每日挑戰：以今天日期為種子，產生固定盤面 ----
  const startDaily = () => {
    const newGame = createDailyPuzzle(todayString());
    if (autoDraft) {
      newGame.board = validateBoard(
        applyAutoDrafts(newGame.puzzle, newGame.board),
      );
    }
    setGame(newGame);
    setIsDaily(true);
    setSelectedCell(null);
    setElapsed(0);
    setGameSolved(false);
    setHighlightNumber(null);
    setFlashRegions([]);
    prevCompleteRef.current = new Set();
  };

  // ---- 初始化新遊戲 ----
  const handleNewGame = useCallback(
    (diff: DifficultyType = difficulty) => {
      const newGame = createNewGame(diff);
      if (autoDraft) {
        newGame.board = validateBoard(
          applyAutoDrafts(newGame.puzzle, newGame.board),
        );
      }
      setGame(newGame);
      setSelectedCell(null);
      setIsDaily(false);
      setElapsed(0);
      setGameSolved(false);
      setHighlightNumber(null);
      setFlashRegions([]);
      prevCompleteRef.current = new Set();
    },
    [difficulty, autoDraft],
  );

  // 選定格 → 選取並顯示草稿輸入；若該格有數字則做全盤相同數字高亮
  const handleSelectCell = (row: number, col: number) => {
    setSelectedCell([row, col]);
    const v = board[row][col].value;
    setHighlightNumber(v !== 0 ? v : null);
  };

  // 依自動草稿狀態重建盤面（填入 / 清除 / 提示後呼叫）
  const rebuildBoard = useCallback((prev: typeof game, on: boolean): Board => {
    const base = boardFromPuzzle(prev.puzzle, prev.board);
    return on ? applyAutoDrafts(prev.puzzle, base) : base;
  }, []);

  // 拖曳 / 點擊放入數字 = 確定填入（使用套件 setCell 作為唯一真理源）
  const handleDropValue = useCallback(
    (row: number, col: number, val: number) => {
      const currentVal = puzzle.current[row][col];
      const newValue = currentVal === val ? 0 : val;
      const success = puzzle.setCell(row, col, newValue as CellValue);
      if (!success) return;
      setGame((prev) => {
        let next = rebuildBoard(prev, autoDraft);
        if (newValue !== 0) next = cleanDrafts(next, row, col, newValue);
        return { ...prev, board: validateBoard(next) };
      });
    },
    [puzzle, autoDraft, rebuildBoard],
  );

  // 草稿邏輯：僅操作 UI board 的 candidates，不觸碰 puzzle 的數值
  const toggleCandidate = useCallback(
    (row: number, col: number, num: number) => {
      setGame((prev) => {
        if (prev.puzzle.readOnly[row][col]) return prev;
        if (prev.puzzle.current[row][col] !== 0) return prev;
        const newBoard = prev.board.map((r) =>
          r.map((c) => ({ ...c, candidates: [...c.candidates] })),
        );
        const cell = newBoard[row][col];
        cell.candidates = cell.candidates.includes(num)
          ? cell.candidates.filter((n) => n !== num)
          : [...cell.candidates, num].sort((a, b) => a - b);
        return { ...prev, board: validateBoard(newBoard) };
      });
    },
    [],
  );

  // 清除指定格子內容（使用套件 setCell 傳 0）
  const clearCell = useCallback(
    (row: number, col: number) => {
      setGame((prev) => {
        if (prev.puzzle.readOnly[row][col]) return prev;
        prev.puzzle.setCell(row, col, 0);
        return { ...prev, board: validateBoard(rebuildBoard(prev, autoDraft)) };
      });
    },
    [autoDraft, rebuildBoard],
  );
  // 手機版底部虛擬鍵盤點選數字：
  // 草稿模式開啟 → 切換該格草稿；關閉 → 填正式答案
  const handleNumPadSelect = useCallback(
    (num: number) => {
      if (!selectedCell) return;
      if (draftMode) {
        toggleCandidate(selectedCell[0], selectedCell[1], num);
      } else {
        handleDropValue(selectedCell[0], selectedCell[1], num);
      }
    },
    [selectedCell, draftMode, toggleCandidate, handleDropValue],
  );
  // 切換自動草稿：開啟時為所有空格計算候選草稿，關閉時清除所有草稿
  const handleToggleAutoDraft = () => {
    const newOn = !autoDraft;
    setAutoDraft(newOn);
    setGame((prev) => {
      let next = rebuildBoard(prev, newOn);
      if (!newOn) next = clearDrafts(next);
      return { ...prev, board: validateBoard(next) };
    });
  };

  // 提示：在所有空格中隨機挑選一個，填入正確答案並跳出通知
  const handleHint = () => {
    const empties: [number, number][] = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (puzzle.current[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) {
      setSnackbar(t("snackbar.noEmptyCells"));
      return;
    }
    const [row, col] = empties[Math.floor(Math.random() * empties.length)];
    const value = puzzle.solution[row][col] as CellValue;
    setGame((prev) => {
      prev.puzzle.setCell(row, col, value);
      const next = cleanDrafts(rebuildBoard(prev, autoDraft), row, col, value);
      return { ...prev, board: validateBoard(next) };
    });
    setSnackbar(t("snackbar.hint", { row: row + 1, col: col + 1, value }));
  };

  // 對答案
  const handleCheckAnswer = () => {
    if (stats.emptyCells > 0) {
      setSnackbar(t("snackbar.notFilled", { count: stats.emptyCells }));
      return;
    }
    if (puzzle.isSolved()) {
      setGameSolved(true);
      clearSavedState();
      // 每日挑戰完成：記錄今日打卡
      if (isDaily) {
        const today = todayString();
        setDailyCompleted((prev) => {
          if (prev.includes(today)) return prev;
          const next = [...prev, today];
          localStorage.setItem("dailyCompleted", JSON.stringify(next));
          return next;
        });
      }
      setConfirm({
        message: t("confirm.success", { time: formatTime(elapsed) }),
        onConfirm: () => {},
        single: true,
      });
      triggerSideConfetti();
    } else {
      setSnackbar(t("snackbar.wrongAnswer"));
    }
  };

  // 右鍵清除確認：若該格已是錯誤狀態則直接清除，否則先詢問
  const handleRequestClear = (row: number, col: number) => {
    if (!board[row][col].value) return;
    if (board[row][col].isInvalid) {
      clearCell(row, col);
      return;
    }
    setConfirm({
      message: t("confirm.clearCell"),
      onConfirm: () => clearCell(row, col),
    });
  };

  // 開新遊戲確認（可指定難度；難度 select 變更與新遊戲按鈕共用）
  const requestNewGame = (diff?: DifficultyType) => {
    setConfirm({
      message: t("confirm.newGame"),
      onConfirm: () => {
        if (diff) setDifficulty(diff);
        handleNewGame(diff);
      },
    });
  };

  // 選定格後鍵盤輸入：1-9 切換候選草稿、Delete/Backspace 清除、Esc 取消選取
  useEffect(() => {
    if (!selectedCell) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (confirm) return; // 確認框開啟時不處理
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, button")) return;
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        toggleCandidate(selectedCell[0], selectedCell[1], Number(e.key));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        clearCell(selectedCell[0], selectedCell[1]);
      } else if (e.key === "Escape") {
        setSelectedCell(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, toggleCandidate, clearCell, confirm]);
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center p-4 pb-48 md:pb-4 md:pr-28">
      <h1 className="text-3xl font-extrabold text-accent my-4">
        {isDaily ? t("app.titleDaily") : t("app.title")}
      </h1>

      {/* 統計資料（getProgress）：置中內文卡片 */}
      <StatsPanel progress={stats.progress} elapsed={elapsed} />

      {/* 控制工具列：難度 + 新遊戲 + 每日挑戰 */}
      <Toolbar
        difficulty={difficulty}
        onSelectDifficulty={requestNewGame}
        onNewGame={() => requestNewGame()}
        onDaily={startDaily}
        todayCompleted={dailyCompleted.includes(todayString())}
      />

      {/* 細分隔線 */}
      <hr className="w-full max-w-[min(92vw,26rem)] border-t border-slate-300 mb-3" />

      {/* 功能按鈕：提示 / 對答案 */}
      <ActionButtons onHint={handleHint} onCheck={handleCheckAnswer} />

      {/* 9x9 網格 + 完成動畫疊加層 */}
      <BoardGrid
        board={board}
        selectedCell={selectedCell}
        highlightNumber={highlightNumber}
        flashRegions={flashRegions}
        onDropValue={handleDropValue}
        onClickCell={handleSelectCell}
        onRequestClear={handleRequestClear}
      />
      {/* 操作提示：桌面版／手機版分開說明 */}
      <div className="w-full max-w-[min(92vw,26rem)] mt-3 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="md:hidden">
          <p>{t("instructions.mobileDraftAndAnswer")}</p>
          <p>{t("instructions.mobileClear")}</p>
        </div>
        <div className="hidden md:block">
          <p>{t("instructions.draft")}</p>
          <p>{t("instructions.answer")}</p>
          <p>{t("instructions.clear")}</p>
        </div>
      </div>

      {/* 數字選擇器：桌面版固定於右側中央（手機版隱藏，改用下方虛擬鍵盤） */}
      <div className="hidden md:block fixed right-3 top-1/2 -translate-y-1/2 z-30">
        <NumberPicker
          onSelectNumber={(num) => {
            if (selectedCell) {
              handleDropValue(selectedCell[0], selectedCell[1], num);
            }
          }}
        />
      </div>

      {/* 手機版：底部固定虛擬數字鍵盤（含鉛筆草稿開關 + 橡皮擦） */}
      <MobileNumpad
        draftMode={draftMode}
        onToggleDraft={() => setDraftMode((d) => !d)}
        onSelectNumber={handleNumPadSelect}
        onErase={() => {
          if (selectedCell) clearCell(selectedCell[0], selectedCell[1]);
        }}
      />

      {/* 提示訊息 (snackbar) */}
      <Snackbar message={snackbar} />

      {/* 設定按鈕：固定於左下角 */}
      <SettingsButton
        isOpen={settingsOpen}
        onToggle={() => setSettingsOpen(!settingsOpen)}
      />

      {/* 設定面板：懸浮於按鈕上方 */}
      <Settings
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        autoDraft={autoDraft}
        onToggleAutoDraft={handleToggleAutoDraft}
        accent={accent}
        onAccentChange={setAccent}
        language={i18n.language}
        onLanguageChange={handleLanguageChange}
        isOpen={settingsOpen}
      />

      {/* 確認對話框 */}
      <ConfirmDialog
        message={confirm?.message ?? null}
        single={confirm?.single}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.onConfirm();
          setConfirm(null);
        }}
      />
    </div>
  );
}

// 應用程式入口：掛載 App 到 #root
// （測試環境沒有 #root 時跳過，避免 import App 時產生副作用掛載）
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
