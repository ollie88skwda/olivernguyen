// Single source of truth for every technical term used on /major.
//
// Tooltip.js reads it for the inline bubbles and S9 reads it for the full list, so a
// definition can never drift between the two. Insertion order is the display order.
//
// Voice rules for anything added here: plain words, one to three short sentences, no em
// dashes, no jargon used to explain jargon.
export const GLOSSARY = {
  'weighted-matrix': {
    label: 'Weighted matrix',
    definition:
      'Score each option on each thing you care about, multiply by how much you care, add it up. That is the whole idea. Everything else on this page is a check on that number.',
  },
  weight: {
    label: 'Weight',
    definition:
      'How much a criterion counts, as a share of 100%. If enjoyment is 16%, it can contribute at most 16 points of the final 100.',
  },
  range: {
    label: 'Range instead of a score',
    definition:
      'You enter a low, a best guess and a high. Between 6 and 9, probably 7. The width of that range is you telling the page how sure you are, and the page uses it.',
  },
  'monte-carlo': {
    label: 'Monte Carlo, or 10,000 runs',
    definition:
      'Named after the casino. The page rolls dice inside your ranges and scores the majors, 10,000 times over, then counts how often each one won. It asks who wins most across every reasonable version of your opinions, instead of betting everything on one set of numbers.',
  },
  distribution: {
    label: 'Distribution',
    definition:
      'The spread of scores one major got across the 10,000 runs. A tall narrow shape means the score barely moved. A wide flat shape means it depended heavily on which way your uncertain numbers fell.',
  },
  confidence: {
    label: 'Confidence, the dial',
    definition:
      'How lopsided those 10,000 runs were, on a 0 to 100 scale. 100 means one major won every single time. 0 means everything tied. Under 55 the page calls it a coin flip. It is not the same thing as the win rate.',
  },
  'flip-fraction': {
    label: 'Changes the winner X% of the time',
    definition:
      'For a question you have not answered yet, the page simulates finding out the answer, then counts how often that flips which major comes first. A high number means go research it now. Zero means the answer does not depend on it and you can skip it.',
  },
  fragility: {
    label: 'Fragility',
    definition:
      'How much you would have to change your mind before a different major wins. Nine points on enjoyment means caring nine percentage points more about enjoyment flips the result. Small numbers mean the answer is delicate.',
  },
  ahp: {
    label: 'Pairwise comparison, or AHP',
    definition:
      'Analytic Hierarchy Process. Instead of typing weights, you answer a stack of this or that, and by how much questions. The page works out your weights from the pattern of your answers, which is far more reliable than guessing percentages.',
  },
  consistency: {
    label: 'Consistency',
    definition:
      'A check that your matchup answers can all be true at once. If A beats B, B beats C, and C beats A, something is wrong. Under 0.10 is fine. Above it, the page quotes the three answers causing the problem.',
  },
  'option-value': {
    label: 'Option value',
    definition:
      'What it is worth to be able to change your mind later. Two options can score the same today while one traps you and the other does not. When you are unsure, the escapable one is better.',
  },
  'head-to-head': {
    label: 'Head to head',
    definition:
      'Ignore the third major and count only these two across the 10,000 runs. 85 to 15 is a real preference. 57 to 43 is close enough to a coin toss that you should not let it decide anything yet.',
  },
  premortem: {
    label: 'Pre-mortem',
    definition:
      'Imagine the choice already failed, then explain why. It surfaces risks a scoring table never will, because you get to write "I would resent it" instead of forcing everything into a number.',
  },
};

export default GLOSSARY;
