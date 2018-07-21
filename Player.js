// Author Petter Andersson
'use strict'

var cardHandAmount = 5;

function Player(index){
	this.index = index;

	this.startTurn = function(){
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
		if(this.cards.getPhase() === 0 && isTurn(this.index)){
			this.cards.useCard(card);
		}
	}

	this.buyCard = function(card, cardId){
		if(this.cards.getPhase() === 1){
			// Check if you can afford card
			if(this.cards.money >= card.cost){
				// Confirm purchase
				deleteButton('confirmPurchase', id_interact + this.index);
				deleteButton('cancelPurchase', id_interact + this.index);
				// Remove selected TODO
				var el = document.getElementById('shopCards');
				for(var i = 0; i < el.childNodes.length; i++){
					modifyCSSEl('remove', el.childNodes[i], 'selected');				
				}
				// Add selected
				modifyCSSID('add', id_card + cardId, 'selected');
				createButton('Confirm Purchase:\n' + card.name, id_interact + this.index, 'confirmPurchase', (function(){
					// Update money
					this.cards.updateMoney(this.cards.money - card.cost);
					this.cards.updateBuysLeft(this.cards.buysLeft - 1);
		
					// Add new card to discard pile
					this.cards.discard.push(card);

					// Check if done with buy phase
					this.cards.checkIfPhaseDone(false);
					
					updateTextPrint(this.index, 'Added card to deck: ' + card.name + '! (Cap: ' + cards_capacity.get(card.name) + ')'); 

					updateCapacity(card.name, cards_capacity.get(card.name) - 1); // Reduce capacity of this card type

					modifyCSSID('remove', id_card + cardId, 'selected');
					deleteButton('confirmPurchase', id_interact + this.index);
					deleteButton('cancelPurchase', id_interact + this.index);
				}).bind(this), 'interactButton');
				createButton('Cancel Purchase', id_interact + this.index, 'cancelPurchase', (function(){
					modifyCSSID('remove', id_card + cardId, 'selected');
					deleteButton('confirmPurchase', id_interact + this.index);
					deleteButton('cancelPurchase', id_interact + this.index);
				}).bind(this), 'interactButton');
			} else{
				updateTextPrint(this.index, 'Not enough money! (' + this.cards.money + '/' + card.cost + ')');
			}
		}
	}

	this.initPlayer = function(){
		// Init HTML Elements
		initNewUIElement('div', new Map().set('id', 'player_' + this.index), 'playArea', ['margin_bottom', 'player']);
		initNewUIElement('div', new Map().set('id', 'name_' + this.index), 'player_' + this.index, ['bold', 'bigger_text'])
			.innerHTML = 'Player ' + (this.index + 1);
		
		initNewUIElement('div', new Map().set('id', id_text + this.index), 'player_' + this.index);
		initNewUIElement('div', new Map().set('id', id_text + this.index + '_1'), id_text + this.index, 'bold')
			.innerHTML = 'Player ' + (this.index + 1) + ' fst text\n';
		initNewUIElement('div', new Map().set('id', id_text + this.index + '_2'), id_text + this.index)
			.innerHTML = 'Player ' + (this.index + 1) + ' snd text\n';
		initNewUIElement('div', new Map().set('id', id_text + this.index + '_3'), id_text + this.index, 'third-message')
			.innerHTML = 'Player ' + (this.index + 1) + ' thr text\n';

		initNewUIElement('div', new Map().set('id', id_info + this.index), 'player_' + this.index, 'info');
		initNewUIElement('div', new Map().set('id', id_board + this.index), 'player_' + this.index);
		initNewUIElement('div', new Map().set('id', id_interact + this.index), 'player_' + this.index, 'interact');		
		initNewUIElement('div', new Map().set('id', id_hand + this.index), 'player_' + this.index, 'hand');

		initNewUIElement('div', new Map().set('id', id_info_stats + this.index), id_info + this.index, 'info_child');
		initNewUIElement('div', new Map().set('id', id_money + this.index), id_info_stats + this.index, ['bold', 'info_stats']);
		initNewUIElement('div', new Map().set('id', id_buysLeft + this.index), id_info_stats + this.index, ['bold', 'info_stats']);
		initNewUIElement('div', new Map().set('id', id_actionsLeft + this.index), id_info_stats + this.index, ['bold', 'info_stats']);

		initNewUIElement('div', new Map().set('id', id_info_cards + this.index), id_info + this.index, 'info_child');
		initNewUIElement('div', new Map().set('id', id_deck + this.index), id_info_cards + this.index, 'bold');
		initNewUIElement('div', new Map().set('id', id_discard + this.index), id_info_cards + this.index, 'bold');

		initNewUIElement('div', new Map().set('id', id_discard_top + this.index), id_info + this.index);

		// Init Deck of Cards
		this.cards = new DeckOfCards(index);
		this.cards.initDeck();
		updateTextPrint(this.index, 'Player ' + (this.index + 1) + ' created', false);
	}
}