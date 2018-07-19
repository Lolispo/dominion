// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;

/*
	TODO
	Scalable card sizes
	sortable hand (instant and on command, when new cards are added)
	Dropdowns of cards for buying, 4 different - All and the 3 categories
		Only affordable cards in main category should show, rest all cards in that category
	Add chosen card choice to Player.js buyCard
*/

function startGame(){
	// Init players
	playingPlayers = sessionStorage.getItem('playersPlaying');;
	// Init Cards
/*
	Cards = JSON.parse(sessionStorage.getItem('Cards'));
	Cards_Treasure = JSON.parse(sessionStorage.getItem('Cards_Treasure'));
	Cards_Action = JSON.parse(sessionStorage.getItem('Cards_Action'));
	Cards_Victory = JSON.parse(sessionStorage.getItem('Cards_Victory'));
*/
	initCardsGlobal();
	for(var i = 0; i < playingPlayers; i++){
		var tempPlayer = new Player(i);
		tempPlayer.initPlayer();
		players.push(tempPlayer);
	}
	for(var i = 0; i < players.length; i++){
		players[i].drawHand();
	}


	// Choosing turn and start
	turn = Math.floor(Math.random() * players.length);
	initNewUIElement('div', new Map().set('id', 'turn'), 'info', 'bold');
	updateTurnUI();
	players[turn].startTurn();
}

// Init cards
async function initCardsGlobal(){
	initCards();
	console.log('Cards should be done - Shop Init');
	initShopHTML();
}

function initShopHTML(){
	var cards = cards_global;
	initNewUIElement('ul', new Map().set('id', 'mainShop'), 'shop');
	cards.forEach(function(value, key){
		console.log(key + ' = ' + value);
		initNewUIElement('li', new Map().set('id', value.name), 'mainShop').innerHTML = value.name;				
	});
}

function updateTurnUI(){
	document.getElementById('turn').innerHTML = 'Player ' + (turn+1) + ':s turn';
}

function changeTurn(){
	if(turn + 1 >= players.length){
		turn = 0;
	} else {
		turn++;
	}
	updateTurnUI();
	players[turn].startTurn();
}

function backMainMenu(){
	location.replace('index.html');
	// Reset variables
}

function updateTextPrint(playerIndex, message, printEverywhere = true){
	console.log('P' + (playerIndex+1) + ': ' + message);
	if(printEverywhere){
		document.getElementById('text'+playerIndex+'_3').innerHTML = document.getElementById('text'+playerIndex+'_2').innerHTML;
		document.getElementById('text'+playerIndex+'_2').innerHTML = document.getElementById('text'+playerIndex+'_1').innerHTML;
		document.getElementById('text'+playerIndex+'_1').innerHTML = message;		
	}
}

function shuffle(array) {
    var counter = array.length;

    while (counter > 0) {
        // Pick a random index
        var index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        var temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function getPlayerFromCard(id){
	return id.split('_')[1];
}

function isTurn(playerIndex){
	if(turn === playerIndex){
		return true;
	}
	return false;
}

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
	var handEl = document.getElementById(parentID); // Remove the button from parentID with id = id
	handEl.removeChild(document.getElementById(id));
}

function removeChildren(id){
	var el = document.getElementById(id);
	for(var i = el.childNodes.length-1; i >= 0; i--){
		el.removeChild(el.childNodes[i]);
	}
}

function addCSSClassID(id, cssClass){
	var el = document.getElementById(id);
	addCSSClassEl(el, cssClass);
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

function changeButtonText(id, text){
	document.getElementById(id).innerHTML = text;
}

function getPlayer(pid){
	return players[pid];
}

function getCorrectImage(card){
	var sPre = 'res/';
	var sPost = '.png';
	return sPre + card.name + sPost;
}

function getCssClassCard(card){
	switch(card.cardType){
		case CardType.ACTION_CARD:
			return 'card_action';
			break;
		case CardType.VICTORY_CARD:
			return 'card_victory';
			break;
		case CardType.TREASURE_CARD:
		default:
			return 'card_treasure';
			break;
	}
}