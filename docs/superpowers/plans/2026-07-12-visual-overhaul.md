# Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the browser Dominion game a faithful-Dominion visual identity and tactile card motion (flying draw/discard/buy, action pop) without changing game logic or adding a build step.

**Architecture:** Split the view layer into three new vanilla-JS modules — `cardRenderer.js` (faithful card DOM), `icons.js` (per-card inline SVG), `animator.js` (FLIP + flight-layer engine) — plus a token-driven `style.css`. Game logic (`Card.js`, `Deck.js`, `Player.js`, `gameScript.js` flow) is preserved; its call sites are rewired to call the new renderer/animator through a narrow interface. Delivered in 4 reviewable phases on branch `visual-overhaul`.

**Tech Stack:** Plain HTML, CSS (custom properties, `clamp()`), vanilla ES5-style JS (matches existing `var`/function-constructor style), Web Animations API. No dependencies, no build. Verification via headless browser screenshots.

## Global Constraints

- **No build step, no dependencies.** The app must run by opening `game.html`/`index.html` directly (`file://`). Copied verbatim from spec: "Open `index.html` and play must keep working."
- **Game logic untouched.** No changes to rules/flow in `Card.js`, `Deck.js`, `Player.js`, or `gameScript.js` beyond rewiring rendering/animation calls and `await`/callback sequencing.
- **Match existing code style.** `'use strict'`, `var`, function-constructor objects, tab indentation, single-quoted strings, existing `id_*` naming vars in `html_css_functions.js`.
- **Faithful Dominion card anatomy:** name banner, central SVG illustration, type line, rules text, cost shield (bottom-left), supply count (bottom-right, hidden when `>= card_capacity_show`).
- **Animations use transform/opacity only** (GPU-friendly); honor `prefers-reduced-motion` (flights → quick fades, counters update instantly, pops skipped).
- **Card art = one inline SVG per card name**, drawn with `currentColor` to inherit type tint. No per-card image files.
- **Branch:** `visual-overhaul`. Frequent commits — one per task minimum.
- **Card DOM id conventions (existing, must preserve):** outer div `card_<id>_div`, img/root `card_<id>`, name `card_<id>_name`, centered value `card_<id>_centered`, cost `card_<id>_bottomLeft`, supply `card_<id>_bottomRight`. Card id comes from `getIDFromCard()`.

## Verification Method (applies to every task)

There is no unit-test harness and none will be created. Each task's verification step means:

1. Serve the folder (`python3 -m http.server 8000` from repo root) **or** open the file directly — both must work; test with the http server for headless screenshots.
2. Drive the game in a headless browser (use the `browse` / `qa` skill: navigate, click through to a game with 2 players, reach the relevant state).
3. Capture a screenshot showing the change and confirm **zero console errors** (`browse` reports console output).
4. Compare against the previous phase's screenshot where a before/after is meaningful.

"Expected" in each task describes what the screenshot/console must show.

## File Structure

**New files:**
- `icons.js` — `var CARD_ICONS = new Map()` mapping `cardName → SVG string`; `function getCardIcon(card)` with per-type fallback.
- `cardRenderer.js` — `function renderCard(tempCard, id, parentID, opts)` (faithful card DOM) + size/scale helpers. Replaces `generateCardHTML`.
- `animator.js` — `flyCard`, `reflowHand`, `popCard`, `bumpCounter`, `prefersReducedMotion`, and internal FLIP helpers. Owns the `#flight-layer` overlay.

**Modified files:**
- `style.css` — replaced with token-driven stylesheet (card anatomy, piles, table, animation timing, menu).
- `html_css_functions.js` — remove `generateCardHTML` + `animateCard`; keep generic helpers. Add card-back + pile builders if not in renderer.
- `game.html` — add `<script>` tags (`icons.js`, `cardRenderer.js`, `animator.js`), add `<div id='flight-layer'></div>`.
- `index.html` — add new script tags where needed; Phase 4 restyle.
- `Deck.js` — rewire `generateCardHTML`→`renderCard`, `animateCard`→animator calls; add pile elements + `updateDeckLength`/`updateDiscardLength` to render piles.
- `Player.js` — `generateCardHTML`→`renderCard` in `generateHandCard`; add pile containers in `initPlayer`.
- `gameScript.js` — `generateCardHTML`→`renderCard` in `endGame` score screen; turn-order highlight class.

---

## PHASE 1 — Design tokens, card face, icons, real piles

Visual only; no behavior change. Biggest visible win first. End of phase: new card faces + felt table + real deck/discard piles render, game still fully playable.

### Task 1: Design tokens + table backdrop + reduced-motion baseline

**Files:**
- Modify: `style.css` (add token block at top; add table surface; keep all existing rules for now so nothing breaks mid-phase)
- Modify: `game.html:9` (`background='res/forest.jpg'`) — remove the HTML `background` attribute; background now driven by CSS body class.

**Interfaces:**
- Produces: CSS custom properties on `:root` used by all later tasks: `--type-treasure`, `--type-victory`, `--type-action`, `--card-face`, `--card-ink`, `--table-top`, `--table-edge`, `--space-1..4`, `--anim-fast`, `--anim-med`, `--ease-card`, `--radius-card`. Body class `theme-table` (felt/wood) with `theme-forest` fallback.

- [ ] **Step 1: Add the token block at the top of `style.css`**

