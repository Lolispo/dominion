# Dominion Visual Overhaul — Resume Notes

**Branch:** `visual-overhaul` (pushed to `origin` = git@github.com:Lolispo/dominion.git).
Working tree clean and in sync with origin as of the last session.

## How to resume / verify
- Serve: `python3 -m http.server 8000` from repo root (may already be running in background).
- Open `http://localhost:8000/index.html` (menu) or `game.html`.
- Visual verification uses the `browse` skill binary: `~/.claude/skills/gstack/browse/dist/browse`.
  - **Always `$B restart` before a check** — the headless browser caches JS/CSS sub-resources.
  - Audio (Web Audio SFX) only starts after a real user gesture (click); it's silent + warning-free before that by design.
- Hobby-repo git: local `core.sshCommand` is set to the lolispo key; push with plain `git push`.
- No build step, no deps. Game logic (Card.js/Deck.js/Player.js rules + gameScript flow) is preserved; the overhaul is the view/animation layer.

## What's DONE (all committed + pushed)
- Faithful card faces (banner, per-card SVG icon in icons.js, type line, rules, cost + supply badges), felt→forest backdrop (forest kept), design tokens, real deck/discard piles.
- FLIP/WAAPI animation engine (animator.js): draw/discard/buy flights, face-down flip **deal cascade** (staggered), action-card pop, counter bumps, **turn-switch flash**, **deal-in for the player whose turn is starting** (silent draw at end-of-turn), and **staggered "+N" gain chips** (floatGain) for resource gains.
- Synthesized sound (sfx.js): deal/buy/play/shuffle + Sound on/off toggle, master volume `_VOL`.
- **Two-column table relayout:** shop left (scrolls internally, grouped by type: treasure/victory/action), active player right with hand pinned to the bottom (fanned, hover to inspect) flanked by piles; opponents collapse to compact top strips showing name + deck/discard counts + discard-top thumb + a small **face-down** mini-hand fan. Fits one viewport, no page scroll (2–4 players). Score screen relaxes to scroll (body.game-over).
- Shop panel is a sticky styled bar at the bottom of the shop column (Close Shop / cost message / Confirm / Cancel).
- Cost + supply badges moved to the TOP of cards; infinite piles show no supply badge; long names kept clear of badges.
- Hover tooltip (initCardTooltip) shows any card's name/type/cost/supply/rules — including rivals' face-up minis (suppressed in face-down mode).
- Active-only rename; coin icon instead of "Money" text.
- **Rivals' hands render face-up by default** (legible mini card: type-coloured banner + icon) with an in-game **"Rivals: Face-up / Face-down"** toggle button (next to Sound) that flips a `body.opp-facedown` class.
- **Dynamic hand-fan tightening** (fitHandFan + a MutationObserver per hand container in Player.js): large hands (8+ cards) tighten `--hand-overlap` to stay on one row instead of scrolling; normal 5-card hands keep the comfortable default.

## DONE (shipped to `main`)
- Overhaul squash-merged to `main` (repo was migrated master→`main` on 2026-07-19; remote HEAD = origin/main).
- **Player-identity pills** — name + turn label are dark forest pills using a refined jewel palette (`getPlayerColor`) as a `--player-color` accent ring, replacing the old neon fills.
- **Opponent discard thumbnail** — compact, framed, captioned "discard"; hides when empty.
- **Maintainability review** (2026-07-19, two code-reviewer passes) + its **safe quick-wins batch B**: extracted CSS colour tokens (`--forest-rgb`, `--wood-rgb`, `--card-back-*`, `--btn-*`, wired `--table-top`), removed dead JS/CSS (commented code, stale 70-line TODO block, dead `.dcard.size-hand` overrides, duplicate rules, no-op `.bind(this)`), extracted `activatePlayer()`, ended the opponent-handRow `!important` war, and fixed the misspelled card name `Duchey`→`Duchy`.

