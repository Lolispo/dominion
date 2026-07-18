# Table Relayout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. NOTE: this is CSS-heavy layout work — verification is visual (headless-browser screenshots at 2/3/4 players), and final CSS values are tuned live against those screenshots, not prescribed to the pixel.

**Goal:** Restructure the game into two columns (shop left, active player right) so the hand is always visible, the whole game fits one viewport, and the deal/flight animations have an on-screen stage.

**Architecture:** Wrap `#shop` and `#playArea` in a flex-row `#table` that fills the viewport under a slim top bar. `#shop` is the left column (scrolls internally); `#playArea` holds the per-player sections. CSS renders the active player's section as the full right column (stats/play at top, hand+piles pinned to the bottom) and collapses non-active sections to a compact `.opponent` strip. Game logic and element IDs are preserved.

**Tech Stack:** Vanilla HTML/CSS/JS, no build, Web Animations API (existing). Verification via the `browse` headless browser.

## Global Constraints

- No build step, no dependencies; runs by opening `game.html`/`index.html` directly.
- Preserve game logic (`Card.js`, `Deck.js`, `Player.js`, `gameScript.js` flow) — this is layout/CSS + a DOM wrapper + turn-code class toggles only.
- Preserve these element IDs (renderer/animator/game look them up): card `id`/`_div`/`_name`/`_centered`/`_bottomLeft`/`_bottomRight`; per-player `player_<i>`, `name_<i>`, `hand_<i>`, `board_<i>`, `interact_<i>`, `info_<i>`, `infoboard_<i>`, `info_stats_<i>`, `info_stats_main_<i>`, `info_stats_cards_<i>`, `money_<i>`, `buysLeft_<i>`, `actionsLeft_<i>`, `deck_<i>`, `discard_<i>`, `pileRow_<i>`, `pile_deck_<i>`, `pile_discard_<i>`, `text_<i>`(+`_0.._3`), `info_cards_<i>`, `info_discard_<i>`.
- Keep the forest backdrop (`theme-forest`), faithful cards, piles, flight/deal engine, sfx.
- No page-level scroll: the game fits the viewport; only the shop column scrolls internally.

## Current per-player DOM (reference — do not restructure except where a task says)

```
player_<i> (.margin_bottom)
  name_<i>_div > name_<i>
  infoboard_<i> (.flex_container)
    info_<i>
      info_stats_<i> > info_stats_main_<i> (money/buysLeft/actionsLeft)
                     > info_stats_cards_<i> (deck_<i>, discard_<i>, pileRow_<i>[pile_deck_<i>, pile_discard_<i>])
      text_<i> (text_<i>_0.._3)              ← status log
      info_cards_<i> > info_discard_<i>       ← discard-top card
    board_<i>                                 ← play area (played actions)
  interact_<i>                                ← buttons
  hand_<i>                                    ← hand
```
Sections live under `#playArea`. `#shop` is a sibling of `#playArea` in `<body>`.

## Verification Method (every task)

Serve with `python3 -m http.server 8000`; drive with `browse` (`~/.claude/skills/gstack/browse/dist/browse`). **`$B restart` before each check** (the browser caches JS/CSS sub-resources). Check: no page scroll (`document.body.scrollHeight <= window.innerHeight + a small slack`), no console errors, and screenshot the state. Test at 2 players by default; Task 5 tests 3 and 4 (set `sessionStorage.playersPlaying` then reload).

---

### Task 1: Viewport shell + two-column skeleton

**Files:** Modify `game.html` (wrap columns, add top bar), `style.css` (shell + column CSS), `gameScript.js` (create controls into the top bar).

**Objective:** `html,body` fill the viewport with no page scroll; a slim top bar holds the title + Music/Sound/Help; below it a flex row `#table` holds `#shop` (left, ~58%, `overflow-y:auto`) and `#playArea` (right, ~42%).

- [ ] **Step 1: game.html structure.** Wrap the existing `#shop` and `#playArea` in `<div id='table'>…</div>`. Add `<div id='topbar'>` containing the `game-title` div (moved out of the column flow) and an empty `<div id='controls'></div>`. Keep the `#info` div (gameScript uses it for the turn box) — place it in the top bar or keep it minimal. Move the "Main Menu" button into the top bar or leave at the very bottom of the right column.

- [ ] **Step 2: gameScript controls into the top bar.** In `startGame`, the Music/Sound/Help buttons are created into `helpDiv` (a child of `#info`). Point their container at `#controls` (top bar) so they render in the top bar, not in the scrolling area. Keep the audio element and `helpMessage` working (helpMessage can stay hidden/absolute).

