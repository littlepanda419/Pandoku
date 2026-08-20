// ===== 應用程式發布資訊（單一維護來源）=====
// 未來發布新版本 / 更新發布日期時，只需修改這個檔案，
// `Settings` 元件（src/components/Settings.tsx）即會自動讀取並顯示於設定面板下方。
// 網頁上的顯示位置維持不變，這裡只是把「值」集中管理，方便日後維護。

export const GAME_INFO = {
  /** 目前發布的版本號 (建議對應 package.json 的 version 欄位) */
  VERSION: "1.0.0",
  /** 本次版本的發布日期（格式 YYYY.MM.DD） */
  PUBLISHED_DATE: "2026.08.26",
} as const;