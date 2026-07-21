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
