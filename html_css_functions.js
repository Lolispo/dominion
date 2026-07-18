// Author Petter Andersson
'use strict'

// Small gold-coin icon used in the money readout (instead of the word "Money").
var COIN_ICON = "<svg viewBox='0 0 24 24' width='22' height='22' style='vertical-align:-4px' aria-hidden='true'>"
	+ "<circle cx='12' cy='12' r='9.5' fill='#e2b13c' stroke='#8a6d0f' stroke-width='2'/>"
	+ "<circle cx='12' cy='12' r='6' fill='none' stroke='#8a6d0f' stroke-width='1'/>"
	+ "<text x='12' y='16.5' text-anchor='middle' font-size='12' font-weight='bold' fill='#6b520c'>$</text></svg>";

// Declare variables like 'hand_' etc here to be used everywhere
var id_player = 'player_';
var id_name_pre = 'name_';
var id_name_post = '_name';
var id_text = 'text_';
var id_info = 'info_';
var id_info_cards = 'info_cards_';
var id_info_stats = 'info_stats_';
var id_info_stats_main = 'info_stats_main_';
var id_info_stats_cards = 'info_stats_cards_';
var id_infoBoard = 'infoboard_';
var id_board = 'board_';
var id_interact = 'interact_';
var id_hand = 'hand_';
var id_deck = 'deck_';
var id_discard = 'discard_';
var id_discard_top = 'info_discard_';
var id_money = 'money_';
var id_buysLeft = 'buysLeft_';
var id_actionsLeft = 'actionsLeft_';

var id_0 = '_0';
var id_1 = '_1';
var id_2 = '_2';
var id_3 = '_3';
var id_img = '_img';
var id_div = '_div';
var id_centeredText = '_centered'
var id_bottomLeft = '_bottomLeft'
var id_bottomRight = '_bottomRight'
var id_shop = 'shop_';
var id_card = 'card_';
var id_scoreScreen = 'score_';
var id_phase0 = '> Go To Buy Phase';
var id_phase1 = '> End Turn';
var id_startBuyString = 'Starting Buying Phase';
var id_statusMessageString = 'Status Messages'

var openShop = 'Open Shop';
var closeShop = 'Close Shop';
const HELP_MESSAGE_OPEN = 'Help';
const HELP_MESSAGE_CLOSE = 'Close Help';
const MUSIC_STRING_PLAY = 'Music: &nbsp&nbsp▶';
const MUSIC_STRING_PAUSE = 'Music: &#9616;&#9616;';

function getHelpString(){
	var s = '';
	s += 'Game Information\nAll players start their turn with 1 action and 1 buy to use.\n If they get money on their hand, the money can be used to buy new cards in the shop\n';
	s += 'When the players deck runs out of cards, the discard pile is shuffled and placed as new deck\n';
	s += 'When a card is bought, it is put into the players discard pile, which makes it available at a later time\n';
	s += 'Starting Deck: Every player starts with 7 Copper and 3 Estate\n<br>\n';
	s += 'Card Information: \nBottom Left: Cost\nBottom right: Capacity\nTop Middle: Name\nMiddle: Value / Effect\n<br>\n';
	s += 'Treasure Cards: Orange border: Gives the player money equal to its value when equipped on hand\n';
	s += 'Victory Cards: Green border: Gives the player points at the end of the game equal to its value\n';
	s += 'Action Cards: Blue border: Can be used at the start of the players turn, effects given on card\n<br>\n';
	return s;
}