```css
:root {
	/* Type palette */
	--type-treasure: #b8860b;
	--type-victory:  #2e7d32;
	--type-action:   #1565c0;
	/* Card surface */
	--card-face: #f4ecd8;   /* parchment */
	--card-ink:  #2b2b2b;
	--radius-card: 8px;
	/* Table */
	--table-top:  #2f6b43;  /* felt green */
	--table-edge: #17361f;
	--wood: #5b3a21;
	/* Spacing */
	--space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 30px;
	/* Motion */
	--anim-fast: 180ms; --anim-med: 380ms;
	--ease-card: cubic-bezier(.22,.61,.36,1);
}

body.theme-table {
	background: radial-gradient(ellipse at 50% 35%, var(--table-top), var(--table-edge) 90%),
	            var(--wood);
	background-blend-mode: multiply;
	min-height: 100vh;
}
body.theme-forest {
	background: url('res/forest.jpg');
}

@media (prefers-reduced-motion: reduce) {
	:root { --anim-fast: 1ms; --anim-med: 1ms; }
}
```

- [ ] **Step 2: Set the body class**

In `game.html:9`, change the `<body>` tag from
`<body onLoad='startGame();' class='flex_container' background='res/forest.jpg'>`
to
`<body onLoad='startGame();' class='flex_container theme-table'>`.

- [ ] **Step 3: Verify (screenshot + console)**

Serve repo (`python3 -m http.server 8000`), open `http://localhost:8000/game.html`, start a 2-player game.
Expected: felt-green table background instead of forest photo; existing cards still render (unstyled-new yet); no console errors. Swapping body class to `theme-forest` in devtools restores forest.

- [ ] **Step 4: Commit**

```bash
git add style.css game.html
git commit -m "feat(visual): add design tokens and felt table backdrop"
```

### Task 2: Icon set (`icons.js`)

**Files:**
- Create: `icons.js`
- Modify: `game.html` — add `<script src='icons.js'></script>` before `cardRenderer.js` (added Task 3) and before `Card.js` usage; place after existing script block open (`game.html:20-26`).
- Modify: `index.html` — add same `<script src='icons.js'></script>` (menu builds cards via shared code in Phase 4; safe to load now).

**Interfaces:**
- Produces: `CARD_ICONS` (`Map<string, string>` of SVG markup) and `function getCardIcon(card)` → SVG string. SVGs use `fill='currentColor'`/`stroke='currentColor'`, `viewBox='0 0 48 48'`, no width/height (sized by CSS). Consumed by `renderCard` (Task 4).

- [ ] **Step 1: Create `icons.js` with the map, fallback, and all 19 card icons**

Build one icon per card. Style rule: single-color line/glyph, `viewBox='0 0 48 48'`, `currentColor`. Cards to cover (19): Copper, Silver, Gold (coin stacks — 1/2/3 coins), Estate, Duchey, Province (house scaled small/med/large), Garden (house+leaves), Curse (skull), Cellar (door), Chapel (cross), Village (huts), Wood Cutter (axe), Smithy (hammer/anvil), Council Room (people around table), Festival (banner/flag), Laboratory (flask), Market (stall/scales), Mine (pickaxe), Witch (witch hat).

```js
// Author Petter Andersson
'use strict'

var CARD_ICONS = new Map();

function svgWrap(inner){
	return "<svg class='card-icon' viewBox='0 0 48 48' aria-hidden='true'>" + inner + "</svg>";
}

// Representative examples — implement all 19 in this style.
CARD_ICONS.set('Copper', svgWrap(
	"<circle cx='24' cy='30' r='11' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<text x='24' y='35' text-anchor='middle' font-size='12' fill='currentColor'>1</text>"));
CARD_ICONS.set('Silver', svgWrap(
	"<circle cx='18' cy='30' r='10' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<circle cx='30' cy='30' r='10' fill='none' stroke='currentColor' stroke-width='3'/>"));
CARD_ICONS.set('Smithy', svgWrap(
	"<rect x='20' y='8' width='8' height='20' fill='currentColor'/>" +
	"<path d='M10 30 h28 l-4 8 h-20 z' fill='currentColor'/>"));
CARD_ICONS.set('Estate', svgWrap(
	"<path d='M24 10 L40 24 H32 V38 H16 V24 H8 Z' fill='none' stroke='currentColor' stroke-width='3'/>"));
// ... implement the remaining 15 cards listed above in the same style.

// Per-type fallback for any unmapped name
function getCardIcon(card){
	if(CARD_ICONS.has(card.name)){
		return CARD_ICONS.get(card.name);
	}
	switch(card.cardType){
		case CardType.TREASURE_CARD:
			return CARD_ICONS.get('Copper');
		case CardType.VICTORY_CARD:
			return CARD_ICONS.get('Estate');
		case CardType.ACTION_CARD:
		default:
			return svgWrap("<circle cx='24' cy='24' r='14' fill='none' stroke='currentColor' stroke-width='3'/>");
	}
}
```

- [ ] **Step 2: Wire the script tag**

In `game.html`, inside the `<script>` block, add `<script src='icons.js'></script>` as the first script (icons has no deps except `CardType` from `Card.js`, so it must load before code that calls `getCardIcon`; loading order in the block is fine since functions are called at runtime, not load).

- [ ] **Step 3: Build a temporary contact-sheet check**

In devtools console on `game.html`, run:
```js
Array.from(CARD_ICONS.keys()).forEach(n => console.log(n, CARD_ICONS.get(n).length));
```
Expected: all 19 card names print with non-trivial SVG lengths; `getCardIcon` returns a fallback for a fake card name.

- [ ] **Step 4: Verify (console)**

Reload `game.html`; expected zero console errors, `typeof getCardIcon === 'function'`.

- [ ] **Step 5: Commit**

```bash
git add icons.js game.html index.html
git commit -m "feat(visual): add per-card SVG icon set"
```

### Task 3: `cardRenderer.js` skeleton + faithful card CSS

**Files:**
- Create: `cardRenderer.js`
- Modify: `style.css` — add the faithful card anatomy rules.
- Modify: `game.html` — add `<script src='cardRenderer.js'></script>` after `icons.js`.

