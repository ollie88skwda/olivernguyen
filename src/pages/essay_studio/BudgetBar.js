import React from 'react';

// The limit sits at 46% of the track, not at the end. Everything to the right of
// the wall is overflow, which is the number that actually matters when four
// drafts are all long. 54% of headroom shows an overrun up to +411 words on the
// same linear scale before it has to clip.
const WALL = 46;
const MAX_OVER = 100 - WALL - 1;

export function budgetGeometry(count, limit) {
  const words = Number(count) || 0;
  const ceiling = Number(limit) || 0;
  if (!ceiling) {
    return { fill: 0, over: 0, wall: WALL, delta: 0, isOver: false, clipped: false, hasLimit: false };
  }
  const unit = WALL / ceiling;
  const overWords = Math.max(words - ceiling, 0);
  const wanted = overWords * unit;
  return {
    fill: Math.min(words, ceiling) * unit,
    over: Math.min(wanted, MAX_OVER),
    wall: WALL,
    delta: words - ceiling,
    isOver: words > ceiling,
    clipped: wanted > MAX_OVER,
    hasLimit: true,
  };
}

export function BudgetTrack({ count, limit, compact = false }) {
  const geometry = budgetGeometry(count, limit);
  return (
    <span className={compact ? 'es-track es-track-compact' : 'es-track'} aria-hidden="true">
      <span className="es-track-fill" style={{ width: `${geometry.fill}%` }} />
      {geometry.isOver && (
        <span className="es-track-over" style={{ left: `${geometry.wall}%`, width: `${geometry.over}%` }} />
      )}
      {geometry.hasLimit && <span className="es-track-wall" style={{ left: `${geometry.wall}%` }} />}
      {geometry.clipped && <span className="es-track-clip">»</span>}
    </span>
  );
}

// `showDelta` is off in the Writing Room, where the footer already spells the
// overrun out as an instruction ("cut 17 words").
export function BudgetReadout({ count, limit, showDelta = true }) {
  const geometry = budgetGeometry(count, limit);
  if (!geometry.hasLimit) return <span className="es-count">{count} words</span>;
  return (
    <span className={geometry.isOver ? 'es-count es-count-over' : 'es-count'}>
      {count} / {limit}
      {geometry.isOver && showDelta ? ` · +${geometry.delta}` : ''}
    </span>
  );
}

export function BudgetBar({ label, count, limit, onClick, title }) {
  const geometry = budgetGeometry(count, limit);
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      className={onClick ? 'es-budget-row es-budget-row-link' : 'es-budget-row'}
      onClick={onClick}
      title={title}
      aria-label={
        geometry.hasLimit
          ? `${label}: ${count} of ${limit} words, ${geometry.isOver ? `${geometry.delta} over` : `${-geometry.delta} remaining`}`
          : `${label}: ${count} words`
      }
    >
      <span className="es-budget-name">{label}</span>
      <BudgetTrack count={count} limit={limit} />
      <BudgetReadout count={count} limit={limit} />
    </Wrapper>
  );
}

export default BudgetBar;
