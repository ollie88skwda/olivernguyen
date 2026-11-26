import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bot, CircleCheck, CircleDashed, CircleDot, CircleX, FlaskConical, FolderKanban, Gauge, GitCommitHorizontal,
  Inbox, LayoutDashboard, Menu, MessageSquareWarning, RefreshCw, ShieldCheck, Wrench, X,
} from 'lucide-react';
import { UserButton } from '@clerk/react';
import { apiFetch } from '../../auth/api';
import './verifier.css';

// /verifier — dashboard for The Verifier loop (github.com/ollie88skwda/the-verifier).
// Read-only view of snapshot.json plus queued actions (approve / reject / label)
// that the loop on the Mac applies on its next cycle.

const POLL_MS = 60_000;

const VIEWS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'proposals', label: 'Proposals', icon: Inbox },
  { key: 'experiments', label: 'Experiments', icon: FlaskConical },
  { key: 'sessions', label: 'Sessions', icon: Bot },
  { key: 'feed', label: 'Pushback', icon: MessageSquareWarning },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'setup', label: 'Setup changes', icon: GitCommitHorizontal },
  { key: 'repairs', label: 'Repairs', icon: Wrench },
  { key: 'self', label: 'Verifier health', icon: ShieldCheck },
];

// ---------- formatting ----------
const fmt = (v, unit) => {
  if (v == null || Number.isNaN(v)) return '—';
  if (unit === 'pct') return `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
  if (unit === 'usd') return v >= 100 ? `$${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`;
  if (unit === 'count') return Math.round(v).toLocaleString();
  return v.toFixed(2);
};
const ago = (iso) => {
  if (!iso) return '';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};
const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');

function delta(def, cur, prev) {
  if (cur == null || prev == null || prev === 0) return { text: '—', cls: 'vf-flat' };
  const rel = (cur - prev) / Math.abs(prev);
  if (Math.abs(rel) < 0.03) return { text: 'flat', cls: 'vf-flat' };
  const good = def.better === 'lower' ? rel < 0 : rel > 0;
  return { text: `${rel > 0 ? '+' : ''}${Math.round(rel * 100)}% vs prior 7d`, cls: good ? 'vf-good' : 'vf-bad' };
}

// ---------- small pieces ----------
function Spark({ values, color = 'var(--vf-accent)' }) {
  const pts = values.map((v) => (v == null ? null : v));
  const nums = pts.filter((v) => v != null);
  if (nums.length < 2) return <svg className="vf-spark" />;
  const min = Math.min(...nums), max = Math.max(...nums), span = max - min || 1;
  const step = 100 / (pts.length - 1);
  let d = '';
  pts.forEach((v, i) => {
    if (v == null) return;
    const y = 24 - ((v - min) / span) * 22;
    d += `${d ? 'L' : 'M'}${(i * step).toFixed(2)},${y.toFixed(2)}`;
  });
  return (
    <svg className="vf-spark" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const STATUS = {
  proposed: { icon: CircleDashed, color: 'var(--vf-text-3)', label: 'Proposed' },
  approved: { icon: CircleDot, color: 'var(--vf-yellow)', label: 'Approved' },
  active: { icon: CircleDot, color: 'var(--vf-yellow)', label: 'In trial' },
  kept: { icon: CircleCheck, color: 'var(--vf-green)', label: 'Kept' },
  reverted: { icon: CircleX, color: 'var(--vf-red)', label: 'Reverted' },
  revert_pending: { icon: CircleX, color: 'var(--vf-orange)', label: 'Revert pending' },
  inconclusive: { icon: CircleDashed, color: 'var(--vf-text-4)', label: 'Inconclusive' },
  rejected: { icon: CircleX, color: 'var(--vf-text-4)', label: 'Rejected' },
};
function StatusIcon({ status, size = 14 }) {
  const s = STATUS[status] || STATUS.proposed;
  const I = s.icon;
  return <I width={size} height={size} color={s.color} aria-label={s.label} />;
}

const HARNESS_COLOR = { pi: '#5e6ad2', claude: '#d97757', hermes: '#4cb782' };
function Harness({ h }) {
  return <span className="vf-chip"><span className="vf-dot" style={{ background: HARNESS_COLOR[h] || '#888' }} />{h}</span>;
}

function scoreLine(sc) {
  if (!sc) return null;
  return `outcome ${sc.outcome}/3 · verified ${sc.verified}/2 · autonomy ${sc.autonomy}/3`;
}
function outcomeColor(sc) {
  if (!sc) return 'var(--vf-text-4)';
  return sc.outcome >= 3 ? 'var(--vf-green)' : sc.outcome === 2 ? 'var(--vf-yellow)' : 'var(--vf-red)';
}

// ---------- charts ----------
function Area({ values, color = 'var(--vf-accent)', height = 44 }) {
  const id = React.useId().replace(/:/g, '');
  const nums = values.filter((v) => v != null);
  if (nums.length < 2) return <svg className="vf-area" style={{ height }} />;
  const min = Math.min(...nums), max = Math.max(...nums), span = max - min || 1;
  const step = 100 / (values.length - 1);
  const pts = values.map((v, i) => (v == null ? null : [i * step, 38 - ((v - min) / span) * 34]));
  const real = pts.filter(Boolean);
  const line = real.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('');
  const fill = `${line}L${real[real.length - 1][0].toFixed(2)},40L${real[0][0].toFixed(2)},40Z`;
  return (
    <svg className="vf-area" style={{ height }} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

// Trend colour: green when the last week moved the good way, red when it moved the bad way.
function trend(def, cur, prev) {
  if (cur == null || prev == null || prev === 0) return { pct: null, tone: 'flat' };
  const rel = (cur - prev) / Math.abs(prev);
  if (Math.abs(rel) < 0.03) return { pct: 0, tone: 'flat' };
  const good = def.better === 'lower' ? rel < 0 : rel > 0;
  return { pct: Math.round(rel * 100), tone: good ? 'good' : 'bad' };
}
const TONE_COLOR = { good: 'var(--vf-green)', bad: 'var(--vf-red)', flat: 'var(--vf-accent)' };

function Pill({ t }) {
  if (t.pct == null) return <span className="vf-pill" data-tone="flat">no data</span>;
  if (t.pct === 0) return <span className="vf-pill" data-tone="flat">flat</span>;
  const Arrow = t.pct > 0 ? ArrowUpRight : ArrowDownRight;
  // Past +200% a percentage stops meaning much; show it as a multiple instead.
  const label = t.pct >= 200 ? `${Math.round(t.pct / 100 + 1)}×` : `${Math.abs(t.pct)}%`;
  return <span className="vf-pill" data-tone={t.tone}><Arrow width={12} height={12} />{label}</span>;
}

function Kpi({ icon: Icon, label, value, sub, t, series, onClick }) {
  return (
    <button className="vf-kpi" onClick={onClick}>
      <div className="vf-kpi-top">
        <span className="vf-kpi-icon" data-tone={t.tone}><Icon width={15} height={15} /></span>
        <span className="vf-kpi-label">{label}</span>
        <Pill t={t} />
      </div>
      <div className="vf-kpi-value">{value}</div>
      <div className="vf-kpi-sub">{sub}</div>
      <Area values={series} color={TONE_COLOR[t.tone]} height={48} />
    </button>
  );
}

function DailyChart({ days }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...days.map((d) => d.roots));
  const top = Math.ceil(max / 5) * 5;
  const ticks = [top, Math.round(top / 2), 0];
  const weekStart = days.length - 7;
  const h = hover != null ? days[hover] : null;
  return (
    <div className="vf-card vf-chart">
      <div className="vf-chart-head">
        <div>
          <div className="vf-chart-title">Tasks per day</div>
          <div className="vf-faint">Tasks you started, last 6 weeks. This week is highlighted.</div>
        </div>
        <div className="vf-chart-readout">
          {h ? (<><strong>{h.roots}</strong> tasks · {h.sessions} sessions · {fmt(h.cost, 'usd')}<span className="vf-faint"> · {shortDate(h.date)}</span></>)
            : <span className="vf-faint">Hover or tap a bar</span>}
        </div>
      </div>
      <div className="vf-chart-plot">
        <div className="vf-chart-y">{ticks.map((t) => <span key={t}>{t}</span>)}</div>
        <div className="vf-chart-area" onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => <div key={t} className="vf-grid" style={{ bottom: `${(t / top) * 100}%` }} />)}
          <div className="vf-chart-bars">
            {days.map((d, i) => (
              <button
                key={d.date}
                className="vf-cbar"
                data-week={i >= weekStart ? 'true' : undefined}
                data-active={hover === i ? 'true' : undefined}
                aria-label={`${shortDate(d.date)}: ${d.roots} tasks`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(i)}
              >
                <span style={{ height: `${(d.roots / top) * 100}%` }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="vf-chart-x"><span>{shortDate(days[0]?.date)}</span><span>{shortDate(days[Math.floor(days.length / 2)]?.date)}</span><span>Today</span></div>
    </div>
  );
}

const KIND_LABEL = { root: 'Your tasks', worker: 'Workers', eval: 'Evals', cron: 'Scheduled', watcher: 'Watchers' };
const KIND_COLOR = { root: '#5e6ad2', worker: '#8b5cf6', eval: '#d97757', cron: '#4cb782', watcher: '#f2c94c' };
function Spend({ snap }) {
  const byKind = {};
  for (const r of snap.harness) byKind[r.kind] = (byKind[r.kind] || 0) + r.cost;
  const rows = Object.entries(byKind).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, c]) => a + c, 0) || 1;
  const projects = [...snap.projects].sort((a, b) => b.cost - a.cost).slice(0, 5);
  const pmax = Math.max(1, ...projects.map((p) => p.cost));
  return (
    <div className="vf-card vf-spend">
      <div className="vf-chart-title">Where compute goes</div>
      <div className="vf-faint">Last 7 days · {fmt(total, 'usd')} total</div>
      <div className="vf-stack">
        {rows.map(([k, c]) => <span key={k} style={{ width: `${(c / total) * 100}%`, background: KIND_COLOR[k] || '#888' }} title={`${KIND_LABEL[k] || k}: ${fmt(c, 'usd')}`} />)}
      </div>
      <div className="vf-legend">
        {rows.map(([k, c]) => (
          <div key={k} className="vf-legend-row">
            <span className="vf-dot" style={{ background: KIND_COLOR[k] || '#888' }} />
            <span>{KIND_LABEL[k] || k}</span>
            <span className="vf-faint vf-num" style={{ marginLeft: 'auto' }}>{Math.round((c / total) * 100)}%</span>
            <span className="vf-num" style={{ width: 64, textAlign: 'right' }}>{fmt(c, 'usd')}</span>
          </div>
        ))}
      </div>
      <div className="vf-spend-h">Top projects · last 14 days</div>
      {projects.map((p) => (
        <div key={p.project} className="vf-hbar">
          <span className="vf-hbar-name">{p.project}</span>
          <span className="vf-hbar-track"><span style={{ width: `${(p.cost / pmax) * 100}%` }} /></span>
          <span className="vf-num vf-muted">{fmt(p.cost, 'usd')}</span>
        </div>
      ))}
    </div>
  );
}

function ExperimentStrip({ snap, open, go }) {
  const running = snap.proposals.filter((p) => p.status === 'active');
  const waiting = snap.proposals.filter((p) => p.status === 'proposed');
  if (!running.length && !waiting.length) return null;
  return (
    <div className="vf-exp-grid">
      {waiting.length > 0 && (
        <button className="vf-card vf-exp vf-exp-wait" onClick={() => go('proposals')}>
          <div className="vf-exp-top"><Inbox width={14} height={14} /><span>Waiting for you</span></div>
          <div className="vf-exp-big">{waiting.length}</div>
          <div className="vf-faint">proposal{waiting.length > 1 ? 's' : ''} to approve or reject</div>
        </button>
      )}
      {running.map((p) => {
        const ev = p.evidence || {};
        const day = p.trial_start ? Math.min(p.trial_days, (Date.now() - Date.parse(p.trial_start)) / 864e5) : 0;
        const tasks = ev.trialTasks ?? 0;
        const worse = (ev.guards || []).filter((g) => g.worse).length;
        return (
          <button key={p.id} className="vf-card vf-exp" onClick={() => open({ type: 'proposal', p })}>
            <div className="vf-exp-top"><FlaskConical width={14} height={14} /><span>In trial</span>
              {worse > 0 && <span className="vf-pill" data-tone="bad" style={{ marginLeft: 'auto' }}>{worse} guard{worse > 1 ? 's' : ''} worse</span>}
            </div>
            <div className="vf-exp-title">{p.title}</div>
            <div className="vf-progress"><span style={{ width: `${(day / p.trial_days) * 100}%` }} /></div>
            <div className="vf-exp-meta"><span>Day {Math.min(p.trial_days, Math.floor(day) + 1)} of {p.trial_days}</span><span>{Math.min(tasks, 15)}/15 tasks</span></div>
          </button>
        );
      })}
    </div>
  );
}

// ---------- views ----------
const HERO = [
  { key: 'corrections_per_task', icon: MessageSquareWarning, label: 'Pushback per task', sub: 'times you had to correct an agent' },
  { key: 'clean_end_rate', icon: CircleCheck, label: 'Clean finish', sub: 'tasks that ended with a real answer' },
  { key: 'cost_per_task', icon: Gauge, label: 'Compute per task', sub: 'model spend for one task you start' },
];

function Overview({ snap, open, go }) {
  const { metrics, current, previous, days } = snap;
  const def = (k) => metrics.find((m) => m.key === k);
  const last28 = days.slice(-28);
  const rootsPrevWeek = days.slice(-14, -7).reduce((a, d) => a + d.roots, 0);
  const tasksT = trend({ better: 'higher' }, current.roots, rootsPrevWeek || null);
  const rest = metrics.filter((m) => !HERO.some((h) => h.key === m.key));
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const checks = snap.self?.checks || [];
  const healthy = checks.filter((c) => c.ok === true).length;
  const known = checks.filter((c) => c.ok != null).length;
  return (
    <>
      <div className="vf-hero">
        <div>
          <h2 className="vf-hello">{hello}, Oliver</h2>
          <p className="vf-muted">Here is how your agents did over the last 7 days. Numbers come from your session logs and are estimates.</p>
        </div>
        <button className="vf-health" onClick={() => go('self')} data-ok={healthy === known ? 'true' : 'false'}>
          <span className="vf-dot" /> Verifier {healthy === known ? 'healthy' : `${known - healthy} check${known - healthy > 1 ? 's' : ''} failing`}
        </button>
      </div>

      <div className="vf-kpis">
        <Kpi icon={Bot} label="Tasks this week" value={current.roots} sub={`${current.sessions.toLocaleString()} agent sessions`} t={tasksT}
          series={last28.map((d) => d.roots)} onClick={() => go('sessions')} />
        {HERO.map((h) => {
          const m = def(h.key);
          if (!m) return null;
          return <Kpi key={h.key} icon={h.icon} label={h.label} value={fmt(current.values[h.key], m.unit)} sub={h.sub}
            t={trend(m, current.values[h.key], previous.values[h.key])} series={last28.map((d) => d[h.key])} onClick={() => open({ type: 'metric', m })} />;
        })}
      </div>

      <ExperimentStrip snap={snap} open={open} go={go} />

      <div className="vf-main-grid">
        <DailyChart days={days} />
        <Spend snap={snap} />
      </div>

      <div className="vf-section-h"><h2>Everything else</h2><span>green is better than the week before, red is worse</span></div>
      <div className="vf-minis">
        {rest.map((m) => {
          const t = trend(m, current.values[m.key], previous.values[m.key]);
          return (
            <button key={m.key} className="vf-mini" onClick={() => open({ type: 'metric', m })}>
              <div className="vf-mini-top"><span className="vf-muted">{m.label}</span><Pill t={t} /></div>
              <div className="vf-mini-value">{fmt(current.values[m.key], m.unit)}</div>
              <Area values={last28.map((d) => d[m.key])} color={TONE_COLOR[t.tone]} height={30} />
            </button>
          );
        })}
      </div>

      <div className="vf-section-h"><h2>Latest pushback</h2><span>where you had to step in</span>
        <button className="vf-link" onClick={() => go('feed')}>See all</button></div>
      <div className="vf-list">
        {snap.feed.slice(0, 6).map((t, i) => (
          <div key={i} className="vf-row">
            <span className="vf-dot" style={{ background: t.c ? 'var(--vf-red)' : 'var(--vf-yellow)' }} />
            <span className="vf-row-title">{t.text}</span>
            <span className="vf-row-meta vf-hide-sm"><span className="vf-chip">{t.project}</span></span>
            <span className="vf-row-time">{ago(t.ts)}</span>
          </div>
        ))}
        {!snap.feed.length && <div className="vf-empty">No pushback in the last 2 weeks.</div>}
      </div>
    </>
  );
}

function ProposalList({ items, open, empty }) {
  if (!items.length) return <div className="vf-list"><div className="vf-empty">{empty}</div></div>;
  const groups = {};
  for (const p of items) (groups[p.status] = groups[p.status] || []).push(p);
  const order = ['proposed', 'active', 'approved', 'revert_pending', 'kept', 'inconclusive', 'reverted', 'rejected'];
  return (
    <div className="vf-list">
      {order.filter((k) => groups[k]).map((k) => (
        <React.Fragment key={k}>
          <div className="vf-group-h"><StatusIcon status={k} />{STATUS[k].label}<span className="vf-faint">{groups[k].length}</span></div>
          {groups[k].map((p) => (
            <button key={p.id} className="vf-row" onClick={() => open({ type: 'proposal', p })}>
              <span className="vf-row-id">{p.id.slice(2, 12)}</span>
              <StatusIcon status={p.status} />
              <span className="vf-row-title">{p.title}</span>
              <span className="vf-row-meta"><span className="vf-chip vf-hide-sm">{p.target}</span><span className="vf-chip">{p.metric}</span></span>
              <span className="vf-row-time">{ago(p.created_at)}</span>
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function Sessions({ snap, open }) {
  const [filter, setFilter] = useState('all');
  const projects = useMemo(() => [...new Set(snap.recent.map((s) => s.project))], [snap]);
  const rows = snap.recent.filter((s) => filter === 'all' || s.project === filter);
  return (
    <>
      <div className="vf-actions">
        <button className="vf-chip" style={filter === 'all' ? { borderColor: 'var(--vf-accent)', color: 'var(--vf-text)' } : null} onClick={() => setFilter('all')}>All</button>
        {projects.map((p) => (
          <button key={p} className="vf-chip" style={filter === p ? { borderColor: 'var(--vf-accent)', color: 'var(--vf-text)' } : null} onClick={() => setFilter(p)}>{p}</button>
        ))}
      </div>
      <div className="vf-list">
        {rows.map((s) => (
          <button key={s.id} className="vf-row" onClick={() => open({ type: 'session', s })}>
            <span className="vf-dot" title={scoreLine(s.scores) || 'not judged'} style={{ background: outcomeColor(s.scores) }} />
            <span className="vf-row-title">{s.label || '(no opening message)'}</span>
            <span className="vf-row-meta">
              {s.corrections > 0 && <span className="vf-chip" style={{ color: 'var(--vf-red)' }}>{s.corrections} pushback</span>}
              {s.nudges > 0 && <span className="vf-chip vf-hide-sm" style={{ color: 'var(--vf-yellow)' }}>{s.nudges} nudge</span>}
              <span className="vf-hide-sm">{s.project}</span>
              <span className="vf-hide-sm"><Harness h={s.harness} /></span>
            </span>
            <span className="vf-row-time">{ago(s.started_at)}</span>
          </button>
        ))}
        {!rows.length && <div className="vf-empty">No sessions.</div>}
      </div>
    </>
  );
}

function Feed({ snap }) {
  return (
    <div className="vf-list">
      {snap.feed.map((t, i) => (
        <div key={i} className="vf-row" style={{ alignItems: 'flex-start' }}>
          <span className="vf-dot" style={{ marginTop: 6, background: t.c ? 'var(--vf-red)' : 'var(--vf-yellow)' }} title={t.c ? 'correction' : 'nudge'} />
          <span style={{ flex: 1, minWidth: 0, color: 'var(--vf-text-2)', wordBreak: 'break-word' }}>{t.text}</span>
          <span className="vf-row-meta vf-hide-sm">{t.project}</span>
          <span className="vf-row-time">{ago(t.ts)}</span>
        </div>
      ))}
      {!snap.feed.length && <div className="vf-empty">Nothing yet.</div>}
    </div>
  );
}

function Projects({ snap }) {
  return (
    <div className="vf-list vf-table-wrap">
      <table className="vf-table">
        <thead><tr><th>Project</th><th className="r">Tasks</th><th className="r">Sessions</th><th className="r">Pushback / task</th><th className="r">Nudges / task</th><th className="r">Tool errors</th><th className="r">Compute</th><th className="r">Last</th></tr></thead>
        <tbody>
          {snap.projects.map((p) => (
            <tr key={p.project}>
              <td>{p.project}</td><td className="r">{p.roots}</td><td className="r">{p.sessions}</td>
              <td className="r">{fmt(p.corrections_per_task)}</td><td className="r">{fmt(p.nudges_per_task)}</td>
              <td className="r">{fmt(p.tool_error_rate, 'pct')}</td><td className="r">{fmt(p.cost, 'usd')}</td><td className="r vf-faint">{ago(p.last)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Setup({ snap }) {
  return (
    <div className="vf-list">
      {snap.setup.map((c) => (
        <div key={c.sha} className="vf-row">
          <span className="vf-row-id">{c.sha.slice(0, 7)}</span>
          <GitCommitHorizontal width={14} height={14} color="var(--vf-text-3)" />
          <span className="vf-row-title">{c.subject}</span>
          <span className="vf-row-meta vf-hide-sm">{c.repo}</span>
          <span className="vf-row-time">{ago(c.ts)}</span>
        </div>
      ))}
      {!snap.setup.length && <div className="vf-empty">No setup commits found.</div>}
    </div>
  );
}

function Repairs({ snap }) {
  const color = { verified: 'var(--vf-green)', repaired: 'var(--vf-yellow)', open: 'var(--vf-orange)', blocked: 'var(--vf-red)' };
  return (
    <div className="vf-list">
      {snap.repairs.map((r) => (
        <div key={r.incident_id} className="vf-row">
          <span className="vf-dot" style={{ background: color[r.status] || 'var(--vf-text-4)' }} title={r.status} />
          <span className="vf-row-title">{r.summary}</span>
          <span className="vf-row-meta vf-hide-sm"><span className="vf-chip">{r.component}</span><span className="vf-chip">{r.status}</span></span>
          <span className="vf-row-time">{ago(r.ts)}</span>
        </div>
      ))}
    </div>
  );
}

function Self({ snap }) {
  const s = snap.self;
  return (
    <>
      <div className="vf-banner">
        <ShieldCheck width={15} height={15} style={{ flexShrink: 0, marginTop: 2 }} color="var(--vf-accent)" />
        <div>The Verifier grades itself with the same rules it applies to your setup: is its data fresh, does its judge agree with you, and do its experiments actually work. A gray check means not enough evidence yet.</div>
      </div>
      <div className="vf-list">
        {s.checks.map((c) => (
          <div key={c.key} className="vf-row">
            {c.ok == null ? <CircleDashed width={14} height={14} color="var(--vf-text-4)" /> : c.ok ? <CircleCheck width={14} height={14} color="var(--vf-green)" /> : <CircleX width={14} height={14} color="var(--vf-red)" />}
            <span className="vf-row-title">{c.label}</span>
            <span className="vf-row-meta vf-num">{c.value}</span>
          </div>
        ))}
        <div className="vf-row"><Bot width={14} height={14} color="var(--vf-text-3)" /><span className="vf-row-title">Verifier's own compute, 7 days</span><span className="vf-row-meta">{fmt(s.verifierCost7d, 'usd')}</span></div>
      </div>
      <div className="vf-section-h"><h2>Recent loop runs</h2><span>detector v{snap.versions.detector} · metrics v{snap.versions.metrics} · rubric v{snap.versions.rubric}</span></div>
      <div className="vf-list">
        {snap.runs.slice(0, 15).map((r, i) => (
          <div key={i} className="vf-row">
            <span className="vf-dot" style={{ background: r.ok ? 'var(--vf-green)' : 'var(--vf-red)' }} />
            <span className="vf-row-title">{r.stage}</span>
            <span className="vf-row-meta vf-num">{(r.duration_ms / 1000).toFixed(1)}s</span>
            <span className="vf-row-time">{ago(r.ts)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// Line-level diff of a find/replace edit, enough to read a prompt change on a phone.
function diffLines(find, replace) {
  const a = (find || '').split('\n'), b = (replace || '').split('\n');
  const out = [];
  for (const l of a) if (!b.includes(l)) out.push(<div key={`-${out.length}`} style={{ color: 'var(--vf-red)' }}>- {l}</div>);
  for (const l of b) out.push(a.includes(l)
    ? <div key={`=${out.length}`} className="vf-faint">  {l}</div>
    : <div key={`+${out.length}`} style={{ color: 'var(--vf-green)' }}>+ {l}</div>);
  return out;
}

// ---------- detail panel ----------
function Peek({ item, onClose, act, snap }) {
  const [note, setNote] = useState('');
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!item) return null;
  let title = '', body = null;

  if (item.type === 'metric') {
    const m = item.m;
    title = m.label;
    body = (
      <>
        <h3>{m.label}</h3>
        <dl className="vf-props">
          <dt>Last 7 days</dt><dd>{fmt(snap.current.values[m.key], m.unit)}</dd>
          <dt>Prior 7 days</dt><dd>{fmt(snap.previous.values[m.key], m.unit)}</dd>
          <dt>Better when</dt><dd>{m.better}</dd>
        </dl>
        <div className="vf-prose">{m.description}</div>
        <div className="vf-prose"><h4>Caution</h4>A single metric moving does not prove the setup got better or worse. Project mix, model releases and how hard the week's work was all move these numbers. Experiments compare windows with confidence intervals and guard metrics before deciding anything.</div>
      </>
    );
  }

  if (item.type === 'proposal') {
    const p = snap.proposals.find((x) => x.id === item.p.id) || item.p;
    const starting = (snap.pending || []).some((a) => a.id === p.id && a.action === 'approve');
    const ev = p.evidence;
    title = p.id;
    body = (
      <>
        <h3>{p.title}</h3>
        <dl className="vf-props">
          <dt>Status</dt><dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}><StatusIcon status={p.status} />{STATUS[p.status]?.label}</dd>
          <dt>Target</dt><dd>{p.target}</dd>
          <dt>Measured by</dt><dd>{p.metric} ({p.direction} is better)</dd>
          <dt>Guards</dt><dd>{p.guards || '—'}</dd>
          <dt>Trial</dt><dd>{p.trial_days} days{p.trial_start ? `, started ${shortDate(p.trial_start)}` : ''}</dd>
          {p.decision && (<><dt>Decision</dt><dd>{p.decision}</dd></>)}
          {p.note && (<><dt>Your note</dt><dd>{p.note}</dd></>)}
        </dl>
        {p.last_error && p.status === 'proposed' && (
          <div className="vf-prose" style={{ color: 'var(--vf-red)' }}>
            <h4>Last approve did not start</h4>{p.last_error.replace(/^\S+ /, '')}
          </div>
        )}
        {starting && (
          <div className="vf-prose"><h4>Starting…</h4>Your approval reached the Mac and is being applied. This page updates by itself.</div>
        )}
        {p.status === 'proposed' && !starting && (
          <>
            <textarea className="vf-textarea" placeholder="Optional note (why, or what to change)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="vf-actions">
              <button className="vf-btn vf-btn-primary" onClick={() => act({ action: 'approve', id: p.id, note })}>Approve and start trial</button>
              <button className="vf-btn" onClick={() => act({ action: 'reject', id: p.id, note })}>Reject</button>
            </div>
          </>
        )}
        {['active', 'revert_pending', 'kept'].includes(p.status) && (
          <div className="vf-actions"><button className="vf-btn" onClick={() => act({ action: 'revert', id: p.id, note: 'reverted from dashboard' })}>Revert</button></div>
        )}
        <div className="vf-prose">
          <h4>What the Verifier saw</h4>{p.finding}
          <h4>Hypothesis</h4>{p.hypothesis}
          <h4>Change</h4>
        </div>
        <div className="vf-code" style={{ whiteSpace: 'pre-wrap' }}>{p.change}</div>
        {p.patch && (
          <div className="vf-prose">
            <h4>Exact edits {p.patch_error ? <span style={{ color: 'var(--vf-red)' }}>· cannot apply: {p.patch_error}</span> : <span className="vf-good">· checked, applies cleanly</span>}</h4>
            {JSON.parse(p.patch).map((e, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="vf-faint" style={{ fontSize: 12, marginBottom: 4 }}>{e.repo.replace('/Users/Ollie/', '~/')}/{e.file}</div>
                <div className="vf-code" style={{ whiteSpace: 'pre-wrap' }}>{diffLines(e.find, e.replace)}</div>
              </div>
            ))}
            Approving commits this to git so it can be reverted in one tap.
          </div>
        )}
        {ev && (
          <div className="vf-prose">
            <h4>Trial evidence</h4>
            {ev.reason}{'\n'}
            {ev.target && `Target ${p.metric}: ${fmt(ev.target.baseline)} → ${fmt(ev.target.trial)} (95% CI of change ${fmt(ev.target.lo)} to ${fmt(ev.target.hi)})\n`}
            {(ev.guards || []).map((g) => `Guard ${g.key}: ${fmt(g.baseline)} → ${fmt(g.trial)}${g.worse ? '  WORSE' : ''}`).join('\n')}
          </div>
        )}
      </>
    );
  }

  if (item.type === 'session') {
    const s = item.s;
    const sc = s.scores;
    title = s.project;
    body = (
      <>
        <h3>{s.label || '(no opening message)'}</h3>
        <dl className="vf-props">
          <dt>Project</dt><dd>{s.project}</dd>
          <dt>Harness</dt><dd><Harness h={s.harness} /> <span className="vf-muted">{s.model}</span></dd>
          <dt>Started</dt><dd>{new Date(s.started_at).toLocaleString()}</dd>
          <dt>Your messages</dt><dd>{s.human_turns} ({s.corrections} pushback, {s.nudges} nudges)</dd>
          <dt>Agent work</dt><dd>{s.tool_calls} tool calls, {s.tool_errors} errors, {s.delegations} workers</dd>
          <dt>Compute</dt><dd>{fmt(s.cost_usd, 'usd')}</dd>
          <dt>Finished cleanly</dt><dd>{s.ended_cleanly ? 'yes' : 'no'}</dd>
        </dl>
        {sc ? (
          <div className="vf-prose">
            <h4>Judge ({s.judge_model})</h4>
            {scoreLine(sc)} · communication {sc.communication}/2 · avoidable interventions {sc.avoidable_interventions}{'\n'}
            Main problem: {sc.root_cause}{'\n'}Suggested setup fix: {sc.setup_fix}
            <div className="vf-actions" style={{ marginTop: 10 }}>
              <button className="vf-btn" onClick={() => act({ action: 'label', id: s.id, agree: true })}>{s.my_label === 1 ? '✓ ' : ''}Judge is right</button>
              <button className="vf-btn" onClick={() => act({ action: 'label', id: s.id, agree: false })}>{s.my_label === 0 ? '✓ ' : ''}Judge is wrong</button>
            </div>
          </div>
        ) : <div className="vf-prose vf-faint">Not judged yet. The daily run grades a sample of sessions.</div>}
        <div className="vf-prose"><h4>Your messages</h4></div>
        {s.turns.map((t, i) => (
          <div key={i} className="vf-turn">
            {t.c ? <span className="vf-chip" style={{ color: 'var(--vf-red)', marginRight: 6 }}>pushback</span> : null}
            {t.n ? <span className="vf-chip" style={{ color: 'var(--vf-yellow)', marginRight: 6 }}>nudge</span> : null}
            {t.text}
          </div>
        ))}
        <div className="vf-prose"><h4>Agent's last message</h4>{s.final_reply || '—'}</div>
      </>
    );
  }

  return (
    <>
      <div className="vf-peek-scrim" onClick={onClose} />
      <aside className="vf-peek" role="dialog" aria-label={title}>
        <div className="vf-peek-h">
          <span className="vf-muted">{title}</span>
          <button className="vf-menu-btn" style={{ display: 'inline-grid', marginLeft: 'auto' }} onClick={onClose} aria-label="Close"><X width={16} height={16} /></button>
        </div>
        <div className="vf-peek-b">{body}</div>
      </aside>
    </>
  );
}

// ---------- page ----------
export default function Verifier() {
  const [snap, setSnap] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.location.hash.slice(1)) || 'overview');
  const [peek, setPeek] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSnap(await apiFetch('/api/verifier/snapshot'));
      setError(null);
    } catch (e) {
      setError(e.status === 403 ? 'This account is not allowed to see the Verifier.' : e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => { window.location.hash = view; setNavOpen(false); }, [view]);

  // After a tap, check back every few seconds until the action has been applied
  // (or failed), so the result shows up without a manual refresh.
  const watch = useCallback((id, before) => {
    let n = 0;
    const tick = async () => {
      n += 1;
      let s;
      try { s = await apiFetch('/api/verifier/snapshot'); setSnap(s); } catch { s = null; }
      const p = s?.proposals.find((x) => x.id === id);
      // Done only when the result is visible: a new status or a new error.
      const changed = p && p.status !== before.status;
      const failed = p && p.last_error && p.last_error !== before.last_error;
      if (changed || failed) {
        setToast(changed ? (p.status === 'active' ? 'Trial started. It is under Experiments now.' : `Done: ${p.status}`) : 'That did not start. The reason is shown on the proposal.');
        setTimeout(() => setToast(null), 5000);
        return;
      }
      if (n < 60) setTimeout(tick, 3000);
      else setToast(null);
    };
    setTimeout(tick, 1500);
  }, []);

  const act = useCallback(async (body) => {
    const before = snap?.proposals.find((x) => x.id === body.id) || {};
    try {
      await apiFetch('/api/verifier/action', { method: 'POST', body: JSON.stringify(body) });
      setToast(body.action === 'approve' ? 'Starting…' : 'Sent.');
      setSnap((s) => s && { ...s, pending: [...(s.pending || []), { action: body.action, id: body.id }] });
      if (body.action !== 'label') watch(body.id, before);
      else setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast(`Failed: ${e.message}`);
      setTimeout(() => setToast(null), 5000);
    }
  }, [snap, watch]);

  if (error && !snap) return <div className="vf"><div className="vf-loading">{error}</div></div>;
  if (!snap) return <div className="vf"><div className="vf-loading">Loading the Verifier…</div></div>;

  const counts = {
    proposals: snap.proposals.filter((p) => p.status === 'proposed').length,
    experiments: snap.proposals.filter((p) => ['active', 'approved', 'revert_pending'].includes(p.status)).length,
    sessions: snap.recent.length,
    feed: snap.feed.length,
  };
  const current = VIEWS.find((v) => v.key === view) || VIEWS[0];
  const experiments = snap.proposals.filter((p) => !['proposed', 'rejected'].includes(p.status));

  return (
    <div className="vf">
      <nav className="vf-side" data-open={navOpen} aria-label="Verifier">
        <div className="vf-ws"><span className="vf-ws-logo">V</span>The Verifier</div>
        {VIEWS.map((v, i) => (
          <React.Fragment key={v.key}>
            {i === 3 && <div className="vf-nav-label">Activity</div>}
            {i === 8 && <div className="vf-nav-label">System</div>}
            <button className="vf-nav-item" aria-current={view === v.key ? 'page' : undefined} onClick={() => setView(v.key)}>
              <v.icon />{v.label}
              {counts[v.key] ? <span className="vf-nav-count">{counts[v.key]}</span> : null}
            </button>
          </React.Fragment>
        ))}
        <div className="vf-side-foot"><UserButton /><span>updated {ago(snap.generatedAt) === 'now' ? 'just now' : `${ago(snap.generatedAt)} ago`}</span></div>
      </nav>
      {navOpen && <div className="vf-peek-scrim" style={{ zIndex: 25 }} onClick={() => setNavOpen(false)} />}

      <main className="vf-main">
        <header className="vf-top">
          <button className="vf-menu-btn" onClick={() => setNavOpen(true)} aria-label="Menu"><Menu width={16} height={16} /></button>
          <span className="vf-top-crumb vf-hide-sm">Verifier ›</span>
          <h1>{current.label}</h1>
          <div className="vf-top-right">
            <span className="vf-hide-sm">{error ? `refresh failed: ${error}` : (ago(snap.generatedAt) === "now" ? "updated just now" : `updated ${ago(snap.generatedAt)} ago`)}</span>
            <button className="vf-menu-btn" style={{ display: 'inline-grid' }} onClick={load} aria-label="Refresh" disabled={loading}><RefreshCw width={14} height={14} /></button>
          </div>
        </header>
        <div className="vf-body">
          {view === 'overview' && <Overview snap={snap} open={setPeek} go={setView} />}
          {view === 'proposals' && <ProposalList items={snap.proposals.filter((p) => p.status === 'proposed' || p.status === 'rejected')} open={setPeek} empty="No proposals yet. The weekly review writes them here." />}
          {view === 'experiments' && <ProposalList items={experiments} open={setPeek} empty="No experiments yet. Approve a proposal to start one." />}
          {view === 'sessions' && <Sessions snap={snap} open={setPeek} />}
          {view === 'feed' && <Feed snap={snap} />}
          {view === 'projects' && <Projects snap={snap} />}
          {view === 'setup' && <Setup snap={snap} />}
          {view === 'repairs' && <Repairs snap={snap} />}
          {view === 'self' && <Self snap={snap} />}
        </div>
      </main>
      <Peek item={peek} onClose={() => setPeek(null)} act={act} snap={snap} />
      {toast && <div className="vf-toast" role="status">{toast}</div>}
    </div>
  );
}
