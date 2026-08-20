import React from "react";
import { FiEdit } from "react-icons/fi";
import { TbEraser } from "react-icons/tb";
import { useTranslation } from "react-i18next";

interface MobileNumpadProps {
  draftMode: boolean;
  onToggleDraft: () => void;
  onSelectNumber: (num: number) => void;
  onErase: () => void;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// 手機版底部固定虛擬數字鍵盤：
// - 3x3 數字按鈕 (1-9)
// - 鉛筆（草稿模式）開關：開啟時點數字＝切換草稿，關閉時點數字＝填正式答案
// - 橡皮擦：清除目前選取的格子
// 僅在手機 / 平板（< md 斷點）顯示，桌面版仍使用右側拖曳數字。
export const MobileNumpad: React.FC<MobileNumpadProps> = ({
  draftMode,
  onToggleDraft,
  onSelectNumber,
  onErase,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-200 dark:border-slate-600 px-2 pt-1.5 shadow-[0_-8px_16px_rgba(0,0,0,0.12)]"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-[min(92vw,26rem)]">
        {/* 數字 1-9 (3x3) */}
        <div className="grid grid-cols-3 gap-1">
          {NUMBERS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onSelectNumber(num)}
              className="h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-accent font-bold text-2xl shadow-sm active:scale-95 transition-transform select-none cursor-pointer"
            >
              {num}
            </button>
          ))}
        </div>

        {/* 操作列：清除 + 模式指示 + 草稿開關 */}
        <div className="mt-1 grid grid-cols-3 gap-1">
          <button
            type="button"
            aria-label={t("numpad.erase")}
            onClick={onErase}
            className="h-11 flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform cursor-pointer"
          >
            <TbEraser className="w-5 h-5" />
          </button>

          <span className="h-11 flex items-center justify-center text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {draftMode ? t("numpad.draftOn") : t("numpad.mode")}
          </span>

          <button
            type="button"
            aria-label={t("numpad.toggleDraft")}
            aria-pressed={draftMode}
            title={t("numpad.toggleDraft")}
            onClick={onToggleDraft}
            className={`h-11 flex items-center justify-center rounded-xl border active:scale-95 transition-all cursor-pointer ${
              draftMode
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-inset ring-indigo-500"
                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            <FiEdit className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};