// Card hover tooltip — shows a card's full details (name, type, cost, rules) on hover.
// Uses event delegation so it covers dynamically-created cards (hand, shop, board).
function initCardTooltip(){
	if(document.getElementById('cardTip')){ return; }
	var tip = document.createElement('div');
	tip.id = 'cardTip';
	tip.className = 'card-tip invis';
	document.body.appendChild(tip);

	document.addEventListener('mouseover', function(e){
		var card = e.target.closest ? e.target.closest('.dcard') : null;
		if(!card){ return; }
		// Rivals' minis show only an icon — let the tooltip name them, but never
		// while they're hidden (face-down mode), which would reveal a hidden hand.
		if(card.closest && card.closest('.opponent') && document.body.classList.contains('opp-facedown')){ return; }
		var name = card.querySelector('.dcard-banner');
		var type = card.querySelector('.dcard-typeline');
		var text = card.querySelector('.dcard-text');
		var cost = card.querySelector('.dcard-cost');
		var supply = card.querySelector('.dcard-supply');
		if(!name){ return; }
		var meta = (type ? type.innerHTML : '');
		if(cost){ meta += ' &middot; cost ' + cost.innerHTML; }
		if(supply && supply.innerHTML !== ''){ meta += ' &middot; ' + supply.innerHTML + ' left'; }
		tip.innerHTML = '<div class="tip-name">' + name.innerHTML + '</div>'
			+ '<div class="tip-type">' + meta + '</div>'
			+ '<div class="tip-text">' + (text ? text.innerHTML : '') + '</div>';
		modifyCSSEl('remove', tip, 'invis');
		var r = card.getBoundingClientRect();
		var left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2));
		var top = r.top - tip.offsetHeight - 12;
		if(top < 8){ top = r.bottom + 12; } // flip below if no room above
		tip.style.left = left + 'px';
		tip.style.top = top + 'px';
	});
	document.addEventListener('mouseout', function(e){
		var card = e.target.closest ? e.target.closest('.dcard') : null;
		if(card){ modifyCSSEl('add', document.getElementById('cardTip'), 'invis'); }
	});
}

// Tighten the active player's hand fan when it grows large (e.g. Smithy chains)
// so cards keep fitting on one row instead of scrolling off-screen.
function fitHandFan(handEl){
	if(!handEl){ return; }
	// Only the active player's fan reads --hand-overlap; skip collapsed opponent strips
	// so a hand flipping between active/opponent across turns never keeps a stale value.
	if(handEl.closest && handEl.closest('.opponent')){ handEl.style.removeProperty('--hand-overlap'); return; }
	var cards = handEl.children;
	var n = cards.length;
	if(n <= 1){ handEl.style.removeProperty('--hand-overlap'); return; }
	var w = cards[0].offsetWidth;
	var avail = handEl.clientWidth;
	if(!w || avail <= 0){ return; } // not laid out yet — leave the CSS default
	var DEFAULT = -26;                 // comfortable fan overlap
	var MIN = -Math.round(w * 0.8);    // tightest allowed: keep a ~20% sliver of each card
	// total width = w + (n-1)*(w + overlap); solve overlap so it fits `avail`
	var needed = (avail - w) / (n - 1) - w;
	var overlap = Math.max(Math.min(DEFAULT, needed), MIN);
	handEl.style.setProperty('--hand-overlap', overlap + 'px');
}

// Attach once per hand container: refit on any card add/remove and on resize.
function observeHandFan(handEl){
	if(!handEl || handEl._fanObserved){ return; }
	handEl._fanObserved = true;
	var refit = function(){ fitHandFan(handEl); };
	new MutationObserver(refit).observe(handEl, {childList: true});
	window.addEventListener('resize', refit);
	refit();
}

// HTML Stuff

function initNewUIElement(typeEl, properties = new Map(), parentID, cssClass = ''){
	var div = document.getElementById(parentID);
	var el = document.createElement(typeEl);
	properties.forEach(function(value, key) {
		el.setAttribute(key, value);	
	});
	modifyCSSEl('add', el, cssClass);
	div.appendChild(el);
	return el;
}

function deckAnchorEl(pid){ return document.getElementById('pile_deck_' + pid); }
function discardAnchorEl(pid){ return document.getElementById('pile_discard_' + pid); }
function setPileCount(pileEl, n){
	var badge = pileEl.querySelector('.pile-count');
	if(!badge){ badge = document.createElement('div'); badge.className = 'pile-count'; pileEl.appendChild(badge); }
	badge.innerHTML = n;
}

function createButton(text, id, parentID, callback, cssClass){
	var el = document.getElementById(parentID);
	var button = document.createElement('button');
	button.type = 'button';
	button.innerHTML = text;
	button.id = id;
	el.appendChild(button);
	button.addEventListener('click', function(){
		callback();
	});
	modifyCSSEl('add', button, cssClass);
}

function deleteButton(id, parentID){
	if(document.getElementById(id) != null){
		var handEl = document.getElementById(parentID); // Remove the button from parentID with id = id
		handEl.removeChild(document.getElementById(id));		
	}
}

function changeText(id, text){
	var el = document.getElementById(id);
	if(el != null){
		el.innerHTML = text;
	}
}

