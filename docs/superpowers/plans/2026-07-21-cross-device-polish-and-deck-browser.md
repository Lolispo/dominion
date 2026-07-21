# Cross-device polish, card fixes & deck browser — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Dominion table render consistently across screen sizes, guarantee no card text/badges are clipped, dock the resource controls to the hand, beef up the action animation with sound, and add a Slay-the-Spire-style deck browser.

**Architecture:** View/animation layer only — no game-rule changes. Edits are concentrated in `style.css` (layout), `cardRenderer.js` (card fit), `animator.js` + `sfx.js` (action feedback), `Player.js`/`gameScript.js` (wiring), plus one new file `deckBrowser.js` (self-contained modal). `renderCard()` in `cardRenderer.js` is the single chokepoint for all card DOM, so per-card behaviour is hooked there once.

**Tech Stack:** Vanilla ES5-style JS, plain CSS, no build step, no dependencies, no unit-test framework. Verification is visual via the `browse` binary at `~/.claude/skills/gstack/browse/dist/browse` and DOM inspection.

## Global Constraints

- No game-rule / turn-flow / card-behaviour changes — view layer only.
- No new dependencies, no build step. Plain `<script>` includes, ES5-compatible style (`var`, `function`), matching the existing files.
- Preserve the legacy element-id contract: `renderCard` keeps building the same ids; do not rename existing ids or their `[id^='...']` CSS selectors.
- All SFX stay fully synthesized in `sfx.js` (no asset files) and respect `_sfxMuted` / `_VOL`.
- Deck browser shows the local/active player's own deck only (no opponent peeking).
- Serve with `python3 -m http.server 8000` from repo root; open `http://localhost:8000/game.html`.
- **Always run `$B restart` before a `browse` check** (it caches JS/CSS). Web Audio only starts after a real click, so trigger a click before expecting sound.
- Commit after each task with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

### Browse quick-reference (used in every verification step)

```bash
B=~/.claude/skills/gstack/browse/dist/browse
$B restart
$B open http://localhost:8000/game.html
$B set-viewport 1440 900     # laptop
$B screenshot /tmp/check.png
$B set-viewport 2560 1440    # 27" class
$B screenshot /tmp/check-big.png
```
(If a subcommand name differs in the installed build, run `$B --help` once and use the equivalent.)

---

## File Structure

- `style.css` — all layout/scale/badge/animation-CSS edits (Tasks 1,2,3,4,5,6).
- `cardRenderer.js` — badge DOM position + `fitCardText` hook (Task 2).
- `html_css_functions.js` — `fitCardText()` helper; shop-message default removal (Tasks 2,3).
- `animator.js` — extracted animation constants + bigger/slower `popCard` (Task 5).
- `sfx.js` — new `sfxAction()` (Task 5).
- `Deck.js` — `getAllOwnedCards()` helper; swap `sfxPlay`→`sfxAction` in `useCard` (Tasks 5,6).
- `Player.js` — resource-bar `order`/class hooks; deck-browser pile+button wiring (Tasks 4,6).
- `gameScript.js` — `initTopbarHeightVar()` call at startup (Task 1).
- `deckBrowser.js` — **new** self-contained modal (Task 6).
- `game.html` — add `<script src='deckBrowser.js'>` (Task 6).

---

## Task 1: Responsive layout — background, cap/center, proportional scale, topbar var

**Files:**
- Modify: `style.css` (`:root`, `body.theme-forest`, `#table`, `.dcard.size-*`)
- Modify: `gameScript.js:29` area (call a new init fn)
- Modify: `html_css_functions.js` (add `initTopbarHeightVar`)

**Interfaces:**
- Produces: global CSS var `--topbar-h` (px string, e.g. `72px`) kept in sync with `#topbar` height; `initTopbarHeightVar()` global.

- [ ] **Step 1: Fix the tiling background.** In `style.css`, replace the `body.theme-forest` background rule (currently `background: url('res/forest.jpg');` at ~line 32-34):

```css
body.theme-forest {
	background: url('res/forest.jpg') center / cover no-repeat fixed;
	background-color: #17361f; /* fallback + letterbox colour, matches --table-edge */
}
```
(Leave the separate `body.theme-forest { overflow: hidden; }` rule further down untouched.)

