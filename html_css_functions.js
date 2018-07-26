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
var id_board = 'board_';
var id_interact = 'interact_';
var id_hand = 'hand_';
var id_deck = 'deck_';
var id_discard = 'discard_';
var id_discard_top = 'info_discard_';
var id_money = 'money_';
var id_buysLeft = 'buysLeft_';
var id_actionsLeft = 'actionsLeft_';

var id_img = '_img';
var id_div = '_div';
var id_centeredText = '_centered'
var id_bottomLeft = '_bottomLeft'
var id_bottomRight = '_bottomRight'
var id_shop = 'shop_';
var id_card = 'card_';
var id_phase0 = '> Go To Buy Phase';
var id_phase1 = '> End Turn';

var openShop = 'Open Shop';
var closeShop = 'Close Shop';

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

function createButton(text, parentID, id, callback, cssClass){
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

function modifyCSSID(mode, id, cssClass){
	var el = document.getElementById(id);
	modifyCSSEl(mode, el, cssClass);
}

function modifyCSSEl(mode, el, cssClass){
	if(Array.isArray(cssClass)){
		for(var i = 0; i < cssClass.length; i++){
			if(mode === 'add'){
				el.classList.add(cssClass[i]);			
			} else if(mode === 'remove'){
				el.classList.remove(cssClass[i]);	
			} else if(mode === 'toggle'){
				el.classList.toggle(cssClass[i]);
			} else{
				throw 'Invalid cssClassEl type';
			}
		}
	}else if(cssClass !== ''){
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
	var cards = cards_global;
	initNewUIElement('div', new Map().set('id', 'mainShop'), 'shop');
	initNewUIElement('div', new Map().set('id', 'shopTitle'), 'mainShop', ['big_text', 'margin_left', 'bold', 'strokeme']).innerHTML = 'Shop';
	initNewUIElement('div', new Map().set('id', 'shopCards'), 'mainShop', 'card_container');
	cards.forEach(function(card, key){
		generateCardHTML(card, id_card + card.id, 'shopCards', 'card_smaller', [getCssClassCard(card)], function(card_HTMLid){
			var card_id = getIDFromCard(card_HTMLid);
			var newCard = generateNewCard(cards_global_id.get(card_id));
			if(newCard === null){ // Out of this card, capacity reached
				updateShopText('Out of this cardtype!'); // TODO: Move this to shop messages instead
			} else { 
				getPlayer(turn).buyCard(newCard, card_id);			
			}
		}, 2);
	});

	initNewUIElement('div', new Map().set('id', 'shopPanel'), 'mainShop', 'shopPanel');
	// Show / dont show shop
	createButton(closeShop, 'shopPanel', 'showShop', (function(){
		var currentName = document.getElementById('showShop').innerHTML;
		if(currentName === openShop){
			changeText('showShop', closeShop);
		} else{
			changeText('showShop', openShop)
		}
		modifyCSSID('toggle', 'shopCards', 'invis');
	}).bind(this), 'normalButton');	
	initNewUIElement('div', new Map().set('id', id_shop + 'texts'), 'shopPanel', 'shopText');
	initNewUIElement('div', new Map().set('id', id_shop + id_text + '1'), id_shop + 'texts', ['big_text', 'bold', 'margin_left', 'strokeme'])
		.innerHTML = 'Shop Message\n';
}

// Returns width size for cards size
function getWidthCard(cardType){
	switch(cardType){
		case 'card_discard':
			return '32px';
		case 'card_smaller':
		case 'card_board':
			return '64px';
		case 'card':
		default:
			return '128px';
	}
}

// Generate HTML for Card - More generic
function generateCardHTML(tempCard, id, parentID, cardType, cssClass, callback = '', orderNum = '4'){
	var div = initNewUIElement('div', new Map().set('id', id + id_div), parentID, ['container', 'margin_left_1', 'position_relative']);
	div.style.order = orderNum;
	var centeredTextCSSClass = getCssFontSize(tempCard); // Should take card or card_smaller into account (More)
	
	var properties = new Map();
	properties.set('id', id);
	properties.set('src', getCorrectImage(tempCard)); // Background image, todo update
	var img = initNewUIElement('img', properties, id + id_div, cssClass);
	modifyCSSEl('add', img, [cardType, 'position_relative', 'noclick']);
	initNewUIElement('div', new Map().set('id', id + id_name_post), id + id_div, ['centered-top', 'noclick']).innerHTML = tempCard.name;
	var centerWidth = getWidthCard(cardType);
	var center = initNewUIElement('div', new Map().set('id', id + id_centeredText), id + id_div, ['centered', 'noclick', centeredTextCSSClass]);
	center.style.width = centerWidth;
	var stringActions = String(tempCard.getValue());
	var splitted = stringActions.split('\n');
	console.log(splitted.length);
	if(splitted.length > 0){
		for(var i = 0; i < splitted.length; i++){
			var el = initNewUIElement('div', new Map().set('id', id + id_centeredText + '_' + i), id + id_centeredText, ['noclick', centeredTextCSSClass]);
			el.innerHTML = splitted[i];
		}		
	} else {
		center.innerHTML = stringActions;
	}
	initNewUIElement('div', new Map().set('id', id + id_bottomLeft), id + id_div, ['bottom-left', 'noclick']).innerHTML = tempCard.getCost();
	var cap = getCapacityString(tempCard);
	initNewUIElement('div', new Map().set('id', id + id_bottomRight), id + id_div, ['bottom-right', 'noclick']).innerHTML = cap;
	if(callback != ''){
		div.addEventListener('click', function(res){
			var card_HTMLid = res.srcElement.id;
			callback(card_HTMLid);
		});		
	}
}

// Gustav
	/*var el = initNewUIElement('div', new Map().set('id', id_card + tempCard.id), id_hand + this.playerIndex, getCssClassCard(tempCard));
	initNewUIElement('div', new Map().set('id', 'value_' + id_card + tempCard.id), id_card + tempCard.id, 'value').innerHTML = tempCard.getValue();
	initNewUIElement('div', new Map().set('id', 'cost_' + id_card + tempCard.id), id_card + tempCard.id, 'cost').innerHTML = tempCard.getCost();
	initNewUIElement('div', new Map().set('id', 'desc_' + id_card + tempCard.id), id_card + tempCard.id, 'description').innerHTML = 'Default String';
	*/

