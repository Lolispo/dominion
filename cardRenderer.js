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
	// Invariant: at most one DOM node per card id. A card can be re-rendered while its
	// previous node is still mid-removal — e.g. Cellar discards a card (useCard fades it
	// out over ~180ms before deleting it, Deck.js), then a reshuffle draws that SAME card
	// back within that window. Without this guard `initNewUIElement` appends a second
	// `<id>_div`, so getElementById() resolves the stale dying node and the fresh hand card
	// never gets `inactive` removed → it reads as a blank grey card. Drop any stale node first.
	var stale = document.getElementById(id + id_div);
	if(stale && stale.parentNode){ stale.parentNode.removeChild(stale); }
	var size = opts.size || 'hand';
	var typeClass = getCssClassCard(tempCard).replace('card_', 'dcard-'); // card_action -> dcard-action
	var div = initNewUIElement('div', new Map().set('id', id + id_div), parentID,
		['dcard', cardSizeClass(size), typeClass, 'position_relative']);
	div.style.order = (opts.order != null ? opts.order : '4');
	if(Array.isArray(opts.cssClass)){ modifyCSSEl('add', div, opts.cssClass); }

	// Banner (name) first so it lands in the top grid row — legacy id: id + id_name_post
	initNewUIElement('div', new Map().set('id', id + id_name_post), id + id_div, ['dcard-banner', 'noclick'])
		.innerHTML = tempCard.name;

	// Illustration fills the big middle row. Root element keeps the bare `id` (legacy code looks up `id` as the card root)
	var art = initNewUIElement('div', new Map().set('id', id), id + id_div, ['dcard-art', 'noclick']);
	art.innerHTML = getCardIcon(tempCard);

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
		var capString = getCapacityString(tempCard);
		if(capString !== '' && capString !== undefined){ // omit the badge entirely for infinite-supply cards
			initNewUIElement('div', new Map().set('id', id + id_bottomRight), id + id_div, ['dcard-supply', 'noclick'])
				.innerHTML = capString;
		}
	}

	if(opts.callback && opts.callback !== ''){
		div.addEventListener('click', function(res){ opts.callback(res.target.id); });
	}
	if(typeof fitCardText === 'function'){
		requestAnimationFrame(function(){ fitCardText(div); });
	}
	return div;
}