**Interfaces:**
- Produces: `function renderCard(tempCard, id, parentID, opts)` where `opts = { isShopCard=false, size='hand', cssClass=[], callback='', order='4' }` and `size ∈ {'shop','hand','discard','board'}`. Builds the same DOM ids the old `generateCardHTML` produced (`id+'_div'`, `id`, `id+'_name'`, `id+'_centered'`, `id+'_bottomLeft'`, `id+'_bottomRight'`) so existing lookups keep working. Sets `--card-scale` on the outer div per size. Consumes `getCardIcon` (Task 2), `getCssClassCard`, `getCapacityString`, `getValue()`.

- [ ] **Step 1: Add faithful card CSS to `style.css`**

```css
.dcard {
	--card-scale: 1;
	position: relative;
	width: calc(160px * var(--card-scale));
	height: calc(250px * var(--card-scale));
	background: var(--card-face);
	color: var(--card-ink);
	border-radius: var(--radius-card);
	border: calc(3px * var(--card-scale)) solid var(--type-color, #888);
	box-shadow: 0 2px 6px rgba(0,0,0,.4);
	display: grid;
	grid-template-rows: 18% 46% 12% 24%;
	overflow: hidden;
	transition: transform var(--anim-fast) var(--ease-card),
	            box-shadow var(--anim-fast) var(--ease-card);
}
.dcard.size-shop    { --card-scale: .8; }
.dcard.size-hand    { --card-scale: 1; }
.dcard.size-board   { --card-scale: .7; }
.dcard.size-discard { --card-scale: .4; }
.dcard-treasure { --type-color: var(--type-treasure); }
.dcard-victory  { --type-color: var(--type-victory); }
.dcard-action   { --type-color: var(--type-action); }

.dcard-banner {
	background: var(--type-color); color: #fff;
	text-align: center; font-weight: bold;
	display: flex; align-items: center; justify-content: center;
	font-size: calc(15px * var(--card-scale));
	text-shadow: 0 1px 1px rgba(0,0,0,.6);
}
.dcard-art { display: flex; align-items: center; justify-content: center; color: var(--type-color); }
.dcard-art .card-icon { width: calc(90px * var(--card-scale)); height: calc(90px * var(--card-scale)); }
.dcard-typeline { text-align: center; font-style: italic; font-size: calc(11px * var(--card-scale)); align-self: center; }
.dcard-text { text-align: center; font-size: calc(12px * var(--card-scale)); padding: 0 calc(6px * var(--card-scale)); line-height: 1.1; }
.dcard-cost, .dcard-supply {
	position: absolute; bottom: calc(6px * var(--card-scale));
	width: calc(22px * var(--card-scale)); height: calc(22px * var(--card-scale));
	border-radius: 50%; display: flex; align-items: center; justify-content: center;
	font-weight: bold; font-size: calc(12px * var(--card-scale)); color: #fff;
}
.dcard-cost   { left: calc(6px * var(--card-scale)); background: var(--type-treasure); }
.dcard-supply { right: calc(6px * var(--card-scale)); background: #444; }
.dcard.selected { outline: calc(3px * var(--card-scale)) solid #ffd400; outline-offset: 2px; }
.dcard.inactive { filter: grayscale(100%) brightness(.8); }
```

- [ ] **Step 2: Create `cardRenderer.js`**

```js
// Author Petter Andersson
'use strict'

// size -> css size class
function cardSizeClass(size){
	switch(size){
		case 'shop': return 'size-shop';
		case 'board': return 'size-board';
		case 'discard': return 'size-discard';
		case 'hand':
		default: return 'size-hand';
	}
}

// Faithful card DOM. Preserves legacy element ids so existing code keeps working.
function renderCard(tempCard, id, parentID, opts){
	opts = opts || {};
	var size = opts.size || 'hand';
	var typeClass = getCssClassCard(tempCard).replace('card_', 'dcard-'); // card_action -> dcard-action
	var div = initNewUIElement('div', new Map().set('id', id + id_div), parentID,
		['dcard', cardSizeClass(size), typeClass, 'position_relative']);
	div.style.order = (opts.order != null ? opts.order : '4');
	if(Array.isArray(opts.cssClass)){ modifyCSSEl('add', div, opts.cssClass); }

	// Root element keeps the bare `id` (legacy code looks up `id` as the card root)
	var art = initNewUIElement('div', new Map().set('id', id), id + id_div, ['dcard-art', 'noclick']);
	art.innerHTML = getCardIcon(tempCard);

	// Banner (name) — legacy id: id + id_name_post
	initNewUIElement('div', new Map().set('id', id + id_name_post), id + id_div, ['dcard-banner', 'noclick'])
		.innerHTML = tempCard.name;

	// Type line
	initNewUIElement('div', new Map().set('id', id + '_typeline'), id + id_div, ['dcard-typeline', 'noclick'])
		.innerHTML = CardType.properties[tempCard.cardType].name;

	// Rules text / value — legacy id: id + id_centeredText
	var text = initNewUIElement('div', new Map().set('id', id + id_centeredText), id + id_div, ['dcard-text', 'noclick']);
	text.innerHTML = String(tempCard.getValue()).split('\n').join('<br>');

	// Cost + supply
	if(opts.isShopCard){
		initNewUIElement('div', new Map().set('id', id + id_bottomLeft), id + id_div, ['dcard-cost', 'noclick'])
			.innerHTML = tempCard.getCost();
		initNewUIElement('div', new Map().set('id', id + id_bottomRight), id + id_div, ['dcard-supply', 'noclick'])
			.innerHTML = getCapacityString(tempCard);
	}

	if(opts.callback && opts.callback !== ''){
		div.addEventListener('click', function(res){ opts.callback(res.target.id); });
	}
	return div;
}
```

- [ ] **Step 3: Add script tag**