- [ ] **Step 2: Add the `--topbar-h` default + cap/center the table.** Add `--topbar-h: 72px;` inside the existing `:root { ... }` block. Then change the `#table` rule (~line 624):

```css
#table {
	display: flex; align-items: stretch; gap: 12px; padding: 0 12px 12px;
	height: calc(100dvh - var(--topbar-h, 72px)); box-sizing: border-box;
	max-width: 1600px; margin-inline: auto;
}
```

- [ ] **Step 3: Proportional card scales.** Replace the fixed `--card-scale` values so cards scale gently with viewport width but stay bounded. Edit the shop/board rules (~line 548-550) and the hand rule (~line 709):

```css
.dcard.size-shop    { --card-scale: clamp(.58, .40vw + .34, .78); }
.dcard.size-board   { --card-scale: clamp(.52, .32vw + .30, .66); }
.dcard.size-discard { --card-scale: .4; }   /* unchanged: tiny thumbnail */
/* ...and where .dcard.size-hand is defined (~line 709): */
.dcard.size-hand    { --card-scale: clamp(.50, .38vw + .28, .68); }
```
(Values are starting points; refine in Step 7 against screenshots.)

- [ ] **Step 4: Add the topbar-height observer.** In `html_css_functions.js`, add near the other UI helpers:

```javascript
// Keep the CSS var --topbar-h in sync with the real topbar height so the table
// fills exactly the remaining viewport, even when the topbar wraps on narrow screens.
function initTopbarHeightVar(){
	var bar = document.getElementById('topbar');
	if(!bar){ return; }
	var apply = function(){
		document.documentElement.style.setProperty('--topbar-h', bar.offsetHeight + 'px');
	};
	if(typeof ResizeObserver === 'function'){ new ResizeObserver(apply).observe(bar); }
	window.addEventListener('resize', apply);
	apply();
}
```

- [ ] **Step 5: Call it at startup.** In `gameScript.js`, inside `startGame()` after `initCardTooltip();` (line 29), add:

```javascript
	initTopbarHeightVar();
```

- [ ] **Step 6: Serve + verify no tiling, centered on big screen.**

```bash
python3 -m http.server 8000 >/tmp/httpd.log 2>&1 &
B=~/.claude/skills/gstack/browse/dist/browse; $B restart
$B open http://localhost:8000/game.html
$B set-viewport 2560 1440; $B screenshot /tmp/t1-big.png
$B set-viewport 1440 900;  $B screenshot /tmp/t1-lap.png
```
Expected: forest background fills once (no repeated/"doubled" image at the bottom) on 2560×1440; `#table` is centered with margins on the big viewport and fills comfortably at 1440. Open `/tmp/t1-big.png` and `/tmp/t1-lap.png` to confirm.

- [ ] **Step 7: Tune scales if needed.** If cards look too small on 1440 or oversized on 2560, adjust the `clamp()` middle terms and re-screenshot. Confirm no page scrollbar appears (the layout still fits one viewport for 2 players).

- [ ] **Step 8: Commit.**

```bash
git add style.css gameScript.js html_css_functions.js
git commit -m "fix(ui): cross-device layout — cover background, capped/centred table, proportional card scale, dynamic --topbar-h

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Cards — badges off text, flexible rules row, auto-fit font (all 19 verified)

**Files:**
- Modify: `style.css` (`.dcard` grid, `.dcard-cost`/`.dcard-supply` position, banner padding)
- Modify: `cardRenderer.js` (call the fit hook)
- Modify: `html_css_functions.js` (add `fitCardText`)

**Interfaces:**
- Produces: `fitCardText(cardDivEl)` global — measures `.dcard-text` inside a `.dcard` root and shrinks its font-size to fit; idempotent.
- Consumes: nothing new.

- [ ] **Step 1: Move badges to the art row's top corners.** In `style.css`, the badges are currently pinned to the card's top corners (`top: calc(4px * var(--card-scale))` at ~line 820), overlapping the name banner. Change them to sit just below the banner (over the empty art area). Replace that override rule with:

```css
/* Cost + supply sit in the top corners of the ART row — clear of both the
   name banner (row 1) and the rules text (row 4). */
