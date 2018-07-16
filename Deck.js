// Author Petter Andersson
'use strict'

function DeckOfCards(playerIndex){
	this.playerIndex = playerIndex;
	this.deckStack = [];
	this.discard = [];
	this.board = [];
	this.actionsLeft = 1;
	this.buysLeft = 1;
	this.money = 0;	
	this.phase = 2;				// 0 = action, 1 = buy, 2 = done, reset hand
	this.hand = new Hand(this);

	this.startTurn = function(){
		this.phase = 0;
		this.money = 0;
		this.actionsLeft = 1;
		this.buysLeft = 1;
		createButton("-> Go To Buy Phase", "hand" + this.playerIndex, 'skipButton', (function(){
			this.checkIfPhaseDone(true); // Go to next stage
		}).bind(this));
	}

	this.drawHand = function(){
		if(this.phase === 2){
			for(var i = 0; i < cardHandAmount; i++){
				this.drawCard();
			}		
		}
	}

	this.initDeck = function(){
		for(var i = 0; i < 7; i++){
			this.discard.push(Cards.get("Copper"));
		}
		for(var i = 0; i < 3; i++){
			this.discard.push(Cards.get("Estate"));
		}
		if(this.discard.length !== 10){
			throw 'Wrong size of ' + this.discard.length + ' on ' + this.discard;
		}
		//console.log('DEBUG: Start Deck: ', this.discard);
	}

	this.getPhase = function(){
		return this.phase;
	}

	this.drawCard = function(){
		if(this.deckStack.length === 0){
			this.deckStack = this.discard;
			this.discard = [];
			shuffle(this.deckStack);
		}
		var tempCard = this.deckStack.pop(); // Read pop
		updateTextPrint(this.playerIndex, 'Draw a card! ' + tempCard.name);
		var handAmount = this.hand.newCard(tempCard);
	}

	this.discardHand = function(){
		updateTextPrint(this.playerIndex, 'Discarding hand!');
		this.discard.concat(this.hand.discardedHand());
		var el = document.getElementById("board" + this.playerIndex);
		for(var i = 0; i < el.childNodes.length; i++){
			el.removeChild(el.childNodes[i]);
		}
		el = document.getElementById("hand" + this.playerIndex);
		for(var i = 0; i < el.childNodes.length; i++){
			el.removeChild(el.childNodes[i]);
		}
	}

	this.checkIfPhaseDone = function(nextStage){ // Boolean to see if next stage
		if(this.phase === 0){
			if(nextStage || this.actionsLeft === 0){
				this.phase++;
				updateTextPrint(this.playerIndex, 'Starting Buying Phase');
				changeButtonText("skipButton", "-> End Turn");
			}
		} else if(this.phase === 1){
			if(nextStage || this.buysLeft === 0 || this.money === 0){
				this.phase++;
				updateTextPrint(this.playerIndex, 'Ending Turn - Discarding hand and drawing new, money: ' + this.money + ', buysLeft: ' + this.buysLeft);
				this.discardHand();
				this.drawHand();
				deleteButton("skipButton", "hand" + this.playerIndex);
				changeTurn();
			}			
		}
	}

	this.useCard = function(Card){
		if(actionsLeft - 1 >= 0){
			var obj = this.hand.useCard(Card);
			var card = obj.card;
			var moreActionCards = obj.moreActionCards; // boolean if there are any action cards left on hand
			
			var actions = card.getValue();
			updateTextPrint(this.playerIndex, 'Using Card ' + card.name + '!');
			if(actions.drawCards !== 0){
				for(var i = 0; i < actions.drawCards; i++){
					this.drawCard();
				}
			}
			if(actions.moreActions !== 0){
				this.actionsLeft += actions.moreActions;
			}
			if(actions.moreBuys !== 0){
				this.buysLeft += actions.moreBuys;
			}
			if(actions.moreGold !== 0){
				this.money += actions.moreGold;
			}
			this.checkIfPhaseDone(moreActionCards); // Make sure this runs AFTER actionsLeft += line above

			board.push(card);
			var el = document.getElementById("board" + this.playerIndex); // TODO Update
			var text = document.createElement('div');
			text.innerHTML = card.name;
			el.appendChild(text);

			/*
				if (list.hasChildNodes()) {
				    list.removeChild(list.childNodes[0]);
				}
			*/			
		}
	}
}

function Hand(deckOfCards){
	this.amount = 0;
	this.treasure = [];
	this.victory = [];
	this.action = [];
	this.deckOfCards = deckOfCards;

	this.getAmount = function(){
		return this.amount;
	}

	this.getTreasure = function(){
		return this.treasure;
	}

	this.getVictory = function(){
		return this.victory;
	}

	this.getAction = function(){
		return this.action;
	}

	this.newCard = function(card){
		this.amount++;
		if(card.cardType === CardType.TREASURE_CARD){
			this.treasure.push(card);
			this.deckOfCards.money += card.getValue();
			console.log('DEBUG money update: ' + this.deckOfCards.money + ', ' + card.getValue());
		} else if(card.cardType === CardType.VICTORY_CARD){
			this.victory.push(card);
		} else if(card.cardType === CardType.ACTION_CARD){
			this.action.push(card);
		}
		return this.amount; // Return can be used for "Draw until certain amount"
	}

	this.useCard = function(card){
		for(var i = 0; i < action.length; i++){
			if(card.name === action[i].name){
				var tempCard = action.splice(i, 1);
				var moreActionCards = true;
				if(this.action.length === 0){
					moreActionCards = false;
				}
				return {card: tempCard, moreActionCards: moreActionCards};
			}
		}
	}

	this.getHand = function(){ // TODO: Add some sorting to this area for each section, treasure cards sorted by rarity
		var listOfCards = this.action.concat(this.treasure).concat(this.victory);
		updateTextPrint(this.deckOfCards.playerIndex, 'Hand contains ' + listOfCards.length + ' cards for Player ' + this.deckOfCards.playerIndex);
		return listOfCards;
	}

	this.discardedHand = function(){
		var listOfCards = this.getHand();
		this.treasure = [];
		this.victory = [];
		this.action = [];
		return listOfCards;
	}
}