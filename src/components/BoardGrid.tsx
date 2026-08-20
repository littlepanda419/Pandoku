import React, { type CSSProperties } from "react";
import type { Board } from "../types/sudokuTypes";
import type { CompletionRegion } from "../utils/sudokuUtils";
import { BoardCell } from "./BoardCell";

interface BoardGridProps {
  board: Board;
  selectedCell: [number, number] | null;
  highlightNumber: number | null;
  flashRegions: CompletionRegion[];
  onDropValue: (row: number, col: number, val: number) => void;
  onClickCell: (row: number, col: number) => void;
  onRequestClear: (row: number, col: number) => void;
}

// 計算完成動畫疊加層的矩形百分比樣式（row / col / 3x3 box 覆蓋範圍）
function getRegionStyle(reg: CompletionRegion): CSSProperties {
  const span = 100 / 9;
  if (reg.type === "row") {
    return {
      left: 0,
      top: `${reg.index * span}%`,
      width: "100%",
      height: `${span}%`,
    };
  }
  if (reg.type === "col") {
    return {
      left: `${reg.index * span}%`,
      top: 0,
      width: `${span}%`,
      height: "100%",
    };
  }
  return {
    left: `${(reg.index % 3) * 3 * span}%`,
    top: `${Math.floor(reg.index / 3) * 3 * span}%`,
    width: `${3 * span}%`,
    height: `${3 * span}%`,
  };
}

// 9x9 網格（含 BoardCell 專屬與完成動畫疊加層）
export const BoardGrid: React.FC<BoardGridProps> = ({
  board,
  selectedCell,
  highlightNumber,
  flashRegions,
  onDropValue,
  onClickCell,
  onRequestClear,
}) => {
  return (
    <div className="w-full max-w-[min(92vw,26rem)] aspect-square bg-slate-800 dark:bg-slate-950 p-1.5 rounded-2xl shadow-2xl border-4 border-slate-800 dark:border-slate-700 overflow-hidden">
      <div className="relative h-full w-full">
        <div className="grid grid-cols-9 grid-rows-9 h-full w-full bg-slate-300 dark:bg-slate-700">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <BoardCell
                key={`${rIdx}-${cIdx}`}
                cell={cell}
                isSelected={
                  selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx
                }
                highlightNumber={highlightNumber}
                onDropValue={onDropValue}
                onClickCell={onClickCell}
                onRequestClear={onRequestClear}
              />
            )),
          )}
        </div>

        {/* 完成動畫疊加層：每個新完成的 row / col / box 一個獨立矩形邊框，互不衝突、可同時出現；pointer-events-none 不擋格子點擊 */}
        {flashRegions.map((reg) => (
          <div
            key={`${reg.type}-${reg.index}`}
            className={`region-flash region-flash-${reg.type}`}
            style={getRegionStyle(reg)}
          />
        ))}
      </div>
    </div>
  );
};
