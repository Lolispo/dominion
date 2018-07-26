// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;
var gameEnded = false;

/*
	TODO
	Start to Center stuff in css
	Redo images, div with images inside
		Allows out of stock image with absolute position and z index
		Figure out so cards cost, cap and value in middle can be configured in html
	Out of stock cards should be filtered DIFFERENTLY, so they are always shown out of stock when cap = 0
		Add to affordable card check

	End
		Prevent drawing a new hand after end
		Add information to more than just console

	Estetic
		Make Player own areas more clearer
			player color, different background color
			border ? 
		color and name choice in main menu

		CSS - Scalable card sizes
	
	CSS
		Better name for text sizes

	Later:
		New Cards:
			Festival, +2 act, 1 buy, +2 gold
			WoodCutter, +1 buy, +2 gold
			Curse, -1 points
				Witch ez
			Garden (functionality already added)
			Rest listed in Deck.js


		netplay - nodejs
			board cards sent
			amount of cards sent to all, which cards only to the player
			Deck updates (buys) are sent
			Move Player and Deck to server side instead of client side

		Private variables (var instead of this.)
			Gather variables in one place
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
	initNewUIElement('div', new Map().set('id', 'turn'), 'info', ['inline', 'bold', 'big_text', 'strokeme']);
	changeText('turn', players[turn].name + ':s turn');
	document.getElementById('turn').style.backgroundColor = getPlayerColor(turn);
	for(var i = 0; i < players.length; i++){
		document.getElementById(id_player + i).style.order = 2;
	}
	document.getElementById(id_player + turn).style.order = 1;
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
	changeText('turn', players[turn].name + ':s turn');
	document.getElementById('turn').style.backgroundColor = getPlayerColor(turn);
	for(var i = 0; i < players.length; i++){
		document.getElementById(id_player + i).style.order = 2;
	}
	document.getElementById(id_player + turn).style.order = 1;
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

function updateShopText(message){
	document.getElementById(id_shop + id_text + '1').innerHTML = message;
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

// Returns orderNum for card, style.order
function getCssOrderCard(card, phase){
	switch(card.cardType){
		case CardType.ACTION_CARD:
			if(phase === 0 || phase === 2){
				return 1;				
			} else {
				return 4;
			}
		case CardType.TREASURE_CARD:
			return 2;
		case CardType.VICTORY_CARD:
			return 3;
		default:
			return 4;
	}
}

// Returns background player color for HTML
function getPlayerColor(index){
	switch(index){
		case 0: 
			return 'aquamarine'
		case 1:
			return 'greenyellow'
		case 2:
			return 'lightblue'
		case 3:
			return 'lightpink';
		default:
			return 'lightgray'
	}
}

// Called when points should be calculated to see who won
function endGame(){
	var pointsArray = [];
	var highestPointPlayer = -1;
	var highestPoints = -100;
	var allPlayerCards = []; 
	for(var i = 0; i < players.length; i++){
		var cards = players[i].cards.endGetAllCards();
		allPlayerCards[i] = cards;
		pointsArray[i] = 0;
		for(var j = 0; j < cards.length; j++){
			if(cards[j].cardType === CardType.VICTORY_CARD){
				if(cards[j].name === 'Garden'){
					// TODO Add garden functionality here
					var temp = cards.length;
					temp -= (cards.length % 10);
					pointsArray[i] += temp / 10;
				} else{
					pointsArray[i] += cards[j].getValue();	
				}
			}
		}
		if(pointsArray[i] > highestPoints){
			highestPoints = pointsArray[i];
			highestPointPlayer = i;
		}
	}

	// TODO Update correct field with victory text, in html
	// Can add functionality to check for total cost of hand, in treasure, victory & actions cards etc

	console.log('The winner is Player ' + (highestPointPlayer + 1) + ' with ' + highestPoints + ' points!');
	console.log('All Results:');
	for(var i = 0; i < players.length; i++){
		var cards = allPlayerCards[i];
		console.log(players[i].name + ': ' + pointsArray[i] + ' points');
		console.log(cards.length + ' cards total');
		var map = new Map();
		for(var j = 0; j < cards.length; j++){
			if(typeof map.get(cards[j].name) === 'undefined'){
				map.set(cards[j].name, 1);
			} else {
				map.set(cards[j].name, map.get(cards[j].name) + 1);
			}
		}
		map.forEach(function(value, key){ // Unknown order of these cards
			console.log(value + ' ' + key);
		});
		console.log('--------------------------');
	}
}