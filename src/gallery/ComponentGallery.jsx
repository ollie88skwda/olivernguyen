// /_components — dev-only component gallery.
//
// NOT LINKED and NOT PUBLIC:
//   · no entry in src/chrome/SiteChrome.jsx's pages menu
//   · public/robots.txt disallows it and it is absent from the sitemap
//   · the route is registered behind import.meta.env.DEV in src/Routes.js, so
//     it does not exist in a production build at all
//
// ALL FOUR THEMES (BRAND.md §3 — theme and mode are independent) are reachable
// from one URL. The gallery does NOT fork the token scoping to show them side by
// side: duplicating those hexes onto a wrapper selector would mean two copies of
// the palette and a contrast gate that only checks one of them. Instead the page
// drives the real attributes — mode through ModeProvider's setMode(), the ladder
// straight onto <html data-theme> — and mirrors both into the URL, so every
// combination is a screenshot-able link:
//   /_components?mode=terminal&theme=dark    (shipped)
//   /_components?mode=graph&theme=light      (shipped)
//   /_components?mode=terminal&theme=light   (derived, 04 §6.1)
//   /_components?mode=graph&theme=dark       (derived, 04 §6.3)
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverDescription } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectLabel, SelectGroup } from "@/components/ui/select";
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import {
  Glyph,
  GLYPHS,
  MonoLabel,
  SectionHead,
  Log,
  LogLine,
  CodeBlock,
  Statusline,
  StatuslineSpacer,
  StatusPill,
  PromptBar,
  NodeCard,
  TechToken,
  TechRow,
  Dossier,
  DossierHeader,
  StatBlock,
  StatRow,
} from "@/components/brand";

import { useMode } from "@/mode/ModeProvider";
import { useTheme } from "@/theme/ThemeProvider";

import "@/styles/sakura.css";
import "@/styles/components.css";
import "./gallery.css";

/* ---------------------------------------------------------------- helpers */

const Row = ({ children, label }) => (
  <div className="gx-row">
    {label && <MonoLabel className="gx-row-label">{label}</MonoLabel>}
    <div className="gx-row-items">{children}</div>
  </div>
);

const Block = ({ id, title, source, rule, children }) => (
  <section className="gx-block" id={id}>
    <SectionHead kicker={source} title={title} rule={false} />
    {rule && <p className="gx-rule">{rule}</p>}
    <div className="gx-block-body">{children}</div>
  </section>
);

/* ------------------------------------------------------------- the specimens */

