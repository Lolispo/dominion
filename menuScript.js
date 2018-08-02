// Author Petter Andersson
'use strict'

var minPlayers = 2;
var maxPlayers = 4;
var playingPlayers = minPlayers;

var players = [];

function main(){
	console.log('Welcome to Dominion!');
	initCardsPrep();
	updatePlayers();
	showHelpMessages();
	document.getElementById('players-').addEventListener('click', function(){
		if(playingPlayers - 1 >= minPlayers){
			playingPlayers--;
			updatePlayers();			
		}
	});
	document.getElementById('players+').addEventListener('click', function(){
		if(playingPlayers + 1 <= maxPlayers){
			playingPlayers++;
			updatePlayers();
		}
	});
};

function initCardsPrep(){
	// Init Card types to choose card types here
	initCards(); // Use these cards when choosing modes, which 10 actions cards to play with
}

function updatePlayers(){
	document.getElementById('playersPlayingID').innerHTML = 'Players playing: ' + playingPlayers;
}

function showHelpMessages(){
	var stringActions = getHelpString();
	var splitted = stringActions.split('\n');
	for(var i = 0; i < splitted.length; i++){
		var el = initNewUIElement('div', new Map().set('id', 'helpMessage_' + i), 'helpMessage', ['inline', 'bold', 'size2_text_medium', 'text_shadow']);
		el.innerHTML = splitted[i];
	}
}

function changePage(){
	sessionStorage.setItem('playersPlaying', playingPlayers);
	sessionStorage.setItem('Cards', JSON.stringify(cards_global));
	sessionStorage.setItem('Cards_id', JSON.stringify(cards_global_id));
	/*sessionStorage.setItem('Cards_Treasure', JSON.stringify(cards_treasure));
	sessionStorage.setItem('Cards_Action', JSON.stringify(cards_action));
	sessionStorage.setItem('Cards_Victory', JSON.stringify(cards_victory));
	*/
	location.replace('game.html');
}




