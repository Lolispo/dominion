// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;
var gameCounter = 0;
var gameEnded = false;

/*
	TODO

	Gameplay:
		End
			Cards should show before text 
		Some way of explaning what cost and cap numbers are
	

	Estetic
		Start to Center stuff in css
		Choose color and name
		Make Player own areas more clearer
		Better background color to buttons so they are more easily spottable
		
		Make it more obvious in UI when having to choose a card from your hand (currently the skip button appears only)
			Also should be availble for shop for Cards where you receive a free card
		Scalable card sizes
			Use 3 existing card sizes, when card amount in hand goes over a certain limit

	Later:
		New Cards:
			Listed in Deck.js

		netplay - nodejs
			board cards sent
			amount of cards sent to all, which cards only to the player
			Deck updates (buys) are sent
			Move Player and Deck to server side instead of client side

		Private variables / exchange var to let / const
			Gather variables in one place
*/

function startGame(){
	// Init players
	playingPlayers = sessionStorage.getItem('playersPlaying');;
	// Init Cards
	if(!Number.isInteger(playingPlayers)){
		playingPlayers = 2;
	}
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
		players[i].drawHand();
	}

	// Choosing turn and start
	turn = Math.floor(Math.random() * playingPlayers);
	initNewUIElement('div', new Map().set('id', 'turn'), 'info', ['inline', 'bold', 'size3_text_medium', 'text_shadow']);
	changeText('turn', 'Player ' + (turn + 1) + ':s turn'); // TODO @nameCustom
	document.getElementById('turn').style.backgroundColor = getPlayerColor(turn);
	for(var i = 0; i < playingPlayers; i++){
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
		document.getElementById(id_text + playerIndex+id_3).innerHTML = document.getElementById(id_text + playerIndex+id_2).innerHTML;
		document.getElementById(id_text + playerIndex+id_2).innerHTML = document.getElementById(id_text + playerIndex+id_1).innerHTML;
		document.getElementById(id_text + playerIndex+id_1).innerHTML = '> ' + message;		
	}
}

