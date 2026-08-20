import React, { useState } from "react";
import type { Cell } from "../types/sudokuTypes";

interface BoardCellProps {
  cell: Cell;
  isSelected: boolean;
  highlightNumber: number | null;
  onDropValue: (row: number, col: number, val: number) => void;
  onClickCell: (row: number, col: number) => void;
  onRequestClear: (row: number, col: number) => void;
}

export const BoardCell: React.FC<BoardCellProps> = ({
  cell,
  isSelected,
  highlightNumber,
  onDropValue,
  onClickCell,
  onRequestClear,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // 右鍵 → 請求清除此格
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cell.isGiven) onRequestClear(cell.row, cell.col);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!cell.isGiven) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (cell.isGiven) return;

    const valStr = e.dataTransfer.getData("text/plain");
    if (valStr) {
      onDropValue(cell.row, cell.col, Number(valStr));
    }
  };

  // 樣式運算
  // 選取/衝突/拖曳狀態使用 ring-inset，不會改變盒模型尺寸，避免打亂 9x9 網格對齊
  const getCellStyles = () => {
    if (cell.isInvalid) {
      if (cell.isGiven) {
        // 題目固定格衝突：彩色主題顯示紅框紅字，mono 主題由 CSS 自動轉為深黑/純白框
        return "bg-slate-200 dark:bg-slate-700 font-bold ring-2 ring-inset cell-given-invalid cursor-not-allowed";
      }
      // 玩家填入格衝突：採用滿版衝突底色 + 粗框 (黑白主題下會對應黑框)
      return "cell-invalid font-bold ring-2 ring-inset";
    }

    if (cell.isGiven)
      return "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-not-allowed";
    if (isDragOver) return "cell-dragover ring-2 ring-inset";
    if (isSelected) return "cell-is-selected ring-2 ring-inset";
    return "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-accent font-semibold";
  };

  // 相同數字高亮：當點擊的格子是某個數字時，全盤相同數字與其草稿一起亮起
  const isHighlighted =
    highlightNumber !== null &&
    (cell.value === highlightNumber ||
      cell.candidates.includes(highlightNumber));

  // 3x3 加粗外框
  const borderRight =
    (cell.col + 1) % 3 === 0 && cell.col !== 8
      ? "border-r-2 border-r-slate-800 dark:border-r-slate-600"
      : "border-r border-r-slate-300 dark:border-r-slate-600";
  const borderBottom =
    (cell.row + 1) % 3 === 0 && cell.row !== 8
      ? "border-b-2 border-b-slate-800 dark:border-b-slate-600"
      : "border-b border-b-slate-300 dark:border-b-slate-600";

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onClickCell(cell.row, cell.col)}
      onContextMenu={handleContextMenu}
      className={`w-full h-full flex items-center justify-center relative select-none cursor-pointer transition-colors box-border ${borderRight} ${borderBottom} ${getCellStyles()} ${
        isHighlighted ? "cell-highlight" : ""
      }`}
    >
      {cell.value ? (
        <span className="text-lg sm:text-xl md:text-2xl">{cell.value}</span>
      ) : (
        /* 草稿標記區 */
        <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5 text-[8px] sm:text-[10px] leading-none text-slate-400 pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <span key={num} className="flex items-center justify-center">
              {cell.candidates.includes(num) ? num : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
