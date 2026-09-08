// D-24 — every library part that renders DOM forwards its ref.
//
// Why this is a gate and not a detail: the registry emits React 19 code, where
// `ref` arrives as an ordinary prop. This project is React 18, where it does
// not. A component that swallows its ref silently breaks the moment it is used
// as a Radix `asChild` child — which is exactly what the chrome does when it
// wraps a control in a tooltip. The failure is a runtime warning plus a dead
// trigger, and nothing in a screenshot shows it. So it is asserted here.
//
// Two layers:
//   1. a structural sweep — every exported part that renders DOM must be a
//      forwardRef component. Cheap, and it catches a new part added flat.
//   2. behavioural mounts — the parts the chrome actually composes, checked to
//      land a real element on the ref, including through `asChild`.
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as avatar from "./avatar.jsx";
import * as badge from "./badge.jsx";
import * as button from "./button.jsx";
import * as card from "./card.jsx";
import * as checkbox from "./checkbox.jsx";
import * as command from "./command.jsx";
import * as dialog from "./dialog.jsx";
import * as dropdownMenu from "./dropdown-menu.jsx";
import * as input from "./input.jsx";
import * as kbd from "./kbd.jsx";
import * as label from "./label.jsx";
import * as popover from "./popover.jsx";
import * as progress from "./progress.jsx";
import * as radioGroup from "./radio-group.jsx";
import * as scrollArea from "./scroll-area.jsx";
import * as select from "./select.jsx";
import * as separator from "./separator.jsx";
import * as sheet from "./sheet.jsx";
import * as skeleton from "./skeleton.jsx";
import * as switchUi from "./switch.jsx";
import * as table from "./table.jsx";
import * as tabs from "./tabs.jsx";
import * as textarea from "./textarea.jsx";
import * as tooltip from "./tooltip.jsx";
import { Icon } from "@/components/brand/icon";

const FORWARD_REF = Symbol.for("react.forward_ref");

// The exports that render no DOM node of their own: Radix context Roots and
// providers, plus the two dialog-shaped wrappers. There is nothing to point a
// ref at, so they stay plain functions.
const CONTEXT_ONLY = new Set([
  "Dialog",
  "DropdownMenu",
  "DropdownMenuSub",
  "Popover",
  "Select",
  "Sheet",
  "Tooltip",
  "TooltipProvider",
  "CommandDialog",
]);

const MODULES = {
  avatar,
  badge,
  button,
  card,
  checkbox,
  command,
  dialog,
  "dropdown-menu": dropdownMenu,
  input,
  kbd,
  label,
  popover,
  progress,
  "radio-group": radioGroup,
  "scroll-area": scrollArea,
  select,
  separator,
  sheet,
  skeleton,
  switch: switchUi,
  table,
  tabs,
  textarea,
  tooltip,
};

describe("D-24 · ui primitives forward refs", () => {
  for (const [name, mod] of Object.entries(MODULES)) {
    for (const [exportName, value] of Object.entries(mod)) {
      if (CONTEXT_ONLY.has(exportName)) continue;
      if (typeof value !== "function" && typeof value !== "object") continue;
      it(`${name} → ${exportName}`, () => {
        expect(value?.$$typeof).toBe(FORWARD_REF);
      });
    }
  }

  it("brand Icon forwards its ref (it is used inside controls)", () => {
    expect(Icon.$$typeof).toBe(FORWARD_REF);
  });
});

describe("D-24 · refs land on real elements", () => {
  it("Label, Separator, Switch and Progress point at DOM nodes", () => {
    const refs = {
      label: React.createRef(),
      separator: React.createRef(),
      switch: React.createRef(),
      progress: React.createRef(),
    };
    render(
      <div className="sakura">
        <label.Label ref={refs.label}>Mode</label.Label>
        <separator.Separator ref={refs.separator} />
        <switchUi.Switch ref={refs.switch} />
        <progress.Progress ref={refs.progress} value={40} />
      </div>,
    );
    for (const ref of Object.values(refs)) {
      expect(ref.current).toBeInstanceOf(HTMLElement);
    }
  });

  it("Icon lands on the rendered svg", () => {
    const ref = React.createRef();
    render(<Icon name="sun" ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGElement);
  });

  // The case D-24 exists for: a control handed to a Radix slot as `asChild`.
  it("a Button survives being a TooltipTrigger asChild child", () => {
    const ref = React.createRef();
    render(
      <div className="sakura">
        <tooltip.TooltipProvider>
          <tooltip.Tooltip>
            <tooltip.TooltipTrigger asChild>
              <button.Button ref={ref}>Switch theme</button.Button>
            </tooltip.TooltipTrigger>
          </tooltip.Tooltip>
        </tooltip.TooltipProvider>
      </div>,
    );
    // Radix composes its own ref onto the trigger; ours must still resolve, and
    // the trigger wiring must have reached the button rather than a wrapper.
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByRole("button", { name: "Switch theme" })).toBe(ref.current);
  });
});
