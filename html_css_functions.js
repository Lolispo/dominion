// Author Petter Andersson
'use strict'

// TODO
// Declare variables like 'hand_' etc here to be used everywhere

// HTML Stuff

function initNewUIElement(typeEl, properties = new Map(), parentID, cssClass = ''){
	var div = document.getElementById(parentID);
	var el = document.createElement(typeEl);
	properties.forEach(function(value, key) {
		el.setAttribute(key, value);
	});
	addCSSClassEl(el, cssClass);
	div.appendChild(el);
	return el;
}

function createButton(text, parentID, id, callback, cssClass){
	//console.log('DEBUG @createButton');
	var el = document.getElementById(parentID);
	var button = document.createElement('button');
	button.type = 'button';
	button.innerHTML = text;
	button.id = id;
	el.appendChild(button);
	button.addEventListener('click', function(){
		callback();
	});
	addCSSClassEl(button, cssClass);
}

function deleteButton(id, parentID){
	if(document.getElementById(id) != null){
		var handEl = document.getElementById(parentID); // Remove the button from parentID with id = id
		handEl.removeChild(document.getElementById(id));
	}
}

function removeChildren(id){
	var el = document.getElementById(id);
	for(var i = el.childNodes.length-1; i >= 0; i--){
		el.removeChild(el.childNodes[i]);
	}
}

// TODO
// Make all of these into 2 methods with args, taking add, remove toggle

function addCSSClassID(id, cssClass){
	var el = document.getElementById(id);
	addCSSClassEl(el, cssClass);
}

function toggleCSSClassID(id, cssClass){
	var el = document.getElementById(id);
	toggleCSSClassEl(el, cssClass);
}

function removeCSSClassID(id, cssClass){
	var el = document.getElementById(id);
	removeCSSClassEl(el, cssClass);
}

function addCSSClassEl(el, cssClass){
	if(Array.isArray(cssClass)){
		for(var i = 0; i < cssClass.length; i++){
			el.classList.add(cssClass[i]);
		}
	}else if(cssClass !== ''){
		el.classList.add(cssClass);		
	}
}

function removeCSSClassEl(el, cssClass){
	if(Array.isArray(cssClass)){
		for(var i = 0; i < cssClass.length; i++){
			el.classList.remove(cssClass[i]);
		}
	}else if(cssClass !== ''){
		el.classList.remove(cssClass);		
	}
}

function toggleCSSClassEl(el, cssClass){
	if(Array.isArray(cssClass)){
		for(var i = 0; i < cssClass.length; i++){
			el.classList.toggle(cssClass[i]);
		}
	}else if(cssClass !== ''){
		el.classList.toggle(cssClass);		
	}
}

function initShopHTML(){
	var cards = cards_global;
	initNewUIElement('div', new Map().set('id', 'mainShop'), 'shop').innerHTML = 'Shop';
	initNewUIElement('div', new Map().set('id', 'shopCards'), 'mainShop');
	cards.forEach(function(value, key){
		var properties = new Map();
		properties.set('id', 'card_' + value.id);
		properties.set('src', getCorrectImage(value));
		var el = initNewUIElement('img', properties, 'shopCards', ['card_smaller', getCssClassCard(value)]);
		el.addEventListener('click', function(res){
			// TODO: 
			console.log(cards_global_id);
			var card_id = getIDFromCard(res.srcElement.id);
			var card = generateNewCard(cards_global_id.get(card_id));
			console.log('DEBUG: ' + card + ', ' + card.name + ', ' + card.cost);
			console.log(card);
			players[turn].buyCard(card);
		});
	});
	createButton('Toggle Shop', 'mainShop', 'showShop', (function(){ // Change to Open and Close / Change on toggle TODO
		// Show / dont show shop
		toggleCSSClassID('shopCards', 'invis');
	}).bind(this));	
}

function changeButtonText(id, text){
	document.getElementById(id).innerHTML = text;
}


function updateTurnUI(){
	document.getElementById('turn').innerHTML = 'Player ' + (turn+1) + ':s turn';
}