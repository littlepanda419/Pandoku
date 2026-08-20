import {
  createSudoku,
  Difficulty,
  SudokuPuzzle,
} from "@hackettyam/sudoku-tools";
import type {
  CellValue,
  DifficultyType,
  SudokuPuzzleType,
} from "@hackettyam/sudoku-tools";
import type { Board, Cell } from "../types/sudokuTypes";

// 難度選項：與套件 Difficulty 列舉對齊（顯示標籤透過 i18n 翻譯）
export const DIFFICULTY_VALUES: DifficultyType[] = [
  Difficulty.Novice,
  Difficulty.Easy,
  Difficulty.Normal,
  Difficulty.Hard,
  Difficulty.Expert,
];

// 完成網格的「區域」描邊（row / column / 3x3 box）——完成動畫疊加使用
export type CompletionRegion = {
  type: "row" | "col" | "box";
  index: number;
};

// 偵測所有已填滿的列 / 行 / 3x3 宮格，回傳對應區域清單（純邏輯，供完成動畫偵測重用）
export function getCompletedRegions(board: Board): CompletionRegion[] {
  const complete = new Set<string>();
  for (let i = 0; i < 9; i++) {
    if (board[i].every((c) => c.value !== 0)) complete.add(`r${i}`);
    if (board.map((r) => r[i]).every((c) => c.value !== 0))
      complete.add(`c${i}`);
  }
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    let full = true;
    outer: for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (board[r][c].value === 0) {
          full = false;
          break outer;
        }
    if (full) complete.add(`b${b}`);
  }
  const regions: CompletionRegion[] = [];
  complete.forEach((key) => {
    const type = key[0] === "r" ? "row" : key[0] === "c" ? "col" : "box";
    regions.push({ type, index: Number(key.slice(1)) });
  });
  return regions;
}

// 建立新遊戲盤面（對齊套件：直接使用 DifficultyType / createSudoku）
export function createNewGame(difficulty: DifficultyType = Difficulty.Normal): {
  board: Board;
  puzzle: SudokuPuzzleType;
} {
  const puzzle = createSudoku(difficulty);

  const board: Board = puzzle.original.map((row, rIdx) =>
    row.map((val, cIdx) => ({
      row: rIdx,
      col: cIdx,
      value: val as CellValue,
      isGiven: puzzle.readOnly[rIdx][cIdx],
      candidates: [],
      isInvalid: false,
    })),
  );

  return { board, puzzle };
}

// 從套件 SudokuPuzzle 的 current 盤面重建 Board；
// prevBoard 用於保留各格的草稿 candidates（套件盤面沒有草稿概念）
export function boardFromPuzzle(
  puzzle: SudokuPuzzleType,
  prevBoard?: Board,
): Board {
  return puzzle.current.map((row, rIdx) =>
    row.map((val, cIdx) => ({
      row: rIdx,
      col: cIdx,
      value: val as CellValue,
      isGiven: puzzle.readOnly[rIdx][cIdx],
      candidates: prevBoard ? prevBoard[rIdx][cIdx].candidates : [],
      isInvalid: false,
    })),
  );
}

// 自動草稿：對所有「未填入答案」的格子以套件 getCandidates 填入候選數
export function applyAutoDrafts(puzzle: SudokuPuzzleType, board: Board): Board {
  return board.map((row, rIdx) =>
    row.map((cell, cIdx) => {
      // 給定格或已填答案的格子不顯示草稿
      if (cell.isGiven || cell.value !== 0) {
        return { ...cell, candidates: [] };
      }
      return { ...cell, candidates: puzzle.getCandidates(rIdx, cIdx) };
    }),
  );
}

// 清除所有草稿
export function clearDrafts(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell, candidates: [] })));
}

