// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;

/*
	TODO
	Make Player own areas more clearer, border or something
	Shop
		Show affordable cards
		Show selected card
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