- [ ] **Step 3: shell CSS.**
```css
html, body { height: 100%; margin: 0; }
body.theme-forest { overflow: hidden; }            /* no page scroll */
#topbar { display: flex; align-items: center; justify-content: space-between;
	padding: 4px 12px; gap: 12px; }
#table { display: flex; align-items: stretch; gap: 12px; padding: 0 12px 12px;
	height: calc(100vh - var(--topbar-h, 84px)); box-sizing: border-box; }
#shop { flex: 0 0 58%; max-width: 58%; overflow-y: auto; overflow-x: hidden;
	margin-bottom: 0; }
#playArea { flex: 1 1 42%; display: flex; flex-direction: column; overflow: hidden; }
```
(`--topbar-h` tuned to the real top bar height during verification.)

- [ ] **Step 4: Verify.** `$B restart`; load; 2 players. Expected: title + controls in a top bar; shop on the left scrolling inside itself; player sections on the right; **no page scroll** (`document.body.scrollHeight <= innerHeight + 4`); no console errors. Screenshot. Layout will look rough (right column not yet arranged) — that's Task 2.

- [ ] **Step 5: Commit.** `git commit -m "feat(layout): viewport shell + two-column table skeleton"`

---

### Task 2: Arrange the active player's right column

**Files:** `style.css` (player-section flex arrangement), `Player.js` (relocate `pileRow_<i>` beside the hand).

**Objective:** The active player's `player_<i>` fills the right column as a flex column: name + opponents area at top, stats + play area in the middle, and the hand pinned to the bottom flanked by the deck/discard piles.

- [ ] **Step 1: Relocate piles beside the hand.** In `initPlayer`, create a `handRow_<i>` container as a child of `player_<i>` (after `interact_<i>`), then create the hand and piles inside it so the DOM is `handRow_<i> > [pile_deck_<i>] [hand_<i>] [pile_discard_<i>]`. Concretely: move the `pileRow_<i>`/`pile_deck_<i>`/`pile_discard_<i>` creation out of `info_stats_cards_<i>` and into `handRow_<i>`, and move the `hand_<i>` creation into `handRow_<i>` between them. Keep all IDs identical (`pile_deck_<i>`, `pile_discard_<i>`, `hand_<i>`, `pileRow_<i>`). The `deck_<i>`/`discard_<i>` text counters stay in `info_stats_cards_<i>` (or hide them via CSS since the pile badges now show counts).

- [ ] **Step 2: Right-column flex CSS.**
```css
#playArea > .margin_bottom { display: flex; flex-direction: column; min-height: 0; }
/* active player fills the column */
#playArea > .margin_bottom:not(.opponent) { flex: 1 1 auto; min-height: 0; }
#playArea > .margin_bottom:not(.opponent) .interact,
#playArea > .margin_bottom:not(.opponent) #handRow_placeholder { }
.hand-row { display: flex; align-items: flex-end; gap: 10px; margin-top: auto; }  /* pin to bottom */
```
Give `handRow_<i>` the `hand-row` class. Ensure `board_<i>` (play area) and stats sit above; the hand row uses `margin-top:auto` to pin to the bottom of the column. Make `info_<i>`/`infoboard_<i>` not stretch (so the hand row gets the auto margin).

- [ ] **Step 3: Verify.** `$B restart`; 2 players. Expected: active player's hand sits at the bottom of the right column with deck pile left and discard pile right; stats + play area above; deal a card (`getPlayer(turn).cards.drawCard()`) and confirm it flies from the (bottom) deck pile into the hand, on-screen. No console errors. Screenshot.

- [ ] **Step 4: Commit.** `git commit -m "feat(layout): active player's hand pinned to bottom, flanked by piles"`

---

### Task 3: Collapse non-active players to opponent strips

**Files:** `gameScript.js` (`startGame`, `changeTurn`), `Deck.js` (`startTurn`/`cleanUp` if they touch active state), `style.css` (`.opponent` collapse).

**Objective:** Non-active player sections render as a compact strip (name, deck/discard counts, discard-top thumbnail) at the top of the right column; the active player's section is full. Toggling happens wherever turn/order is currently set.

- [ ] **Step 1: Toggle `.opponent`.** Where `startGame` and `changeTurn` currently set `style.order` / `player-active` on `player_<i>` (search `player-active`), add: remove `.opponent` from `player_<i>` for the active `turn`, add `.opponent` to all others. Keep the existing order logic so the active section sorts after the opponent strips (opponents on top). Verify `Deck.startTurn`/`cleanUp` don't need a matching toggle (they run for the active player only).