// 智慧填入：在 (row, col) 填入 value 後，自動移除同行、同列、同 3x3 九宮格內
// 其他格子中該數字的草稿（不影響已確定的數字與給定格）
export function cleanDrafts(
  board: Board,
  row: number,
  col: number,
  value: number,
): Board {
  return board.map((r, rIdx) =>
    r.map((cell, cIdx) => {
      // 只處理空格；給定 / 已填入的格子不動
      if (cell.isGiven || cell.value !== 0) return cell;
      // 放置數字的格子本身不動
      if (rIdx === row && cIdx === col) return cell;

      const sameRow = rIdx === row;
      const sameCol = cIdx === col;
      const sameBox =
        Math.floor(rIdx / 3) === Math.floor(row / 3) &&
        Math.floor(cIdx / 3) === Math.floor(col / 3);

      if (sameRow || sameCol || sameBox) {
        if (cell.candidates.includes(value)) {
          return {
            ...cell,
            candidates: cell.candidates.filter((n) => n !== value),
          };
        }
      }
      return cell;
    }),
  );
}

// 每日挑戰：以日期字串（YYYY-MM-DD）作為種子，產生當天固定的同一盤數獨。
// 作法：暫時以可重現的 PRNG 覆寫 Math.random（套件內部依賴 Math.random 產生亂數），
// 產生後於 finally 還原，確保每天全世界玩家拿到同一盤。
export function createDailyPuzzle(dateString: string): {
  board: Board;
  puzzle: SudokuPuzzleType;
} {
  // FNV-1a 雜湊：把日期字串轉成 32-bit 種子
  let seed = 2166136261 >>> 0;
  for (let i = 0; i < dateString.length; i++) {
    seed ^= dateString.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }

  // mulberry32 PRNG
  const rng = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const originalRandom = Math.random;
  Math.random = rng;
  let puzzle: SudokuPuzzleType;
  try {
    puzzle = createSudoku(Difficulty.Easy);
  } finally {
    Math.random = originalRandom;
  }

  // 與 createNewGame 相同方式建立初始 Board
  const board: Board = puzzle.original.map((row, rIdx) =>
    row.map((val, cIdx) => ({
      row: rIdx,
      col: cIdx,
      value: val as CellValue,
      isGiven: puzzle.readOnly[rIdx][cIdx],
      candidates: [],
      isInvalid: false,
    })),
  );
  return { board, puzzle };
}

// 檢查重複數字並標示衝突 (同行、同列、同 3x3 九宮格)
// 只標示「自身數值重複」的格子，避免整行/列/宮格一起亮起
export function validateBoard(board: Board): Board {
  // 深拷貝盤面並預設清除衝突標記
  const newBoard: Board = board.map((row) =>
    row.map((cell) => ({ ...cell, isInvalid: false })),
  );

  // 檢查重複區域的輔助函式
  const checkDuplicates = (cells: Cell[]) => {
    const counts: { [key: number]: Cell[] } = {};
    cells.forEach((cell) => {
      if (cell.value !== 0) {
        if (!counts[cell.value]) counts[cell.value] = [];
        counts[cell.value].push(cell);
      }
    });

    // 只要有同值重複超過 1 個，全部標示為衝突狀態
    Object.values(counts).forEach((group) => {
      if (group.length > 1) {
        group.forEach((c) => {
          newBoard[c.row][c.col].isInvalid = true;
        });
      }
    });
  };

  // 1. 檢查每行 (Row) 與每列 (Col)
  for (let i = 0; i < 9; i++) {
    const rowCells = newBoard[i];
    const colCells = newBoard.map((row) => row[i]);
    checkDuplicates(rowCells);
    checkDuplicates(colCells);
  }

  // 2. 檢查 3x3 九宮格 (Box)
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxCells: Cell[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          boxCells.push(newBoard[boxRow * 3 + r][boxCol * 3 + c]);
        }
      }
      checkDuplicates(boxCells);
    }
  }

  return newBoard;
}

// ===== 儲存 & 接續挑戰 (Save & Continue) =====

const SAVE_KEY = "sudoku-save";
const SAVE_VERSION = 1;