.dcard-cost, .dcard-supply {
	top: 19%;          /* just under the ~16% banner row */
	bottom: auto; z-index: 2;
}
```

- [ ] **Step 2: Give the rules row more room + drop the badge-clearing banner padding.** Update the `.dcard` grid rows (~line 543) and the banner rule (~line 834):

```css
.dcard { /* ...unchanged props... */ grid-template-rows: 16% 42% 11% 31%; }
```
```css
.dcard-banner {
	padding: 2px calc(6px * var(--card-scale));   /* was 30px each side to dodge badges */
	box-sizing: border-box;
	font-size: calc(15px * var(--card-scale));
	line-height: 1.05;
	white-space: normal;
}
```

- [ ] **Step 3: Add `fitCardText`.** In `html_css_functions.js`, add near `fitHandFan`:

```javascript
// Shrink a card's rules text until it fits its grid row — guarantees the longest
// cards (Mine, Council Room, Cellar, Market) never clip. Idempotent: resets first.
function fitCardText(cardDiv){
	if(!cardDiv){ return; }
	var text = cardDiv.querySelector('.dcard-text');
	if(!text){ return; }
	text.style.fontSize = '';               // reset to the CSS-driven size
	var base = parseFloat(getComputedStyle(text).fontSize) || 12;
	var size = base;
	var MIN = 6;                            // floor in px
	// Row height is the box the text must fit inside.
	var avail = text.clientHeight;
	if(!avail){ return; }                   // not laid out yet
	var guard = 40;
	while(text.scrollHeight > avail && size > MIN && guard-- > 0){
		size -= 0.5;
		text.style.fontSize = size + 'px';
	}
}
```

- [ ] **Step 4: Hook it into every card render.** In `cardRenderer.js`, at the end of `renderCard` just before `return div;`, add:

```javascript
	if(typeof fitCardText === 'function'){
		requestAnimationFrame(function(){ fitCardText(div); });
	}
```

- [ ] **Step 5: Verify ALL 19 cards (the confidence gate).** Restart + screenshot the shop (all buyable cards) and a hand.

```bash
B=~/.claude/skills/gstack/browse/dist/browse; $B restart
$B open http://localhost:8000/game.html
$B set-viewport 1600 900
$B screenshot /tmp/t2-shop.png
```
Open `/tmp/t2-shop.png` and check every card present in the shop: Copper, Silver, Gold, Estate, Duchy, Province, Garden, Cellar, Chapel, Village, Wood Cutter, Smithy, Council Room, Festival, Laboratory, Market, Mine, Witch. (Curse is not in the shop; verify it via the deck browser in Task 6 or a temporary render.) For each confirm: full name visible and not overlapped by badges; cost badge (bottom-left→now top-left of art) and supply badge readable; **no clipped last line** on the multi-line cards (Council Room = 3 lines, Mine = long sentence, Cellar, Market = 4 lines, Festival = 3 lines). Note any failures.

- [ ] **Step 6: Fix any card that still clips.** If a card still overflows, lower `MIN` slightly or nudge the `31%` text-row up (e.g. `15% 40% 11% 34%`) and re-screenshot until all pass. Re-run Step 5.

- [ ] **Step 7: Commit.**

```bash
git add style.css cardRenderer.js html_css_functions.js
git commit -m "fix(ui): card badges clear of name/text, flexible rules row, auto-fit long card text

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Hide default shop message + first hand card fully visible

**Files:**
- Modify: `html_css_functions.js` (`initShopHTML`)
- Modify: `style.css` (`.hand-row [id^='hand_']` overflow)

- [ ] **Step 1: Stop seeding the placeholder.** In `html_css_functions.js` `initShopHTML`, the last `initNewUIElement(...id_shop + id_text + '1'...)` currently sets `.innerHTML = 'Shop Message\n';`. Change it to leave it empty:

