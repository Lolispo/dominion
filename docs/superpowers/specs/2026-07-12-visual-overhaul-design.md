# Visual Overhaul — Faithful Dominion Cards, Tactile Animations

**Date:** 2026-07-12
**Branch:** `visual-overhaul`
**Status:** Approved design, ready for implementation plan

## Goal

Overhaul the visual identity and motion of the browser Dominion game so it feels
like sitting at a table playing with a friend on one computer. Two pain points
drive this: the card faces are weak (a generic per-type image plus overlaid
text), and there are essentially no animations.

Success looks like: recognizably faithful Dominion card faces, and cards that
physically move — drawn from the deck, swept to the discard, bought from the
shop, and popped when played.

## Constraints (decided during brainstorming)

- **Stay vanilla.** Plain HTML/CSS/JS, no build step, no dependencies. "Open
  `index.html` and play" must keep working.
- **Preserve game logic.** `Card.js`, `Deck.js`, `Player.js`, and the game-flow
  orchestration in `gameScript.js` are not rewritten. This is a view +
  animation overhaul only.
- **Art direction: faithful Dominion.** Parchment/kingdom-card layout — name
  banner, central illustration, type line, rules text, cost shield, supply
  count.
- **Card art: CSS/SVG icon per card.** No external image files per card; a
  vector icon per card name, drawn so it inherits the type tint.
- **Animation engine: FLIP + a shared flight layer** (Web Animations API),
  with CSS transitions for micro-interactions. No animation library.
- **Hotseat feel = tactile & lively**, not turn ceremony. No handoff/privacy
  screen. Cards feel physical; the board is readable; the active player is
  clearly highlighted.

## Architecture

Rendering and animation become two clean modules the existing game code calls
through a narrow interface. Game logic never measures rects or knows about
keyframes.

**Untouched (game logic):**
- `Card.js` — card model.
- `Deck.js` — deck/hand/discard logic.
- `Player.js` — player state and turn actions.
- `gameScript.js` — game-flow orchestration (turn order, endGame, etc.). It
  gains `await`s on the new animator API but its logic is unchanged.

**Rebuilt / new (view layer):**
- `cardRenderer.js` (new) — builds the new faithful card DOM. Owns the card
  anatomy and the three size variants. Extracted from the current
  `generateCardHTML` in `html_css_functions.js`.
- `icons.js` (new) — a `Map` of `cardName → inline SVG string`, drawn with
  `currentColor` so icons inherit the type tint. One entry per card, plus a
  sensible per-type fallback for any unmapped name.
- `animator.js` (new) — the FLIP + flight-layer engine. Narrow public API
  (see Animation Layer). The only module that measures rects or drives WAAPI.
- `html_css_functions.js` — keeps the generic DOM helpers
  (`initNewUIElement`, `createButton`, `modifyCSS*`, `changeText`,
  `removeChildren`). Card-building logic moves out to `cardRenderer.js`.
- `style.css` — replaced by a design-token-driven stylesheet (see Visual
  Identity).
- `game.html` — add `<script>` tags for the new modules; add a `flight-layer`
  overlay container.

## The New Card Face

Each card is a stack of positioned layers, built once by `cardRenderer.js`. No
per-card image files.

- **Name banner** — top plate with the card name, color-tinted by type.
- **Illustration area** — a single inline SVG icon per card from `icons.js`
  (e.g. coins sized by tier for Copper/Silver/Gold; a house scaled by tier for
  Estate/Duchy/Province; hammer = Smithy; cellar door = Cellar; huts = Village;
  etc.). Drawn with `currentColor`.
- **Type line** — "Action", "Treasure", "Victory", including compound lines
  like "Action – Attack" (Witch) where relevant. Centered mid-card.
- **Rules text / value** — the existing `card.getValue()` output
  (+Cards / +Actions / +Buys / +$ and additional description), with small
  inline icon glyphs next to the numbers instead of plain text.
- **Cost shield** — bottom-left coin badge (from `card.getCost()`).
- **Supply count** — bottom-right badge; hidden when the pile is effectively
  infinite, matching current `getCapacityString` behavior.
- **Frame + border** keyed to the type color.

