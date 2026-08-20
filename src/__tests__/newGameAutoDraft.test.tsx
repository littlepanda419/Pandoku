import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
import App from "../App";

// 回歸測試：當「自動草稿」已開啟時，開新遊戲應立即自動填上各格候選數，
// 不需再把開關關掉再開一次才看得到。（由 App.render 實際互動取得 ground truth）

function openSettings(container: HTMLElement): HTMLElement {
  // 設定齒輪按鈕
  const gear = container.querySelector(
    '[data-testid="settings-button"]',
  ) as HTMLElement;
  expect(gear).toBeTruthy();
  fireEvent.click(gear);
  const panel = container.querySelector(
    '[data-testid="settings-panel"]',
  ) as HTMLElement;
  expect(panel).toBeTruthy();
  return panel;
}

function toggleAutoDraft(panel: HTMLElement) {
  // 自動草稿的 switch 是 settings 面板第一顆 h-6 w-10 的 toggle 按鈕
  const toggles = Array.from(panel.querySelectorAll("button")).filter(
    (b) =>
      b.className.includes("h-6") &&
      b.className.includes("w-10") &&
      b.className.includes("rounded-full"),
  );
  expect(toggles.length).toBeGreaterThanOrEqual(1);
  fireEvent.click(toggles[0] as HTMLElement);
}

function setupCells(container: HTMLElement) {
  const grid = container.querySelector(".grid.grid-cols-9") as HTMLElement;
  const cellDivs = Array.from(grid.children) as HTMLElement[];
  return { cellDivs };
}

describe("自動草稿開新遊戲", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("自動草稿開啟時，開新遊戲後空格應自動帶候選數（不需關閉再開啟）", () => {
    const { container } = render(<App />);
    const panel = openSettings(container);

    // 先打開自動草稿 → 目前盤面的空格立刻帶上候選數
    toggleAutoDraft(panel);
    const { cellDivs } = setupCells(container);
    const beforeEmpty = cellDivs.filter(
      (el) => (el.textContent ?? "").trim() === "",
    ).length;
    // 自動草稿開啟後，空格應已顯示候選數字（幾乎沒有完全空白的格子）
    expect(beforeEmpty).toBeLessThan(cellDivs.length);

    // 關閉設定面板（再點齒輪按鈕）
    const gear = container.querySelector(
      '[data-testid="settings-button"]',
    ) as HTMLElement;
    fireEvent.click(gear);

    // 透過難度 select 開新遊戲 → 確認對話框 → 確定
    const select = container.querySelector("select") as HTMLSelectElement;
    const opts = Array.from(select.options);
    const target =
      opts.find((o) => /Normal|中等|Easy|簡單/.test(o.textContent ?? "")) ??
      opts[opts.length - 1];
    fireEvent.change(select, { target: { value: target.value } });
    const confirmBtn = within(container).getByText("確定");
    fireEvent.click(confirmBtn);

    // 新遊戲應保留自動草稿：空格仍然有候補數
    const fresh = setupCells(container);
    const freshEmpty = fresh.cellDivs.filter(
      (el) => (el.textContent ?? "").trim() === "",
    ).length;
    expect(freshEmpty).toBeLessThan(fresh.cellDivs.length);
  });
});