```javascript
	initNewUIElement('div', new Map().set('id', id_shop + id_text + '1'), id_shop + 'texts', ['text16', 'bold', 'margin_left', 'text_shadow'])
		.innerHTML = '';
```
(`updateShopText` fills it on first real interaction; an empty div collapses invisibly.)

- [ ] **Step 2: Remove the clipping overflow on the hand fan.** In `style.css`, the rule at ~line 649 sets `overflow-x: auto` on the hand list, which forces `overflow-y` to clip too (cutting the first card + hover lift). Replace that rule:

```css
/* fan is kept on one row by fitHandFan(), so no scroll/clip is needed */
.hand-row [id^='hand_'] { flex: 1 1 0; min-width: 0; flex-wrap: nowrap; overflow: visible; padding: 4px 0 4px 6px; }
```
Also ensure the first card lifts above the deck pile on hover — confirm the existing `.hand-row [id^='hand_'] .dcard:hover { transform: translateY(-14px); z-index: 6; }` (~line 713) is present (it is); if the deck pile still occludes it, add `.hand-row .pile { z-index: 0; }`.

- [ ] **Step 3: Verify.**

```bash
B=~/.claude/skills/gstack/browse/dist/browse; $B restart
$B open http://localhost:8000/game.html
$B set-viewport 1600 900; $B screenshot /tmp/t3.png
```
Expected in `/tmp/t3.png`: no "Shop Message" text in the shop panel before any click; the leftmost hand card is fully visible (not cut by the deck pile). Hover the first card (`$B hover` or move+screenshot) and confirm it lifts fully without being clipped.

- [ ] **Step 4: Commit.**

```bash
git add html_css_functions.js style.css
git commit -m "fix(ui): hide default shop message; stop clipping the first hand card

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Dock resource readouts + action buttons above the hand

**Files:**
- Modify: `style.css` (active-column `order` rules)
- Modify: `Player.js` (add a class to the interact + stats containers for targeting; no re-parenting)

**Interfaces:**
- Consumes: existing containers `#info_stats_<pid>` (money/buys/actions live under it), `#interact_<pid>` (action buttons), `#handRow_<pid>`.
- Produces: a visual bottom group (stats + interact + hand) via flex `order`.

- [ ] **Step 1: Understand current order.** The active player's column is `#playArea > .margin_bottom:not(.opponent)` with `display:flex; flex-direction:column`. Children in DOM order: name div, `#infoboard_` (contains `#info_` → stats + text + discard-top, and `#board_`), `#interact_`, `#handRow_`. The hand is pinned to the bottom via `.hand-row { margin-top:auto }`. We want stats + interact to sit directly above the hand, still at the bottom.

- [ ] **Step 2: Add ordering rules.** In `style.css`, in the relayout section, add:

```css
/* Dock the resource readouts + action buttons directly above the hand (active player). */
#playArea > .margin_bottom:not(.opponent) { }              /* container already flex column */
#playArea > .margin_bottom:not(.opponent) > [id^='name_'][id$='_div'] { order: 0; }
#playArea > .margin_bottom:not(.opponent) > [id^='infoboard_']         { order: 1; }
#playArea > .margin_bottom:not(.opponent) > [id^='interact_']          { order: 8; margin-top: auto; }
#playArea > .margin_bottom:not(.opponent) > [id^='handRow_']           { order: 9; margin-top: 0; }
/* Pull the money/buys/actions readouts out of the top infoboard and show them in the dock row.
   They live under #info_stats_<pid>; float that block down next to the buttons. */
#playArea > .margin_bottom:not(.opponent) [id^='info_stats_'] { }
```

- [ ] **Step 3: Group stats with the buttons visually.** The money/buys/actions blocks (`#money_`, `#buysLeft_`, `#actionsLeft_`) sit inside `#info_stats_main_<pid>` under `#infoboard_` (order 1, top). To bring them into the dock, give the interact bar and the stats a shared flex row. Simplest non-reparenting approach: make `#interact_<pid>` a flex row and move the stats visually by relocating the `#info_stats_<pid>` node's order. Since `#info_stats_` is nested (not a direct child of the column), use a thin wrapper instead: in `Player.js` `initPlayer`, wrap the stats + interact by adding class `dock-bar` to `#interact_<pid>` and add the stats readouts' parent a class. Add in `Player.js` where `id_interact` is created (line 146):

