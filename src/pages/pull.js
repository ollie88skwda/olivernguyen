import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import "../styles/sakura.css";
import "../styles/Pull.css";
import { supabase } from "../lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Display, Glyph, MonoLabel, SectionHead, StatusPill } from "@/components/brand";

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVELS = [
  { amount: 20,      label: "Might show up",   sub: "Would skip for $20" },
  { amount: 100,     label: "Pretty free",      sub: "Would skip for $100" },
  { amount: 500,     label: "I want this one",  sub: "Would skip for $500" },
  { amount: 5000,    label: "High priority",    sub: "Would skip for $5,000" },
  { amount: 1000000, label: "Nothing stops me", sub: "Would skip for $1,000,000" },
];

function formatAmount(amount) {
  if (amount >= 1000000) return "$1M";
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

function formatPool(pool) {
  return pool >= 1000 ? `$${(pool / 1000).toFixed(0)}K` : `$${pool}`;
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return {
    month: d.toLocaleDateString("en-AU", { month: "short" }),
    day: d.toLocaleDateString("en-AU", { day: "2-digit" }),
  };
}

function getUpcomingWeekends() {
  const weekends = [];
  const today = new Date();
  const end = new Date("2027-01-01");
  const d = new Date(today);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  while (d < end) {
    weekends.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return weekends;
}

// ─── Name Screen ─────────────────────────────────────────────────────────────

function NameScreen({ onSubmit }) {
  const [input, setInput] = useState("");

  return (
    <div className="pull-name-screen">
      <div className="pull-name-card">
        <div className="pull-logo-area">
          <MonoLabel tone="accent">AU Tournament Scheduler</MonoLabel>
          <Display as="h1" className="pull-name-title">PULL.</Display>
          <p className="pull-tagline on-prose">Mark your weekends. Commit to the game.</p>
        </div>
        <Separator />
        <form
          className="pull-name-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) onSubmit(input.trim());
          }}
        >
          <Label htmlFor="pull-name">Who are you?</Label>
          <Input
            id="pull-name"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            autoComplete="off"
          />
          <Button type="submit" disabled={!input.trim()} className="pull-enter-btn">
            Enter PULL →
          </Button>
        </form>
        <p className="pull-fine-print">
          Your name is saved to this device. Others in the group
          <br />can see your picks across all their devices.
        </p>
      </div>
    </div>
  );
}

// ─── Commitment Selector ─────────────────────────────────────────────────────

function CommitmentSelector({ currentAmount, onSelect, onClear }) {
  return (
    <div className="pull-selector">
      <MonoLabel tone="muted">How much would it take to make you miss this?</MonoLabel>
      <div className="pull-levels">
        {LEVELS.map((level) => {
          const selected = currentAmount === level.amount;
          return (
            <button
              key={level.amount}
              type="button"
              onClick={() => onSelect(level.amount)}
              aria-pressed={selected}
              className="pull-level"
            >
              <span className="pull-level-text">
                <span className="pull-level-label">{level.label}</span>
                <MonoLabel tone="faint">{level.sub}</MonoLabel>
              </span>
              <span className="pull-level-right">
                <span className="pull-level-amount">{formatAmount(level.amount)}</span>
                {selected && <Glyph name="dot" />}
              </span>
            </button>
          );
        })}
      </div>
      {currentAmount !== null && (
        <Button type="button" variant="ghost" onClick={onClear} className="pull-clear">
          <Glyph name="close" /> Mark as unavailable
        </Button>
      )}
    </div>
  );
}

// ─── Weekend Card ─────────────────────────────────────────────────────────────