`game.html`: add `<script src='cardRenderer.js'></script>` after `icons.js`.

- [ ] **Step 4: Verify (isolated render)**

In devtools on `game.html` after game start, run:
```js
renderCard(cards_global.get('Smithy'), 'demo_1', 'playArea', {isShopCard:true, size:'hand'});
```
Expected: a faithful Smithy card appears in the play area — blue border, name banner, hammer icon, "action" type line, "+3 Cards", cost shield "4", supply badge. No console errors. (Remove the demo node after.)

- [ ] **Step 5: Commit**

```bash
git add cardRenderer.js style.css game.html
git commit -m "feat(visual): faithful card renderer and card CSS"
```

### Task 4: Swap the shop + hand + board + discard + score renders to `renderCard`

**Files:**
- Modify: `html_css_functions.js:154-185` (`initShopHTML` — the `generateCardHTML` call)
- Modify: `Deck.js:263-288` (`generateHandCard`), `Deck.js:307-310` (`showTopOfDiscard`), `Deck.js:594-596` (played-card board render)
- Modify: `gameScript.js:518-521` (score-screen render)
- Modify: `Deck.js:164-190` (`displayEntireHand`/`displayCard` — the size upgrade from hand→big is now a CSS class swap, not the old font-class juggling)

**Interfaces:**
- Consumes: `renderCard` (Task 3).
- Produces: All card DOM now uses `.dcard`. `displayCard(id)` toggles `size-*` classes instead of the legacy `card`/`card_smaller` classes.

- [ ] **Step 1: Shop cards → `renderCard`**

In `html_css_functions.js` `initShopHTML`, replace the `generateCardHTML(card, id_card + card.id, 'shopCards', true, 'card_smaller', [getCssClassCard(card)], function(...){...}, 2)` call with:
```js
renderCard(card, id_card + card.id, 'shopCards', {
	isShopCard: true, size: 'shop', order: 2,
	callback: function(card_HTMLid){
		var card_id = getIDFromCard(card_HTMLid);
		var newCard = generateNewCard(cards_global_id.get(card_id));
		if(newCard === null){ updateShopText('Out of this cardtype!'); }
		else { getPlayer(turn).buyCard(newCard, card_id); }
	}
});
```

- [ ] **Step 2: Hand cards → `renderCard`**

In `Deck.js` `generateHandCard`, replace the `generateCardHTML(tempCard, id_card + tempCard.id, id_hand + this.playerIndex, false, 'card_smaller', ['inactive', getCssClassCard(tempCard)], function(card_HTMLid){...}, getCssOrderCard(tempCard, this.phase))` call with `renderCard(tempCard, id_card + tempCard.id, id_hand + this.playerIndex, { size:'hand', cssClass:['inactive'], order:getCssOrderCard(tempCard, this.phase), callback:function(card_HTMLid){ /* unchanged body */ } })`. Keep the callback body identical.

- [ ] **Step 3: Discard top, board, score-screen → `renderCard`**

- `showTopOfDiscard`: `renderCard(tempCard, id_discard_top + id_card + this.playerIndex, id_discard_top + this.playerIndex, { size:'discard' });`
- Played card board render (`Deck.js:596`): `renderCard(card, id_board + card.id, id_board + this.playerIndex, { size:'board' });`
- Score screen (`gameScript.js:520`): `renderCard(card, id_scoreScreen + id_card + card.id + i, id_scoreScreen + id_card + card.name + '_' + i, { size:'discard' });`

- [ ] **Step 4: Replace `displayCard` size logic**

In `Deck.js` `displayCard(id)`, replace the body with a class swap:
```js
this.displayCard = function(id){
	var div = document.getElementById(id + id_div);
	if(div){ modifyCSSEl('remove', div, ['size-hand','inactive']); modifyCSSEl('add', div, 'size-hand'); }
	// flight/fade handled by animator in Phase 2; keep a fade for now:
	animateCardFade(id);
};
```
Add a temporary `animateCardFade(id)` shim in `html_css_functions.js` that adds `animation_fadeIn` (keep the existing fade keyframes in `style.css` for now). This shim is replaced in Phase 2.

- [ ] **Step 5: Verify (full playthrough screenshot)**

Play a full 2-player turn (action → buy → end turn). Expected: hand, shop, board, discard-top, and end-game score screen all show faithful `.dcard` faces at correct sizes; buying/playing/ending still works; no console errors.

- [ ] **Step 6: Commit**

```bash
git add html_css_functions.js Deck.js gameScript.js
git commit -m "feat(visual): render all card surfaces with faithful renderer"
```

### Task 5: Real deck & discard piles

**Files:**
- Modify: `Player.js:143-164` (`initPlayer` — add pile container elements near the info stats)
- Modify: `Deck.js:13-19` (`updateDeckLength`/`updateDiscardLength` — render pile + count badge instead of text)
- Modify: `style.css` — pile + card-back CSS

**Interfaces:**
- Produces: per-player pile elements `pile_deck_<pid>` and `pile_discard_<pid>` (used as flight anchors in Phase 2). `deckAnchorEl(pid)` / `discardAnchorEl(pid)` helpers in `html_css_functions.js` returning those elements.

- [ ] **Step 1: Add pile CSS to `style.css`**

```css
.pile { position: relative; width: 64px; height: 100px; border-radius: 6px; }
.pile-deck { background: repeating-linear-gradient(45deg, #33406b, #33406b 6px, #26305a 6px, #26305a 12px);
	border: 2px solid #1b2140; box-shadow: 0 2px 5px rgba(0,0,0,.4); }
.pile-empty { background: rgba(255,255,255,.08); border: 2px dashed rgba(255,255,255,.4); }
.pile-count { position: absolute; bottom: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 4px;
	border-radius: 10px; background: #000c; color: #fff; font-size: 12px; font-weight: bold;
	display: flex; align-items: center; justify-content: center; }
.pile-row { display: flex; gap: var(--space-3); }
```