function Specimens() {
  const [progress, setProgress] = React.useState(64);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <div className="gx-specimens">
        {/* ---------------------------------------------------- type */}
        <Block
          id="type"
          title="Type"
          source="hand-built · BRAND §7"
          rule="Familjen Grotesk 700 display · Hanken Grotesk sans · JetBrains Mono bodies · Martian Mono labels"
        >
          <h1 className="on-display gx-hero">Oliver Nguyen</h1>
          <SectionHead kicker="Section kicker" title="Section head" />
          <p className="on-prose">
            Body copy is Hanken Grotesk at 16px on a 1.6 line, capped at a 70ch measure so a
            paragraph never runs past the point where the eye loses the line.
          </p>
          <p className="on-mono">
            Mono body — JetBrains Mono at 13px/1.7, the face for anything you read forty lines of.
          </p>
          <Row label="Mono label tones">
            <MonoLabel>faint</MonoLabel>
            <MonoLabel tone="muted">muted</MonoLabel>
            <MonoLabel tone="text">text</MonoLabel>
            <MonoLabel tone="accent">accent</MonoLabel>
          </Row>
        </Block>

        {/* ---------------------------------------------------- glyphs */}
        <Block
          id="glyphs"
          title="Glyphs"
          source="hand-built · BRAND §8 / D-09"
          rule="Typographic marks in the mono. Never a hand-rolled SVG path."
        >
          <div className="gx-glyphs">
            {Object.keys(GLYPHS).map((name) => (
              <div className="gx-glyph-cell" key={name}>
                <Glyph name={name} tone="accent" />
                <MonoLabel>{name}</MonoLabel>
              </div>
            ))}
          </div>
        </Block>

        {/* ---------------------------------------------------- buttons */}
        <Block
          id="button"
          title="Button"
          source="shadcn/ui"
          rule="3px control radius · Martian label · 140ms ease-out on state change"
        >
          <Row label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="icon" aria-label="Close">
              <Glyph name="close" />
            </Button>
          </Row>
          <Row label="Disabled">
            <Button disabled>Primary</Button>
            <Button variant="ghost" disabled>
              Ghost
            </Button>
          </Row>
          <Row label="With glyph">
            <Button variant="ghost">
              <Glyph name="call" /> Route
            </Button>
            <Button variant="primary">
              <Glyph name="email" /> Contact
            </Button>
          </Row>
        </Block>

        {/* ---------------------------------------------------- fields */}
        <Block
          id="fields"
          title="Fields"
          source="shadcn/ui"
          rule="Label → content gap of 12 · 44px tap target on coarse pointers"
        >
          <div className="gx-grid-2">
            <div className="on-field-row">
              <Label htmlFor="gx-name">Name</Label>
              <Input id="gx-name" placeholder="Oliver Nguyen" />
            </div>
            <div className="on-field-row">
              <Label htmlFor="gx-cmd">Command</Label>
              <Input id="gx-cmd" face="mono" placeholder="operator --replay" />
            </div>
            <div className="on-field-row">
              <Label htmlFor="gx-bad">Invalid</Label>
              <Input id="gx-bad" aria-invalid="true" defaultValue="not an email" />
            </div>
            <div className="on-field-row">
              <Label htmlFor="gx-off">Disabled</Label>
              <Input id="gx-off" disabled defaultValue="locked" />
            </div>
            <div className="on-field-row">
              <Label htmlFor="gx-select">Select</Label>
              <Select>
                <SelectTrigger id="gx-select" className="on-field on-select-trigger">
                  <SelectValue placeholder="Pick a mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Mode</SelectLabel>
                    <SelectItem value="terminal">Terminal</SelectItem>
                    <SelectItem value="graph">Graph</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="on-field-row">
              <Label htmlFor="gx-note">Textarea</Label>
              <Textarea id="gx-note" placeholder="Say something." />
            </div>
          </div>
          <Row label="Toggles">
            <span className="on-check-row">
              <Checkbox id="gx-c1" defaultChecked />
              <Label htmlFor="gx-c1" role="inline">
                Checked
              </Label>
            </span>
            <span className="on-check-row">
              <Checkbox id="gx-c2" />
              <Label htmlFor="gx-c2" role="inline">
                Unchecked
              </Label>
            </span>
            <span className="on-check-row" data-disabled="true">
              <Checkbox id="gx-c3" disabled />
              <Label htmlFor="gx-c3" role="inline">
                Disabled
              </Label>
            </span>
            <span className="on-check-row">
              <Switch id="gx-s1" defaultChecked />
              <Label htmlFor="gx-s1" role="inline">
                Switch on
              </Label>
            </span>
            <span className="on-check-row">
              <Switch id="gx-s2" />
              <Label htmlFor="gx-s2" role="inline">
                Switch off
              </Label>
            </span>
          </Row>
          <Row label="Radio group">
            <RadioGroup defaultValue="a" className="gx-radios">
              {["a", "b"].map((v) => (
                <span className="on-check-row" key={v}>
                  <RadioGroupItem value={v} id={`gx-r-${v}`} />
                  <Label htmlFor={`gx-r-${v}`} role="inline">
                    Option {v.toUpperCase()}
                  </Label>
                </span>
              ))}
            </RadioGroup>
          </Row>
        </Block>

        {/* ---------------------------------------------------- badges */}
        <Block
          id="badges"
          title="Badge · tech token · status pill · key hint"
          source="shadcn/ui + hand-built"
          rule="Badges and tokens are controls (3px). Only status pills are round (§4)."
        >
          <Row label="Badge">
            <Badge>Neutral</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Shipped</Badge>
            <Badge tone="warning">Draft</Badge>
            <Badge tone="danger">Failed</Badge>
            <Badge solid>Solid</Badge>
          </Row>
          <Row label="Tech token">
            <TechRow>
              {["React", "Vite", "Tailwind v4", "Playwright", "Zustand"].map((t) => (
                <TechToken key={t}>{t}</TechToken>
              ))}
            </TechRow>
          </Row>
          <Row label="Status pill">
            <StatusPill>Idle</StatusPill>
            <StatusPill status="live">Live</StatusPill>
            <StatusPill status="routing">Routing</StatusPill>
            <StatusPill status="warning">Degraded</StatusPill>
            <StatusPill status="error">Down</StatusPill>
          </Row>
          <Row label="Key hint">
            <KbdGroup>
              <Kbd>
                <Glyph name="key" />
              </Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>ESC</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>G</Kbd>
              <Kbd>G</Kbd>
            </KbdGroup>
          </Row>
        </Block>

        {/* ---------------------------------------------------- surfaces */}
        <Block
          id="surfaces"
          title="Card · separator · avatar · skeleton · progress"
          source="shadcn/ui"
          rule="Surfaces are square, separated by 1px hairlines, and never lift"
        >
          <div className="gx-grid-2">
            <Card>
              <CardHeader>
                <div>
                  <MonoLabel>Project</MonoLabel>
                  <CardTitle>Replay console</CardTitle>
                </div>
                <StatusPill status="live">Live</StatusPill>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A card is a surface: radius 0, one hairline, 28px of padding, no shadow.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button size="sm">Open</Button>
                <Button size="sm" variant="ghost">
                  Source
                </Button>
              </CardFooter>
            </Card>
            <Card interactive>
              <CardHeader>
                <CardTitle>Interactive card</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Hover moves the hairline to the accent. Nothing lifts.</CardDescription>
              </CardContent>
            </Card>
          </div>
          <Separator />
          <Row label="Avatar (§10: square, 3px, oN)">
            <Avatar size="sm">
              <AvatarFallback>oN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>oN</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>oN</AvatarFallback>
            </Avatar>
          </Row>
          <Row label="Skeleton (static — §6 bans loops)">
            <div className="gx-skeletons" aria-busy="true">
              <Skeleton shape="text" style={{ width: "60%" }} />
              <Skeleton shape="text" style={{ width: "90%" }} />
              <Skeleton shape="control" style={{ width: "120px", height: "40px" }} />
            </div>
          </Row>
          <Row label="Progress">
            <div className="gx-progress">
              <Progress value={progress} />
              <div className="gx-row-items">
                <Button size="sm" variant="ghost" onClick={() => setProgress((p) => Math.max(0, p - 20))}>
                  −20
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setProgress((p) => Math.min(100, p + 20))}>
                  +20
                </Button>
                <MonoLabel tone="muted">{progress}%</MonoLabel>
              </div>
            </div>
          </Row>
          <Row label="Scroll area">
            <ScrollArea className="gx-scroll">
              <div className="gx-scroll-inner">
                {Array.from({ length: 12 }, (_, i) => (
                  <p className="on-mono" key={i}>
                    line {String(i + 1).padStart(2, "0")} — scrollback content
                  </p>
                ))}
              </div>
            </ScrollArea>
          </Row>
        </Block>

        {/* ---------------------------------------------------- table + tabs */}
        <Block id="table" title="Table · tabs" source="shadcn/ui" rule="Header row is a label row; hairlines separate">
          <Table>
            <TableCaption>Deploys, last 3</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead numeric>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["4531b14", "success", "1m 04s"],
                ["a90c2ef", "warning", "2m 41s"],
                ["77bd103", "error", "0m 12s"],
              ].map(([ref, status, dur]) => (
                <TableRow key={ref}>
                  <TableCell>{ref}</TableCell>
                  <TableCell>
                    <StatusPill status={status === "success" ? "live" : status}>{status}</StatusPill>
                  </TableCell>
                  <TableCell numeric>{dur}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Tabs defaultValue="one">
            <TabsList>
              <TabsTrigger value="one">Overview</TabsTrigger>
              <TabsTrigger value="two">Transcript</TabsTrigger>
              <TabsTrigger value="three">Stack</TabsTrigger>
            </TabsList>
            <TabsContent value="one">
              <p className="on-prose">The active tab is marked by an accent hairline on the rail — no filled pill.</p>
            </TabsContent>
            <TabsContent value="two">
              <p className="on-prose">Second panel.</p>
            </TabsContent>
            <TabsContent value="three">
              <p className="on-prose">Third panel.</p>
            </TabsContent>
          </Tabs>
        </Block>

        {/* ---------------------------------------------------- overlays */}
        <Block
          id="overlays"
          title="Overlays"
          source="shadcn/ui"
          rule="Panels are square and unshadowed; items inside them are 3px controls"
        >
          <Row label="Triggers">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Repeats what the label already says</TooltipContent>
            </Tooltip>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost">Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverTitle>Popover</PopoverTitle>
                <PopoverDescription>A surface with a hairline and no shadow.</PopoverDescription>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Session</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Glyph name="prompt" /> Open replay
                  <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem checked>Follow tail</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem tone="danger">
                  <Glyph name="close" /> Kill session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost">Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <MonoLabel>Confirm</MonoLabel>
                  <DialogTitle>Kill the session?</DialogTitle>
                  <DialogDescription>
                    Scrollback and the pane layout die with it, like a real session.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="danger">Kill</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost">Sheet</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <MonoLabel>Panel</MonoLabel>
                  <SheetTitle>Drawer</SheetTitle>
                  <SheetDescription>
                    Enters on the graph camera curve, holds still under reduced motion.
                  </SheetDescription>
                </SheetHeader>
                <TechRow>
                  <TechToken>right</TechToken>
                  <TechToken>640ms</TechToken>
                </TechRow>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" onClick={() => setPaletteOpen(true)}>
              Command palette
            </Button>
            <Button variant="ghost" onClick={() => toast.success("Route committed")}>
              Toast
            </Button>
          </Row>

          <Row label="Command palette (inline)">
            <div className="on-panel gx-palette">
              <Command>
                <CommandInput placeholder="type a command" />
                <CommandList>
                  <CommandEmpty>No results.</CommandEmpty>
                  <CommandGroup heading="Navigate">
                    <CommandItem>
                      <Glyph name="call" /> Go to projects
                      <CommandShortcut>G P</CommandShortcut>
                    </CommandItem>
                    <CommandItem>
                      <Glyph name="email" /> Contact
                      <CommandShortcut>G C</CommandShortcut>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </Row>

          <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
            <CommandInput placeholder="type a command" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup heading="Mode">
                <CommandItem onSelect={() => setPaletteOpen(false)}>
                  <Glyph name="decision" /> Switch to terminal
                </CommandItem>
                <CommandItem onSelect={() => setPaletteOpen(false)}>
                  <Glyph name="decision" /> Switch to graph
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </Block>

        {/* ---------------------------------------------------- log */}
        <Block
          id="log"
          title="Log line · code block · statusline · prompt"
          source="hand-built · BRAND §5/§7/§8"
          rule="The only place density is allowed, besides the statusline"
        >
          <Log>
            <LogLine time="09:14:02" glyph="prompt" state="dim">
              operator --replay week-32
            </LogLine>
            <LogLine time="09:14:02" glyph="call">
              fetch transcript · 412 lines
            </LogLine>
            <LogLine time="09:14:03" glyph="decision" state="active">
              route → tool:search (confidence 0.91)
            </LogLine>
            <LogLine time="09:14:05" glyph="checkText" state="success">
              committed 3 changes
            </LogLine>
            <LogLine time="09:14:06" glyph="close" state="error">
              upstream timeout after 30s
            </LogLine>
          </Log>

          <CodeBlock title="vite.config.js" meta="excerpt">
            {`export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
});`}
          </CodeBlock>

          <Statusline>
            <span>on.c</span>
            <span>
              <Glyph name="sep" /> terminal
            </span>
            <span>2 panes</span>
            <StatuslineSpacer />
            <span>
              <Glyph name="key" />K
            </span>
            <span>09:14</span>
          </Statusline>

          <PromptBar placeholder="what did you ship this week?" />
        </Block>

        {/* ---------------------------------------------------- graph */}
        <Block
          id="graph"
          title="Node card · dossier · stat block"
          source="hand-built · BRAND §9"
          rule="The dossier is the only element in the system that carries a shadow"
        >
          <div className="gx-grid-2">
            <NodeCard
              kicker="Project"
              title="Terminal replay"
              description="An operator console that replays a week of agent runs."
              tech={["React", "cmdk", "Zustand"]}
            />
            <NodeCard
              kicker="Project"
              title="Router canvas"
              description="Active state moves the hairline to the node's active border."
              tech={["d3-zoom", "Canvas"]}
              active
            />
          </div>

          <Dossier>
            <DossierHeader
              kicker="Dossier"
              title="Router canvas"
              meta={
                <>
                  <StatusPill status="live">Shipped</StatusPill>
                  <MonoLabel>2026</MonoLabel>
                </>
              }
              onClose={() => {}}
            />
            <p className="on-prose">
              The open dossier lifts. Everything else in this library sits flat on its hairline.
            </p>
            <StatRow>
              <StatBlock value="412" label="Log lines" />
              <StatBlock value="3" label="Tools routed" />
              <StatBlock value="1.2s" label="Median hop" />
            </StatRow>
          </Dossier>
        </Block>

        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}

/* --------------------------------------------------------------- the page */

const MODES = [
  { mode: "terminal", label: "terminal" },
  { mode: "graph", label: "graph" },
];
const LADDERS = [
  { theme: "light", label: "light", name: "Sakura Paper" },
  { theme: "dark", label: "dark", name: "Night Plum" },
];

// BRAND.md §3: theme and mode are independent, so the gallery needs BOTH
// switches to reach all four combinations. Both now go through the real
// providers — mode through ModeProvider, the ladder through ThemeProvider,
// which reads ?theme= and mirrors it back into the URL. So every combination
// stays a screenshot-able link, and the gallery no longer owns any switching
// logic of its own:
//   /_components?mode=terminal&theme=light   /_components?mode=graph&theme=dark
export function ComponentGallery() {
  const { mode, setMode } = useMode();
  const { theme, setTheme } = useTheme();
  const ladder = LADDERS.find((l) => l.theme === theme) ?? LADDERS[0];

  return (
    <div className="sakura gx-root">
      <header className="gx-head">
        <div>
          <MonoLabel tone="accent">Component gallery · dev only</MonoLabel>
          <h1 className="on-section-title">{ladder.name}</h1>
          <MonoLabel tone="faint">{`${mode} · ${theme}`}</MonoLabel>
        </div>
        <div className="gx-head-switch" role="group" aria-label="Mode">
          {MODES.map((m) => (
            <Button
              key={m.mode}
              size="sm"
              variant={m.mode === mode ? "primary" : "ghost"}
              aria-pressed={m.mode === mode}
              onClick={() => setMode(m.mode)}
            >
              {m.label}
            </Button>
          ))}
        </div>
        <div className="gx-head-switch" role="group" aria-label="Theme">
          {LADDERS.map((l) => (
            <Button
              key={l.theme}
              size="sm"
              variant={l.theme === theme ? "primary" : "ghost"}
              aria-pressed={l.theme === theme}
              onClick={() => setTheme(l.theme)}
            >
              {l.label}
            </Button>
          ))}
        </div>
      </header>
      <Specimens />
    </div>
  );
}

export default ComponentGallery;
