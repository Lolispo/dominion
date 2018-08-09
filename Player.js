// Author Petter Andersson
'use strict'

var cardHandAmount = 5;

function Player(index){
	this.index = index;
	this.name = 'Player ' + (this.index + 1); 

	this.startTurn = function(){
		this.cards.startTurn();
		this.displayHand();
		this.cards.checkIfPhaseDone();
	}

	this.getName = function(){
		return this.name;
	}

	this.setName = function(newName){
		if(newName !== ''){ // TODO: Make sure the name could not be a problem
			this.name = newName;
			changeText(id_name_pre + this.index, this.name);
		}
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
		//updateTextPrint(this.index, 'Your turn Player ' + (this.index + 1) + '!');
		this.cards.displayEntireHand();
	}

	this.playActionCard = function(card){
		if(this.cards.getPhase() === 0 && isTurn(this.index)){ 
			this.cards.useCard(card);
		} else { // These checks shouldn't in theory be required
			throw ('Check me: ' + (this.cards.getPhase() === 0) + (isTurn(this.index)) );
		}
	}

	this.buyCard = function(card, cardId){
		if(this.cards.getPhase() === 1){
			// Check if you can afford card
			if(this.cards.getCurrentMoney() >= card.cost){
				// Confirm purchase
				deleteButton('confirmPurchase', id_interact + this.index);
				deleteButton('cancelPurchase', id_interact + this.index);
				modifyCSSChildren('remove', 'shopCards', 'selected');
				var cap = getCapacity(card);
				var capString = ')';
				if(cap < card_capacity_show){
					capString = ', cap: ' + cap + ')';
				}
				updateShopText(card.name + ': (cost: ' + card.cost + capString);
				// Add selected
				modifyCSSID('add', id_card + cardId, 'selected');
				createButton('Confirm Purchase:\n' + card.name, 'confirmPurchase', id_interact + this.index, (function(){
					// Update money
					this.cards.updateMoney(this.cards.money - card.cost, true);
					this.cards.updateBuysLeft(this.cards.buysLeft - 1);
		
					// Add new card to discard pile
					this.cards.addNewCard(card);
					changeText(id_card + cardId + id_bottomRight, getCapacityString(card));

					// Check if done with buy phase
					this.cards.checkIfPhaseDone();
					updateTextPrint(this.index, 'Added card to deck: ' + card.name + '! (Cap: ' + cap + ')'); 
					updateShopText(this.name + ' bought a ' + card.name + ' card! (Cap: ' + cap + ')');
					
					modifyCSSID('remove', id_card + cardId, 'selected');
					deleteButton('confirmPurchase', id_interact + this.index);
					deleteButton('cancelPurchase', id_interact + this.index);
				}).bind(this), 'interactButton');
				createButton('Cancel Purchase', 'cancelPurchase', id_interact + this.index, (function(){
					modifyCSSID('remove', id_card + cardId, 'selected');
					deleteButton('confirmPurchase', id_interact + this.index);
					deleteButton('cancelPurchase', id_interact + this.index);
				}).bind(this), 'interactButton');
			} else{
				updateShopText('Not enough money! (' + this.cards.getCurrentMoney() + '/' + card.cost + ')');
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
		initNewUIElement('div', new Map().set('id', id_name_pre + this.index + id_div), id_player + this.index, ['card_container', 'margin_left']);
		var name = initNewUIElement('div', new Map().set('id', id_name_pre + this.index), id_name_pre + this.index + id_div, ['inline', 'bold', 'text34', 'text_shadow']);
		name.innerHTML = this.name;
		name.style.backgroundColor = color;
		name.addEventListener('click', function(event){
			// Option to changeName
			var pid = getIDFromCard(event.target.id);
			if(document.getElementById(id_name_pre + 'change_' + pid) !== null){
				removeChildren(id_name_pre + 'change_' + pid);
				var outer = document.getElementById(id_name_pre + pid + id_div);
				var el = document.getElementById(id_name_pre + 'change_' + pid);
				outer.removeChild(el);
			}
			var callbackFunc = function(){
				var inputString = document.getElementById(id_name_pre + 'input_' + pid).value;
				updateTextPrint(pid, 'Set new name for Player ' + pid + ': ' + inputString, false);
				// Sanitize
				getPlayer(pid).setName(inputString);
				removeChildren(id_name_pre + 'change_' + pid);
				var outer = document.getElementById(id_name_pre + pid + id_div);
				var el = document.getElementById(id_name_pre + 'change_' + pid);
				outer.removeChild(el);
			}
			initNewUIElement('div', new Map().set('id', id_name_pre + 'change_' + pid), id_name_pre + pid + id_div, ['inline', 'margin_left']);
			initNewUIElement('input', new Map().set('id', id_name_pre + 'input_' + pid).set('placeholder', 'New name'), id_name_pre + 'change_' + pid, ['inline', 'margin_left_10']); // TODO: Make better looking
			initNewUIElement('div', new Map().set('id', id_name_pre + 'change_button_' + pid), id_name_pre + 'change_' + pid, ['margin_left', 'card_container', 'margin_left_10']);
			createButton('Submit new name', 'submitName', id_name_pre + 'change_button_' + pid, callbackFunc, ['interactButton', 'margin_left_10', 'margin_top_2']);
			createButton('Cancel change', 'cancelName', id_name_pre + 'change_button_' + pid, function(){
				removeChildren(id_name_pre + 'change_' + pid);
				var outer = document.getElementById(id_name_pre + pid + id_div);
				var el = document.getElementById(id_name_pre + 'change_' + pid);
				outer.removeChild(el);
			}, ['interactButton', 'margin_top_2']);
		});

		initNewUIElement('div', new Map().set('id', id_infoBoard + this.index), id_player + this.index, ['flex_container', 'margin_top_2']);
		initNewUIElement('div', new Map().set('id', id_info + this.index), id_infoBoard + this.index, 'card_container');
		initNewUIElement('div', new Map().set('id', id_board + this.index), id_infoBoard + this.index, ['card_container', 'margin_left']);
		initNewUIElement('div', new Map().set('id', id_interact + this.index), id_player + this.index, 'interact');		
		initNewUIElement('div', new Map().set('id', id_hand + this.index), id_player + this.index, ['card_container', 'margin_left']);

		initNewUIElement('div', new Map().set('id', id_info_stats + this.index), id_info + this.index, ['info_child', 'card_container']);
		initNewUIElement('div', new Map().set('id', id_info_stats_main + this.index), id_info_stats + this.index);
		initNewUIElement('div', new Map().set('id', id_money + this.index), id_info_stats_main + this.index, ['bold', 'info_stats_main', 'info_stats', 'text_shadow', 'text16']);
		initNewUIElement('div', new Map().set('id', id_buysLeft + this.index), id_info_stats_main + this.index, ['bold', 'info_stats_main', 'info_stats', 'text_shadow', 'text16']);
		initNewUIElement('div', new Map().set('id', id_actionsLeft + this.index), id_info_stats_main + this.index, ['bold', 'info_stats_main', 'info_stats', 'text_shadow', 'text16']);

		initNewUIElement('div', new Map().set('id', id_info_stats_cards + this.index), id_info_stats + this.index, ['margin_left', 'margin_top_2']);	
		initNewUIElement('div', new Map().set('id', id_deck + this.index), id_info_stats_cards + this.index, ['bold', 'text_shadow', 'text16']);
		initNewUIElement('div', new Map().set('id', id_discard + this.index), id_info_stats_cards + this.index, ['bold', 'text_shadow', 'text16']);

		initNewUIElement('div', new Map().set('id', id_text + this.index), id_info + this.index);
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_0), id_text + this.index, ['bold', 'text_shadow', 'margin_left', 'border_bottom'])
			.innerHTML = id_statusMessageString;
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_1), id_text + this.index, ['bold', 'text_shadow', 'margin_left'])
			.innerHTML = '> ';
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_2), id_text + this.index, ['text_shadow', 'margin_left'])
			.innerHTML = '> ';
		initNewUIElement('div', new Map().set('id', id_text + this.index + id_3), id_text + this.index, ['color_gray', 'text_shadow', 'margin_left'])
			.innerHTML = '> ';
			
		initNewUIElement('div', new Map().set('id', id_info_cards + this.index), id_info + this.index, 'margin_left_30');
		initNewUIElement('div', new Map().set('id', id_discard_top + this.index), id_info_cards + this.index);

		// Init Deck of Cards
		this.cards = new DeckOfCards(index);
		this.cards.initDeck();
		updateTextPrint(this.index, this.name + ' created', false);
	}
}