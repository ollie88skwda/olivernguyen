import React, { useState, useEffect, useCallback } from "react";
import { TopBar } from "./top_bar";
import "../styles/Pull.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

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
          <p className="pull-subtitle">AU Tournament Scheduler</p>
          <h1 className="pull-title">PULL.</h1>
          <p className="pull-tagline">Mark your weekends. Commit to the game.</p>
        </div>
        <div className="pull-divider" />
        <p className="pull-label">Who are you?</p>
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) onSubmit(input.trim()); }}>
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your name"
            className="pull-input"
          />
          <button type="submit" disabled={!input.trim()} className="pull-btn-primary">
            Enter PULL →
          </button>
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
    <div className="pull-commitment-selector">
      <p className="pull-label" style={{ marginBottom: "10px" }}>
        How much would it take to make you miss this?
      </p>
      {LEVELS.map((level) => (
        <button
          key={level.amount}
          onClick={() => onSelect(level.amount)}
          className={`pull-level-btn ${currentAmount === level.amount ? "active" : ""}`}
        >
          <div className="pull-level-text">
            <span className="pull-level-label">{level.label}</span>
            <span className="pull-level-sub">{level.sub}</span>
          </div>
          <div className="pull-level-right">
            <span className={`pull-level-amount ${currentAmount === level.amount ? "active" : ""}`}>
              {formatAmount(level.amount)}
            </span>
            {currentAmount === level.amount && <div className="pull-dot" />}
          </div>
        </button>
      ))}
      {currentAmount !== null && (
        <button onClick={onClear} className="pull-clear-btn">
          × Mark as unavailable
        </button>
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

  return (
    <div className={`pull-card ${isAvailable ? "active" : ""}`}>
      <button className="pull-card-header" onClick={() => setExpanded((e) => !e)}>
        <div className="pull-card-left">
          <div className="pull-card-date">
            <span className="pull-card-month">{date.month}</span>
            <span className="pull-card-day">{date.day}</span>
          </div>
          <span className={`pull-card-status ${isAvailable ? "committed" : ""}`}>
            {isAvailable ? `${formatAmount(myAmount)} committed ✓` : "Weekend"}
          </span>
        </div>
        <div className="pull-card-right">
          {available.length > 0 ? (
            <>
              <span className="pull-card-count">{available.length} in</span>
              <span className="pull-card-pool">
                Pool: {totalPool >= 1000 ? `$${(totalPool / 1000).toFixed(0)}K` : `$${totalPool}`}
              </span>
            </>
          ) : (
            <span className="pull-card-empty">No picks yet</span>
          )}
        </div>
      </button>

      {available.length > 0 && (
        <div className="pull-card-chips">
          {available.map((p) => (
            <span key={p.id} className={`pull-chip ${p.player === playerName ? "mine" : ""}`}>
              {p.player} {formatAmount(p.amount)}
            </span>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="pull-card-bar-wrap">
          <div
            className="pull-card-bar-fill"
            style={{ width: `${Math.min((totalPool / 25000) * 100, 100)}%` }}
          />
        </div>
      )}

      {expanded && (
        <div className="pull-card-expanded">
          <CommitmentSelector
            currentAmount={myAmount}
            onSelect={(amount) => { onPick(weekend, amount); setExpanded(false); }}
            onClear={() => { onPick(weekend, null); setExpanded(false); }}
          />
        </div>
      )}
    </div>
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
    <div className="pull-banner">
      <p className="pull-banner-title">Best Weekends So Far</p>
      <div className="pull-banner-items">
        {ranked.map((w, i) => {
          const date = formatDate(w.weekend);
          return (
            <div key={w.weekend} className="pull-banner-item">
              <span className="pull-banner-rank">#{i + 1}</span>
              <span className="pull-banner-date">{date.month} {date.day}</span>
              <span className="pull-banner-count">{w.count} in</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Pull = () => {
  const [playerName, setPlayerName] = useState(null);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const weekends = getUpcomingWeekends();

  useEffect(() => {
    const saved = localStorage.getItem("pull_player_name");
    if (saved) setPlayerName(saved);
  }, []);

  useEffect(() => {
    async function fetchPicks() {
      const { data } = await supabase
        .from("pull_picks")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setPicks(data);
      setLoading(false);
    }

    fetchPicks();

    const channel = supabase
      .channel("pull_picks_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pull_picks" }, () => {
        fetchPicks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSetName = useCallback((name) => {
    localStorage.setItem("pull_player_name", name);
    setPlayerName(name);
  }, []);

  const handlePick = useCallback(async (weekend, amount) => {
    if (!playerName) return;

    setPicks((prev) => {
      const without = prev.filter((p) => !(p.player === playerName && p.weekend === weekend));
      if (amount === null) return without;
      return [...without, { id: `optimistic-${weekend}`, player: playerName, weekend, amount, created_at: new Date().toISOString() }];
    });

    if (amount === null) {
      await supabase.from("pull_picks").delete().eq("player", playerName).eq("weekend", weekend);
    } else {
      await supabase.from("pull_picks").upsert({ player: playerName, weekend, amount }, { onConflict: "player,weekend" });
    }
  }, [playerName]);

  if (playerName === null) {
    return <NameScreen onSubmit={handleSetName} />;
  }

  return (
    <div className="pull-page">
      <TopBar />
      <div className="pull-content">
        <div className="pull-page-header">
          <div>
            <h1 className="pull-page-title">PULL.</h1>
            <p className="pull-page-sub">AU Tournament Scheduler</p>
          </div>
          <div className="pull-user-info">
            <span className="pull-user-name">{playerName}</span>
            <button
              className="pull-change-btn"
              onClick={() => { localStorage.removeItem("pull_player_name"); setPlayerName(null); }}
            >
              change
            </button>
          </div>
        </div>

        <p className="pull-instructions">
          Tap a weekend to mark your availability. The commitment scale shows{" "}
          <strong>how much it would take to make you miss it</strong> — so the
          group can find which weekends are real priorities.
        </p>

        {!loading && <BestWeekendsBanner picks={picks} weekends={weekends} />}

        {loading ? (
          <div className="pull-loading">Loading...</div>
        ) : (
          <div className="pull-grid">
            {weekends.map((weekend) => {
              const weekendPicks = picks.filter((p) => p.weekend === weekend);
              const myPick = weekendPicks.find((p) => p.player === playerName) || null;
              return (
                <WeekendCard
                  key={weekend}
                  weekend={weekend}
                  picks={weekendPicks}
                  myPick={myPick}
                  playerName={playerName}
                  onPick={handlePick}
                />
              );
            })}
          </div>
        )}

        <div className="pull-footer">
          PULL. — Made for the group. Updates in real time.
        </div>
      </div>
    </div>
  );
};

export default Pull;