```javascript
		initNewUIElement('div', new Map().set('id', id_interact + this.index), id_player + this.index, ['interact', 'dock-bar']);
```

- [ ] **Step 4: Render the stat readouts inside the dock.** The cleanest reliable route (avoids fighting the nested infoboard) is to have the dock bar show the live stat elements. Move the three stat elements' creation so they are appended into `#interact_<pid>` instead of `#info_stats_main_<pid>`. In `Player.js`, change the three lines that create `#money_/#buysLeft_/#actionsLeft_` (lines 156-158) to parent them under the interact bar:

```javascript
		initNewUIElement('div', new Map().set('id', id_money + this.index), id_interact + this.index, ['bold', 'info_stats_main', 'info_stats', 'text_shadow', 'text16']);
		initNewUIElement('div', new Map().set('id', id_buysLeft + this.index), id_interact + this.index, ['bold', 'info_stats_main', 'info_stats', 'text_shadow', 'text16']);
		initNewUIElement('div', new Map().set('id', id_actionsLeft + this.index), id_interact + this.index, ['bold', 'info_stats_main', 'info_stats', 'text_shadow', 'text16']);
```
(These ids are unchanged, so all `document.getElementById(id_money + pid)` lookups, `bumpCounter`, and `floatGain` targets keep working. `#info_stats_main_<pid>` becomes an empty container — harmless; the end-game score screen repopulates `#info_stats_<pid>` directly in `endGame`, which still works because it uses `removeChildren(id_info_stats + i)` on the parent.)

- [ ] **Step 5: Style the dock bar.** In `style.css` add:

```css
.dock-bar {
	display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
	padding: 6px 10px; margin: 0 0 4px;
	background: linear-gradient(180deg, rgba(var(--wood-rgb), .55), rgba(var(--forest-rgb), .6));
	border: 1px solid var(--wood); border-radius: 10px;
}
.dock-bar [id^='money_'], .dock-bar [id^='buysLeft_'], .dock-bar [id^='actionsLeft_'] { font-size: 16pt; }
```
Confirm the earlier per-player stat font rule (`...[id^='money_'] { font-size: 18pt }` ~line 724) still applies or is superseded; keep whichever reads best.

- [ ] **Step 6: Verify layout + that opponents are unaffected.**

```bash
B=~/.claude/skills/gstack/browse/dist/browse; $B restart
$B open http://localhost:8000/game.html
$B set-viewport 1600 900; $B screenshot /tmp/t4.png
$B set-viewport 2560 1440; $B screenshot /tmp/t4-big.png
```
Expected: gold/buys/actions + "Go To Buy Phase"/"End Turn" buttons sit in one bar directly above the hand; name pill still at top; the big-screen gap between top and hand is much smaller. Opponent strips at the top still show only name + counts + minis (the `.opponent [id^='interact_'] { display:none }` and stats-hiding rules still apply because opponents never get `player-active`). Play a treasure and confirm the money readout still bumps/updates in the dock.

- [ ] **Step 7: Commit.**

