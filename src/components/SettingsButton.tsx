import React from "react";
import { FiSettings } from "react-icons/fi";

interface SettingsButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

// 左下角固定設定齒輪按鈕（開合上方懸浮設定面板）
export const SettingsButton: React.FC<SettingsButtonProps> = ({
  isOpen,
  onToggle,
}) => {
  return (
    <div className="fixed z-[50] left-3 bottom-[calc(13rem+env(safe-area-inset-bottom))] md:bottom-3">
      <button
        aria-label="Settings"
        aria-expanded={isOpen}
        data-testid="settings-button"
        onClick={onToggle}
        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <FiSettings className="text-slate-700 dark:text-slate-300 w-5 h-5" />
      </button>
    </div>
  );
};