// 存檔資料結構：完整保存可重建一局所需的所有資訊
export interface SavedState {
  version: number;
  current: CellValue[][]; // 玩家進度（已放置數字）
  original: CellValue[][]; // 原始給定盤面（用於重建 readOnly / original）
  solution: CellValue[][]; // 解答（isSolved / getHint 比對用）
  difficulty: DifficultyType;
  candidates: number[][][]; // 各格草稿候選數
  elapsed: number; // 已花費秒數
  isDaily: boolean; // 是否為每日挑戰
  autoDraft: boolean; // 自動草稿開關狀態
}

// 從當前遊戲狀態序列化並寫入 localStorage
export function persistSavedState(
  puzzle: SudokuPuzzleType,
  board: Board,
  opts: { elapsed: number; isDaily: boolean; autoDraft: boolean },
): void {
  try {
    const state: SavedState = {
      version: SAVE_VERSION,
      current: puzzle.current.map((r) => r.slice()) as CellValue[][],
      original: puzzle.original.map((r) => r.slice()) as CellValue[][],
      solution: puzzle.solution.map((r) => r.slice()) as CellValue[][],
      difficulty: puzzle.difficulty,
      candidates: board.map((r) => r.map((c) => c.candidates.slice())),
      elapsed: opts.elapsed,
      isDaily: opts.isDaily,
      autoDraft: opts.autoDraft,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // 寫入失敗（隱私模式 / 空間不足 / 配額超用）時靜默忽略
  }
}

// 讀取存檔；無存檔或格式 / 版本不符回 null
export function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedState;
    if (!data || data.version !== SAVE_VERSION) return null;
    if (!Array.isArray(data.current) || data.current.length !== 9) return null;
    if (!Array.isArray(data.original) || data.original.length !== 9)
      return null;
    if (!Array.isArray(data.solution) || data.solution.length !== 9)
      return null;
    if (!Array.isArray(data.candidates) || data.candidates.length !== 9)
      return null;
    return data;
  } catch {
    return null;
  }
}

// 清除存檔
export function clearSavedState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // 忽略清除失敗
  }
}

// 從存檔重建 { board, puzzle }；puzzle 使用套件真正的 SudokuPuzzle 類別，
// 保留 setCell / getProgress / isSolved / getCandidates / getHint 等所有方法。
// 作法：以 original 重建實例（constructor 會據此推導 readOnly / original / solution），
// 再把 current 覆寫為玩家進度。
export function restoreGame(save: SavedState): {
  board: Board;
  puzzle: SudokuPuzzleType;
} {
  const puzzle = new SudokuPuzzle({
    board: save.original,
    difficulty: save.difficulty,
    solved: save.solution,
  });
  // 覆寫為玩家進度（constructor 會把 current 設為 original 的複本，需覆蓋回進度）
  puzzle.current = save.current.map((r) => r.slice()) as CellValue[][];

  const board: Board = save.current.map((row, rIdx) =>
    row.map((val, cIdx): Cell => ({
      row: rIdx,
      col: cIdx,
      value: val as CellValue,
      isGiven: puzzle.readOnly[rIdx][cIdx],
      candidates: save.candidates[rIdx]?.[cIdx]?.slice() ?? [],
      isInvalid: false,
    })),
  );
  return { board: validateBoard(board), puzzle };
}

// 啟動時決定初始遊戲狀態：有可接續存檔（且尚未通關）→ 接續；否則開今日每日挑戰
export function initAppState(today: string): {
  game: { board: Board; puzzle: SudokuPuzzleType };
  elapsed: number;
  isDaily: boolean;
} {
  const saved = loadSavedState();
  if (saved) {
    try {
      const restored = restoreGame(saved);
      // 已通關的存檔不接續，改為開新每日挑戰
      if (!restored.puzzle.isSolved()) {
        return {
          game: restored,
          elapsed: typeof saved.elapsed === "number" ? saved.elapsed : 0,
          isDaily: saved.isDaily === true,
        };
      }
    } catch {
      // 損毀的存檔忽略，落入下方開新遊戲
    }
    clearSavedState();
  }
  return { game: createDailyPuzzle(today), elapsed: 0, isDaily: true };
}
