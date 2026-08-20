// ---- 純格式化 / 日期輔助函式 ----（App 內多處重用，獨立成檔避免重複）

// 格式化秒數為 mm:ss
export function formatTime(total: number): string {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// 取得今日日期字串（YYYY-MM-DD）：每日挑戰種子 & 打卡記錄共用
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