function updateShopText(message){
	//console.log('DEBUG END', message, gameEnded);
	if(!gameEnded){
		document.getElementById(id_shop + id_text + '1').innerHTML = message;
	} else {
		if(gameCounter === 0){
			document.getElementById(id_shop + id_text + '1').innerHTML = message;
			gameCounter++;
		}
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

function getIDImgFromDiv(id){
	var splitted = id.split('_');
	return splitted[0] + '_' + splitted[1];	
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

function getPlayerCard(pid, cardID){
	return getPlayer(pid).cards.hand.getCard(cardID);
}

function getCorrectImage(card){
	var sPre = 'res/';
	var sPost = '.png';
	switch(card.cardType){
		case CardType.ACTION_CARD:
			return sPre + 'Action' + sPost;
		case CardType.VICTORY_CARD:
			return sPre + 'Victory' + sPost;
		case CardType.TREASURE_CARD:
		default:
			return sPre + 'Treasure' + sPost;
	}
}

// Returns css class for CardType
function getCssClassCard(card){
	switch(card.cardType){
		case CardType.ACTION_CARD:
			return 'card_action';
		case CardType.VICTORY_CARD:
			return 'card_victory';
		case CardType.TREASURE_CARD:
		default:
			return 'card_treasure';
	}
}

function getCssAlign(string, width){
	switch(width){
		case width_smallest:
			return 'size1_' + string;
		case width_biggest:
			return 'size3_' + string;
		case width_middle:
		default:
			return 'size2_' + string;			
	}
}

// Returns Font size for center text
function getCssFontSize(card, width, isCenter){
	if(isCenter){
		switch(card.cardType){
			case CardType.ACTION_CARD:
				return getCssAlign('text_small', width);
			case CardType.VICTORY_CARD:
				if(card.name === 'Garden'){
					return getCssAlign('text_small', width);
				}
			case CardType.TREASURE_CARD:
			default:
				return getCssAlign('text_big', width);
		}
	} else{
		return getCssAlign('text_medium', width);
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

function getStringNotZero(money, buysLeft, actionsLeft, plusMoney){
	var s = '(';
	var added = false;
	if(money != 0){
		s += 'Money: ' + money;
		added = true;
	}
	if(plusMoney != 0){
		if(added){
			s += ', ';
		}
		s += '+$: ' + plusMoney;
		added = true;
	}
	if(buysLeft != 0){
		if(added){
			s += ', ';
		}
		s += 'BuysLeft: ' + buysLeft;
		added = true;
	}
	if(actionsLeft != 0){
		if(added){
			s += ', ';
		}
		s += 'ActionsLeft: ' + actionsLeft;
		added = true;		
	}
	s += ')';
	return s;
}

// Called when points should be calculated to see who won
function endGame(){
	console.log('Game ending!');
	gameEnded = true;
	modifyCSSID('add', 'shopCards', 'invis')
	var pointsArray = [];
	var highestPointPlayer = [];
	var highestPoints = -100;
	var allPlayerCards = []; 
	for(var i = 0; i < players.length; i++){
		modifyCSSID('add', id_info_cards + i, 'invis');
		var cards = players[i].cards.endGetAllCards();
		allPlayerCards[i] = cards;
		pointsArray[i] = 0;
		for(var j = 0; j < cards.length; j++){
			if(cards[j].cardType === CardType.VICTORY_CARD){
				if(cards[j].name === 'Garden'){
					var temp = cards.length;
					temp -= (cards.length % 10);
					pointsArray[i] += temp / 10;
				} else{
					pointsArray[i] += cards[j].getValue();	
				}
			}
		}
		if(pointsArray[i] === highestPoints){
			highestPointPlayer.push(i);
		} else if(pointsArray[i] > highestPoints){
			highestPoints = pointsArray[i];
			highestPointPlayer = [];
			highestPointPlayer.push(i);
		}
	}

	// TODO Update correct field with victory text, in html
	// Can add functionality to check for total cost of hand, in treasure, victory & actions cards etc
	// TODO Loop over highestPointPlayer names
	var s = '';
	if(highestPointPlayer.length > 1){
		s += 'The winners are ';
	} else{
		s += 'The winner is ';
	}
	for(var i = 0; i < highestPointPlayer.length; i++){
		if(i !== 0){
			s += 'and ';
		}
		s += players[highestPointPlayer[i]].name + ' ';
	}
	s += 'with ' + highestPoints + ' points!';
	console.log(s);
	updateShopText(String(s));
	console.log('All Results:');
	// TODO Add data to player areas
	// Current Data: info_cards, info_discard
	for(var i = 0; i < players.length; i++){
		removeChildren(id_info_stats + i);
		var el = document.getElementById(id_info_stats + i);
		modifyCSSEl('add', el, 'flex_container')
		var cards = allPlayerCards[i];
		var newEl = initNewUIElement('div', new Map(), id_info_stats + i, ['noclick', 'text_shadow', 'size3_text_medium']);
		newEl.innerHTML = pointsArray[i] + ' points'; // players[i].name + ': ' + 
		var newEl2 = initNewUIElement('div', new Map(), id_info_stats + i, ['noclick', 'text_shadow', 'size3_text_medium']);
		newEl2.innerHTML = cards.length + ' cards total';
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
			var card = cards_global.get(key); 
			var victoryCardString = '';
			if(card.cardType === CardType.VICTORY_CARD){
				var points = 0;
				if(card.name === 'Garden'){
					// TODO Add garden functionality here
					var temp = cards.length;
					temp -= (cards.length % 10);
					points = temp / 10;
				} else{
					points = card.getValue();	
				}
				var totalPoints = points * value;
				victoryCardString = ', Victory Points Worth: ' + totalPoints;
			}
			initNewUIElement('div', new Map().set('id', id_scoreScreen + id_card + card.name + '_' + i), id_info_stats + i, ['card_container']);
			generateCardHTML(card, id_scoreScreen + id_card + card.id + i, id_scoreScreen + id_card + card.name + '_' + i, false, 'card_discard', [getCssClassCard(card)]);
			initNewUIElement('div', new Map().set('id', id_scoreScreen + id_text + '_' + i), id_scoreScreen + id_card + card.name + '_' + i, ['noclick', 'text_shadow', 'text16'])
				.innerHTML = 'Amount: ' + value + victoryCardString;			
			//tempEl.innerHTML = value + ' ' + key;
			console.log(value + ' ' + key);
		});
		console.log('--------------------------');
	}
}