- [ ] **Step 2: Add pile containers in `initPlayer`**

Where the deck/discard counters are created (`id_info_stats_cards`), add:
```js
var pileRow = initNewUIElement('div', new Map().set('id', 'pileRow_' + this.index), id_info_stats_cards + this.index, ['pile-row']);
initNewUIElement('div', new Map().set('id', 'pile_deck_' + this.index), 'pileRow_' + this.index, ['pile', 'pile-deck']);
initNewUIElement('div', new Map().set('id', 'pile_discard_' + this.index), 'pileRow_' + this.index, ['pile', 'pile-empty']);
```
Keep the existing `id_deck`/`id_discard` text divs (used as count source) but move them or leave; badges are added in Step 3.

- [ ] **Step 3: Render count badges in `updateDeckLength`/`updateDiscardLength`**

```js
this.updateDeckLength = function(){
	var pile = document.getElementById('pile_deck_' + this.playerIndex);
	if(pile){
		modifyCSSEl(this.deckStack.length === 0 ? 'add' : 'remove', pile, 'pile-empty');
		modifyCSSEl(this.deckStack.length === 0 ? 'remove' : 'add', pile, 'pile-deck');
		setPileCount(pile, this.deckStack.length);
	}
	var t = document.getElementById(id_deck + this.playerIndex); if(t){ t.innerHTML = 'Deck: ' + this.deckStack.length; }
};
```
Add `setPileCount(pileEl, n)` in `html_css_functions.js`: creates/updates a `.pile-count` child. Mirror the same in `updateDiscardLength` using `pile_discard_` and toggling `pile-empty` based on `this.discard.length`.

- [ ] **Step 4: Add anchor helpers to `html_css_functions.js`**

```js
function deckAnchorEl(pid){ return document.getElementById('pile_deck_' + pid); }
function discardAnchorEl(pid){ return document.getElementById('pile_discard_' + pid); }
function setPileCount(pileEl, n){
	var badge = pileEl.querySelector('.pile-count');
	if(!badge){ badge = document.createElement('div'); badge.className = 'pile-count'; pileEl.appendChild(badge); }
	badge.innerHTML = n;
}
```

- [ ] **Step 5: Verify (screenshot)**

Start a 2-player game, draw to reshuffle. Expected: each player shows a face-down deck pile and a discard pile with count badges; deck goes to dashed-empty look when emptied then refills after reshuffle; no console errors.

- [ ] **Step 6: Commit**

```bash
git add Player.js Deck.js style.css html_css_functions.js
git commit -m "feat(visual): real deck and discard piles with count badges"
```

### Task 6: Phase 1 cleanup — remove dead CSS/JS

**Files:**
- Modify: `style.css` — remove now-unused legacy card rules (`.card`, `.card_smaller`, `.card_discard`, `.card_treasure/victory/action`, size font classes only used by old cards) **only if** grep shows no remaining references.
- Modify: `html_css_functions.js` — remove `generateCardHTML` (replaced by `renderCard`); keep `animateCard` until Phase 2 replaces it.

- [ ] **Step 1: Grep for legacy references**

Run: `grep -rn "generateCardHTML\|card_smaller\|card_discard" *.js *.html`
Expected: only definitions remain, no callers. Remove the dead definitions/classes that have zero callers.

- [ ] **Step 2: Verify (full playthrough)**
Play a full game end-to-end. Expected: identical to Task 5 result, no console errors, no missing styles.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(visual): remove legacy card rendering dead code"
```

---

## PHASE 2 — Animator module + draw/discard flight

End of phase: cards physically fly deck→hand on draw and hand→discard on end-of-turn, hand re-flows smoothly.

### Task 7: `animator.js` — flight layer + `flyCard` + reduced motion

**Files:**
- Create: `animator.js`
- Modify: `game.html` — add `<div id='flight-layer'></div>` just inside `<body>` (before `#info`), and `<script src='animator.js'></script>` after `cardRenderer.js`.
- Modify: `style.css` — `#flight-layer` rules.

**Interfaces:**
- Produces:
  - `function prefersReducedMotion()` → bool.
  - `function flyCard(cardRootId, fromEl, toEl, opts)` → Promise; clones the `.dcard` (`cardRootId + '_div'`), animates it in `#flight-layer` from `fromEl` rect to `toEl` rect, resolves when done. `opts = { fade:false }`. If reduced motion: resolves after a 1ms fade.
  - `function reflowHand(handEl)` → Promise (Task 9 uses it; define here).
- Consumes: nothing from game logic; pure DOM.

- [ ] **Step 1: Add flight-layer CSS**

```css
#flight-layer { position: fixed; inset: 0; pointer-events: none; z-index: 1000; }
#flight-layer .dcard { position: fixed; margin: 0; }
```

- [ ] **Step 2: Create `animator.js`**

