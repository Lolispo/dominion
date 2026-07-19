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

## OPEN TODOS / candidate next steps
1. **Maintainability review** (done 2026-07-19 via two code-reviewer passes on the refactored view layer + CSS) — act on the prioritized findings (design-token extraction, id/selector-coupling fragility, duplication, dead code). See the review summary in the session / consider capturing top items here.
2. Minor/accepted: action "pop" reads as scale-while-leaving-hand (not a forward pop); score-screen amount labels spacing.
3. Docs: README notes the overhaul but not the two-column relayout — refresh if desired.

## Specs & plans (for reference)
- docs/superpowers/specs/2026-07-12-visual-overhaul-design.md
- docs/superpowers/plans/2026-07-12-visual-overhaul.md
- docs/superpowers/specs/2026-07-17-table-relayout-design.md
- docs/superpowers/plans/2026-07-17-table-relayout.md
- Ledger: .superpowers/sdd/progress.md (git-ignored scratch)
