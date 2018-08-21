// Author Petter Andersson
'use strict'

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

var width_smallest = '32px';
var width_middle = '64px';
var width_biggest = '128px';

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
			modifyCSSID(mode, getIDImgFromDiv(el.childNodes[i].id), cssClass);				
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
		generateCardHTML(card, id_card + card.id, 'shopCards', true, 'card_smaller', [getCssClassCard(card)], function(card_HTMLid){
			var card_id = getIDFromCard(card_HTMLid);
			var newCard = generateNewCard(cards_global_id.get(card_id));
			if(newCard === null){ // Out of this card, capacity reached
				updateShopText('Out of this cardtype!');
			} else { 
				getPlayer(turn).buyCard(newCard, card_id);			
			}
		}, 2);
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

// Returns width size for cards size
function getWidthCard(cardType){
	switch(cardType){
		case 'card_discard':
			return width_smallest;
		case 'card_smaller':
		case 'card_board':
		default:
			return width_middle;
	}
}

// Generate HTML for Card - More generic
function generateCardHTML(tempCard, id, parentID, isShopCard, cardType, cssClass, callback = '', orderNum = '4'){
	var div = initNewUIElement('div', new Map().set('id', id + id_div), parentID, ['container', 'margin_left_1', 'position_relative']);
	div.style.order = orderNum;
	var centerWidth = getWidthCard(cardType);
	var centeredTextCSSClass = getCssFontSize(tempCard, centerWidth, true); 
	var normalTextCSSClass = getCssFontSize(tempCard, centerWidth, false);

	// Img element
	var properties = new Map();
	properties.set('id', id);
	properties.set('src', getCorrectImage(tempCard));
	var img = initNewUIElement('img', properties, id + id_div, cssClass);
	modifyCSSEl('add', img, [cardType, 'position_relative', 'noclick']);
	
	// Name
	var name = initNewUIElement('div', new Map().set('id', id + id_name_post), id + id_div, [getCssAlign('centered_top', centerWidth), 'text_shadow', 'noclick', normalTextCSSClass]);
	name.innerHTML = tempCard.name;
	//name.style.width = centerWidth;
	// Center text
	var center = initNewUIElement('div', new Map().set('id', id + id_centeredText), id + id_div, ['centered', 'noclick', centeredTextCSSClass]);
	center.style.width = centerWidth;
	var stringActions = String(tempCard.getValue());
	var splitted = stringActions.split('\n');
	if(splitted.length > 0){
		for(var i = 0; i < splitted.length; i++){
			var el = initNewUIElement('div', new Map().set('id', id + id_centeredText + '_' + i), id + id_centeredText, ['noclick', 'text_shadow', centeredTextCSSClass]);
			el.innerHTML = splitted[i];
		}		
	} else {
		center.innerHTML = stringActions;
	}
	// Bottom texts
	if(isShopCard){ // Only shop cards have to show cost and capacity
		var bottomLeft = initNewUIElement('div', new Map().set('id', id + id_bottomLeft), id + id_div, [getCssAlign('bottom_left', centerWidth), 'noclick', 'text_shadow', normalTextCSSClass]);
		var bottomRight = initNewUIElement('div', new Map().set('id', id + id_bottomRight), id + id_div, [getCssAlign('bottom_right', centerWidth), 'noclick', 'text_shadow', normalTextCSSClass]);
		bottomLeft.innerHTML = tempCard.getCost();
		bottomRight.innerHTML = getCapacityString(tempCard);
	}
	// Event
	if(callback != ''){
		div.addEventListener('click', function(res){
			var card_HTMLid = res.target.id;
			callback(card_HTMLid);
		});		
	}
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

function animateCard(id, animationCSS = '', callbackEnd = '', requiredCSS = ''){
	// Animate display card
	//console.log('DEBUG @animateCard ' + id + ', ' + animationCSS);
	var element = document.getElementById(id + id_div);
	modifyCSSEl('add', element, requiredCSS);
	element.addEventListener('animationstart', listener, false);
	element.addEventListener('animationend', listener, false);

	if(animationCSS != ''){
		modifyCSSEl('add', element, animationCSS);
	}
	function listener(event) {
		switch(event.type) {
			case 'animationstart':
				//console.log('animationstart: ' + animationCSS + ', ' + event.elapsedTime + 's');
				break;
			case 'animationend':
				//console.log('animationend: ' + animationCSS + ', ' + event.elapsedTime + 's');
				if(animationCSS != ''){
					modifyCSSEl('remove', element, animationCSS);
				}
				modifyCSSEl('remove', element, requiredCSS);
				if(callbackEnd != ''){
					callbackEnd(turn, id);
				}
				element.removeEventListener('animationstart', listener);
				element.removeEventListener('animationend', listener);
				break;
		}
	}
	return true;
}