```js
// Author Petter Andersson
'use strict'

function prefersReducedMotion(){
	return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rectOf(el){ return el.getBoundingClientRect(); }

// Fly a clone of a card from fromEl's position to toEl's position.
function flyCard(cardRootId, fromEl, toEl, opts){
	opts = opts || {};
	return new Promise(function(resolve){
		var source = document.getElementById(cardRootId + '_div');
		var layer = document.getElementById('flight-layer');
		if(!fromEl || !toEl || !layer){ return resolve(); }

		var from = rectOf(fromEl), to = rectOf(toEl);
		var clone = source ? source.cloneNode(true) : document.createElement('div');
		clone.id = ''; clone.classList.add('dcard');
		clone.style.left = from.left + 'px';
		clone.style.top  = from.top + 'px';
		clone.style.width = from.width + 'px';
		clone.style.height = from.height + 'px';
		layer.appendChild(clone);

		var dx = to.left - from.left, dy = to.top - from.top;
		var scale = to.width / Math.max(from.width, 1);
		var dur = prefersReducedMotion() ? 1 : 380;

		var anim = clone.animate([
			{ transform: 'translate(0,0) scale(1)', opacity: 1 },
			{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')', opacity: opts.fade ? 0 : 1 }
		], { duration: dur, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });

		anim.onfinish = function(){ if(clone.parentNode){ clone.parentNode.removeChild(clone); } resolve(); };
	});
}

// FLIP: cards in handEl glide to their new positions after a DOM change.
function reflowHand(handEl){
	return new Promise(function(resolve){
		if(!handEl || prefersReducedMotion()){ return resolve(); }
		var kids = Array.prototype.slice.call(handEl.children);
		var first = kids.map(rectOf);
		requestAnimationFrame(function(){
			var pending = 0;
			kids.forEach(function(el, i){
				var last = rectOf(el);
				var dx = first[i].left - last.left, dy = first[i].top - last.top;
				if(dx || dy){
					pending++;
					var a = el.animate([
						{ transform: 'translate(' + dx + 'px,' + dy + 'px)' },
						{ transform: 'translate(0,0)' }
					], { duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)' });
					a.onfinish = function(){ if(--pending === 0){ resolve(); } };
				}
			});
			if(pending === 0){ resolve(); }
		});
	});
}
```

- [ ] **Step 3: Verify (isolated flight)**

On `game.html` after start, run in console:
```js
flyCard(id_card + getPlayer(turn).cards.hand.getHand()[0].id,
	deckAnchorEl(turn), document.getElementById('hand_' + turn));
```
Expected: a card clone visibly flies from the deck pile to the hand area, then disappears; no console errors.

- [ ] **Step 4: Commit**

```bash
git add animator.js game.html style.css
git commit -m "feat(anim): flight-layer engine with flyCard and reflowHand"
```

### Task 8: Wire draw flight into `drawCard`/`displayCard`

**Files:**
- Modify: `Deck.js` `drawCard` (`Deck.js:242-260`) and `displayCard` (from Task 4)
- Modify: `html_css_functions.js` — remove the `animateCardFade` shim and old `animateCard`.

**Interfaces:**
- Consumes: `flyCard`, `deckAnchorEl`.
- Produces: card is created hidden in hand, then a flight from the deck pile reveals it.

- [ ] **Step 1: Make drawn cards fly from the deck pile**

In `drawCard`, after `this.addCardToHand(tempCard)` (which builds the hand DOM), replace the `animateCard(...)` call with a flight:
```js
var rootId = id_card + tempCard.id;
var handCardDiv = document.getElementById(rootId + id_div);
if(handCardDiv){ handCardDiv.style.visibility = 'hidden'; }
flyCard(rootId, deckAnchorEl(this.playerIndex), handCardDiv).then(function(){
	if(handCardDiv){ handCardDiv.style.visibility = 'visible'; }
});
return rootId;
```

- [ ] **Step 2: Simplify `displayCard`**

`displayCard` now only ensures the hand size class (flight handles the reveal). Remove the `animateCardFade` shim call; body:
```js
this.displayCard = function(id){
	var div = document.getElementById(id + id_div);
	if(div){ modifyCSSEl('remove', div, 'inactive'); modifyCSSEl('add', div, 'size-hand'); }
};
```

- [ ] **Step 3: Verify (screenshot of draw)**

Start game, end action phase to trigger draw of a fresh hand next turn (or use Laboratory to draw). Expected: cards fly one-by-one from the deck pile into the hand; deck count decrements; no console errors.

- [ ] **Step 4: Commit**

```bash
git add Deck.js html_css_functions.js
git commit -m "feat(anim): cards fly from deck pile on draw"
```

### Task 9: Wire discard flight into end-of-turn + hand reflow

**Files:**
- Modify: `Deck.js` `Hand.discardHandAnimation` (`Deck.js:716-727`) and `Hand.useCard` (`Deck.js:653-672`)
- Modify: `Deck.js` `checkIfPhaseDone` end-turn branch (`Deck.js:217-231`) — sequence discard flight before `changeTurn`.

**Interfaces:**
- Consumes: `flyCard`, `discardAnchorEl`, `reflowHand`.
- Produces: end-of-turn hand cards fly to the discard pile; single-card discard (treasure spend/trash) flies too.

- [ ] **Step 1: `discardHandAnimation` flies each card to the discard pile**

```js
this.discardHandAnimation = function(){
	var listOfCards = this.getHand();
	var pid = this.deckOfCards.playerIndex;
	var handEl = document.getElementById(id_hand + pid);
	var discard = discardAnchorEl(pid);
	var flights = listOfCards.map(function(card){
		var rootId = id_card + card.id;
		return flyCard(rootId, document.getElementById(rootId + id_div), discard, {fade:true}).then(function(){
			var el = document.getElementById(rootId + id_div);
			if(el && el.parentNode){ el.parentNode.removeChild(el); }
		});
	});
	return Promise.all(flights);
};
```

- [ ] **Step 2: Sequence the end-turn branch on the flight promise**

In `checkIfPhaseDone` phase-1 branch, replace the `this.hand.discardHandAnimation(); setTimeout(...useCardAnimationTime)` with:
```js
var self = this;
this.hand.discardHandAnimation().then(function(){
	var currentPlayer = getPlayer(turn);
	currentPlayer.cards.discardHand();
	currentPlayer.drawHand();
	changeTurn();
});
```

- [ ] **Step 3: `Hand.useCard` single-card fade→remove (keeps working during play)**

