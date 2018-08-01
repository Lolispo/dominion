// Author Petter Andersson
'use strict'

var cardHandAmount = 5;

function Player(index){
	this.index = index;
	this.name = 'Player ' + (this.index + 1); 

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
		this.cards.updateDeckLength();
		this.cards.updateDiscardLength();
	}

	this.displayHand = function(){
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
				modifyCSSChildren('remove', 'shopCards', 'selected');
				var el = document.getElementById('shopCards');
				for(var i = 0; i < el.childNodes.length; i++){
					modifyCSSID('remove', getIDImgFromDiv(el.childNodes[i].id), 'selected');				
				}
				var cap = getCapacity(card);
				var capString = ')';
				if(cap < card_capacity_show){
					capString = ', cap: ' + cap + ')';
				}
				updateShopText(card.name + ': (cost: ' + card.cost + capString);
				// Add selected
				modifyCSSID('add', id_card + cardId, 'selected');
				createButton('Confirm Purchase:\n' + card.name, id_interact + this.index, 'confirmPurchase', (function(){
					// Update money
					this.cards.updateMoney(this.cards.money - card.cost, true);
					this.cards.updateBuysLeft(this.cards.buysLeft - 1);
		
					// Add new card to discard pile
					this.cards.addNewCard(card);
					changeText(id_card + cardId + id_bottomRight, getCapacityString(card));

					// Check if done with buy phase
					this.cards.checkIfPhaseDone(false);
					updateTextPrint(this.index, 'Added card to deck: ' + card.name + '! (Cap: ' + cap + ')'); 
					updateShopText(this.name + ' bought a ' + card.name + ' card! (Cap: ' + cap + ')');
					
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
				updateShopText('Not enough money! (' + this.cards.money + '/' + card.cost + ')');
			}
		}
	}

	this.initPlayer = function(){
		// Init HTML Elements
		var color = getPlayerColor(this.index);
		var player = initNewUIElement('div', new Map().set('id', id_player + this.index), 'playArea', 'margin_bottom');
		//player.style.borderStyle = 'solid';
		//player.style.borderColor = color;
		//player.style.backgroundColor = color;
		var name = initNewUIElement('div', new Map().set('id', id_name_pre + this.index), id_player + this.index, ['inline', 'bold', 'biggest_text', 'strokeme', 'margin_left']);
		name.innerHTML = this.name;
		name.style.backgroundColor = color;


		initNewUIElement('div', new Map().set('id', id_infoBoard + this.index), id_player + this.index, ['flex-container', 'margin_top_2']);
		initNewUIElement('div', new Map().set('id', id_info + this.index), id_infoBoard + this.index, 'card_container');
		initNewUIElement('div', new Map().set('id', id_board + this.index), id_infoBoard + this.index, ['card_container', 'margin_left']);
		initNewUIElement('div', new Map().set('id', id_interact + this.index), id_player + this.index, 'interact');		
		initNewUIElement('div', new Map().set('id', id_hand + this.index), id_player + this.index, ['card_container', 'margin_left']);

		initNewUIElement('div', new Map().set('id', id_info_stats + this.index), id_info + this.index, ['info_child', 'card_container']);
		initNewUIElement('div', new Map().set('id', id_info_stats_main + this.index), id_info_stats + this.index);
		initNewUIElement('div', new Map().set('id', id_money + this.index), id_info_stats_main + this.index, ['bold', 'info_stats_main', 'info_stats', 'strokeme', 'bigger_text']);
		initNewUIElement('div', new Map().set('id', id_buysLeft + this.index), id_info_stats_main + this.index, ['bold', 'info_stats_main', 'info_stats', 'strokeme', 'bigger_text']);
		initNewUIElement('div', new Map().set('id', id_actionsLeft + this.index), id_info_stats_main + this.index, ['bold', 'info_stats_main', 'info_stats', 'strokeme', 'bigger_text']);

		initNewUIElement('div', new Map().set('id', id_info_stats_cards + this.index), id_info_stats + this.index, ['margin_left', 'margin_top_2']);	
		initNewUIElement('div', new Map().set('id', id_deck + this.index), id_info_stats_cards + this.index, ['bold', 'strokeme', 'bigger_text']);
		initNewUIElement('div', new Map().set('id', id_discard + this.index), id_info_stats_cards + this.index, ['bold', 'strokeme', 'bigger_text']);

		initNewUIElement('div', new Map().set('id', id_text + this.index), id_info + this.index);
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_0), id_text + this.index, ['bold', 'strokeme', 'margin_left', 'border_bottom'])
			.innerHTML = id_statusMessageString;
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_1), id_text + this.index, ['bold', 'strokeme', 'margin_left'])
			.innerHTML = '> ' + this.name + ' fst text';
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_2), id_text + this.index, ['strokeme', 'margin_left'])
			.innerHTML = '> ' + this.name + ' snd text';
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_3), id_text + this.index, ['third-message', 'strokeme', 'margin_left'])
			.innerHTML = '> ' + this.name + ' thr text';
			
		initNewUIElement('div', new Map().set('id', id_info_cards + this.index), id_info + this.index, 'margin_left_30');
		initNewUIElement('div', new Map().set('id', id_discard_top + this.index), id_info_cards + this.index);

		// Init Deck of Cards
		this.cards = new DeckOfCards(index);
		this.cards.initDeck();
		updateTextPrint(this.index, this.name + ' created', false);
	}
}