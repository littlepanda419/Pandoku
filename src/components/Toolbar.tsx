import React from "react";
import { useTranslation } from "react-i18next";
import type { DifficultyType } from "@hackettyam/sudoku-tools";
import { DIFFICULTY_VALUES } from "../utils/sudokuUtils";

interface ToolbarProps {
  difficulty: DifficultyType;
  onSelectDifficulty: (diff: DifficultyType) => void;
  onNewGame: () => void;
  onDaily: () => void;
  todayCompleted: boolean;
}

// 頂端控制列：難度選擇 + 新遊戲 / 每日挑戰按鈕
export const Toolbar: React.FC<ToolbarProps> = ({
  difficulty,
  onSelectDifficulty,
  onNewGame,
  onDaily,
  todayCompleted,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-3 mb-3 items-center justify-center">
      <select
        value={difficulty}
        onChange={(e) => onSelectDifficulty(e.target.value as DifficultyType)}
        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {DIFFICULTY_VALUES.map((value) => (
          <option key={value} value={value}>
            {t(`difficulty.${value}`)}
          </option>
        ))}
      </select>

      <button
        onClick={onNewGame}
        className="px-4 py-2 btn-accent text-white font-semibold rounded-lg shadow"
      >
        {t("buttons.newGame")}
      </button>

      <button
        onClick={onDaily}
        className="px-4 py-2 btn-accent text-white font-semibold rounded-lg shadow transition-opacity hover:opacity-90"
      >
        {todayCompleted ? t("buttons.dailyDone") : t("buttons.daily")}
      </button>
    </div>
  );
};
