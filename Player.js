// Author Petter Andersson
'use strict'

var cardHandAmount = 5;

function Player(index){
	this.index = index;

	this.startTurn = function(){
		//console.log('DEBUG: Starting turn for Player ' + (this.index + 1));
		this.cards.startTurn();
		this.displayHand();
	}

	this.drawHand = function(){
		if(this.cards.getPhase() === 2){
			for(var i = 0; i < cardHandAmount; i++){
				this.cards.drawCard();
			}
		}
	}

	this.displayHand = function(){
		//var hand = this.cards.hand.getHand();
		// TODO: Add some sorting to this area for each section, treasure cards sorted by rarity etc
		updateTextPrint(this.index, 'Your turn Player ' + (this.index + 1) + '!');
		var handElement = document.getElementById('hand' + this.index);
		for(var i = 0; i < handElement.childNodes.length; i++){
			removeCSSClassEl(handElement.childNodes[i], 'card_smaller');
			addCSSClassEl(handElement.childNodes[i], 'card');
		}
	}

	this.playActionCard = function(card){
		if(this.cards.getPhase() === 0){
			this.cards.useCard(card);
		}
	}

	this.buyCard = function(){
		if(this.cards.getPhase() === 1){
			var card = generateNewCard(cards_global.get('Copper'));
			// Choose card, generate a list of all available cards or something
			// 3 lists, one for every type

			// Check if you can afford card
			if(this.cards.money >= card.cost){
				// Confirm purchase
				createButton('Confirm Purchase for :\n' + card.name, 'hand' + this.playerIndex, 'confirmPurchase', (function(){
					// Update money
					this.cards.money -= card.cost;
					this.cards.checkIfPhaseDone(false);
					// Add new card to discard pile
					this.cards.discard.push(card);
					updateTextPrint(this.playerIndex, 'Added card to deck: ' + card.name + 
						'! (' + (this.cards.money + card.cost) + ' - ' + card.cost + ' = ' + this.cards.money + ')');
					deleteButton('confirmPurchase', 'hand' + this.playerIndex);
					deleteButton('cancelPurchase', 'hand' + this.playerIndex);
				}).bind(this));
				createButton('Cancel Purchase', 'hand' + this.playerIndex, 'cancelPurchase', (function(){
					deleteButton('confirmPurchase', 'hand' + this.playerIndex);
					deleteButton('cancelPurchase', 'hand' + this.playerIndex);
				}).bind(this));
			}
		}
	}

	this.initPlayer = function(){
		// Init HTML Elements
		initNewUIElement('div', new Map().set('id', 'player' + this.index), 'playArea', 'margin_bottom');

		initNewUIElement('div', new Map().set('id', 'text' + this.index), 'player' + this.index);
		initNewUIElement('div', new Map().set('id', 'text' + this.index + '_1'), 'text' + this.index, 'bold')
			.innerHTML = 'Player ' + (this.index + 1) + ' fst text\n';
		initNewUIElement('div', new Map().set('id', 'text' + this.index + '_2'), 'text' + this.index)
			.innerHTML = 'Player ' + (this.index + 1) + ' snd text\n';
		initNewUIElement('div', new Map().set('id', 'text' + this.index + '_3'), 'text' + this.index, 'third-message')
			.innerHTML = 'Player ' + (this.index + 1) + ' thr text\n';

		initNewUIElement('div', new Map().set('id', 'board' + this.index), 'player' + this.index);
		initNewUIElement('div', new Map().set('id', 'hand' + this.index), 'player' + this.index, 'hand');
		initNewUIElement('div', new Map().set('id', 'info' + this.index), 'player' + this.index);
		initNewUIElement('div', new Map().set('id', 'money' + this.index), 'info' + this.index);
		initNewUIElement('div', new Map().set('id', 'buysLeft' + this.index), 'info' + this.index);
		initNewUIElement('div', new Map().set('id', 'actionsLeft' + this.index), 'info' + this.index);
		// Init Deck of Cards
		this.cards = new DeckOfCards(index);
		this.cards.initDeck();
		console.log('Player ' + (this.index + 1) + ' created');
	}
}