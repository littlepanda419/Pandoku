import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
import { StrictMode } from "react";
import App from "../App";

// 整合測試：重現「放下數字後所有格子的草稿都消失」的回報，
// 透過實際渲染 App 互動來取得 ground truth（草稿是否被意外清除）。

function setup() {
  const utils = render(<App />);
  const grid = utils.container.querySelector(
    ".grid.grid-cols-9",
  ) as HTMLElement;
  expect(grid).toBeTruthy();
  const cellDivs = Array.from(grid.children) as HTMLElement[];
  expect(cellDivs.length).toBe(81);
  const isEmpty = (el: HTMLElement) => (el.textContent ?? "").trim() === "";
  const rOf = (i: number) => Math.floor(i / 9);
  const cOf = (i: number) => i % 9;
  const emptyIndices: number[] = [];
  cellDivs.forEach((el, i) => {
    if (isEmpty(el)) emptyIndices.push(i);
  });
  return { cellDivs, emptyIndices, rOf, cOf, utils };
}

function addDraft(cellDivs: HTMLElement[], index: number, num: string) {
  fireEvent.click(cellDivs[index]);
  fireEvent.keyDown(document.body, { key: num });
}

describe("草稿 bug 整合測試", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("click 路徑：放下數字後其他格子草稿應保留", () => {
    const { cellDivs, emptyIndices, rOf, cOf, utils } = setup();
    const A = emptyIndices[0];
    const B = emptyIndices.find((i) => rOf(i) !== rOf(A) && cOf(i) !== cOf(A))!;
    const cellA = cellDivs[A];
    const cellB = cellDivs[B];
    addDraft(cellDivs, A, "3");
    addDraft(cellDivs, B, "5");
    // 放 2 到 B
    fireEvent.click(cellB);
    const np = utils.container.querySelector(".fixed.right-3") as HTMLElement;
    fireEvent.click(within(np).getByText("2"));
    expect(cellB.textContent?.trim()).toBe("2");
    expect(cellA.textContent).toContain("3");
  });

  it("StrictMode + click：放下數字後其他格子草稿應保留", () => {
    const utils = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    const grid = utils.container.querySelector(
      ".grid.grid-cols-9",
    ) as HTMLElement;
    const cellDivs = Array.from(grid.children) as HTMLElement[];
    const isEmpty = (el: HTMLElement) => (el.textContent ?? "").trim() === "";
    const rOf = (i: number) => Math.floor(i / 9);
    const cOf = (i: number) => i % 9;
    const emptyIndices: number[] = [];
    cellDivs.forEach((el, i) => isEmpty(el) && emptyIndices.push(i));
    const A = emptyIndices[0];
    const B = emptyIndices.find((i) => rOf(i) !== rOf(A) && cOf(i) !== cOf(A))!;
    const cellA = cellDivs[A];
    const cellB = cellDivs[B];
    addDraft(cellDivs, A, "3");
    addDraft(cellDivs, B, "5");
    fireEvent.click(cellB);
    const np = utils.container.querySelector(".fixed.right-3") as HTMLElement;
    fireEvent.click(within(np).getByText("2"));
    console.log(
      "[StrictMode click] A:",
      JSON.stringify(cellA.textContent),
      "B:",
      JSON.stringify(cellB.textContent),
    );
    expect(cellB.textContent?.trim()).toBe("2");
    expect(cellA.textContent).toContain("3");
  });

  it("drag 路徑：拖放數字後其他格子草稿應保留", () => {
    const { cellDivs, emptyIndices, rOf, cOf } = setup();
    const A = emptyIndices[0];
    const B = emptyIndices.find((i) => rOf(i) !== rOf(A) && cOf(i) !== cOf(A))!;
    const cellA = cellDivs[A];
    const cellB = cellDivs[B];
    addDraft(cellDivs, A, "3");
    addDraft(cellDivs, B, "5");
    // 拖放：用 mock dataTransfer（jsdom 無全域 DataTransfer）對 cellB 觸發 drop
    const fakeDT = { getData: (t: string) => (t === "text/plain" ? "2" : "") };
    fireEvent.drop(cellB, {
      dataTransfer: fakeDT,
      preventDefault: () => {},
    });
    console.log(
      "[drag] A:",
      JSON.stringify(cellA.textContent),
      "B:",
      JSON.stringify(cellB.textContent),
    );
    expect(cellB.textContent?.trim()).toBe("2");
    expect(cellA.textContent).toContain("3");
  });
});
