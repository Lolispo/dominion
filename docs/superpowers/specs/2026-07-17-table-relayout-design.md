# Table Relayout — Two-Column, Always-Visible Hand

**Date:** 2026-07-17
**Branch:** `visual-overhaul` (continues the visual overhaul work)
**Status:** Approved design, ready for implementation plan

## Goal

Fix the core problem surfaced during review: the hand and the shop share the
same vertical axis, so you can never see both at once, you scroll constantly,
and the draw/deal/buy animations have nowhere visible to land. Relayout the
game into two columns so the active player's hand is always on screen and the
whole game fits one viewport — giving the animations a stage and making it
feel like playing at a table.

## Problem (from playtest feedback)

- Hand is below the shop in a single vertical flow → hand is off-screen when
  looking at the shop.
- Bigger overhaul cards made the page taller → more scrolling.
- The deal/flip/flight animations don't pay off because the hand isn't in frame
  when cards are dealt.

## Constraints (unchanged from the overhaul)

- Vanilla HTML/CSS/JS, no build step, no dependencies. Open `index.html` to play.
- Preserve game logic (`Card.js`, `Deck.js`, `Player.js`, `gameScript.js` flow).
- Preserve the faithful card renderer, real piles, flight/deal engine, and sfx
  built earlier in this branch.
- Keep the forest backdrop (`theme-forest`).
- Preserve the element IDs the renderer/animator/game code look up (card
  `id`/`_div`/`_name`/`_centered`/`_bottomLeft`/`_bottomRight`; per-player
  `hand_<i>`, `board_<i>`, `pile_deck_<i>`, `pile_discard_<i>`,
  `interact_<i>`, `info_*_<i>`, `deck_<i>`, `discard_<i>`, `player_<i>`).

## Layout

Fills the viewport height; **no page-level scroll**.

```
┌───────────────────────────────────────────────┐
│ top bar: DOMINION        [Music][Sound][Help]  │  slim, fixed height
├─────────────────────────────┬─────────────────┤
│ SHOP  (left, ~58%)          │ YOU (right, ~42%)│
│  title                      │ opponent strips  │  (name, deck#, disc#, □)
│  card grid (wraps)          │ stat bar M/B/A   │
│  ...                        │ + 1-line status  │
│  overflow-y: auto  ◀────────┤ play area        │  (played actions)
│  (scrolls inside itself)    │                  │
│  shop panel: [Confirm][Cancel]                 │
│                             │ ┌──────────────┐ │
│                             │ │deck │HAND│disc│ │  pinned to column bottom
│                             │ │ + interact btns│ │
│                             │ └──────────────┘ │
└─────────────────────────────┴─────────────────┘
```

- **Top bar:** the `game-title` banner (smaller) on the left, the Music / Sound
  / Help buttons on the right. Fixed height (does not scroll).
- **Left column — Shop (~58%):** shop title, the wrapping card grid, and the
  shop panel (which already hosts the buy Confirm/Cancel buttons). This column
  has `overflow-y: auto`; a tall shop scrolls inside itself and never affects
  the right column.
- **Right column — You (~42%):** a vertical flex sized to the viewport:
  - **Opponent strips** (top): one compact row per non-active player — name,
    deck count, discard count, top-of-discard thumbnail.
  - **Stat bar:** Money / Buys / Actions (bump on increase) + a **single-line**
    status message (the verbose multi-line log is reduced to one current line).
  - **Play area:** action cards played this turn.
  - **Hand block** pinned to the column bottom (`margin-top: auto`): the hand,
    flanked by the deck and discard piles, with the interact buttons (End Turn,
    "Use <card>?", Cellar/Chapel/Mine/skip prompts) beside it.

## Why this fixes the animations

Deck pile, discard pile, hand, shop, and play area are all on screen together.
Draw/deal flights (deck→hand) land in an always-visible hand at bottom-right;
buy flights cross the table (shop left → discard right); action pops happen in
the visible play area. No motion happens off-screen.

## Turn handoff (hotseat)

The right column always shows the **current** player. On turn pass, the
finishing player collapses into an opponent strip and the next player's
hand/stats/play/piles populate the right column. Because the right column *is*
the active player, the gold full-area highlight is no longer needed; a subtle
cue (e.g., the active player's name styled) is enough.

## Implementation approach

Restructure the container layout with minimal game-logic change; do the
active-vs-opponent transformation mostly in CSS, keyed off a class the existing
turn code toggles.

1. **DOM wrapper (`game.html`):** wrap `#shop` and `#playArea` in a flex row
   container (e.g. `#table`). Move the Music/Sound/Help controls into the top
   bar. `#shop` becomes the left column; `#playArea` the right column.
2. **Per-player sections keep their current structure and IDs** (built by
   `initPlayer`). CSS does the work:
   - The **active** player's section renders as the full right-column layout
     (stats, play area, hand pinned bottom, piles, interact).
   - **Non-active** sections get an `.opponent` class → CSS collapses them to
     the compact strip: show name + `deck_<i>` + `discard_<i>` + discard-top
     thumbnail; hide the hand, play area, interact, and detailed stats.
3. **Turn code (`gameScript.js` `startGame` + `changeTurn`, and
   `Deck.startTurn`/`cleanUp`):** where it currently sets `style.order` and
   toggles `player-active`, also toggle `.opponent` on non-active sections and
   remove it from the active one. Keep the existing `player-active`/order logic
   or replace it with the column placement — whichever is cleaner, decided in
   the plan.
4. **Right-column internal order:** use CSS (flex order / `margin-top:auto` on
   the hand block) so opponents sit on top and the hand pins to the bottom,
   using the existing child containers of the player section.
5. **Status log:** reduce the 3-line message stack to a single current line
   (keep `updateTextPrint` working; just show the latest line, hide the older
   two via CSS or by only rendering one).
6. **Buy Confirm/Cancel** already live in `shopPanel` (left column) — they stay
   there, which now reads naturally.

**Main risk:** collapsing a full per-player section into a compact strip purely
via CSS, and keeping the flight anchors (`pile_deck_<i>`, `pile_discard_<i>`,
`hand_<i>`) correctly positioned for both active and opponent states. The plan
must verify flights still target the right on-screen elements after relayout,
for 2–4 players, and that nothing overflows the fixed viewport.

## Split & sizing

- Shop column ~58%, right column ~42% (via flex-basis / width; min-widths so it
  degrades gracefully on narrow windows).
- Card sizes stay as tuned (shop .72, hand .86) but may be nudged in the plan if
  the right column can't fit the hand + piles + play area at 42% width.
- Everything uses relative units / flex so it adapts to window size; the shop
  grid wraps; the right column scrolls internally only as a last resort.

## Out of scope

- No game-logic/rules changes; no new cards.
- No networked play.
- No build tooling or dependencies.
- Turn-handoff ceremony / privacy screens (still out).

## Testing & verification

- Manual/visual via headless browser (browse): confirm at 2, 3, and 4 players
  the whole game fits one viewport with no page scroll; the active hand is
  always visible; opponents show as compact strips; draw/deal, buy, and play
  animations are fully on-screen; buying, playing actions (incl.
  Cellar/Chapel/Mine multi-step), end turn, reshuffle, and end-game score
  screen all still work; no console errors.
- Confirm `index.html` still launches and the menu is unaffected (menu is a
  separate page).
