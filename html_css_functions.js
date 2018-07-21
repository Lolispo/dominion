// Author Petter Andersson
'use strict'

// Declare variables like 'hand_' etc here to be used everywhere
var id_player = 'player_';
var id_name = 'name_';
var id_text = 'text_';
var id_info = 'info_';
var id_info_cards = 'info_cards_';
var id_info_stats = 'info_stats_';
var id_board = 'board_';
var id_interact = 'interact_';
var id_hand = 'hand_';
var id_deck = 'deck_';
var id_discard = 'discard_';
var id_money = 'money_';
var id_buysLeft = 'buysLeft_';
var id_actionsLeft = 'actionsLeft_';

var id_card = 'card_'
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
	initNewUIElement('div', new Map().set('id', 'mainShop'), 'shop').innerHTML = 'Shop';
	initNewUIElement('div', new Map().set('id', 'shopCards'), 'mainShop');
	cards.forEach(function(value, key){
		// TODO: Use method here
		var properties = new Map();
		properties.set('id', 'card_' + value.id);
		properties.set('src', getCorrectImage(value));
		var el = initNewUIElement('img', properties, 'shopCards', ['card_smaller', getCssClassCard(value)]);
		el.addEventListener('click', function(res){
			var card_id = getIDFromCard(res.srcElement.id);
			var card = generateNewCard(cards_global_id.get(card_id));
			if(card === null){ // Out of this card, capacity reached
				updateTextPrint(getPlayer(turn).index, 'Out of this cardtype!'); // TODO: Move this to shop messages instead
			} else { 
				getPlayer(turn).buyCard(card);			
			}
		});
	});
	createButton(closeShop, 'mainShop', 'showShop', (function(){ // Change to Open and Close / Change on toggle TODO
		// Show / dont show shop
		var currentName = document.getElementById('showShop').innerHTML;
		if(currentName === openShop){
			changeText('showShop', closeShop);
		} else{
			changeText('showShop', openShop)
		}
		modifyCSSID('toggle', 'shopCards', 'invis');
	}).bind(this), 'normalButton');	
}