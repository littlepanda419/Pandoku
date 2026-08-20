import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, within, waitFor } from "@testing-library/react";
import App from "../App";

const SAVE_KEY = "sudoku-save";

// 測試用的最小存檔形狀（僅斷言會用到的欄位）
interface SaveShape {
  current: number[][];
  solution: number[][];
  candidates: number[][][];
  isDaily: boolean;
}

function getSave(): SaveShape | null {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? (JSON.parse(raw) as SaveShape) : null;
}

function setupCells(container: HTMLElement) {
  const grid = container.querySelector(".grid.grid-cols-9") as HTMLElement;
  const cellDivs = Array.from(grid.children) as HTMLElement[];
  return { grid, cellDivs };
}

const isEmpty = (el: HTMLElement) => (el.textContent ?? "").trim() === "";

describe("儲存 & 接續挑戰", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("無存檔時預設載入每日挑戰，標題顯示 (每日)", () => {
    const { container } = render(<App />);
    expect(container.querySelector("h1")?.textContent).toContain("每日");
  });

  it("放置數字 / 草稿後儲存；重啟後接續同一局（含數字與草稿）", async () => {
    const { container, unmount } = render(<App />);
    const { cellDivs } = setupCells(container);

    // 第一個空格 → 草稿 7
    const draftIdx = cellDivs.findIndex(isEmpty);
    expect(draftIdx).toBeGreaterThanOrEqual(0);
    fireEvent.click(cellDivs[draftIdx]);
    fireEvent.keyDown(document.body, { key: "7" });
    expect(cellDivs[draftIdx].textContent).toContain("7");

    // 另一個不同行不同列的空格 → 放置 3
    const placeIdx = cellDivs.findIndex(
      (el, i) =>
        i !== draftIdx &&
        isEmpty(el) &&
        Math.floor(i / 9) !== Math.floor(draftIdx / 9) &&
        i % 9 !== draftIdx % 9,
    );
    expect(placeIdx).toBeGreaterThanOrEqual(0);
    fireEvent.click(cellDivs[placeIdx]);
    const np = container.querySelector(".fixed.right-3") as HTMLElement;
    fireEvent.click(within(np).getByText("3"));

    const placeRow = Math.floor(placeIdx / 9);
    const placeCol = placeIdx % 9;
    const draftRow = Math.floor(draftIdx / 9);
    const draftCol = draftIdx % 9;

    // 等存檔寫入「放置的 3」與「草稿 7」
    await waitFor(() => {
      const s = getSave();
      if (!s) throw new Error("no save");
      expect(s.current[placeRow][placeCol]).toBe(3);
      expect(s.candidates[draftRow][draftCol]).toContain(7);
    });

    // 模擬「下次開啟」：卸載後重新掛載 App（lazy initializer 會從 localStorage 接續）
    unmount();
    const { container: c2 } = render(<App />);
    const { cellDivs: cells2 } = setupCells(c2);

    expect(cells2[placeIdx].textContent?.trim()).toBe("3");
    expect(cells2[draftIdx].textContent).toContain("7");
    expect(c2.querySelector("h1")?.textContent).toContain("每日");
  });

  it("開新遊戲（非每日）後存檔；重啟接續且標題不含 (每日)", async () => {
    const { container, unmount } = render(<App />);
    expect(container.querySelector("h1")?.textContent).toContain("每日");

    // 透過難度 select 觸發「開新遊戲」確認對話框
    const select = container.querySelector("select") as HTMLSelectElement;
    const options = Array.from(select.options);
    const normalOpt =
      options.find((o) => /Normal|中等/.test(o.textContent ?? "")) ??
      options[options.length - 1];
    fireEvent.change(select, { target: { value: normalOpt.value } });

    // 點「確定」落實新遊戲
    const confirmBtn = within(container).getByText("確定");
    fireEvent.click(confirmBtn);

    // 新遊戲為非每日 -> 標題不應含 (每日)
    await waitFor(() => {
      expect(container.querySelector("h1")?.textContent).not.toContain("每日");
    });

    // 放個數字以確保存檔含進度
    const { cellDivs } = setupCells(container);
    const placeIdx = cellDivs.findIndex(isEmpty);
    fireEvent.click(cellDivs[placeIdx]);
    const np = container.querySelector(".fixed.right-3") as HTMLElement;
    fireEvent.click(within(np).getByText("3"));

    await waitFor(() => {
      const s = getSave();
      if (!s) throw new Error("no save");
      expect(s.isDaily).toBe(false);
    });

    // 重啟 -> 接續非每日新遊戲，標題不含 (每日)
    unmount();
    const { container: c2 } = render(<App />);
    expect(c2.querySelector("h1")?.textContent).not.toContain("每日");
    const { cellDivs: cells2 } = setupCells(c2);
    expect(cells2[placeIdx].textContent?.trim()).toBe("3");
  });

  it("通關存檔不接續，下次開啟改為每日挑戰", async () => {
    // 先種一份「已解開」的存檔（current == solution）作為前置狀態
    const base = render(<App />);
    await waitFor(() => expect(getSave()).not.toBeNull());
    const s = getSave();
    if (!s) throw new Error("no save");
    s.current = s.solution.map((r: number[]) => r.slice());
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    base.unmount();

    // 重啟：initAppState 看到 isSolved -> 丟棄 -> 開每日挑戰
    const { container } = render(<App />);
    expect(container.querySelector("h1")?.textContent).toContain("每日");
    await waitFor(() => {
      const s2 = getSave();
      // 通關存檔應已被新每日取代（current 不是全填滿）
      if (!s2) throw new Error("no save");
      const filled = s2.current.flat().filter((v: number) => v !== 0).length;
      expect(filled).toBeLessThan(81);
    });
  });
});
