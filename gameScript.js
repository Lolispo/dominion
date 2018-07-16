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
	document.getElementById("info").innerHTML = "Player " + (turn+1) + ":s turn";
	players[turn].startTurn();
}

function changeTurn(){
	if(turn + 1 >= players.length){
		turn = 0;
	} else {
		turn++;
	}
	players[turn].startTurn();
	document.getElementById("info").innerHTML = "Player " + (turn+1) + ":s turn";
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

function createButton(text, parentID, id, callback){
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
}

function deleteButton(id, parentID){
	var handEl = document.getElementById(parentID); // Remove the skip action button
	handEl.removeChild(document.getElementById(id));
}

function changeButtonText(id, text){
	document.getElementById(id).innerHTML = text;
}