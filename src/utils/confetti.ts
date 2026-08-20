import confetti from "canvas-confetti";

// 從 <html> 的 CSS 變數讀取當前主題色彩，讓彩帶顏色跟隨主題
// （mono 主題時為黑/灰/白深淺）
function getThemeColors(): string[] {
  if (typeof document === "undefined") return [];
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string) => cs.getPropertyValue(name).trim();
  return [
    pick("--accent"),
    pick("--accent-strong"),
    pick("--accent-hover"),
    pick("--accent-soft"),
  ].filter((c) => c.length > 0);
}

// 觸發兩側噴射彩帶特效（顏色跟隨主題）
export function triggerSideConfetti() {
  const colors = getThemeColors();
  const count = 200;
  const defaults: confetti.Options = {
    origin: { y: 0.7 }, // 噴射起的垂直高度（0.7 約為畫面下方偏中）
    zIndex: 9999, // 確保彩帶在最上層（不被 Modal 遮擋）
    ...(colors.length ? { colors } : {}),
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // 從左側邊緣向右上噴射
  fire(0.25, {
    spread: 60,
    startVelocity: 55,
    angle: 60, // 60 度角射向右上
    origin: { x: 0, y: 0.8 },
  });

  // 從右側邊緣向左上噴射
  fire(0.25, {
    spread: 60,
    startVelocity: 55,
    angle: 120, // 120 度角射向左上
    origin: { x: 1, y: 0.8 },
  });

  // 補充中央補花增強豐富度
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
}
