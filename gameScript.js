// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;

/*
	TODO
	Dropdowns of cards for buying, 4 different - All and the 3 categories
		Only affordable cards in each category should show
	Add chosen card choice to Player.js buyCard
	Info to HTML, money buyleft actionleft. Added id:s, need to be used on update in Deck.js

	Test
*/

function startGame(){
	playingPlayers = sessionStorage.playersPlaying;
	initCards();
	for(var i = 0; i < playingPlayers; i++){
		var tempPlayer = new Player(i);
		tempPlayer.initPlayer();
		players.push(tempPlayer);
	}
	for(var i = 0; i < players.length; i++){
		players[i].drawHand();
	}
	turn = Math.floor(Math.random() * players.length);
	initNewUIElement('turn', 'info', 'bold');
	updateTurnUI();
	players[turn].startTurn();
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

function updateTextPrint(playerIndex, message){
	console.log('P' + (playerIndex+1) + ': ' + message);
	document.getElementById("text"+playerIndex+"_3").innerHTML = document.getElementById("text"+playerIndex+"_2").innerHTML;
	document.getElementById("text"+playerIndex+"_2").innerHTML = document.getElementById("text"+playerIndex+"_1").innerHTML;
	document.getElementById("text"+playerIndex+"_1").innerHTML = message;
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

function initNewUIElement(id, parentID, cssClass = ''){
	var div = document.getElementById(parentID);
	var el = document.createElement('div');
	el.id = id;
	addCSSClassEl(el, cssClass);
	div.appendChild(el);
}

function createButton(text, parentID, id, callback, cssClass){
	//console.log('DEBUG @createButton');
	var el = document.getElementById(parentID);
	var button = document.createElement('button');
	button.type = "button";
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
	console.log(handEl);
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

function addCSSClassEl(el, cssClass){
	if(Array.isArray(cssClass)){
		for(var i = 0; i < cssClass.length; i++){
			el.classList.add(cssClass[i]);
		}
	}else if(cssClass !== ''){
		el.classList.add(cssClass);		
	}
}


function changeButtonText(id, text){
	document.getElementById(id).innerHTML = text;
}

function getPlayer(pid){
	return players[pid];
}