**Sizes.** The three existing sizes (`card`, `card_smaller`, `card_discard`)
are the *same markup* scaled by a single CSS variable (`--card-scale`) using
`clamp()`, not three separate code paths. Text and icons stay legible at the
smallest (discard/score-screen) size.

## Animation Layer (`animator.js`)

Public API (all flight methods return Promises so callers can `await`):

- **`flyCard(card, fromContainer, toContainer, opts)`** — clone the card into a
  `position: fixed` flight-layer overlay above everything, animate transform
  from the source rect to the destination rect (transform + opacity only via
  WAAPI), then remove the clone and reveal the real card in `toContainer`.
  Used for: **draw** (deck → hand), **discard** (hand → discard), **buy**
  (shop → discard).
- **`reflow(container)`** — FLIP on a container (the hand) so remaining cards
  glide to their new fanned positions when one leaves or arrives; no snapping.
- **`pop(card)`** — playing an action pops the card forward and scales it up
  briefly, then it settles into the play area.
- **`bump(counterEl)`** — the money / buys / actions / draw counters bump when
  they increment.

**Sequencing.** `startTurn`, `drawHand`, `buyCard`, and the play-action path
`await` the relevant flight before mutating the next bit of visible state, so
game state and visuals stay in sync.

**Reduced motion.** Honor `prefers-reduced-motion`: flights collapse to quick
fades; counters update instantly; pops are skipped.

**Performance.** Animate transform/opacity only. Flight clones are removed on
the animation's `finish` event. No layout thrash: batch rect reads before DOM
writes within each FLIP.

## Visual Identity & Board

- **Design tokens** in `:root` as CSS custom properties: type palette
  (treasure gold, victory green, action blue), parchment card fill, table
  surface colors, a spacing scale, and a shared timing/easing scale so every
  animation feels part of one system.
- **Table surface.** Try a new felt/wood table backdrop (CSS gradient/texture,
  no heavy asset) to support the tactile feel. Keep the existing `forest.jpg`
  wired in as a switchable fallback — if the new surface does not land, the
  forest stays usable via a single toggle/variable.
- **Board readability.** Active player's area gets a clear highlight; the hand
  fans with slight overlap and lifts on hover; shop cards lift on hover.
- **Real deck & discard piles.** Replace the current text-only deck/discard
  counters with real per-player pile elements: a face-down **deck pile**
  (card-back art) and a face-up **discard pile** (top card shown), each with a
  count badge. These give card flights real anchors to fly to/from and land
  by the end of Phase 1, before flight animation begins in Phase 2.
- **Reused, restyled (not rebuilt):** the header, music/help buttons, shop
  toggle, and end-of-game score screen — restyled with the new tokens.
- **Main menu.** `index.html` (player-count stepper, Start Game, help) shares
  the stylesheet and is brought into the new visual identity in Phase 4 so the
  whole app is consistent.

## Phasing

Delivered on branch `visual-overhaul` in reviewable phases:

1. **Design tokens + card face** — visual only, no behavior change. Biggest
   visible win first. (`cardRenderer.js`, `icons.js`, token stylesheet.)
2. **Animator module + draw/discard flight.** (`animator.js`, wire into
   `drawHand` / end-of-turn discard.)
3. **Buy flight + play-action pop + counter bumps.** (Wire into `buyCard` and
   the play-action path.)
4. **Board/table restyle + hover polish + score-screen restyle + menu
   (`index.html`) restyle.**

## Testing & Verification

- No test harness exists and none will be invented for this view work.
  Verification is manual/visual: drive the game in a headless browser and
  capture before/after screenshots at each phase.
- Confirm the "open `index.html` directly" path still works (no build, no
  server required).

## Edge Cases

- **3–4 players** — hand re-sort and `flyCard` still target the correct
  containers.
- **Deck-empty reshuffle** — discard becomes the new deck; draw flight still
  originates from the deck position.
- **Buying the last of a pile** — supply count reaches empty; the empty-pile
  visual still shows.
- **`prefers-reduced-motion`** — reduced animation path.
- **Small-card legibility** — discard and score-screen sizes remain readable.

## Out of Scope

- Turn-handoff / privacy / "ready?" screens.
- Networked/multiplayer-over-internet play.
- New cards or gameplay/rules changes.
- Any build tooling, framework, or dependency.
