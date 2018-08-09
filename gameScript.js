// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;
var gameCounter = 0;
var gameEnded = false;

/*
	TODO
	Top of Discard show 'Empty' image instead of not showing when discard empty
		After this, move it before status messages
	Make cards for other players show backside by default
		Make the backside of the cards
			When backside is added, add a Deck element, same as discard
	Deck and Discard visual cards can have their amount of cards on their back (atleast deck)
		If a nicer way of showing what is bought than discard pile is found, discard pile could be backside up aswell

	Sound
		Music on/off button
		Sound on/off button

		Sound
			New Turn
			Selects

	Animations:
		All UI updates
			Shop availability changes
			Buying a card

	Firefox:
		Council Room Firefox, sizes differ, text overlap	

	Gameplay:
		Make it more obvious whne you have more buys (1 moire buy with 1 gold maybe)

	Code
		Change global vars to Caps / Const
		Currently animation for both draw and dispaly card - Problem? Seems fine animation wise Check me.

	Estetic
		Better looking new name CSS input field
		Start to Center stuff in css
		Choose color and name
		Make Player own areas more clearer
		Better background color to buttons so they are more easily spottable
		
		Make it more obvious in UI when having to choose a card from your hand (currently the skip button appears only)
			Also should be available for shop for Cards where you receive a free card
		Scalable card sizes
			Use 3 existing card sizes, when card amount in hand goes over a certain limit
		Is it required to remove money cards that are used? In buy phase, they are hardly used so its visual only
			Could be good in netplay
		More visual on what was bought
			netplay

	Restructure: 
		Board in middle 

	Later:
		New Cards:
			Listed in Deck.js

		netplay - nodejs
			Remove code about order of players divs
				On restructure, this should be set to each user anyway
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
	if(!Number.isInteger(parseInt(playingPlayers))){
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
	initNewUIElement('div', new Map().set('id', 'turn'), 'info', ['inline']);
	initNewUIElement('div', new Map().set('id', 'turn_box'), 'turn', ['inline', 'bold', 'size3_text_medium', 'text_shadow']);
	initNewUIElement('div', new Map().set('id', 'helpDiv'), 'info', ['inline']);
	initNewUIElement('audio', new Map().set('id', 'audioMain').set('src', 'res/villageMusicShort.mp3').set('loop', ''), //.set('controls', '')
		'helpDiv', ['inline', 'margin_top_10']).innerHTML = 'Your browser does not support the audio element';
	// TODO: Move the strings to vars
	createButton('Music: &nbsp&nbsp▶', 'audioButton', 'helpDiv', togglePlay, ['normalButton', 'margin_left_10', 'margin_top_2']);
	createButton(HELP_MESSAGE_OPEN, 'helpButton', 'helpDiv', (function(){
		var currentName = document.getElementById('helpButton').innerHTML;
		if(currentName === HELP_MESSAGE_OPEN){
			changeText('helpButton', HELP_MESSAGE_CLOSE);
		} else{
			changeText('helpButton', HELP_MESSAGE_OPEN)
		}
		modifyCSSID('toggle', 'helpMessage', 'invis');
	}).bind(this), ['normalButton', 'margin_left_10', 'margin_top_2']);
	initNewUIElement('div', new Map().set('id', 'helpMessage'), 'helpDiv', ['flex_container', 'invis']);
	var stringActions = getHelpString();
	var splitted = stringActions.split('\n');
	for(var i = 0; i < splitted.length; i++){
		var el = initNewUIElement('div', new Map().set('id', 'helpMessage_' + i), 'helpMessage', ['inline', 'bold', 'size2_text_medium', 'text_shadow']);
		el.innerHTML = splitted[i];
	}
	changeText('turn_box', getPlayer(turn).name + ":s turn");
	document.getElementById('turn_box').style.backgroundColor = getPlayerColor(turn);
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

function togglePlay(){
	var myAudio = document.getElementById('audioMain');
	if(myAudio.paused){
		changeText('audioButton', 'Music: &#9616;&#9616;'); // ⏸. Move to vars
		modifyCSSID('add', 'helpDiv', 'margin_top_05');
		return myAudio.play();
	} else {
		changeText('audioButton', 'Music: &nbsp&nbsp▶');
		modifyCSSID('remove', 'helpDiv', 'margin_top_05');
		return myAudio.pause();
	}
}

function changeTurn(){
	if(turn + 1 >= players.length){
		turn = 0;
	} else {
		turn++;
	}

	var element = document.getElementById('turn');
	element.addEventListener('animationstart', listener, false);
	element.addEventListener('animationend', listener, false);

	modifyCSSEl('add', element, 'animation_slideOut');
	function listener(event) {
		switch(event.type) {
			case 'animationstart':
				//console.log('animationstart: 1: ' + event.elapsedTime);
				break;
			case 'animationend':
				//console.log('animationend: 1: ' + event.elapsedTime);
				modifyCSSEl('remove', element, 'animation_slideOut');
				// Outside of screen
				changeText('turn_box', players[turn].name + ":s turn"); // Decide ' or :
				document.getElementById('turn_box').style.backgroundColor = getPlayerColor(turn);
				modifyCSSEl('add', element, 'invis_opacity');

				element.removeEventListener('animationstart', listener);
				element.removeEventListener('animationend', listener);
				element.addEventListener('animationstart', listener2, false);
				element.addEventListener('animationend', listener2, false);

				modifyCSSEl('add', element, 'animation_slideIn');
				function listener2(event) {
					switch(event.type) {
						case 'animationstart':
							//console.log('animationstart: 2: ' + event.elapsedTime);
							break;
						case 'animationend':
							//console.log('animationend: 2: ' + event.elapsedTime);
							modifyCSSEl('remove', element, 'invis_opacity');
							element.removeEventListener('animationstart', listener2);
							element.removeEventListener('animationend', listener2);
							modifyCSSEl('remove', element, 'animation_slideIn');
							
							for(var i = 0; i < players.length; i++){
								document.getElementById(id_player + i).style.order = 2;
							}
							document.getElementById(id_player + turn).style.order = 1;
							players[turn].startTurn();
						
							break;
					}
				}
				break;
			/*
			case 'animationiteration':
				console.log('animationiteration: ' + event.elapsedTime);
				break;
			}*/
		}
	}
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
// phase = 3 : => score screen
function getCssOrderCard(card, phase){
	if(phase === 3){ // Score screen sorting
		switch(card.cardType){
			case CardType.ACTION_CARD:
				return 2;
			case CardType.TREASURE_CARD:
				return 3;
			case CardType.VICTORY_CARD:
				return 1;
			default:
				return 4;
		}
	} else {
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
	if(s !== '()'){
		return s;
	} else {
		return '';
	}
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
			var div = initNewUIElement('div', new Map().set('id', id_scoreScreen + id_card + card.name + '_' + i), id_info_stats + i, ['card_container']);
			div.style.order = getCssOrderCard(card, 3);
			generateCardHTML(card, id_scoreScreen + id_card + card.id + i, id_scoreScreen + id_card + card.name + '_' + i, false, 'card_discard', [getCssClassCard(card)]);
			initNewUIElement('div', new Map().set('id', id_scoreScreen + id_text + card.name + '_' + i + id_div), id_scoreScreen + id_card + card.name + '_' + i, 'endScreen_texts').style.order = 1;
			initNewUIElement('div', new Map().set('id', id_scoreScreen + id_text + i), id_scoreScreen + id_text + card.name + '_' + i + id_div, ['noclick', 'text_shadow', 'text16'])
				.innerHTML = 'Amount: ' + value + victoryCardString;			
			//tempEl.innerHTML = value + ' ' + key;
			console.log(value + ' ' + key);
		});
		console.log('--------------------------');
	}
}