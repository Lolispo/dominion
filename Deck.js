// Author Petter Andersson
'use strict'

function DeckOfCards(playerIndex){
	this.playerIndex = playerIndex;
	this.deckStack = [];
	this.discard = [];
	this.board = [];
	this.phase = 2;				// 0 = action, 1 = buy, 2 = done, reset hand
	this.hand = new Hand(this);

	this.updateDeckLength = function(){
		document.getElementById('deck_' + this.playerIndex).innerHTML = 'Deck: ' + this.deckStack.length + ' cards';
	}

	this.updateDiscardLength = function(){
		document.getElementById('discard_' + this.playerIndex).innerHTML = 'Discard: ' + this.discard.length + ' cards';
	}

	this.updateMoney = function(value = this.money){
		this.money = value;
		document.getElementById('money_' + this.playerIndex).innerHTML = 'Money: ' + this.money;
	}

	this.updateActionsLeft = function(value = this.actionsLeft){
		this.actionsLeft = value;
		document.getElementById('actionsLeft_' + this.playerIndex).innerHTML = 'Actions Left: ' + this.actionsLeft;
	}

	this.updateBuysLeft = function(value = this.buysLeft){
		this.buysLeft = value;
		document.getElementById('buysLeft_' + this.playerIndex).innerHTML = 'Buys Left: ' + this.buysLeft;
	}

	this.updateDeckLength();
	this.updateDiscardLength();
	this.updateActionsLeft(1);
	this.updateBuysLeft(1);
	this.updateMoney(0);	

	this.updateHTMLElements = function(){
		this.updateDeckLength();
		this.updateDiscardLength();
		this.updateMoney();
		this.updateActionsLeft();
		this.updateBuysLeft();
	}

	this.startTurn = function(){
		this.phase = 0;
		removeCSSClassID('board_' + this.playerIndex, 'invis');
		removeCSSClassID('info_' + this.playerIndex, 'invis');
		removeCSSClassID('text_' + this.playerIndex, 'invis');
		removeCSSClassID('actionsLeft_' + this.playerIndex, 'invis');
		
		createButton('-> Go To Buy Phase', 'interact_' + this.playerIndex, 'skipButton', (function(){
			this.checkIfPhaseDone(true); // Go to next stage
		}).bind(this), 'skipButtonCss');
	}

	// Start Deck
	this.initDeck = function(){
		addCSSClassID('board_' + this.playerIndex, 'invis');
		addCSSClassID('info_' + this.playerIndex, 'invis');
		addCSSClassID('text_' + this.playerIndex, 'invis');

		for(var i = 0; i < 7; i++){
			this.discard.push(generateNewCard(cards_global.get('Copper')));
		}
		for(var i = 0; i < 3; i++){
			this.discard.push(generateNewCard(cards_global.get('Estate')));
		}
		// Test action cards
		//this.discard.push(generateNewCard(cards_global.get('Laboratory')));
		if(this.discard.length !== 10){
			console.warn('Wrong size of ' + this.discard.length + ' on ' + this.discard);
		}
		//console.log('DEBUG: Start Deck: ', this.discard);
	}

	this.getPhase = function(){
		return this.phase;
	}

	this.displayEntireHand = function(){
		var handElement = document.getElementById('hand_' + this.playerIndex);
		for(var i = 0; i < handElement.childNodes.length; i++){
			removeCSSClassEl(handElement.childNodes[i], ['card_smaller', 'inactive']);
			addCSSClassEl(handElement.childNodes[i], 'card');
		}		
	}

	this.displayCard = function(id){
		removeCSSClassID(id, ['card_smaller', 'inactive']);
		addCSSClassID(id, 'card');
	}

	this.drawCard = function(){
		//console.log(this.deckStack, this.discard); // Debug me
		if(this.deckStack.length === 0){
			this.deckStack = this.discard;
			this.discard = [];
			shuffle(this.deckStack);
			updateTextPrint(this.playerIndex, 'Shuffled Deck! (' + this.deckStack.length + ' cards)');
		}
		if(this.deckStack.length > 0){ // No more cards available
			var tempCard = this.deckStack.pop(); // Read pop
			//console.log(this.deckStack, this.discard); // Debug me
			var handAmount = this.hand.newCard(tempCard);
			updateTextPrint(this.playerIndex, 'Draw a card! ' + tempCard.name + ' (Holding ' + handAmount + ')', false);
			this.generateCardHTML(tempCard); // Generate Card HTML
			this.updateHTMLElements();
			return 'card_' + tempCard.id;
		} else {
			updateTextPrint(this.playerIndex, 'Out of cards!'); // TODO: Check game functionality here, assume just get no more card
		}
	}

	// Generate HTML for Card
	this.generateCardHTML = function(tempCard){
		var properties = new Map();
		properties.set('id', 'card_' + tempCard.id);
		properties.set('src', getCorrectImage(tempCard));
		var el = initNewUIElement('img', properties, 'hand_' + this.playerIndex, ['card_smaller', 'inactive', getCssClassCard(tempCard)]);
		
		el.addEventListener('click', function(res){
			var card_HTMLid = res.srcElement.id;
			var tempEl = document.getElementById(card_HTMLid);
			var playerID = getIDFromCard(tempEl.parentElement.id);
			var card_id = getIDFromCard(card_HTMLid);
			if(isTurn(playerID)) {
				var card = players[turn].cards.hand.getCard(card_id);
				console.log(players[turn].cards.hand);
				console.log(players[turn].cards.hand.getCard(card_id));
				if(card.cardType === CardType.ACTION_CARD){
					// Add use card button
					updateTextPrint(players[turn].index, 'Selected Action Card!');
					createButton(card.name + '\nUse?', 'interact_' + players[turn].index, 'playActionID', (function(){
						updateTextPrint(players[turn].index, 'Played Action Card ' + card.name + '!');
						players[turn].playActionCard(card);
					}).bind(this), 'skipButtonCss');					
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

		removeChildren('board_'+this.playerIndex);
		this.board = [];

		addCSSClassID('board_' + this.playerIndex, 'invis');
		addCSSClassID('info_' + this.playerIndex, 'invis');
		addCSSClassID('text_' + this.playerIndex, 'invis');
		removeChildren('board_' + this.playerIndex);
		removeChildren('hand_' + this.playerIndex);
		removeChildren('interact_' + this.playerIndex);
	}

	this.checkIfPhaseDone = function(nextStage){ // Boolean to see if next stage
		if(this.phase === 0){
			if(nextStage || this.actionsLeft === 0 || !this.hand.containsAction()){
				this.phase++;
				addCSSClassID('actionsLeft_' + this.playerIndex, 'invis')
				updateTextPrint(this.playerIndex, 'Starting Buying Phase');
				changeButtonText('skipButton', '-> End Turn');
			}
		} else if(this.phase === 1){
			if(nextStage || this.buysLeft === 0 || this.money === 0){
				this.phase++;
				updateTextPrint(this.playerIndex, 'Ending Turn (Money: ' + this.money + ', BuysLeft: ' + this.buysLeft + ', ActionsLeft: ' + this.actionsLeft + ')');
				deleteButton('skipButton', 'interact_' + this.playerIndex);
				this.discardHand();
				getPlayer(this.playerIndex).drawHand();
				changeTurn();
			}			
		}
	}

	this.useCard = function(cardParam){
		if(this.actionsLeft - 1 >= 0){
			this.actionsLeft--;
			var card = this.hand.useCard(cardParam);

			var actions = card.getValue();
			updateTextPrint(this.playerIndex, 'Using Card ' + card.name + '!');
			if(actions.drawCards !== 0){
				for(var i = 0; i < actions.drawCards; i++){
					var html_id = this.drawCard();
					this.displayCard(html_id);
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
			this.updateHTMLElements();
			this.checkIfPhaseDone(false); // Make sure this runs AFTER actionsLeft += line above

			this.board.push(card);			
			var properties = new Map();
			properties.set('id', 'board_' + card.id);
			properties.set('src', getCorrectImage(card));
			var el = initNewUIElement('img', properties, 'board_' + this.playerIndex, ['card_board', getCssClassCard(card)]);
		
			// Remove Use action button
			deleteButton('playActionID', 'interact_' + this.playerIndex);
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

	this.containsAction = function(){
		if(this.action.length > 0){
			return true;
		}
		return false;
	}

	this.newCard = function(card){
		this.amount++;
		this.allCards[card.id] = card;
		if(card.cardType === CardType.TREASURE_CARD){
			this.treasure.push(card);
			this.deckOfCards.money += card.getValue();
			updateTextPrint(this.deckOfCards.playerIndex, 'Money Update! ( + ' + card.getValue() + ')');
		} else if(card.cardType === CardType.VICTORY_CARD){
			this.victory.push(card);
		} else if(card.cardType === CardType.ACTION_CARD){
			this.action.push(card);
		}
		return this.amount; // Return can be used for 'Draw until certain amount'
	}

	this.useCard = function(card){
		for(var i = 0; i < this.action.length; i++){
			if(card.id === this.action[i].id){
				var tempCard = this.action.splice(i, 1)[0];
				this.allCards.splice(card.id, 1);
				var handEl = document.getElementById('hand_' + this.deckOfCards.playerIndex);
				var el = document.getElementById('card_' + card.id);
				console.log(handEl);
				console.log(el);
				handEl.removeChild(el);
				return tempCard;
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