- [ ] **Step 2: `.opponent` collapse CSS.**
```css
.opponent { flex: 0 0 auto; }
.opponent .interact, .opponent .hand-row, .opponent #board_placeholder,
.opponent [id^='board_'], .opponent [id^='text_'], .opponent [id^='info_stats_main_'] { display: none; }
.opponent [id^='hand_'] { display: none; }
.opponent { font-size: .85em; opacity: .8; }
/* keep visible in the strip: name, deck_/discard_ counts, info_discard_ thumbnail */
.opponent [id^='name_'] { font-size: 16pt; }
```
Adjust selectors so exactly these remain in an opponent row: name, `deck_<i>`, `discard_<i>`, and `info_discard_<i>` (discard-top thumbnail). Lay the row out horizontally.

- [ ] **Step 3: Verify.** `$B restart`; 2 players; then end a turn and confirm the strip/active swap. Expected: the non-active player shows as a compact top-right strip (name + counts + discard thumb), the active player is full with hand at bottom; on end-turn the two swap; no page scroll; no console errors. Screenshot before and after end-turn.

- [ ] **Step 4: Commit.** `git commit -m "feat(layout): collapse non-active players into compact opponent strips"`

---

### Task 4: One-line status, top-bar/score polish, fit tuning

**Files:** `style.css` (status log, sizing), possibly `gameScript.js` (score screen still renders under `#playArea`).

**Objective:** Reduce the status log to one line; make sure nothing overflows the fixed viewport at 2 players; keep the end-game score screen usable in the new layout.

- [ ] **Step 1: Single-line status.** Show only `text_<i>_1` (latest) in the active section; hide `text_<i>_0/_2/_3` via CSS (`.status-collapsed` or `[id$='_0'],[id$='_2'],[id$='_3']` scoped to `text_<i>`). Keep `updateTextPrint` untouched (it still writes all three; we just show one).

- [ ] **Step 2: Fit tuning.** With everything in place, if the right column overflows at 42% width, nudge: hand card scale (currently `.86`), shop scale (`.72`), gaps, and the split (e.g. 60/40). Tune against screenshots so 2-player fits with no page scroll.

- [ ] **Step 3: Score screen.** `endGame` renders per-player card breakdowns into `info_stats_<i>`. Confirm it still displays acceptably (it may need `.opponent`/column rules relaxed at game end — e.g. add a `body.game-over` class that un-collapses sections and allows the results to scroll inside `#playArea`). Keep it readable; page scroll is acceptable on the end screen only.

- [ ] **Step 4: Verify.** `$B restart`; 2 players; play through to `endGame()`. Expected: single status line during play; no page scroll mid-game; score screen readable. Screenshot mid-game and end-game.

- [ ] **Step 5: Commit.** `git commit -m "feat(layout): one-line status, fit tuning, score-screen in new layout"`

---

### Task 5: Multi-player + animation re-verification

**Files:** none expected (verification; small CSS fixes only if issues found).

**Objective:** Confirm the relayout holds at 3 and 4 players and that all animations land on-screen.

- [ ] **Step 1: 3 & 4 players.** For each: set `sessionStorage.setItem('playersPlaying','3')` (then `'4'`), reload. Expected: 2–3 opponent strips stacked top-right, active full, no page scroll, no console errors. Screenshot each.

- [ ] **Step 2: Animation sweep (2 players).** Verify on-screen: turn-start deal cascade (deck→hand, bottom-right), buy flight (shop left → discard right, crossing the table), action pop (play area), counter bumps, end-turn discard (hand→discard) + next player's deal, reshuffle. Confirm each is fully within the viewport. Screenshot a buy mid-flight if catchable; otherwise confirm functionally + no errors.

- [ ] **Step 3: Interaction sweep.** Play Cellar/Chapel/Mine (multi-step prompts appear beside the hand and work), buy with multiple buys, end turn. No console errors.

- [ ] **Step 4: Commit** any fixes. `git commit -m "test(layout): verify relayout at 3-4 players and animations on-screen"`

---

## Self-Review (author checklist — completed)

- **Spec coverage:** two columns (T1), hand pinned bottom + piles (T2), opponent strips (T3), one-line status + fit + score (T4), viewport-fit + animations on-screen + multi-player (T1/T5). ✓
- **ID preservation:** Task 2 relocates pile/hand DOM but keeps every ID; all other tasks are CSS + class toggles. Flight anchors (`pile_deck_<i>`/`pile_discard_<i>`) and `hand_<i>` retained. ✓
- **Placeholders:** CSS values in T1/T2 are starting points explicitly tuned in T4 against screenshots (layout work); no logic placeholders. Selectors in T3 are marked "adjust so exactly these remain" — the implementer verifies the exact set visually.
- **Risk:** the `.opponent` collapse (T3) and viewport fit (T4) are the risky parts; both are visually verified with before/after screenshots and multi-player checks (T5).

## Out of Scope

No game-logic/rules changes; no networked play; no build tooling; no turn-handoff ceremony.
