import React from "react";
import { useTranslation } from "react-i18next";

interface ActionButtonsProps {
  onHint: () => void;
  onCheck: () => void;
}

// 盤面上方功能按鈕：提示 / 對答案
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onHint,
  onCheck,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center justify-center">
      <button
        onClick={onHint}
        className="px-4 py-2 ui-btn-hint font-semibold rounded-lg shadow transition-colors"
      >
        {t("buttons.hint")}
      </button>
      <button
        onClick={onCheck}
        className="px-4 py-2 ui-btn-check font-semibold rounded-lg shadow transition-colors"
      >
        {t("buttons.check")}
      </button>
    </div>
  );
};