Replace the `animateCard(id_card + card.id, 'animation_fadeOut', cb)` call with:
```js
var rootId = id_card + card.id;
var div = document.getElementById(rootId + id_div);
if(div){ div.style.opacity = '0'; div.style.transition = 'opacity ' + (prefersReducedMotion()?'1ms':'180ms'); }
setTimeout(function(){ if(div && div.parentNode){ div.parentNode.removeChild(div); } }, prefersReducedMotion()?1:180);
```

- [ ] **Step 4: Reflow hand when a card leaves mid-turn**

After the removal in Step 3, call `reflowHand(document.getElementById(id_hand + this.deckOfCards.playerIndex))`.

- [ ] **Step 5: Verify (screenshot of end turn)**

Play a turn, end it. Expected: hand cards sweep to the discard pile, discard count increments, next player's hand flies in from their deck; remaining cards glide (no snapping) when one is played mid-turn; no console errors.

- [ ] **Step 6: Commit**

```bash
git add Deck.js
git commit -m "feat(anim): hand flies to discard on end turn, hand reflows"
```

---

## PHASE 3 — Buy flight + play-action pop + counter bumps

### Task 10: Counter bump on money/actions/buys/draw increments

**Files:**
- Modify: `animator.js` — add `bumpCounter(el)`.
- Modify: `Deck.js` `updateMoney`/`updateActionsLeft`/`updateBuysLeft`/`updatePlusMoney` — call `bumpCounter` when value increases.
- Modify: `style.css` — `.counter-bump` keyframe.

**Interfaces:**
- Consumes: `bumpCounter`.
- Produces: stat elements pulse when they increase.

- [ ] **Step 1: Add `bumpCounter` + CSS**

`animator.js`:
```js
function bumpCounter(el){
	if(!el || prefersReducedMotion()){ return; }
	el.animate([{ transform:'scale(1)' },{ transform:'scale(1.35)' },{ transform:'scale(1)' }],
		{ duration: 260, easing: 'ease-out' });
}
```
`style.css`: (no keyframe needed; WAAPI inline). Ensure stat divs are `display:inline-block` so scale is visible — add `.info_stats { display:inline-block; }` if needed.

- [ ] **Step 2: Call on increments**

In each `updateX` where `value > this.X`, after updating the DOM text call `bumpCounter(document.getElementById(id_X + this.playerIndex))`. For money use `id_money`, actions `id_actionsLeft`, buys `id_buysLeft`.

- [ ] **Step 3: Verify (screenshot)**

Play a Market/Festival (adds actions/buys/money). Expected: the corresponding counters visibly pulse on increment; no console errors.

- [ ] **Step 4: Commit**

```bash
git add animator.js Deck.js style.css
git commit -m "feat(anim): counters bump when they increase"
```

### Task 11: Play-action pop

**Files:**
- Modify: `animator.js` — add `popCard(cardRootId)` → Promise.
- Modify: `Deck.js` `useCard` (`Deck.js:359-367`) — pop the played card before it resolves to the board.

**Interfaces:**
- Consumes: `popCard`.

- [ ] **Step 1: Add `popCard`**

```js
function popCard(cardRootId){
	return new Promise(function(resolve){
		var div = document.getElementById(cardRootId + '_div');
		if(!div || prefersReducedMotion()){ return resolve(); }
		var a = div.animate([
			{ transform:'scale(1)' }, { transform:'scale(1.25)', offset:.4 }, { transform:'scale(1)' }
		], { duration: 420, easing:'cubic-bezier(.22,.61,.36,1)' });
		a.onfinish = resolve;
	});
}
```

- [ ] **Step 2: Pop on play**

In `useCard`, before the `setTimeout(...useCardAfterAnimation...)`, call `popCard(id_card + cardParam.id)` and drive the follow-up from its promise instead of the fixed `useCardAnimationTime` timeout:
```js
this.useCard = function(cardParam){
	this.actionsLeft--;
	var card = this.hand.useCard(cardParam);
	var currentDeck = getPlayer(turn).cards;
	popCard(id_card + cardParam.id).then(function(){ currentDeck.useCardAfterAnimation(card); });
};
```

- [ ] **Step 3: Verify (screenshot)**

Play a Smithy. Expected: the card pops/enlarges, then its +3 cards fly in from the deck, then it lands in the board area; no console errors.

- [ ] **Step 4: Commit**

```bash
git add animator.js Deck.js
git commit -m "feat(anim): action cards pop when played"
```

### Task 12: Buy flight (shop → discard pile)

**Files:**
- Modify: `Player.js` `buyCard` confirm callback (`Player.js:66-83`) — fly the bought card from its shop position to the buyer's discard pile.

**Interfaces:**
- Consumes: `flyCard`, `discardAnchorEl`.

- [ ] **Step 1: Fly the bought card on confirm**

