import React from "react";
import { useTranslation } from "react-i18next";
import { formatTime } from "../utils/format";

interface StatsPanelProps {
  progress: number; // 完成百分比 (0-100)
  elapsed: number; // 已花費秒數
}

// 頂端內文統計卡片：隨版面流動置中，不阻擋網格（時間 + 進度）
export const StatsPanel: React.FC<StatsPanelProps> = ({
  progress,
  elapsed,
}) => {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-[min(92vw,26rem)] mx-auto mb-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
      {/* 標題：手機 / 平板（< md）隱藏，僅顯示時間與進度並分置左右 */}
      <span className="hidden md:block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0 whitespace-nowrap">
        {t("stats.title")}
      </span>

      <span className="flex items-center gap-1 text-xs tabular-nums shrink-0">
        <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">{t("stats.time")}</span>
        <span className="font-semibold">{formatTime(elapsed)}</span>
      </span>

      <span className="flex items-center gap-1 text-xs tabular-nums shrink-0">
        <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">{t("stats.progress")}</span>
        <span className="font-semibold">{progress}%</span>
      </span>
    </div>
  );
};
