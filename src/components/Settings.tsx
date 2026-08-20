import React, { useState, useRef, useEffect } from "react";
import { SiGithub } from "react-icons/si";
import { useTranslation } from "react-i18next";
import { GAME_INFO } from "../constants/gameInfo";

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  autoDraft: boolean;
  onToggleAutoDraft: () => void;
  accent: string;
  onAccentChange: (accent: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  isOpen: boolean;
}

const LANGUAGES = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
];

// 主題色預覽色票（與 index.css 的 --accent 對應）；作為下拉選單中「整列填滿」的顯示色
// mono 改用中灰（#64748b）代表，避免原本黑白漸層的白色融入淺色模式背景
const THEMES = [
  { value: "blue", color: "#6366f1" },
  { value: "green", color: "#10b981" },
  { value: "pink", color: "#ec4899" },
  { value: "yellow", color: "#facc15" },
  { value: "orange", color: "#f97316" },
  { value: "mono", color: "#64748b" },
];

const GITHUB_URL = "https://github.com";

export const Settings: React.FC<SettingsProps> = ({
  darkMode,
  onToggleDarkMode,
  autoDraft,
  onToggleAutoDraft,
  accent,
  onAccentChange,
  language,
  onLanguageChange,
  isOpen,
}) => {
  const { t } = useTranslation();

  // 主題色彩下拉選單的開合狀態：點擊外部 或 按 Escape 時關閉
  const [themeOpen, setThemeOpen] = useState(false);
  const themeSelectRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!themeOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        themeSelectRef.current &&
        !themeSelectRef.current.contains(e.target as Node)
      ) {
        setThemeOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setThemeOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [themeOpen]);

  if (!isOpen) return null;

  // 目前選中的主題（防呆：找不到時退回第一個）
  const activeTheme =
    THEMES.find((theme) => theme.value === accent) ?? THEMES[0];

  return (
    <div className="fixed bottom-15 left-3 z-40 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl p-4 text-slate-700 dark:text-slate-300">
      {/* 設定選項：自動草稿 / 語言 / 深色模式 / 主題色彩 */}
      <div className="flex flex-col gap-3 mb-3 w-full">
        {/* 語言選單：各自一行，標題靠左、下拉選單靠右 */}
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase shrink-0">
            {t("settings.language")}
          </label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* 自動草稿：各自一行，標題靠左、Switch 開關靠右 */}
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase shrink-0">
            {t("settings.autoDraft")}
          </label>
          <button
            onClick={onToggleAutoDraft}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none ${
              autoDraft ? "ui-toggle-on" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                autoDraft ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* 深色模式：各自一行，標題靠左、Switch 開關靠右 */}
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase shrink-0">
            {t("settings.dark")}
          </label>
          <button
            onClick={onToggleDarkMode}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none ${
              darkMode ? "ui-toggle-on" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                darkMode ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* 主題色彩：下拉選單（每個選項以顏色整列填滿 + 附名稱，避免橫向排列越來越擠） */}
        <div className="flex items-center justify-between gap-2 mb-4 w-full">
          {/* 左側標籤：允許收縮，不被右側硬擠 */}
          <label
            id="theme-label"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase shrink-0"
          >
            {t("settings.theme")}
          </label>

          {/* 右側：下拉選單容器 (限制最大寬度 max-w-[150px] 或 flex-1，確保不爆框) */}
          <div className="relative flex-1 max-w-[150px]" ref={themeSelectRef}>
            {/* 下拉觸發器：w-full 自適應容器寬度 */}
            <button
              type="button"
              onClick={() => setThemeOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={themeOpen}
              aria-labelledby="theme-label"
              className="relative w-full h-9 rounded-lg border border-black/10 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow overflow-hidden"
              style={{ backgroundColor: activeTheme.color }}
            >
              {/* 內容區域：保留右側箭頭空間 (pr-7) */}
              <span className="absolute inset-y-0 left-0 right-7 flex items-center pl-1.5 overflow-hidden">
                <span
                  className="inline-block truncate rounded px-1.5 py-0.5 bg-black/45 text-white text-xs font-semibold max-w-full"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  {t(`settings.themes.${activeTheme.value}`)}
                </span>
              </span>

              {/* 右側箭頭：固定靠右 */}
              <svg
                className={`absolute inset-y-0 right-1.5 my-auto w-4 h-4 text-white transition-transform ${
                  themeOpen ? "rotate-180" : ""
                }`}
                style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.6))" }}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.352a.75.75 0 111.12.996l-4.25 5a.75.75 0 01-1.12 0l-4.25-5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* 下拉面板：與按鈕同寬 */}
            {themeOpen && (
              <div
                role="listbox"
                aria-labelledby="theme-label"
                className="absolute right-0 bottom-full mb-1 w-full z-50 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto p-1 flex flex-col gap-1"
              >
                {THEMES.map((theme) => {
                  const isActive = accent === theme.value;
                  return (
                    <button
                      key={theme.value}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => {
                        onAccentChange(theme.value);
                        setThemeOpen(false);
                      }}
                      title={t(`settings.themes.${theme.value}`)}
                      className={`relative h-8 w-full rounded-md border border-black/10 dark:border-white/15 transition-opacity overflow-hidden ${
                        isActive
                          ? "opacity-100 ring-2 ring-inset ring-white dark:ring-slate-900"
                          : "opacity-90 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: theme.color }}
                    >
                      <span className="absolute inset-y-0 left-0 right-6 flex items-center pl-1 overflow-hidden">
                        <span
                          className="inline-block truncate rounded px-1.5 py-0.5 bg-black/45 text-white text-xs font-semibold max-w-full"
                          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                        >
                          {t(`settings.themes.${theme.value}`)}
                        </span>
                      </span>
                      {isActive && (
                        <svg
                          className="absolute inset-y-0 right-1.5 my-auto w-4 h-4 text-white"
                          style={{
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.6))",
                          }}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42l3.29 3.29 7.29-7.29a1 1 0 011.42 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub link & Version info */}
      <div className="flex flex-col items-center gap-2">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xl"
        >
          <SiGithub />
        </a>

        {/* 版本號與發布日期（數值來源：src/constants/gameInfo.ts） */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
          <div>{t(`settings.version`)}: {GAME_INFO.VERSION}</div>
          <div>{t(`settings.publishedDate`)}: {GAME_INFO.PUBLISHED_DATE}</div>
        </div>
      </div>
    </div>
  );
};
