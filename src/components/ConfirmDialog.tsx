import React from "react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  message: string | null;
  single?: boolean; // true = 只顯示單一「確定」按鈕（無取消）
  onClose: () => void;
  onConfirm: () => void;
}

// 置中確認對話框（message 為 null 時不渲染）；有半透明遮罩
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  single,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6">
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-5">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          {!single && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              {t("buttons.cancel")}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 btn-accent text-white font-semibold rounded-lg"
          >
            {t("buttons.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};
