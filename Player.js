// Author Petter Andersson
'use strict'

var cardHandAmount = 5;

function Player(index){
	this.index = index;

	this.startTurn = function(){
		//console.log('DEBUG: Starting turn for Player ' + (this.index + 1));
		this.cards.startTurn();
		this.displayHand();
		this.cards.checkIfPhaseDone(false);
	}

	this.drawHand = function(){
		if(this.cards.getPhase() === 2){
			for(var i = 0; i < cardHandAmount; i++){
				this.cards.drawCard();
			}
		}
	}

	this.displayHand = function(){
		// TODO: Add some sorting to this area for each section, treasure cards sorted by rarity etc
		updateTextPrint(this.index, 'Your turn Player ' + (this.index + 1) + '!');
		this.cards.displayEntireHand();
	}

	this.playActionCard = function(card){
		console.log('DEBUG: @playActionCard ' + this.cards.getPhase() === 0 && isTurn(this.index));
		if(this.cards.getPhase() === 0 && isTurn(this.index)){
			this.cards.useCard(card);
		}
	}

	this.buyCard = function(card){
		if(this.cards.getPhase() === 1){
			// Check if you can afford card
			console.log('DEBUG: Buy? ' + this.cards.money + ', ' + card.cost);
			if(this.cards.money >= card.cost){
				// Confirm purchase
				createButton('Confirm Purchase:\n' + card.name, 'interact_' + this.index, 'confirmPurchase', (function(){
					// Update money
					this.cards.money -= card.cost;
					this.cards.buysLeft--;
					this.cards.checkIfPhaseDone(false);
					// Add new card to discard pile
					this.cards.discard.push(card);
					updateTextPrint(this.index, 'Added card to deck: ' + card.name + 
						'! (' + (this.cards.money + card.cost) + ' - ' + card.cost + ' = ' + this.cards.money + ')');
					deleteButton('confirmPurchase', 'interact_' + this.index);
					deleteButton('cancelPurchase', 'interact_' + this.index);
				}).bind(this), 'skipButtonCss');
				createButton('Cancel Purchase', 'interact_' + this.index, 'cancelPurchase', (function(){
					deleteButton('confirmPurchase', 'interact_' + this.index);
					deleteButton('cancelPurchase', 'interact_' + this.index);
				}).bind(this), 'skipButtonCss');
			} else{
				updateTextPrint(this.index, 'Not enough money! (' + this.cards.money + '/' + card.cost + ')');
			}
		}
	}

	this.initPlayer = function(){
		// Init HTML Elements
		initNewUIElement('div', new Map().set('id', 'player_' + this.index), 'playArea', ['margin_bottom', 'player']);

		initNewUIElement('div', new Map().set('id', 'name_' + this.index), 'player_' + this.index, ['bold', 'bigger_text']).innerHTML = 'Player ' + this.index;
		initNewUIElement('div', new Map().set('id', 'text_' + this.index), 'player_' + this.index);
		initNewUIElement('div', new Map().set('id', 'text_' + this.index + '_1'), 'text_' + this.index, 'bold')
			.innerHTML = 'Player ' + (this.index + 1) + ' fst text\n';
		initNewUIElement('div', new Map().set('id', 'text_' + this.index + '_2'), 'text_' + this.index)
			.innerHTML = 'Player ' + (this.index + 1) + ' snd text\n';
		initNewUIElement('div', new Map().set('id', 'text_' + this.index + '_3'), 'text_' + this.index, 'third-message')
			.innerHTML = 'Player ' + (this.index + 1) + ' thr text\n';

		initNewUIElement('div', new Map().set('id', 'info_' + this.index), 'player_' + this.index, 'info');
		initNewUIElement('div', new Map().set('id', 'board_' + this.index), 'player_' + this.index);
		initNewUIElement('div', new Map().set('id', 'interact_' + this.index), 'player_' + this.index, 'interact');		
		initNewUIElement('div', new Map().set('id', 'hand_' + this.index), 'player_' + this.index, 'hand');
		initNewUIElement('div', new Map().set('id', 'info_cards_' + this.index), 'info_' + this.index, 'info_child');
		initNewUIElement('div', new Map().set('id', 'info_stats_' + this.index), 'info_' + this.index, 'info_child');
		initNewUIElement('div', new Map().set('id', 'deck_' + this.index), 'info_cards_' + this.index, 'bold');
		initNewUIElement('div', new Map().set('id', 'discard_' + this.index), 'info_cards_' + this.index, 'bold');
		initNewUIElement('div', new Map().set('id', 'money_' + this.index), 'info_stats_' + this.index, 'bold');
		initNewUIElement('div', new Map().set('id', 'buysLeft_' + this.index), 'info_stats_' + this.index, 'bold');
		initNewUIElement('div', new Map().set('id', 'actionsLeft_' + this.index), 'info_stats_' + this.index, 'bold');
		// Init Deck of Cards
		this.cards = new DeckOfCards(index);
		this.cards.initDeck();
		console.log('Player ' + (this.index + 1) + ' created');
	}
}