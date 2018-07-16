// Author Petter Andersson
'use strict'

var minPlayers = 2;
var maxPlayers = 4;
var playingPlayers = minPlayers;

var players = [];

function main(){
	console.log('Hello');
	initCards();
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

function initCards(){
	// Init Card types to choose card types here

}

function updatePlayers(){
	document.getElementById('playersPlayingID').innerHTML = 'Players playing: ' + playingPlayers;
}

function changePage(){
	sessionStorage.playersPlaying = playingPlayers;
	location.replace('game.html');
}