In the confirm-purchase callback, after `this.cards.addNewCard(card)` (which pushes to discard + shows top), add a flight from the shop card element to the discard pile:
```js
var shopDiv = document.getElementById(id_card + cardId); // shop card root
flyCard(id_card + card.id, shopDiv, discardAnchorEl(this.index), {fade:false});
```
(Use the *new* card's id for the clone content; the shop element as the origin rect.)

- [ ] **Step 2: Verify (screenshot)**

Buy a Silver. Expected: a card leaps from the shop pile and lands on the buyer's discard pile; shop supply badge ticks down; money spent counter updates; no console errors.

- [ ] **Step 3: Commit**

```bash
git add Player.js
git commit -m "feat(anim): bought card flies from shop to discard pile"
```

---

## PHASE 4 — Board/table polish, hover, score screen, menu

### Task 13: Active-player highlight + hand fan + hover lift

**Files:**
- Modify: `style.css` — `.player-active`, hand fan/overlap, hover lift.
- Modify: `gameScript.js` (`startGame` `startTurn` order block + `changeTurn`) — add/remove `player-active` class on `id_player + turn`.

- [ ] **Step 1: Add CSS**

```css
#playArea .margin_bottom { transition: box-shadow var(--anim-med), opacity var(--anim-med); }
.player-active { box-shadow: 0 0 0 3px #ffd400, 0 0 24px rgba(255,212,0,.5); border-radius: 10px; }
.player-active ~ .margin_bottom, .margin_bottom:not(.player-active) { opacity: .85; }
.card_container .dcard { transition: transform var(--anim-fast) var(--ease-card), box-shadow var(--anim-fast); }
#playArea .dcard:hover { transform: translateY(-10px); box-shadow: 0 8px 18px rgba(0,0,0,.5); z-index: 5; }
#hand_0 .dcard, #hand_1 .dcard, #hand_2 .dcard, #hand_3 .dcard { margin-left: -14px; }
```

- [ ] **Step 2: Toggle `player-active`**

In `startGame` (after setting order) and in `changeTurn`'s `listener2` (where order is reset), remove `player-active` from all `id_player + i` and add it to `id_player + turn`.

- [ ] **Step 3: Verify (screenshot)**

Start a 2-player game. Expected: active player's area has a gold highlight; opponents slightly dimmed; hand cards overlap and lift on hover; highlight follows turns; no console errors.

- [ ] **Step 4: Commit**

```bash
git add style.css gameScript.js
git commit -m "feat(visual): active-player highlight, hand fan, hover lift"
```

### Task 14: Restyle header, buttons, shop panel, score screen

**Files:**
- Modify: `style.css` — restyle `.normalButton`, `.bigButton`, `.interactButton`, shop panel, header title, `.info_stats`, score-screen containers with tokens.

- [ ] **Step 1: Token-ize buttons + panels**

Replace hard-coded button colors/borders with token-based styles (e.g. `background: var(--wood); border:2px solid var(--table-edge); border-radius:6px;` and a `:hover` lift/glow). Restyle `.info_stats` (stat readout), shop panel, and the header `Dominion` title (larger, banner-like using `--type-*`). Keep all class names and ids.

- [ ] **Step 2: Verify (screenshots of game + score screen)**

Play to game end. Expected: buttons/panels/score screen match the new identity (parchment/felt/wood, type colors); everything legible; no console errors.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(visual): restyle buttons, panels, and score screen"
```

### Task 15: Restyle the main menu (`index.html`)

**Files:**
- Modify: `index.html` — body class `theme-table`; remove `background='res/forest.jpg'`; wrap controls in a styled panel.
- Modify: `style.css` — menu panel/title CSS.

- [ ] **Step 1: Apply theme + panel**

Set `<body onLoad='main();' class='theme-table'>`; add a `.menu-panel` wrapper class around the stepper/Start/help; style the title to match the game header. Ensure the player-count stepper and Start button use the new button styles.

- [ ] **Step 2: Verify (screenshot)**

Open `index.html`. Expected: menu matches the game's identity; +/- stepper and Start Game work; help messages legible; no console errors; clicking Start still launches `game.html`.

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "feat(visual): restyle main menu to match new identity"
```

### Task 16: Final pass — reduced-motion + multi-player + docs

**Files:**
- Modify: `README.md` — note the visual overhaul (one line).
- Verify only: 3–4 player game, `prefers-reduced-motion`, empty-pile buy.

- [ ] **Step 1: Reduced-motion check**

In headless browser emulate `prefers-reduced-motion: reduce`. Expected: flights/pops/bumps collapse to instant; game fully playable; no console errors.

- [ ] **Step 2: 3–4 player + edge cases**

Play a 4-player game; buy the last card of an action pile (supply→empty, out-of-stock visual); force a reshuffle. Expected: flights target correct players' piles; empty pile shows dashed/empty; no console errors.

- [ ] **Step 3: Update README + commit**

```bash
git add README.md
git commit -m "docs: note visual overhaul; final verification pass"
```

---

## Self-Review (author checklist — completed)

**Spec coverage:**
- Faithful card face → Tasks 3–4. Per-card SVG icons → Task 2. CSS/SVG only, no image files → Task 2 (`currentColor`, no `<img>`). ✓
- FLIP + flight layer, transform/opacity only, reduced motion → Tasks 7–9, 16. ✓
- Draw/discard flight → Tasks 8–9; buy flight → Task 12; play-action pop → Task 11; counter bumps → Task 10. ✓
- Real deck+discard piles (added during planning) → Task 5. ✓
- Design tokens + felt table + forest fallback → Task 1. ✓
- Board readability / active-player highlight / hover → Task 13. ✓
- Header/buttons/shop/score restyle → Task 14; menu restyle → Task 15. ✓
- Stay vanilla / no build / game logic untouched → Global Constraints, enforced per task. ✓
- Verification via headless screenshots → Verification Method + every task. ✓

**Placeholder scan:** The only non-literal content is the 15 remaining icon SVGs in Task 2 (representative examples + explicit list of all 19 given) — this is asset authoring, not a logic placeholder; the style, viewBox, color contract, and full card list are specified.

**Type consistency:** `renderCard(tempCard, id, parentID, opts)` signature is stable across Tasks 3, 4. Legacy ids (`_div`, `_name`, `_centered`, `_bottomLeft`, `_bottomRight`) preserved so existing lookups in `Deck.js`/`gameScript.js` keep working. Anchor helpers `deckAnchorEl`/`discardAnchorEl` defined Task 5, consumed Tasks 8/9/12. `flyCard`/`reflowHand`/`popCard`/`bumpCounter`/`prefersReducedMotion` defined in `animator.js` (Tasks 7,10,11), consumed consistently.

## Out of Scope (from spec)

Turn-handoff/privacy screens; networked play; new cards or rules changes; any build tooling, framework, or dependency.
