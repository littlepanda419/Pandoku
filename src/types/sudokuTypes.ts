import type { CellValue } from "@hackettyam/sudoku-tools";

// 對齊套件型別：value 使用套件的 CellValue (0 = 空白, 1-9 = 已填入)
export type Cell = {
  row: number;
  col: number;
  value: CellValue;
  isGiven: boolean;
  candidates: number[];
  isInvalid: boolean;
};

export type Board = Cell[][];
