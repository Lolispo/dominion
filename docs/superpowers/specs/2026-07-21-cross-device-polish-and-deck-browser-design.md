# Cross-device polish, card fixes & deck browser — Design

**Date:** 2026-07-21
**Status:** Approved (design), pending implementation plan
**Scope:** View/UI layer only. No game-rule logic changes.

## Context

The Dominion visual overhaul shipped to `main` (see
`docs/superpowers/RESUME.md`). This spec collects a batch of UI polish items plus
one net-new feature (a deck browser), all reported from real play. There is no
build step and no dependencies; game logic in `Card.js` / `Deck.js` / `Player.js`
is preserved — this is purely the view/animation layer.

Serve locally with `python3 -m http.server 8000`, open `game.html`. Visual
verification uses the `browse` binary at
`~/.claude/skills/gstack/browse/dist/browse` (always `$B restart` before a check
— it caches JS/CSS sub-resources). Web Audio SFX only start after a real click.

## Goals

1. Consistent layout across screen sizes (laptop → 27″), no background tiling,
   no oversized empty gap between the hand and the rest of the interactions.
2. Every one of the 19 cards renders with nothing clipped or hidden behind
   badges — verified card by card.
3. Hide the placeholder "Shop Message" until there is a real message.
4. The first hand card is fully visible (not clipped on the left / on hover).
5. Action-play animation is bigger and slower, with a distinct sound effect.
6. Resource readouts (gold / buys / actions) and the action buttons dock
   directly above the hand instead of sitting up by the player name.
7. A Slay-the-Spire-style deck-browser popup to view your whole deck.

## Non-goals

- No changes to game rules, turn flow, or card behaviour.
- No refactor of the `Deck.js` god object or the id-string↔CSS-selector contract
  beyond what these features strictly require (those remain deferred — see
  `RESUME.md` "Deferred maintainability findings").
- No opponent deck peeking (would be cheating); the deck browser is your own
  deck only.
- No mobile-first redesign; "cross-device" here means the desktop range behaves
  well and does not break on smaller/larger viewports.

## Data model (reference)

`DeckOfCards` (in `Deck.js`) holds, per player:
- `deckStack` — draw pile (array)
- `discard` — discard pile (array)
- `board` — cards in play this turn (array)
- `hand` — a `Hand` object; its cards live in `hand.allCards` (a `Map` of id→card)
- `money`, `buysLeft`, `actionsLeft`, `activeActionCard`

Card faces are built by `renderCard(tempCard, id, parentID, opts)` in
`cardRenderer.js`. The `.dcard` grid rows are currently a fixed
`18% / 46% / 12% / 24%` with `overflow: hidden`.

---

## A. Cross-device layout

**Files:** `style.css`, small addition to a JS file (topbar height).

1. **Background tiling fix.** Replace
   `body.theme-forest { background: url('res/forest.jpg') }` with
   `background: url('res/forest.jpg') center/cover no-repeat fixed;` plus a
   `background-color: #17361f;` fallback. This removes the "doubling at the
   bottom" on tall screens.
2. **Cap + center.** `#table { max-width: 1600px; margin-inline: auto; }` so the
   table centers with tidy margins on a 27″ rather than stretching edge to edge.
3. **Gentle proportional scaling.** Derive the card size-class scales from
   `clamp()` on viewport width so cards grow modestly between a laptop and a
   27″ but stay within a fixed min/max. Approximate targets (tuned during
   implementation against real screenshots):
   - `.dcard.size-hand  { --card-scale: clamp(.50, .8vw + .20, .68); }`
   - `.dcard.size-shop  { --card-scale: clamp(.58, .9vw + .22, .78); }`
   - `.dcard.size-board { --card-scale: clamp(.52, .7vw + .18, .66); }`
   The exact clamp expressions are a tuning detail; the requirement is: never
   tiny on a laptop, never oversized on a 27″, proportional in between.
4. **Remove the magic `72px`.** `#table` currently uses
   `height: calc(100vh - 72px)`. Set `--topbar-h` from JS via a `ResizeObserver`
   on `#topbar`, and use `height: calc(100dvh - var(--topbar-h))`. `dvh` handles
   mobile browser chrome; the observer keeps it correct when the topbar wraps on
   a narrow viewport. This also resolves deferred maintainability finding #3.

The large empty gap between the top area and the bottom-pinned hand is chiefly a
consequence of the resource block living at the top; section D removes most of
it by docking those controls to the hand.

## B. Card text — uniform size, nothing clipped

**Files:** `style.css`, `cardRenderer.js`.

Chosen approach (from brainstorm): keep every card the same fixed size and make
the text auto-fit, rather than letting tall cards grow.

1. **Badges off the text.** Move the cost/supply badges to the **top corners of
   the art row** — clear of both the name banner (fixes Council Room's name
   collision) and the rules text (fixes the "blocked by gold and quantity"
   report). The art row is mostly empty space around the central icon, so
   corner badges there read cleanly. Remove the now-unneeded banner side-padding
   that was compensating for badge overlap.
2. **Flexible rules row.** Rebalance the `.dcard` grid so the rules row has more
   room (e.g. banner / art / typeline / text ≈ `16% / 42% / 11% / 31%`; final
   numbers tuned against screenshots), keeping `overflow: hidden` only as a
   backstop.