```bash
git add Player.js style.css
git commit -m "feat(ui): dock gold/buys/actions and action buttons in a bar above the hand

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Action animation bigger/slower + distinct action sound

**Files:**
- Modify: `animator.js` (extract constants; bigger/slower `popCard`)
- Modify: `sfx.js` (add `sfxAction`)
- Modify: `Deck.js:373` (`sfxPlay` → `sfxAction` in `useCard`)

**Interfaces:**
- Produces: `sfxAction()` global in `sfx.js`.
- Note: `Deck.js` `useCard` waits on `popCard(...).then(...)`; the `useCardAnimationTime = 500` constant is separate and only used elsewhere — increasing `popCard` duration does not stall game logic because it chains on the returned promise.

- [ ] **Step 1: Extract animator constants + enlarge/slow the pop.** In `animator.js`, add constants near the top (with the existing `DEAL_*` consts) and rewrite `popCard`:

```javascript
var POP_SCALE = 1.5;       // was 1.25 — a bigger forward pop
var POP_DURATION = 650;    // was 420 — slower, more readable
```
```javascript
function popCard(cardRootId){
	return new Promise(function(resolve){
		var div = document.getElementById(cardRootId + '_div');
		if(!div || prefersReducedMotion()){ return resolve(); }
		div.style.zIndex = '7';   // pop above neighbours while scaling
		var a = div.animate([
			{ transform:'scale(1)' },
			{ transform:'scale(' + POP_SCALE + ')', offset:.45 },
			{ transform:'scale(1)' }
		], { duration: POP_DURATION, easing:'cubic-bezier(.34,1.56,.64,1)' }); // slight overshoot
		a.onfinish = function(){ div.style.zIndex = ''; resolve(); };
	});
}
```

- [ ] **Step 2: Add `sfxAction`.** In `sfx.js`, add after `sfxPlay`:

```javascript
// A richer two-note chime — an action card played (distinct from the single-blip treasure sfxPlay).
function sfxAction(){
	if(_sfxMuted || !_ready()){ return; }
	var ctx = _ctx();
	var t = ctx.currentTime;
	[ {f: 523.25, at: 0.00}, {f: 783.99, at: 0.09} ].forEach(function(n){  // C5 then G5
		var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = n.f;
		var g = ctx.createGain();
		var s = t + n.at;
		g.gain.setValueAtTime(0.0001, s);
		g.gain.exponentialRampToValueAtTime(0.07 * _VOL, s + 0.02);
		g.gain.exponentialRampToValueAtTime(0.0001, s + 0.34);
		o.connect(g); g.connect(ctx.destination);
		o.start(s); o.stop(s + 0.36);
	});
}
```

- [ ] **Step 3: Wire it into the action-play path.** In `Deck.js`, in `useCard` (line 373), change `if(typeof sfxPlay === 'function'){ sfxPlay(); }` to:

```javascript
		if(typeof sfxAction === 'function'){ sfxAction(); }
```
(Leave `sfxPlay` defined; it is still available and other treasure-play paths may use it. Verify with `grep -n sfxPlay Deck.js` — if `useCard` was its only caller, that's fine; `sfxPlay` simply becomes unused and can stay.)

- [ ] **Step 4: Verify (needs a click for audio).**

```bash
B=~/.claude/skills/gstack/browse/dist/browse; $B restart
$B open http://localhost:8000/game.html
$B set-viewport 1600 900
# click an action card in hand to play it, then screenshot mid-pop if possible
```
Expected: playing an action card produces a visibly larger, slower pop (scales to ~1.5 over ~0.65s) that rises above neighbouring cards, and a two-note chime plays (audible after the click gesture). Confirm gameplay still proceeds (effects resolve after the pop).

- [ ] **Step 5: Commit.**

```bash
git add animator.js sfx.js Deck.js
git commit -m "feat(ui): bigger/slower action-card pop + distinct two-note action sound

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Deck-browser popup (Slay-the-Spire style)

**Files:**
- Create: `deckBrowser.js`
- Modify: `Deck.js` (add `getAllOwnedCards`)
- Modify: `Player.js` (pile click handlers + "View Deck" button in the dock)
- Modify: `game.html` (script include)
- Modify: `style.css` (modal styles)

**Interfaces:**
- Consumes: `DeckOfCards` fields `deckStack`, `discard`, `board`, `hand.allCards` (Map); `renderCard(card, id, parentID, {size})`; `getCssOrderCard`; `getPlayer(pid)`; `isTurn(pid)`.
- Produces: `DeckOfCards.getAllOwnedCards()` → array of card objects; globals `openDeckBrowser(pid)` and `closeDeckBrowser()`.

- [ ] **Step 1: Add `getAllOwnedCards` to `DeckOfCards`.** In `Deck.js`, near `endGetAllCards` (~line 325), add (this one does NOT mutate piles, unlike `endGetAllCards`):

```javascript
	// Every card the player owns right now, across all piles — for the deck browser (read-only).
	this.getAllOwnedCards = function(){
		return this.deckStack
			.concat(this.discard)
			.concat(this.board)
			.concat(Array.from(this.hand.allCards.values()));
	}
```

