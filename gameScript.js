// Author Petter Andersson
'use strict'

var playingPlayers;

var players = [];
var turn = 0;
var gameCounter = 0;
var gameEnded = false;

// Open tasks / roadmap now live in docs/superpowers/RESUME.md (kept out of source).

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
	initCardTooltip();
	initTopbarHeightVar();
	for(var i = 0; i < playingPlayers; i++){
		var tempPlayer = new Player(i);
		tempPlayer.initPlayer();
		players.push(tempPlayer);
		players[i].drawHand(true); // silent: the starting player's hand deals in at startTurn
	}

	// Choosing turn and start
	turn = Math.floor(Math.random() * playingPlayers);
	initNewUIElement('div', new Map().set('id', 'turn'), 'info', ['inline']);
	initNewUIElement('div', new Map().set('id', 'turn_box'), 'turn', ['inline', 'bold', 'size3_text_medium', 'text_shadow', 'turn-box']);
	initNewUIElement('div', new Map().set('id', 'helpDiv'), 'info', ['inline']);
	initNewUIElement('audio', new Map().set('id', 'audioMain').set('src', 'res/villageMusicShort.mp3').set('loop', ''), //.set('controls', '')
		'helpDiv', ['inline', 'margin_top_10']).innerHTML = 'Your browser does not support the audio element';
	// TODO: Move the strings to vars
	createButton(MUSIC_STRING_PLAY, 'audioButton', 'helpDiv', togglePlay, ['normalButton', 'margin_left_10', 'margin_top_2']);
	createButton('Sound: On', 'sfxButton', 'helpDiv', (function(){
		if(typeof sfxSetMuted === 'function'){
			sfxSetMuted(!sfxMuted());
			changeText('sfxButton', 'Sound: ' + (sfxMuted() ? 'Off' : 'On'));
		}
	}), ['normalButton', 'margin_left_10', 'margin_top_2']);
	// Toggle whether opponents' hands show face-up (default) or as card backs
	createButton('Rivals: Face-up', 'oppFaceButton', 'helpDiv', (function(){
		var down = document.body.classList.toggle('opp-facedown');
		changeText('oppFaceButton', 'Rivals: ' + (down ? 'Face-down' : 'Face-up'));
	}), ['normalButton', 'margin_left_10', 'margin_top_2']);
	createButton(HELP_MESSAGE_OPEN, 'helpButton', 'helpDiv', (function(){
		var currentName = document.getElementById('helpButton').innerHTML;
		if(currentName === HELP_MESSAGE_OPEN){
			changeText('helpButton', HELP_MESSAGE_CLOSE);
		} else{
			changeText('helpButton', HELP_MESSAGE_OPEN)
		}
		modifyCSSID('toggle', 'helpMessage', 'invis');
	}), ['normalButton', 'margin_left_10', 'margin_top_2']);
	initNewUIElement('div', new Map().set('id', 'helpMessage'), 'helpDiv', ['flex_container', 'invis']);
	var stringActions = getHelpString();
	var splitted = stringActions.split('\n');
	for(var i = 0; i < splitted.length; i++){
		var el = initNewUIElement('div', new Map().set('id', 'helpMessage_' + i), 'helpMessage', ['inline', 'bold', 'size2_text_medium', 'text_shadow']);
		el.innerHTML = splitted[i];
	}
	activatePlayer();
}

// Highlight the current player (turn label colour + active/opponent classes) and start their turn.
// Shared by startGame and changeTurn so the role-swap logic lives in one place.
function activatePlayer(){
	changeText('turn_box', players[turn].name + ":s turn");
	document.getElementById('turn_box').style.setProperty('--player-color', getPlayerColor(turn));
	for(var i = 0; i < players.length; i++){
		document.getElementById(id_player + i).style.order = 1;
		modifyCSSID('remove', id_player + i, 'player-active');
		modifyCSSID('add', id_player + i, 'opponent');
	}
	document.getElementById(id_player + turn).style.order = 2;
	modifyCSSID('add', id_player + turn, 'player-active');
	modifyCSSID('remove', id_player + turn, 'opponent');
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
		changeText('audioButton', MUSIC_STRING_PAUSE); // ⏸
		modifyCSSID('add', 'helpDiv', 'margin_top_05');
		return myAudio.play();
	} else {
		changeText('audioButton', MUSIC_STRING_PLAY);
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
	activatePlayer();
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

// Per-player identity colour — used as an accent (border/glow), not a flat fill.
// Refined jewel tones that read on the dark forest backdrop and harmonise with
// the card type palette (treasure gold / victory green / action blue).
function getPlayerColor(index){
	switch(index){
		case 0:
			return '#e0a63c'  // amber
		case 1:
			return '#35b39a'  // teal
		case 2:
			return '#7d9ce6'  // periwinkle
		case 3:
			return '#dd7ba0'; // rose
		default:
			return '#9aa0a6'  // slate
	}
}

function getStringNotZero(money, buysLeft, actionsLeft){
	var s = '(';
	var added = false;
	if(money != 0){
		s += 'Money: ' + money;
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
	document.body.classList.add('game-over'); // relax the one-screen layout so results scroll
	for(var p = 0; p < players.length; p++){
		modifyCSSID('remove', id_player + p, 'opponent');
	}
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

	// TODO: Can add functionality to check for total cost of hand, in treasure, victory & actions cards etc
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
			renderCard(card, id_scoreScreen + id_card + card.id + i, id_scoreScreen + id_card + card.name + '_' + i, { size: 'discard' });
			initNewUIElement('div', new Map().set('id', id_scoreScreen + id_text + card.name + '_' + i + id_div), id_scoreScreen + id_card + card.name + '_' + i, 'endScreen_texts').style.order = 1;
			initNewUIElement('div', new Map().set('id', id_scoreScreen + id_text + i), id_scoreScreen + id_text + card.name + '_' + i + id_div, ['noclick', 'text_shadow', 'text16'])
				.innerHTML = 'Amount: ' + value + victoryCardString;			
			//tempEl.innerHTML = value + ' ' + key;
			console.log(value + ' ' + key);
		});
		console.log('--------------------------');
	}
}