## DONE (branch `feat/cross-device-polish-deck-browser`, 2026-07-21 — not yet merged)
Spec/plan: `docs/superpowers/specs/2026-07-21-cross-device-polish-and-deck-browser-design.md`,
`docs/superpowers/plans/2026-07-21-cross-device-polish-and-deck-browser.md`.
- **Cross-device layout:** forest background now `cover / no-repeat / fixed` (no more tiling on tall screens); `#table` capped at 1600px + centred; card scales fixed per size class with `@media` step-ups at 1900/2400px (a unitless `--card-scale` can't be driven by `vw`); `--topbar-h` set from JS `ResizeObserver` and used via `calc(100dvh - var(--topbar-h))`.
- **Card text:** cost/supply badges moved to the art-row top corners (clear of name + rules); grid rebalanced to 16/42/11/31; `fitCardText()` (in html_css_functions.js, hooked in `renderCard`) shrinks long rules to fit — all 19 cards verified no-overflow at 1440 & 2560.
- **Shop message** hidden until a real message; **first hand card** no longer clipped (dropped `overflow-x:auto` on the fan; `fitHandFan` already guarantees fit).
- **Resource dock:** money/buys/actions + action buttons + a new **View Deck** button sit in a `.dock-bar` directly above the hand (readouts re-parented into `#interact_`, ids unchanged; column reordered via flex `order`). Hidden on the score screen; opponents unaffected.
- **Action feedback:** `popCard` bigger/slower (scale 1.5 / 650ms / overshoot, lifts above neighbours); new synth `sfxAction` (C5→G5) on action play; dead `sfxPlay` removed.
- **Deck browser:** new `deckBrowser.js` — read-only Slay-the-Spire-style modal grouping owned cards with ×N badges (sorted by type then cost); `DeckOfCards.getAllOwnedCards()` aggregates draw+discard+in-play+hand without mutating; opens from either pile or the View Deck button; closes on Esc / backdrop / ✕.
- **New deferred nit:** `#info_stats_main_<pid>` is now an empty vestigial container; its `invis` toggles in Deck.js (lines ~130/148/353) are no-ops (dock visibility via `.opponent` preserves the per-turn show/hide). Safe to remove in a game-logic cleanup pass.

## OPEN TODOS / candidate next steps
### Hand interaction: tooltip-vs-button fix + drag-and-drop play/buy (NEW, 2026-07-22)
Reported by user: pressing an action card in hand pops a tooltip that covers the "Use <card>?" button, and it'd be nicer to drag cards to play/buy them.

**A. Tooltip blocks the "Use <card>?" button (bug, do first — small).**
- Repro: tap/click an action card in your hand. The click handler (`Deck.js:~281-297`) selects the card and injects a `Use <br><card>?` button (id `playActionID`) into the dock bar `#interact_<pid>`, which sits *directly above* the hand (the `.dock-bar`). The hover tooltip `#cardTip` (`initCardTooltip`, `html_css_functions.js:70-107`) positions itself *above* the hovered card (`top = r.top - tip.offsetHeight - 12`, flipping below only when there's no room above — line 98-99). For a bottom-docked hand card, "above" is exactly where the dock/`playActionID` button lives → the tooltip overlaps and blocks the button you now need to press.
- Options (pick when implementing):
  1. For hand cards specifically, prefer flipping the tooltip *below* the card (or offset it sideways) so it never lands on the dock. The generic "flip below if no room above" logic already exists — extend it so a hand/dock context always flips (or clears the dock rect).
  2. Make `#cardTip` `pointer-events:none` (it may already be — verify) AND ensure it isn't drawn over the dock; even non-interactive, it visually hides the button.
  3. Suppress/hide the tooltip once a card is selected (i.e. while `playActionID` is showing for that card), or hide it on the card's own click.
- Acceptance: after clicking an action card, the "Use <card>?" button is fully visible and clickable with no tooltip overlapping it, on both desktop hover and touch.

**B. Drag an action card from hand → board to play it (feature).**
- Drop target: the active player's board region `#board_<pid>` (`id_board`, rendered in `Player.js:145`; cards land there via `playCard`/`Deck.js:634-636`). The area is the strip above the hand.
- On a valid drop, run the same path as the existing button: `currentPlayer.playActionCard(card)` (`Player.js:44`) — reuse it, don't fork the logic. Respect the same guards the click handler uses (`isTurn`, `phase === 0`, `cardType === ACTION_CARD`, `actionsLeft > 0`, `activeActionCard === ''`).
- Keep the click→"Use <card>?" button flow working as a fallback (touch + accessibility); drag is an additive shortcut.

**C. Drag a shop card → hand to buy it (feature).**
- Source: shop cards. Drop target: the active player's hand `#hand_<pid>` (`id_hand`) or the dock.
- On a valid drop, run the existing buy path: `getPlayer(turn).buyCard(newCard, card_id)` (`Player.js:52`, mirroring `html_css_functions.js:282`). Respect buy guards (buys left, affordable, correct phase).
- The buy already has a WAAPI "buy flight" animation in `animator.js`; ensure the drag doesn't double-animate — either suppress the flight when the drop provides the motion, or let go and play the existing flight from the drop point.

**Notes / cross-cutting.**
- Use HTML5 DnD or pointer events; must work with the existing FLIP/WAAPI animator and not fight `fitHandFan`'s `--hand-overlap` transforms. Touch drag needs pointer events (native HTML5 DnD is desktop-only).
- Reuse `playActionCard` / `buyCard`; the drop handlers are just alternative *triggers*, so all rules/animations stay centralized.
- Good candidate for its own spec+plan session (brainstorm first) rather than a drive-by; item A alone is a quick fix that can ship independently.

### BUG: "gray card with a blank face" appeared during play (NEW, 2026-07-22 — H1 FIXED)
Reported by user: mid-game a card showed up **gray with nothing on its face**. User's hunch: it may be tied to **drawing a card when few/none are left to draw**. **Hypotheses 1 (Cellar reshuffle collision) and 2 (Council Room rival draw) were confirmed and fixed** on 2026-07-22 — see "FIX SHIPPED" below. H3–H4 remain open follow-ups. Below is the code review of how it can happen (ranked).

**FIX SHIPPED (H1, 2026-07-22):**
- Root cause: `initNewUIElement` (`html_css_functions.js`) appends nodes with no id dedup, so re-rendering a card whose previous `<id>_div` is still mid-removal (Cellar discards a card → `useCard` fades it out over ~180ms → a reshuffle draws that same card back within that window) created **two `card_<id>_div` nodes**. `getElementById` returns the first (stale, dying) one, so `displayCard` stripped `inactive` from the wrong node and the fresh hand card stayed gray.
- Fix 1 (root cause): `renderCard` (`cardRenderer.js`) now drops any pre-existing `<id>_div` before building — enforces the invariant "one DOM node per card id." Only the hand uses `card_<cardid>_div`, and ids are globally unique, so a same-id node is always a stale leftover; safe to remove.
- Fix 2 (defense in depth): the Cellar draw path (`Deck.js`) now null-guards `drawCard()` before `displayCard()` (drawCard returns null when deck+discard are both empty).
- Verified with a `vm`-loaded regression test of the real `renderCard` (scratchpad `renderCard.collision.test.js`): fails on pre-fix code (2 duplicate nodes / card stays `inactive`), passes after. No jsdom/deps added.
- Not yet re-verified live in-browser; H2–H4 below are untouched.

Background on the two symptoms:
- **Gray** = the `.dcard.inactive` filter (`style.css`: `filter: grayscale(100%) brightness(.8)`). Newly-drawn hand cards are *rendered gray on purpose* (`Deck.js:275-276` and `generateHandCard` `Deck.js:681-682` pass `cssClass:['inactive']`) and are only un-grayed when the caller calls `displayCard()` (`Deck.js:192-195`, which removes `inactive`). The deal-flight `.then()` only restores `visibility`, **not** `inactive` (`Deck.js:261-263`, `animator.js:170-178`).
- **Blank face** = either the real card node is `visibility:hidden` (reveal never ran) or `renderCard` (`cardRenderer.js:16-59`) built a `.dcard` shell but didn't populate its children.

**Hypothesis 1 — Cellar draw-after-discard id collision / reveal hits the wrong node (LEADING; fits "gray, while playing, low on cards").**
- `Deck.js:591-595` (Cellar "Exchange Selected Cards"): it discards each selected card into `this.discard` (`addNewCard(newTempCard, true, false)`, line 592) and *immediately* `drawCard()` (594). `hand.useCard` (line 591) doesn't remove the card's DOM node right away — it fades opacity to 0 and removes it **180ms later** via `setTimeout` (`Deck.js:703-711`).
- If the deck was empty, `drawCard` reshuffles `this.discard` into the deck (`Deck.js:246-249`) — and that discard now contains the cards *just discarded by this same Cellar action* — so it can pop the **same card id** back. `generateHandCard` → `renderCard(tempCard, id_card + tempCard.id, …)` then builds a **second element with the same `card_<id>_div` id** while the old (opacity:0, mid-removal) one still exists.
- `displayCard(cardHtml_id)` (line 595) → `getElementById('card_<id>_div')` resolves to the **stale dying node** (first in DOM order), removes `inactive` from *it* (pointless), and the freshly-drawn real hand card keeps `inactive` → **gray card left in hand.** Duplicate ids also corrupt every later `getElementById` on that card.
- Extra: `displayCard(cardHtml_id)` at 595 has **no null guard** (`drawCard` returns `null` when truly out of cards — `Deck.js:250-252`); `displayCard(null)` no-ops but signals the missing-draw case the user described.

**Hypothesis 2 — a drawn card's `inactive` is simply never cleared (general). [FIXED 2026-07-22]**
- Any draw path that renders a hand card but forgets to call `displayCard()` leaves it gray. Confirmed gap: **Council Room** "each other player draws a card" (`Deck.js:442-448`) called `getPlayer(i).cards.drawCard()` with no `silent` and no follow-up `displayCard()` → opponents' drawn cards stayed gray (visible in face-up rival mode). The self-draw loop in `useCardAfterAnimation` (`Deck.js:397-403`) *is* guarded, so Smithy/Lab/Market/Village were already fine.
- **Fix:** Council Room now captures the drawn id and calls `getPlayer(i).cards.displayCard(rivalHtmlId)` (null-guarded), mirroring the self-draw pattern. `displayCard` only toggles `inactive`/`size-hand` — it does not reveal face-down info (face-down is `body.opp-facedown` + CSS), so no hidden-hand leak. Witch's rival draw is unaffected (it goes to the discard pile via `addNewCard`, which never renders `inactive`). Syntax-checked; not yet re-verified live in-browser.

**Hypothesis 3 — deal/flip reveal race leaves the card hidden/gray (transient).**
- `drawCard` sets the real div `visibility:hidden` then re-shows it inside `flyCardDeal().then()` (`Deck.js:261-263`; `dealInHand` `animator.js:170-178`). If the flight's `onfinish` never fires — card div removed/replaced mid-flight by a turn switch or hand re-render, or the WAAPI anim cancelled — the `.then()` never runs and the card stays hidden; with `inactive` also lingering it reads as a gray blank.

**Hypothesis 4 — `renderCard` partial build on a malformed/null card (blank face; low likelihood).**
- `renderCard` has no null/shape guard. A `null` card (`generateNewCard` returns `null` at 0 capacity, `Card.js:48-59`) or a card missing a valid `cardType`/`getValue` would throw partway — typeline `CardType.properties[tempCard.cardType].name` (`cardRenderer.js:35`) or text `tempCard.getValue()` (`cardRenderer.js:39`) — leaving a `.dcard` shell with a blank face. Unlikely in normal play (Curse/Silver/Gold are effectively infinite) but a cheap guard.

**Suggested fixes (when picked up — confirm with a repro first).**
1. Null-guard `displayCard` and skip when `drawCard` returns null (Cellar line 594-595 + `displayCard` itself).
2. Make "un-gray on draw" not depend on the caller: remove `inactive` in the `flyCardDeal` reveal (`Deck.js:262-263`) / `dealInHand`, or in `addCardToHand` once the flight resolves — so no draw path can leave a gray card. Fixes H2 (incl. Council Room) too.
3. Prevent same-id DOM duplicates: before `renderCard` builds `card_<id>_div`, remove any existing node with that id synchronously (don't rely on the 180ms fade), or don't fold the just-discarded Cellar cards back into the draw pile until the whole Cellar action finishes.
4. Add a guard at the top of `renderCard` for null/invalid cards.

**Repro to try:** run your deck very low, play **Cellar**, and discard-then-draw enough to force a reshuffle that includes the cards you just discarded (or play with a tiny deck). Watch for a hand card that stays gray/blank. Also check opponents after a **Council Room** in face-up rival mode.

### Deferred maintainability findings (from the 2026-07-19 review — bigger, own session)
1. **`Deck.js` God Object** (~770 lines): `useCardAfterAnimation` is a ~250-line mega-fn with near-identical Mine/Chapel/Cellar blocks, and card behaviour is dispatched by hardcoded `card.name === 'Witch'` strings. → per-card handler registry attached to card definitions.
2. **Fragile id-string ↔ CSS-selector contract**: 30+ hand-built ids (`id_discard_top + id_card + ...`) matched by 30+ `[id^='...']` CSS rules; a rename fails silently. → id-builder helpers + semantic classes; document the contract.
3. **CSS structural consolidation**: merge the multi-location `.dcard-banner` / `.dcard-cost,.dcard-supply` / `.hand-row [id^='hand_']` rule blocks; extract a `.btn` base class (3 near-identical button blocks + 3 identical hovers); add a `@media` breakpoint or document the single-viewport assumption; replace magic `calc(100vh - 72px)` with a JS-set `--topbar-h`.
### Smaller leftover review nits (low priority)
4. `Player.js:48` — a debugging `throw ('Check me: ...')` is still in production code; make it a real error or drop it.
5. `html_css_functions.js` `modifyCSSEl` — array vs string branches duplicate the add/remove/toggle logic; normalise to an array once.
6. Extract animation magic numbers in `animator.js` (fly 380ms, deal stagger 135ms, float rise -52px, pop 420ms) into named constants; add an `_envelope()` helper for the repeated gain-ramp boilerplate in `sfx.js`.
7. Legacy `snake_case` utility classes (`margin_left_10`, `size2_text_medium`) vs overhaul-era `kebab-case` — unify in a follow-up (touch JS references too).

### Minor / cosmetic
8. Action "pop" reads as scale-while-leaving-hand (not a forward pop); score-screen amount labels spacing.
9. Docs: README notes the overhaul but not the two-column relayout — refresh if desired.
10. Face-down opponent minis read a bit muddy over the busy autumn backdrop (accepted; it's the non-default mode).

## Specs & plans (for reference)
- docs/superpowers/specs/2026-07-12-visual-overhaul-design.md
- docs/superpowers/plans/2026-07-12-visual-overhaul.md
- docs/superpowers/specs/2026-07-17-table-relayout-design.md
- docs/superpowers/plans/2026-07-17-table-relayout.md
- Ledger: .superpowers/sdd/progress.md (git-ignored scratch)