3. **Auto-fit the rules font.** Add `fitCardText(cardEl)` (mirrors the existing
   `fitHandFan` measure-and-adjust pattern in `html_css_functions.js`): measure
   the `.dcard-text` against its row and step the font-size down to a sensible
   floor until it no longer overflows. Called once per card at render (and it is
   cheap / idempotent). This guarantees the longest cards — Mine, Council Room,
   Cellar, Market, Festival — fit fully at the same dimensions as Copper.
4. **Verification gate (the "be confident" requirement).** Screenshot **all 19
   cards** (Copper, Silver, Gold, Estate, Duchy, Province, Garden, Curse, Cellar,
   Chapel, Village, Wood Cutter, Smithy, Council Room, Festival, Laboratory,
   Market, Mine, Witch) at both hand and shop scale via `browse`, and confirm
   each has: full name visible, no badge overlap on name or text, and no clipped
   rules line. This check is an explicit step in the implementation plan, not
   optional.

## C. Small fixes

**Files:** `html_css_functions.js` (shop), `style.css` (hand).

1. **Shop message hidden by default.** In `initShopHTML`, stop seeding the
   `'Shop Message\n'` placeholder; leave `#shop_text_1` empty so nothing shows
   until `updateShopText` writes a real message.
2. **First hand card fully visible.** Root cause: `.hand-row [id^='hand_']` sets
   `overflow-x: auto`; per the CSS overflow spec, a non-`visible` value on one
   axis forces the other axis to compute to `auto`, which clips the first card
   and the hover-lift. Fix: remove the overflow from the hand fan (the
   `fitHandFan` tightener already guarantees the fan fits on one row), and add a
   small left padding plus a hover `z-index` so the lifted first card is never
   occluded by the deck pile to its left.

## D. Resource bar docked above the hand

**Files:** `Player.js` (order/class hooks), `style.css`.

Group into one bar directly above the hand tray, pinned to the bottom of the
active player's column with the hand:
- gold / buys / actions readouts (`#money_`, `#buysLeft_`, `#actionsLeft_`)
- the action buttons (Go To Buy Phase / End Turn, in `#interact_`)
- a new **"View Deck"** button (opens the section-F popup)

The player name pill stays at the top.

**Implementation approach:** reposition via flexbox `order` on the active
player's column (`#playArea > .margin_bottom:not(.opponent)`), **not** by
re-parenting DOM nodes. This keeps the fragile id→CSS-selector contract intact
and leaves the opponent-strip rules (which already `display:none` the stats and
`#interact_` blocks) working unchanged. Assign the resource/interact blocks an
`order` just below the `handRow`, and give both the bottom group the existing
`margin-top:auto` push so they sit together at the bottom.

## E. Action animation — bigger, slower, sound

**Files:** `animator.js`, `sfx.js`, `Deck.js`.

1. **`popCard` bigger/slower.** Scale `1.25 → ~1.5`, duration `420 → ~650ms`,
   with a slight overshoot easing. Extract these (and the other animator magic
   numbers noted in deferred finding #6) into named constants at the top of
   `animator.js`.
2. **Distinct action sound.** Add `sfxAction()` to `sfx.js` — a richer two-note
   synth chime, clearly distinct from the single-blip treasure `sfxPlay`. Wire
   it into the action-play path (currently `sfxPlay()` at `Deck.js:373`,
   immediately before `popCard`). Keep it fully synthesized (no asset files), in
   the style of the existing effects, respecting `_sfxMuted` / `_VOL`.

## F. Deck-browser popup

**Files:** new `deckBrowser.js`; `style.css`; wire-up in `Player.js` (pile +
button click) and a small helper in `Deck.js`; `<script>` tag in `game.html`.

Kept in its own file so `Deck.js` (already ~770 lines) does not grow.

1. **Data.** Add `getAllOwnedCards()` to `DeckOfCards`:
   `deckStack` + `discard` + `board` + `Array.from(hand.allCards.values())`.
   Returns the player's complete card collection.
2. **UI.** A modal overlay: dimmed full-screen backdrop + a centered panel with
   a header **"Your Deck (N cards)"** and a close (X). The body is one scrollable
   grid of **unique cards, each grouped with a `×N` count badge**, sorted by
   type (treasure → victory → action) then cost, matching the shop's grouping.
   Cards are drawn with the existing `renderCard` at a browse-appropriate size,
   **read-only** — no buy/click callbacks, `pointer-events` disabled on the
   faces so it is purely informational.
3. **Triggers.** Opens on click of the player's **deck pile**
   (`#pile_deck_<pid>`), **discard pile** (`#pile_discard_<pid>`), or the **View
   Deck** button in the resource bar. Closes on **Esc**, **backdrop click**, or
   the **X**. Only the active/local player's own deck is ever shown.
4. **Rendering into a scratch container.** The popup builds its cards into its
   own container with fresh ids (or an isolated id namespace) so it never
   collides with the live board's element ids.

---

## Sequencing

- **A + B + C + D** touch the same layout surface and should be implemented and
  visually verified together.
- **E** is independent (animation + audio).
- **F** is the net-new feature and can land last.

All three groups are covered by one implementation plan with staged steps.

## Verification

- Manual visual check via `browse` at (at minimum) a laptop width (~1440) and a
  large width (~2560) — background not tiling, table centered, hand + resource
  bar grouped, no oversized gap.
- The 19-card screenshot gate from section B.
- Deck browser: open via each trigger, confirm counts equal the sum of the four
  piles, close via each method, confirm no id collisions with the live board and
  no way to interact/buy from it.
- Sound + animation confirmed after a user click (audio needs a gesture).