function WeekendCard({ weekend, picks, myPick, playerName, onPick }) {
  const [expanded, setExpanded] = useState(false);
  const date = formatDate(weekend);
  const available = picks.filter((p) => p.amount > 0);
  const totalPool = available.reduce((sum, p) => sum + Math.min(p.amount, 5000), 0);
  const myAmount = myPick ? myPick.amount : null;
  const isAvailable = myAmount !== null && myAmount > 0;
  const poolPct = Math.min((totalPool / 25000) * 100, 100);

  return (
    <Card interactive className="pull-weekend">
      <button
        type="button"
        className="pull-card-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="pull-card-left">
          <span className="pull-card-date">
            <MonoLabel tone="faint">{date.month}</MonoLabel>
            <span className="pull-card-day">{date.day}</span>
          </span>
          {isAvailable ? (
            <StatusPill status="routing">{formatAmount(myAmount)} committed</StatusPill>
          ) : (
            <MonoLabel tone="muted">Weekend</MonoLabel>
          )}
        </span>
        <span className="pull-card-meta">
          {available.length > 0 ? (
            <span className="pull-card-stats">
              <span className="pull-card-count">{available.length} in</span>
              <Glyph name="sep" />
              <span className="pull-card-pool">pool {formatPool(totalPool)}</span>
            </span>
          ) : (
            <MonoLabel tone="faint">No picks yet</MonoLabel>
          )}
          <Glyph name={expanded ? "up" : "down"} />
        </span>
      </button>

      {available.length > 0 && (
        <div className="pull-chips">
          {available.map((p) => (
            <Badge
              key={p.id}
              tone={p.player === playerName ? "accent" : "neutral"}
              className="pull-chip"
            >
              {p.player} {formatAmount(p.amount)}
            </Badge>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <Progress value={poolPct} aria-label="Group pool size" className="pull-card-progress" />
      )}

      {expanded && (
        <div className="pull-card-expanded">
          <CommitmentSelector
            currentAmount={myAmount}
            onSelect={(amount) => {
              onPick(weekend, amount);
              setExpanded(false);
            }}
            onClear={() => {
              onPick(weekend, null);
              setExpanded(false);
            }}
          />
        </div>
      )}
    </Card>
  );
}

// ─── Best Weekends Banner ─────────────────────────────────────────────────────

function BestWeekendsBanner({ picks, weekends }) {
  const ranked = weekends
    .map((w) => {
      const wPicks = picks.filter((p) => p.weekend === w && p.amount > 0);
      const pool = wPicks.reduce((s, p) => s + Math.min(p.amount, 5000), 0);
      return { weekend: w, count: wPicks.length, pool };
    })
    .filter((w) => w.count > 0)
    .sort((a, b) => b.pool - a.pool || b.count - a.count)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  return (
    <Card className="pull-banner">
      <MonoLabel as="h2" tone="accent">
        Best Weekends So Far
      </MonoLabel>
      <div className="pull-banner-items">
        {ranked.map((w, i) => {
          const date = formatDate(w.weekend);
          return (
            <div key={w.weekend} className="pull-banner-item">
              <MonoLabel tone="faint">#{i + 1}</MonoLabel>
              <span className="pull-banner-date">
                {date.month} {date.day}
              </span>
              <MonoLabel tone="muted">{w.count} in</MonoLabel>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Pull = () => {
  const [playerName, setPlayerName] = useState(null);
  const [picks, setPicks] = useState([]);
  const picksRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const weekends = getUpcomingWeekends();

  useEffect(() => {
    const saved = localStorage.getItem("pull_player_name");
    if (saved) setPlayerName(saved);
  }, []);

  const setPicksFromSource = useCallback((nextPicks) => {
    const normalized = nextPicks || [];
    picksRef.current = normalized;
    setPicks(normalized);
  }, []);

  // Initial load shows the skeleton and can fail into the error panel; the
  // realtime refresh is silent so a transient blip never blanks a loaded list.
  const loadPicks = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pull_picks")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPicksFromSource(data);
      setFetchError(false);
      return true;
    } catch {
      if (!silent) setFetchError(true);
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [setPicksFromSource]);

  useEffect(() => {
    loadPicks();

    const channel = supabase
      .channel("pull_picks_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pull_picks" }, () => {
        loadPicks({ silent: true });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPicks]);

  const handleSetName = useCallback((name) => {
    localStorage.setItem("pull_player_name", name);
    setPlayerName(name);
  }, []);

  const handleChangeName = useCallback(() => {
    localStorage.removeItem("pull_player_name");
    setPlayerName(null);
  }, []);

  const handlePick = useCallback(
    async (weekend, amount) => {
      if (!playerName) return;

      const previousPicks = picksRef.current;
      const without = previousPicks.filter(
        (p) => !(p.player === playerName && p.weekend === weekend),
      );
      const optimisticPicks =
        amount === null
          ? without
          : [
              ...without,
              {
                id: `optimistic-${weekend}`,
                player: playerName,
                weekend,
                amount,
                created_at: new Date().toISOString(),
              },
            ];
      picksRef.current = optimisticPicks;
      setPicks(optimisticPicks);

      // Writes go through our own route, which holds the service-role key and validates the
      // weekend and amount. The browser has no write access to pull_picks at all. Reads and
      // the realtime subscription above still go direct, on anon SELECT.
      try {
        const res = await fetch("/api/pull/pick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player: playerName, weekend, amount }),
        });
        if (!res.ok) throw new Error(`pick save failed: ${res.status}`);
      } catch {
        // Roll the optimistic row back to server truth; the realtime channel
        // still reconciles if the write actually landed.
        toast.error("couldn't save your pick — check the connection and try again");
        const reconciled = await loadPicks({ silent: true });
        if (!reconciled) setPicksFromSource(previousPicks);
      }
    },
    [playerName, loadPicks, setPicksFromSource],
  );

  if (playerName === null) {
    return (
      <div className="pull sakura">
        <NameScreen onSubmit={handleSetName} />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="pull sakura">
      <div className="pull-page">
        <div className="pull-content">
          <div className="pull-page-header">
            <SectionHead kicker="AU Tournament Scheduler" title="PULL." as="h1" rule={false} />
            <div className="pull-user-info">
              <MonoLabel tone="text" className="pull-user-name">
                {playerName}
              </MonoLabel>
              <Button variant="ghost" size="sm" onClick={handleChangeName} className="pull-change-btn">
                Change
              </Button>
            </div>
          </div>

          <p className="pull-instructions on-prose">
            Tap a weekend to mark your availability. The commitment scale shows{" "}
            <strong>how much it would take to make you miss it</strong> — so the
            group can find which weekends are real priorities.
          </p>

          {!loading && !fetchError && <BestWeekendsBanner picks={picks} weekends={weekends} />}

          {loading ? (
            <div className="pull-loading" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} shape="surface" className="pull-loading-card" />
              ))}
            </div>
          ) : fetchError ? (
            <div className="pull-error" role="alert">
              <p className="pull-error-title">Couldn't load the picks</p>
              <p className="pull-error-detail">
                The group's weekends didn't come through. Check your connection and try again.
              </p>
              <Button onClick={() => loadPicks()}>Try again</Button>
            </div>
          ) : (
            <ul className="pull-grid">
              {weekends.map((weekend) => {
                const weekendPicks = picks.filter((p) => p.weekend === weekend);
                const myPick = weekendPicks.find((p) => p.player === playerName) || null;
                return (
                  <li key={weekend} className="pull-grid-item">
                    <WeekendCard
                      weekend={weekend}
                      picks={weekendPicks}
                      myPick={myPick}
                      playerName={playerName}
                      onPick={handlePick}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <footer className="pull-footer">
            <MonoLabel tone="faint">PULL. — Made for the group. Updates in real time.</MonoLabel>
          </footer>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Pull;
