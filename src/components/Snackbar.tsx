import React from "react";

interface SnackbarProps {
  message: string | null;
}

// 底部臨時提示訊息（message 為 null 時不渲染）；自動消失由 App 的 effect 處理
export const Snackbar: React.FC<SnackbarProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-[calc(13.5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {message}
    </div>
  );
};
