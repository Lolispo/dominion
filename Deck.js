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
		document.getElementById(id_deck + this.playerIndex).innerHTML = 'Deck: ' + this.deckStack.length + ' cards';
	}

	this.updateDiscardLength = function(){
		document.getElementById(id_discard + this.playerIndex).innerHTML = 'Discard: ' + this.discard.length + ' cards';
	}

	this.updateMoney = function(value = this.money){
		if(value !== this.money){
			updateTextPrint(this.playerIndex, '+1 Money!', false);
		}
		this.money = value;
		document.getElementById(id_money + this.playerIndex).innerHTML = 'Money: ' + this.money;
	}

	this.updateActionsLeft = function(value = this.actionsLeft){
		if(value !== this.actionsLeft){
			updateTextPrint(this.playerIndex, '+1 Action!', false);
		}
		this.actionsLeft = value;
		document.getElementById(id_actionsLeft + this.playerIndex).innerHTML = 'Actions Left: ' + this.actionsLeft;
	}

	this.updateBuysLeft = function(value = this.buysLeft){
		if(value !== this.buysLeft){
			updateTextPrint(this.playerIndex, '+1 Buy!', false);
		}
		this.buysLeft = value;
		document.getElementById(id_buysLeft + this.playerIndex).innerHTML = 'Buys Left: ' + this.buysLeft;
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
		modifyCSSID('remove', id_board + this.playerIndex, 'invis');
		modifyCSSID('remove', id_info + this.playerIndex, 'invis');
		modifyCSSID('remove', id_text + this.playerIndex, 'invis');
		modifyCSSID('remove', id_actionsLeft + this.playerIndex, 'invis');

		createButton(id_phase0, id_interact + this.playerIndex, 'skipButton', (function(){
			this.checkIfPhaseDone(true); // Go to next stage
		}).bind(this), 'interactButton');
	}

	// Start Deck
	this.initDeck = function(){
		modifyCSSID('add', id_board + this.playerIndex, 'invis');
		modifyCSSID('add', id_info + this.playerIndex, 'invis');
		modifyCSSID('add', id_text + this.playerIndex, 'invis');

		for(var i = 0; i < 7; i++){
			this.discard.push(generateNewCard(cards_global.get('Copper')));
		}
		for(var i = 0; i < 3; i++){
			this.discard.push(generateNewCard(cards_global.get('Estate')));
		}
		// Test action cards
		//this.discard.push(generateNewCard(cards_global.get('Laboratory')));
		if(this.discard.length !== 10){
			console.warn('Wrong size of ' + this.discard.length);
		}
	}

	this.getPhase = function(){
		return this.phase;
	}

	this.displayEntireHand = function(){
		var handElement = document.getElementById('hand_' + this.playerIndex);
		for(var i = 0; i < handElement.childNodes.length; i++){
			modifyCSSEl('remove', handElement.childNodes[i], ['card_smaller', 'inactive']);
			modifyCSSEl('add', handElement.childNodes[i], 'card');
		}		
	}

	this.displayCard = function(id){
		modifyCSSID('remove', id, ['card_smaller', 'inactive']);
		modifyCSSID('add', id, 'card');
	}

	this.drawCard = function(){
		if(this.deckStack.length === 0){
			this.deckStack = this.discard;
			this.discard = [];
			shuffle(this.deckStack);
			updateTextPrint(this.playerIndex, 'Shuffled Deck! (' + this.deckStack.length + ' cards)');
		}
		if(this.deckStack.length > 0){ // No more cards available
			var tempCard = this.deckStack.pop(); // Read pop
			var handAmount = this.hand.newCard(tempCard);
			updateTextPrint(this.playerIndex, 'Draw a card! ' + tempCard.name + ' (Holding ' + handAmount + ')', false);
			this.generateCardHTML(tempCard, true); // Generate Card HTML
			this.updateHTMLElements();
			return id_card + tempCard.id;
		} else {
			updateTextPrint(this.playerIndex, 'Out of cards!'); // TODO: Check game functionality here, assume just get no more card
		}
	}

	// Generate HTML for Card
	this.generateCardHTML = function(tempCard, handCard){
		var properties = new Map();
		properties.set('id', id_card + tempCard.id);
		properties.set('src', getCorrectImage(tempCard));
		var el = initNewUIElement('div', new Map().set('id', id_card + tempCard.id), id_hand + this.playerIndex, getCssClassCard(tempCard));
		initNewUIElement('div', new Map().set('id', 'value_' + id_card + tempCard.id), id_card + tempCard.id).innerHTML = tempCard.getValue();
		initNewUIElement('div', new Map().set('id', 'cost_' + id_card + tempCard.id), id_card + tempCard.id).innerHTML = tempCard.getCost();
		initNewUIElement('div', new Map().set('id', 'desc_' + id_card + tempCard.id), id_card + tempCard.id).innerHTML = 'Default String';
		//var el = initNewUIElement('img', properties, id_hand + this.playerIndex, ['card_smaller', 'inactive', getCssClassCard(tempCard)]);
		if(handCard){
			el.addEventListener('click', function(res){
				var card_HTMLid = res.srcElement.id;
				var tempEl = document.getElementById(card_HTMLid);
				var playerID = getIDFromCard(tempEl.parentElement.id);
				var card_id = getIDFromCard(card_HTMLid);
				if(isTurn(playerID)) {
					var card = players[turn].cards.hand.getCard(card_id);
					console.log(players[turn].cards.hand);
					console.log(card_id);
					console.log(players[turn].cards.hand.getCard(card_id)); // TODO Fix Undefined
					if(card.cardType === CardType.ACTION_CARD){
						// Add use card button
						updateTextPrint(players[turn].index, 'Selected Action Card!');
						createButton(card.name + '\nUse?', id_interact + players[turn].index, 'playActionID', (function(){
							updateTextPrint(players[turn].index, 'Played Action Card ' + card.name + '!');
							players[turn].playActionCard(card);
						}).bind(this), 'interactButton');					
					}
				}
			});			
		}
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

		removeChildren(id_board + this.playerIndex);
		this.board = [];

		modifyCSSID('add', id_board + this.playerIndex, 'invis');
		modifyCSSID('add', id_info + this.playerIndex, 'invis');
		modifyCSSID('add', id_text + this.playerIndex, 'invis');
		removeChildren(id_board + this.playerIndex);
		removeChildren(id_hand + this.playerIndex);
		removeChildren(id_interact + this.playerIndex);
	}

	this.checkIfPhaseDone = function(nextStage){ // Boolean to see if next stage
		if(this.phase === 0){
			if(nextStage || this.actionsLeft === 0 || !this.hand.containsAction()){
				this.phase++;
				modifyCSSID('add', id_actionsLeft + this.playerIndex, 'invis')
				updateTextPrint(this.playerIndex, 'Starting Buying Phase');
				changeText('skipButton', id_phase1);
			}
		} else if(this.phase === 1){
			if(nextStage || this.buysLeft === 0 || this.money === 0){
				this.phase++;
				updateTextPrint(this.playerIndex, 'Ending Turn (Money: ' + this.money + ', BuysLeft: ' + this.buysLeft + ', ActionsLeft: ' + this.actionsLeft + ')');
				deleteButton('interactButton', id_interact + this.playerIndex);
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
				this.updateBuysLeft(this.buysLeft + actions.moreBuys);
			}
			if(actions.moreGold !== 0){
				this.updateMoney(this.money + actions.moreGold);
			}
			this.updateHTMLElements();
			this.checkIfPhaseDone(false); // Make sure this runs AFTER actionsLeft += line above

			this.board.push(card);
			
			// TODO: Use function
			//this.generateCardHTML(card, false);
			
			var properties = new Map();
			properties.set('id', id_board + card.id);
			properties.set('src', getCorrectImage(card));
			var el = initNewUIElement('img', properties, id_board + this.playerIndex, ['card_board', getCssClassCard(card)]);
			
			// Remove Use action button
			deleteButton('playActionID', id_interact + this.playerIndex);
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
			//updateTextPrint(this.deckOfCards.playerIndex, 'Money Update! ( + ' + card.getValue() + ')');
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
				var handEl = document.getElementById(id_hand + this.deckOfCards.playerIndex);
				var el = document.getElementById(id_card + card.id);
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