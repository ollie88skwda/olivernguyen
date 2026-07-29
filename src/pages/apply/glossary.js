// Single source of truth for every technical term used on /apply.
//
// components/Tooltip.js reads it through GlossaryProvider for the inline bubbles, and S9
// reads it for the full list, so a definition can never drift between the two. Insertion
// order is the display order.
//
// Voice rules for anything added here: plain words, one to three short sentences, no em
// dashes, no jargon used to explain jargon. Terms that /major already defines keep the
// same wording where the meaning is identical.
export const GLOSSARY = {
  portfolio: {
    label: 'Portfolio, not a ranking',
    definition:
      'You are not picking one school, you are picking a set of about fifteen. A set can be bad even when every school in it is good, because eight reaches can all say no on the same afternoon. This page scores the set.',
  },
  'expected-best-offer': {
    label: 'Expected best offer',
    definition:
      'The score of the best school that actually admits you, averaged over every way the season could go. It is zero in the versions where nobody says yes. This is the number the page is trying to make big.',
  },
  correlation: {
    label: 'Correlation, or rho',
    definition:
      'How much the same underlying thing drives every decision. The same transcript and the same essays go to every school, so if one committee is unimpressed the others usually are too. Zero means fifteen independent coin flips. One means every school effectively makes the same call.',
  },
  independence: {
    label: 'The independence mistake',
    definition:
      'Multiplying your rejection odds together, which is what every chance calculator does. It assumes the schools decide separately. They do not, and the error is largest exactly where it hurts, in the odds of being shut out everywhere.',
  },
  'marginal-value': {
    label: 'Marginal value',
    definition:
      'How much adding one more school raises your expected best offer. Late additions add very little, because the outcomes they cover are already covered. When this number goes flat, stop adding schools.',
  },
  'effort-budget': {
    label: 'Effort budget',
    definition:
      'How many supplemental essays you are willing to write. It is the real constraint on the list, not ambition. Every school is competing for a slot inside it.',
  },
  tier: {
    label: 'Reach, target, likely',
    definition:
      'Rough bands by how likely you are to get in. Above 60% is likely, 25% to 60% is target, below that is a reach. Round numbers on purpose, because the underlying estimate is not sharp enough to justify anything finer.',
  },
  'shut-out': {
    label: 'Shut out',
    definition:
      'No admission anywhere. It is the one outcome the whole list exists to prevent, and it is the number that independence-based estimates understate the most.',
  },
  'program-admit-rate': {
    label: 'Program admit rate',
    definition:
      'The rate for the engineering school or the specific major, not the whole campus. These differ a lot. Using the campus number for an engineering applicant quietly flatters your odds at the schools where you can least afford it.',
  },
  'senior-only': {
    label: 'Senior only',
    definition:
      'A program you can only apply to while you are still in high school. If you do not apply this fall, the door is closed for good. Rarer than it sounds, so the page checks each one against the program page and records the sentence that proves it.',
  },
  'can-join-later': {
    label: 'Can join later',
    definition:
      'The program takes applications from students already enrolled at the school. That makes it much less urgent, because missing it now does not end the chance.',
  },
  ed: {
    label: 'Early Decision',
    definition:
      'A binding early application. If they admit you, you go. You get exactly one, so the page treats it as something to spend in the right place rather than a free bonus.',
  },
  'business-load': {
    label: 'Business load',
    definition:
      'How much business coursework a program actually commits you to. Heavy means a business degree or a dual degree. Overlay means a minor on top of engineering. It matters here because the plan is to do business outside school.',
  },
  'switch-policy': {
    label: 'Switching majors',
    definition:
      'How hard it is to change engineering major once you are in. It matters more than the entry major when you are undecided. Some schools let you start undeclared, some lock you in on day one.',
  },
  weight: {
    label: 'Weight',
    definition:
      'How much a criterion counts, as a share of 100%. You never type one. They come out of the head to head comparisons in S2.',
  },
  range: {
    label: 'Range instead of a score',
    definition:
      'You enter a low, a best guess and a high. The width is you telling the page how sure you are, and the page uses it. A school nobody has researched yet gets a very wide range, which reads as unknown rather than bad.',
  },
  unresearched: {
    label: 'Unresearched',
    definition:
      'A school added to the board that nobody has looked up yet. Its cells are hatched and its ranges are wide on purpose, so it never quietly inherits scores it did not earn.',
  },
  'monte-carlo': {
    label: 'Monte Carlo, or 10,000 runs',
    definition:
      'Named after the casino. The page rolls dice inside your ranges and scores the schools, 10,000 times over, then counts how often each one came out on top. It asks who wins across every reasonable version of your opinions instead of betting on one set of numbers.',
  },
  ahp: {
    label: 'Head to head weighting',
    definition:
      'You compare two criteria at a time and say which matters more and by how much. The page turns all those small answers into a set of weights. People are much better at pairs than at handing out percentages.',
  },
};

export default GLOSSARY;
