import { Vim } from '@replit/codemirror-vim';
import { EditorSelection } from '@codemirror/state';

// Ex commands are registered on the vim engine globally, not per editor, so they
// dispatch through a handler table the Room swaps out for whichever draft is
// open. Muscle memory should reach the same save the toolbar does.
const handlers = { save: null, saveAndClose: null, close: null };

let registered = false;

// Vim moves by *logical* line, and a soft-wrapped paragraph is one logical
// line -- so in prose `j` jumps a whole paragraph instead of dropping to the
// next line you can see. `gj`/`gk`/`g0`/`g$` are vim's own display-line motions;
// remapping the plain keys to them is the standard prose fix (`nnoremap j gj`).
//
// Applied unconditionally rather than only when there is no count: in an essay
// the whole document is a handful of logical lines, so `5j` meaning five
// paragraphs is never what you want either.
//
// noremap rather than map because each target contains the key being remapped
// (`gj` contains `j`), which is exactly the case recursive mapping mishandles --
// the same reason vimrc convention is `nnoremap`, not `map`.
const MOTIONS = [
  ['j', 'gj'],
  ['k', 'gk'],
  ['$', 'g$'],
  // `+` and `-` are the other line-step motions; `<CR>` expands to `j^` and so
  // inherits the mappings above on its own.
  ['+', 'gj'],
  ['-', 'gk'],
];

// Line-wise edits rebuilt on display-line motions. `D`/`C` are operator+motion,
// so swapping the motion is enough. `A` is a position action, so it becomes a
// motion plus the matching insert.
const EDITS = [
  ['D', 'dg$'],
  ['C', 'cg$'],
  ['A', 'g$a'],
];

// `I` has to resolve `0` through the user keymap to reach the visual-row-start
// binding below, so it is a recursive map. Safe here: `0i` does not contain `I`.
const RECURSIVE_EDITS = [['I', '0i']];

// The library's `g0`/`g^` route through a compat shim that, in practice, lands
// on the logical line start rather than the visual row start (`g$` does not have
// this problem). Bind CM6's own visual-line boundary instead, which is what the
// editor actually uses to wrap.
function defineVisualRowStart() {
  Vim.defineMotion('moveToStartOfVisualRow', (cm) => {
    const view = cm.cm6;
    const head = view.state.selection.main.head;
    const moved = view.moveToLineBoundary(EditorSelection.cursor(head), false);
    return cm.posFromIndex(moved.head);
  });
  for (const keys of ['0', '^', 'g0', 'g^']) {
    Vim.mapCommand(keys, 'motion', 'moveToStartOfVisualRow', {}, { context: 'normal' });
    Vim.mapCommand(keys, 'motion', 'moveToStartOfVisualRow', {}, { context: 'visual' });
  }
}

// `dd`, `cc` and `yy` cannot be reached by remapping: pressing `d` matches the
// operator and commits before a two-key user mapping is consulted (verified --
// a probe mapping `dq` never fired). What they *do* go through is the operator
// doubling branch, which hardcodes the `expandToLine` motion, and `evalInput`
// calls that motion before it reads `motionArgs.linewise` and accepts a
// [start, end] pair as a full range. That is the seam: override the motion,
// clear linewise from inside it, and return the visual row explicitly.
function defineDisplayLineExpansion() {
  Vim.defineMotion('expandToLine', (cm, head, motionArgs) => {
    const view = cm.cm6;
    const repeat = Math.max(1, motionArgs.repeat || 1);
    const from = cm.indexFromPos(head);
    const cursor = (at) => EditorSelection.cursor(at);

    const rowStart = view.moveToLineBoundary(cursor(from), false).head;
    let rowEnd = from;
    for (let i = 1; i < repeat; i += 1) {
      rowEnd = view.moveVertically(cursor(rowEnd), true).head;
    }
    rowEnd = view.moveToLineBoundary(cursor(rowEnd), true).head;

    // The doubling branch asked for a line-wise range over logical lines. Turn
    // that off *here*, before evalInput reads it, and hand back an explicit
    // character range covering the visual row instead. Exclusive, because
    // rowEnd is the wrap point -- the first offset of the next row.
    motionArgs.linewise = false;
    motionArgs.inclusive = false;
    return [cm.posFromIndex(rowStart), cm.posFromIndex(rowEnd)];
  });
}

function mapDisplayLineMotions() {
  for (const mode of ['normal', 'visual']) {
    for (const [from, to] of MOTIONS) Vim.noremap(from, to, mode);
  }
  for (const [from, to] of EDITS) Vim.noremap(from, to, 'normal');
  for (const [from, to] of RECURSIVE_EDITS) Vim.map(from, to, 'normal');
}

export function registerVimCommands() {
  if (registered) return;
  registered = true;
  defineVisualRowStart();
  mapDisplayLineMotions();
  defineDisplayLineExpansion();
  Vim.defineEx('write', 'w', () => handlers.save && handlers.save());
  Vim.defineEx('wq', 'wq', () => handlers.saveAndClose && handlers.saveAndClose());
  Vim.defineEx('xit', 'x', () => handlers.saveAndClose && handlers.saveAndClose());
  // `:q` goes back to the Desk through the same dirty guard as the Desk button,
  // so it can prompt rather than silently dropping edits.
  Vim.defineEx('quit', 'q', () => handlers.close && handlers.close());
}

export function setVimHandlers(next) {
  Object.assign(handlers, next);
}

export default registerVimCommands;
