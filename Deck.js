// Author Petter Andersson
'use strict'

function DeckOfCards(playerIndex){
	this.playerIndex = playerIndex;
	this.deckStack = [];
	this.discard = [];
	this.board = [];
	this.phase = 2;				// 0 = action, 1 = buy, 2 = done, reset hand
	this.hand = new Hand(this);

	this.updateMoney = function(value = this.money){
		this.money = value;
		document.getElementById('money' + this.playerIndex).innerHTML = 'Money: ' + this.money;
	}

	this.updateActionsLeft = function(value = this.actionsLeft){
		this.actionsLeft = value;
		document.getElementById('actionsLeft' + this.playerIndex).innerHTML = 'Actions Left: ' + this.actionsLeft;
	}

	this.updateBuysLeft = function(value = this.buysLeft){
		this.buysLeft = value;
		document.getElementById('buysLeft' + this.playerIndex).innerHTML = 'Buys Left: ' + this.buysLeft;
	}

	this.updateActionsLeft(1);
	this.updateBuysLeft(1);
	this.updateMoney(0);	

	this.updateHTMLElements = function(){
		this.updateMoney();
		this.updateActionsLeft();
		this.updateBuysLeft();
	}

	this.startTurn = function(){
		this.phase = 0;
		removeCSSClassID('board' + this.playerIndex, 'invis');
		removeCSSClassID('info' + this.playerIndex, 'invis');
		removeCSSClassID('text' + this.playerIndex, 'invis');

		createButton('-> Go To Buy Phase', 'hand' + this.playerIndex, 'skipButton', (function(){
			this.checkIfPhaseDone(true); // Go to next stage
		}).bind(this), 'skipButtonCss');
	}

	this.initDeck = function(){
		addCSSClassID('board' + this.playerIndex, 'invis');
		addCSSClassID('info' + this.playerIndex, 'invis');
		addCSSClassID('text' + this.playerIndex, 'invis');

		for(var i = 0; i < 7; i++){
			this.discard.push(generateNewCard(cards_global.get('Copper')));
		}
		for(var i = 0; i < 3; i++){
			this.discard.push(generateNewCard(cards_global.get('Estate')));
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
		//console.log(this.deckStack, this.discard); // Debug me
		if(this.deckStack.length === 0){
			this.deckStack = this.discard;
			this.discard = [];
			shuffle(this.deckStack);
			updateTextPrint(this.playerIndex, 'Shuffled Deck! (' + this.deckStack.length + ' cards)');
		}
		var tempCard = this.deckStack.pop(); // Read pop
		//console.log(this.deckStack, this.discard); // Debug me
		var handAmount = this.hand.newCard(tempCard);
		updateTextPrint(this.playerIndex, 'Draw a card! ' + tempCard.name + ' (Holding ' + handAmount + ')', false);
		this.generateCardHTML(tempCard); // Generate Card HTML
		this.updateHTMLElements();
	}

	// Generate HTML for Card
	this.generateCardHTML = function(tempCard){
		var properties = new Map();
		properties.set('id', 'card_' + tempCard.id);
		properties.set('src', getCorrectImage(tempCard));
		var el = initNewUIElement('img', properties, 'hand' + this.playerIndex, ['card_smaller', getCssClassCard(tempCard)]);
		
		el.addEventListener('click', function(res){
			var card_id = res.srcElement.id;
			var tempEl = document.getElementById(card_id); // This wont work? TODO Check
			if(isTurn(getPlayerFromCard(card_id))) {
				var card = this.hand.getCard(card_id);
				if(card.cardType === CardType.ACTION_CARD){
					// Add use card button
					updateTextPrint(this.playerIndex, 'Selected Action Card!');
					createButton(card.name + '\nUse?', 'hand' + this.playerIndex, 'playActionID', (function(){
						updateTextPrint(this.playerIndex, 'Played Action Card ' + card.name + '!');
						this.playActionCard(card);
					}).bind(this));					
				}
			}
		});
	}

	this.discardHand = function(){
		var discardedCards = this.hand.discardedHand();
		updateTextPrint(this.playerIndex, 'Discarding hand!');
		this.discard = this.discard.concat(discardedCards);				
		this.cleanUp();
	}

	// Cleanup phase
	this.cleanUp = function(){
		this.updateMoney(0);	
		this.updateActionsLeft(1);
		this.updateBuysLeft(1);

		removeChildren('board'+this.playerIndex);
		this.board = [];
		
		addCSSClassID('board' + this.playerIndex, 'invis');
		addCSSClassID('info' + this.playerIndex, 'invis');
		addCSSClassID('text' + this.playerIndex, 'invis');
		removeChildren('board' + this.playerIndex);
		removeChildren('hand' + this.playerIndex);
	}

	this.checkIfPhaseDone = function(nextStage){ // Boolean to see if next stage
		if(this.phase === 0){
			if(nextStage || this.actionsLeft === 0){
				this.phase++;
				updateTextPrint(this.playerIndex, 'Starting Buying Phase');
				changeButtonText('skipButton', '-> End Turn');
			}
		} else if(this.phase === 1){
			if(nextStage || this.buysLeft === 0 || this.money === 0){
				this.phase++;
				updateTextPrint(this.playerIndex, 'Ending Turn (Money: ' + this.money + ', BuysLeft: ' + this.buysLeft + ', ActionsLeft: ' + this.actionsLeft + ')');
				deleteButton('skipButton', 'hand' + this.playerIndex);
				this.discardHand();
				getPlayer(this.playerIndex).drawHand();
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
				this.updateActionsLeft(this.actionsLeft + actions.moreActions);
			}
			if(actions.moreBuys !== 0){
				this.updateActionsLeft(this.buysLeft + actions.moreBuys);
			}
			if(actions.moreGold !== 0){
				this.updateMoney(this.money + actions.moreGold);
			}
			this.checkIfPhaseDone(moreActionCards); // Make sure this runs AFTER actionsLeft += line above

			board.push(card);
			var card_board = initNewUIElement('div', new Map().set('id', 'board_' + card.id), 'board' + this.playerIndex);
			card_board.innerHTML = card.name; // TODO: Update showing the card instead
		}
	}
}

function Hand(deckOfCards){
	this.amount = 0;
	this.allCards = []; // Array mapping Card.id -> Card
	this.treasure = [];
	this.victory = [];
	this.action = [];
	this.deckOfCards = deckOfCards;

	this.getCard = function(id){
		return this.allCards[id];
	}

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
		this.allCards[card.id] = card;
		if(card.cardType === CardType.TREASURE_CARD){
			this.treasure.push(card);
			this.deckOfCards.money += card.getValue();
			console.log('DEBUG money update: ' + this.deckOfCards.money + ', ' + card.getValue());
		} else if(card.cardType === CardType.VICTORY_CARD){
			this.victory.push(card);
		} else if(card.cardType === CardType.ACTION_CARD){
			this.action.push(card);
		}
		return this.amount; // Return can be used for 'Draw until certain amount'
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

	this.getHand = function(){ 
		var listOfCards = this.action.concat(this.treasure).concat(this.victory);
		return listOfCards;
	}

	this.discardedHand = function(){
		var listOfCards = this.getHand();
		this.treasure = [];
		this.victory = [];
		this.action = [];
		this.amount = 0;
		return listOfCards;
	}
}