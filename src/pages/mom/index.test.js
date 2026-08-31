import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import MomFifty from "./index";
import { REASONS } from "./reasons";

// jsdom has no matchMedia; the page must not depend on it existing.
beforeEach(() => {
  window.localStorage.clear();
});

describe("/mom", () => {
  test("a first visit opens on the animation and taps into reason one", () => {
    render(<MomFifty />);
    expect(screen.getByText("Happy Birthday, Mom")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /begin/i }));

    expect(screen.getByText(REASONS[0])).toBeInTheDocument();
    expect(document.querySelector(".mom-count")).toHaveTextContent("01/50");
  });

  test("the standing title stands above the deck, and nothing signs off the card", () => {
    render(<MomFifty />);
    fireEvent.click(screen.getByRole("button", { name: /begin/i }));

    expect(screen.getByRole("heading", { name: /reasons we love you/i })).toBeInTheDocument();
    expect(screen.queryByText(/from both of us/i)).not.toBeInTheDocument();
  });

  test("progress saved under the old /mum keys is still honoured", () => {
    window.localStorage.setItem("mum50.seenOpening", "1");
    window.localStorage.setItem("mum50.deckDone", "1");
    vi.useFakeTimers();
    try {
      render(<MomFifty />);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      fireEvent.click(screen.getByRole("button", { name: /read the fifty reasons/i }));
      expect(screen.getAllByRole("button", { name: /^Reason \d+$/ })).toHaveLength(50);
    } finally {
      vi.useRealTimers();
    }
  });

  test("taps forward and back through the deck, remembering progress", () => {
    const { unmount } = render(<MomFifty />);
    fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    fireEvent.click(screen.getByRole("button", { name: /next reason/i }));
    expect(screen.getByText(REASONS[1])).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /previous reason/i }));
    expect(screen.getByText(REASONS[0])).toBeInTheDocument();

    unmount();
    expect(window.localStorage.getItem("mom50.seenOpening")).toBe("1");
    expect(JSON.parse(window.localStorage.getItem("mom50.opened"))).toEqual([1, 2]);
  });

  test("a later visit shows the live age, then the grid of all fifty", () => {
    window.localStorage.setItem("mom50.seenOpening", "1");
    window.localStorage.setItem("mom50.deckDone", "1");
    vi.useFakeTimers();
    try {
      render(<MomFifty />);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText(/to be precise/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /read the fifty reasons/i }));
      expect(screen.getAllByRole("button", { name: /^Reason \d+$/ })).toHaveLength(50);
    } finally {
      vi.useRealTimers();
    }
  });

  test("wiped storage falls back to the first-visit path", () => {
    window.localStorage.setItem("mom50.opened", "not json");
    window.localStorage.setItem("mom50.index", "banana");
    render(<MomFifty />);
    expect(screen.getByText("Happy Birthday, Mom")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    expect(screen.getByText(REASONS[0])).toBeInTheDocument();
  });
});
