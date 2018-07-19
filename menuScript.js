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

function changePage(){
	sessionStorage.setItem('playersPlaying', playingPlayers);
	sessionStorage.setItem('Cards', JSON.stringify(Cards));
	sessionStorage.setItem('Cards_Treasure', JSON.stringify(Cards_Treasure));
	sessionStorage.setItem('Cards_Action', JSON.stringify(Cards_Action));
	sessionStorage.setItem('Cards_Victory', JSON.stringify(Cards_Victory));
	location.replace('game.html');
}




