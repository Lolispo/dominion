// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;

/*
	TODO
	Next parts:
		Card Capacity
		win condition

	Make Player own areas more clearer
		player color, different background color
		border ?
	Shop
		Move button - toggle shop. Change so Open / Close change
		CSS - Show affordable cards
			Update on every money change
		CSS - Show selected card
	Discard pile
		Show bought card on top of discard pile
	
	CSS - Scalable card sizes
	sortable hand (instant and on command, when new cards are added)
		Sort on every draw card

	Later:
		Mine
		color and name choice in main menu

		netplay - nodejs
			board cards sent
			amount of cards sent to all, which cards only to the player
			Deck updates (buys) are sent
			Move Player and Deck to server side instead of client side

*/

function startGame(){
	// Init players
	playingPlayers = sessionStorage.getItem('playersPlaying');;
	// Init Cards
	/*
	// TODO: Add so cards can be loaded before hand, not important
	cards_global = JSON.parse(sessionStorage.getItem('Cards'));
	cards_global_id = JSON.parse(sessionStorage.getItem('Cards_id'));
	cards_treasure = JSON.parse(sessionStorage.getItem('Cards_Treasure'));
	cards_action = JSON.parse(sessionStorage.getItem('Cards_Action'));
	cards_victory = JSON.parse(sessionStorage.getItem('Cards_Victory'));
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
	initNewUIElement('div', new Map().set('id', 'turn'), 'info', ['bold', 'bigger_text']);
	changeText('turn', 'Player ' + (turn+1) + ':s turn');
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
	changeText('turn', 'Player ' + (turn+1) + ':s turn');
	players[turn].startTurn();
}

function backMainMenu(){
	location.replace('index.html');
	// Reset variables
}

function updateTextPrint(playerIndex, message, printEverywhere = true){
	console.log('P' + (playerIndex+1) + ': ' + message);
	if(printEverywhere){
		document.getElementById(id_text + playerIndex+'_3').innerHTML = document.getElementById(id_text + playerIndex+'_2').innerHTML;
		document.getElementById(id_text + playerIndex+'_2').innerHTML = document.getElementById(id_text + playerIndex+'_1').innerHTML;
		document.getElementById(id_text + playerIndex+'_1').innerHTML = '> ' + message;		
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

function getIDFromCard(id){
	var parsed = id.split('_')[1];
	if(isNaN(parseInt(parsed))){
		return parsed;
	}
	return parseInt(parsed);
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

// Returns css class for CardType
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