function removeChildren(id){
	var el = document.getElementById(id);
	for(var i = el.childNodes.length-1; i >= 0; i--){
		el.removeChild(el.childNodes[i]);
	}
}

function modifyCSSChildren(mode, id, cssClass, isCard = true){
	var el = document.getElementById(id);
	for(var i = 0; i < el.childNodes.length; i++){
		if(isCard){
			modifyCSSID(mode, getIDImgFromDiv(el.childNodes[i].id) + id_div, cssClass); // target the .dcard root, not the inner art div
		} else{
			modifyCSSID(mode, el.childNodes[i].id, cssClass);
		}
	}	
}

function modifyCSSID(mode, id, cssClass){
	var el = document.getElementById(id);
	modifyCSSEl(mode, el, cssClass);
}

function modifyCSSEl(mode, el, cssClass){
	if(Array.isArray(cssClass)){
		if(mode === 'add'){
			el.classList.add(...cssClass);
		} else if(mode === 'remove'){
			el.classList.remove(...cssClass);	
		} else if(mode === 'toggle'){
			el.classList.toggle(...cssClass);
		} else{
			throw 'Invalid cssClassEl type';
		}
	} else if(cssClass !== ''){
		if(mode === 'add'){
			el.classList.add(cssClass);			
		} else if(mode === 'remove'){
			el.classList.remove(cssClass);	
		} else if(mode === 'toggle'){
			el.classList.toggle(cssClass);
		} else{
			throw 'Invalid cssClassEl type';
		}
	}
}

function initShopHTML(){
	var cards = cards_global_shop;
	initNewUIElement('div', new Map().set('id', 'mainShop'), 'shop');
	initNewUIElement('div', new Map().set('id', 'shopTitle'), 'mainShop', ['text16', 'margin_left', 'bold', 'text_shadow']).innerHTML = 'Shop';
	initNewUIElement('div', new Map().set('id', 'shopCards'), 'mainShop', 'card_container');
	cards.forEach(function(card, key){
		renderCard(card, id_card + card.id, 'shopCards', {
			isShopCard: true, size: 'shop',
			// Group the shop by type: treasures, then victories, then actions
			order: (card.cardType === CardType.TREASURE_CARD ? 1 : card.cardType === CardType.VICTORY_CARD ? 2 : 3),
			callback: function(card_HTMLid){
				var card_id = getIDFromCard(card_HTMLid);
				var newCard = generateNewCard(cards_global_id.get(card_id));
				if(newCard === null){ // Out of this card, capacity reached
					updateShopText('Out of this cardtype!');
				} else {
					getPlayer(turn).buyCard(newCard, card_id);
				}
			}
		});
	});

	initNewUIElement('div', new Map().set('id', 'shopPanel'), 'mainShop', 'shopPanel');
	// Show / dont show shop
	createButton(closeShop, 'showShop', 'shopPanel', (function(){
		var currentName = document.getElementById('showShop').innerHTML;
		if(currentName === openShop){
			changeText('showShop', closeShop);
		} else{
			changeText('showShop', openShop)
		}
		modifyCSSID('toggle', 'shopCards', 'invis');
	}).bind(this), 'normalButton');	
	initNewUIElement('div', new Map().set('id', id_shop + 'texts'), 'shopPanel', 'shopText');
	initNewUIElement('div', new Map().set('id', id_shop + id_text + '1'), id_shop + 'texts', ['text16', 'bold', 'margin_left', 'text_shadow'])
		.innerHTML = 'Shop Message\n';
}



// Add eventListener to hand card
function addHandCardClick(pid, allowedCardTypes, callback){
	var hand = document.getElementById(id_hand + pid);
	var cid = getPlayer(pid).cards.activeActionCard;
	var getActionCardID = function(){ // Called closure to use this
		return cid;
	}
	for(var i = 0; i < hand.childNodes.length; i++){
		//console.log('DEBUG @addHandCardClick', pid, hand.childNodes[i].id);
		var card = getPlayerCard(pid, getIDFromCard(hand.childNodes[i].id));
		if(allowedCardTypes.includes(card.cardType)){
			hand.childNodes[i].addEventListener('click', function(res){
				let card_HTMLid = res.target.id;
				let actionCardID = getActionCardID();
				callback(card_HTMLid, actionCardID);
			});
		}
	}
}