- [ ] **Step 2: Create `deckBrowser.js`.**

```javascript
// Author Petter Andersson
// Slay-the-Spire-style read-only deck browser: view all cards a player owns.
'use strict'

function closeDeckBrowser(){
	var el = document.getElementById('deckBrowser');
	if(el && el.parentNode){ el.parentNode.removeChild(el); }
	document.removeEventListener('keydown', _deckBrowserKey);
}

function _deckBrowserKey(e){ if(e.key === 'Escape'){ closeDeckBrowser(); } }

function openDeckBrowser(pid){
	closeDeckBrowser(); // never stack two
	var player = getPlayer(pid);
	if(!player){ return; }
	var cards = player.cards.getAllOwnedCards();

	// Group by card name → {card, count}
	var groups = new Map();
	cards.forEach(function(c){
		var g = groups.get(c.name);
		if(g){ g.count++; } else { groups.set(c.name, { card: c, count: 1 }); }
	});

	// Backdrop + panel
	var overlay = document.createElement('div');
	overlay.id = 'deckBrowser';
	overlay.className = 'deck-browser-overlay';
	overlay.addEventListener('click', function(e){ if(e.target === overlay){ closeDeckBrowser(); } });

	var panel = document.createElement('div');
	panel.className = 'deck-browser-panel';
	overlay.appendChild(panel);

	var header = document.createElement('div');
	header.className = 'deck-browser-header';
	header.innerHTML = '<span>' + player.name + "'s Deck (" + cards.length + ' cards)</span>';
	var close = document.createElement('button');
	close.type = 'button'; close.className = 'deck-browser-close normalButton'; close.innerHTML = '✕';
	close.addEventListener('click', closeDeckBrowser);
	header.appendChild(close);
	panel.appendChild(header);

	var grid = document.createElement('div');
	grid.id = 'deckBrowserGrid';
	grid.className = 'deck-browser-grid';
	panel.appendChild(grid);
	document.body.appendChild(overlay);

	// Sort by type then cost (matches the shop grouping), render read-only cards with a ×N badge.
	var items = Array.from(groups.values()).sort(function(a, b){
		var oa = getCssOrderCard(a.card, 1), ob = getCssOrderCard(b.card, 1);
		if(oa !== ob){ return oa - ob; }
		return (a.card.getCost() || 0) - (b.card.getCost() || 0);
	});
	items.forEach(function(item, i){
		var cell = document.createElement('div');
		cell.id = 'db_cell_' + i;
		cell.className = 'deck-browser-cell';
		grid.appendChild(cell);
		renderCard(item.card, 'db_card_' + i, 'db_cell_' + i, { size: 'shop' });
		var badge = document.createElement('div');
		badge.className = 'deck-browser-count';
		badge.innerHTML = '×' + item.count;
		cell.appendChild(badge);
	});

	document.addEventListener('keydown', _deckBrowserKey);
}
```
(No click callbacks are passed to `renderCard`, so the cards are inert; CSS in Step 5 also disables pointer events on the faces. Fresh `db_*` ids never collide with the live board's ids.)

- [ ] **Step 3: Include the script.** In `game.html`, add inside the `<script>` block (after `sfx.js`, before `Deck.js` is fine since it only calls globals at click-time):

```html
	<script src='deckBrowser.js'></script>
```

- [ ] **Step 4: Wire triggers.** In `Player.js` `initPlayer`, after the deck + discard piles are created (lines 149 & 152), attach click handlers, and add a "View Deck" button to the dock bar. After line 152 (`pile_discard_` creation), add:

```javascript
		var openMyDeck = (function(){ openDeckBrowser(this.index); }).bind(this);
		document.getElementById('pile_deck_' + this.index).addEventListener('click', openMyDeck);
		document.getElementById('pile_discard_' + this.index).addEventListener('click', openMyDeck);
		document.getElementById('pile_deck_' + this.index).style.cursor = 'pointer';
		document.getElementById('pile_discard_' + this.index).style.cursor = 'pointer';
```
And add the button into the dock bar (`#interact_<pid>`), after the stat readouts created in Task 4 Step 4:

```javascript
		createButton('View Deck', 'viewDeck_' + this.index, id_interact + this.index, openMyDeck, ['normalButton']);
```

- [ ] **Step 5: Style the modal.** In `style.css` add:

```css
/* Deck browser (read-only) */
.deck-browser-overlay {
	position: fixed; inset: 0; z-index: 3000;
	background: rgba(0,0,0,.66);
	display: flex; align-items: center; justify-content: center; padding: 24px;
}
.deck-browser-panel {
	width: min(1100px, 92vw); max-height: 88vh; display: flex; flex-direction: column;
	background: linear-gradient(180deg, rgba(var(--wood-rgb), .96), rgba(var(--forest-rgb), .97));
	border: 3px solid var(--type-treasure); border-radius: 14px;
	box-shadow: 0 18px 50px rgba(0,0,0,.6);
}
.deck-browser-header {
	display: flex; align-items: center; justify-content: space-between;
	padding: 12px 18px; color: var(--card-face); font-size: 20pt; font-weight: bold;
	border-bottom: 2px solid var(--wood); text-shadow: 0 1px 2px rgba(0,0,0,.7);
}
.deck-browser-close { width: auto; padding: 0 14px; }
.deck-browser-grid {
	display: flex; flex-wrap: wrap; gap: 16px; align-content: flex-start;
	padding: 18px; overflow-y: auto;
}
.deck-browser-cell { position: relative; }
.deck-browser-cell .dcard { pointer-events: none; cursor: default; }
.deck-browser-count {
	position: absolute; bottom: -6px; right: -6px; min-width: 24px; height: 24px; padding: 0 6px;
	border-radius: 12px; background: #000d; color: #fff; font-size: 13px; font-weight: bold;
	display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,.5);
}
```

- [ ] **Step 6: Verify.**

```bash
B=~/.claude/skills/gstack/browse/dist/browse; $B restart
$B open http://localhost:8000/game.html
$B set-viewport 1600 900
# click the deck pile (or the "View Deck" button), then:
$B screenshot /tmp/t6-open.png
```
Expected: modal opens showing a grid of unique cards each with a `×N` badge; the header count equals the sum of deck+discard+in-play+hand (a fresh game start = 10: 7 Copper ×7, 3 Estate ×3, though 5 are in hand — total still 10). Cards are not clickable/buyable. Press Esc / click the backdrop / click ✕ — each closes it. Open via the discard pile too. Confirm no console errors and the live board is unchanged after closing.

- [ ] **Step 7: Commit.**

```bash
git add deckBrowser.js Deck.js Player.js game.html style.css
git commit -m "feat(ui): Slay-the-Spire-style read-only deck browser (piles + View Deck button)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (after all tasks)

- [ ] Full playthrough at 1440×900 and 2560×1440: no background tiling, table centered on big screen, no page scroll for 2 players, hand + dock grouped at the bottom.
- [ ] Every shop card + Curse (via deck browser) shows full name + rules with nothing clipped.
- [ ] Play several action cards: bigger/slower pop + two-note sound; effects resolve.
- [ ] Deck browser opens from deck pile, discard pile, and View Deck; closes via Esc/backdrop/✕; count is correct; read-only.
- [ ] Play through to game end: score screen still renders (Task 4's `#info_stats_` reuse is intact).
- [ ] Update `docs/superpowers/RESUME.md` "OPEN TODOS" to reflect what shipped.

## Self-review notes (author)

- **Spec coverage:** A→Task 1; B→Task 2; C→Task 3; D→Task 4; E→Task 5; F→Task 6. All six spec sections covered.
- **Type/name consistency:** `fitCardText`, `initTopbarHeightVar`, `sfxAction`, `getAllOwnedCards`, `openDeckBrowser`/`closeDeckBrowser`, `--topbar-h`, `.dock-bar` used consistently across tasks.
- **Risk note:** Task 4 moves the money/buys/actions element parenting from `#info_stats_main_` to `#interact_`; ids are unchanged so all lookups/animations still resolve, and `endGame` clears `#info_stats_` by parent so the score screen is unaffected — verified against `gameScript.js:342-386`.
