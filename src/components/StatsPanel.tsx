import React from "react";
import { useTranslation } from "react-i18next";
import { formatTime } from "../utils/format";

interface StatsPanelProps {
  progress: number; // 完成百分比 (0-100)
  elapsed: number; // 已花費秒數
}

// 左上角固定統計面板：只顯示遊玩時間與進度（其餘統計明細已註解收合）
export const StatsPanel: React.FC<StatsPanelProps> = ({
  progress,
  elapsed,
}) => {
  const { t } = useTranslation();
  return (
    <div className="fixed left-3 top-3 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg px-4 py-3 w-44 text-slate-700 dark:text-slate-300">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
        {t("stats.title")}
      </div>
      <ul className="space-y-1 text-sm">
        <li className="flex justify-between">
          <span>{t("stats.time")}</span>
          <span className="font-semibold tabular-nums">
            {formatTime(elapsed)}
          </span>
        </li>
        <li className="flex justify-between">
          <span>{t("stats.progress")}</span>
          <span className="font-semibold">{progress}%</span>
        </li>
      </ul>
    </div>
  );
};
