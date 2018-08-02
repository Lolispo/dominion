// Author Petter Andersson
'use strict'

function DeckOfCards(playerIndex){
	this.playerIndex = playerIndex;
	this.deckStack = [];
	this.discard = [];
	this.board = [];
	this.phase = 2;				// 0 = action, 1 = buy, 2 = done, reset hand
	this.hand = new Hand(this);
	this.activeActionCard = '';

	this.updateDeckLength = function(){
		document.getElementById(id_deck + this.playerIndex).innerHTML = 'Deck: ' + this.deckStack.length + ' cards';
	}

	this.updateDiscardLength = function(){
		document.getElementById(id_discard + this.playerIndex).innerHTML = 'Discard: ' + this.discard.length + ' cards';
	}

	this.checkShopCostInactive = function(){
		var shop = document.getElementById('shopCards');
		for(var i = 0; i < shop.childNodes.length; i++){
			var imgID = getIDImgFromDiv(shop.childNodes[i].id);
			var card = cards_global_id.get(getIDFromCard(imgID));
			var cardCost = card.cost;
			if(getCapacity(card) === 0){
				// TODO: Make me get checked everytime a card is bought
				shop.childNodes[i].style.order = 3; // Order set
				// Mark out of stock
				if(document.getElementById(imgID + '_out') === null){
					var properties = new Map();
					properties.set('id', imgID + '_out');
					properties.set('src', 'res/outOfStockSmaller.png');
					modifyCSSID('add', imgID, 'inactive');				
					var el = initNewUIElement('img', properties, shop.childNodes[i].id, ['outOfStock', 'position_absolute']);
					el.style.left = '0px';
					el.style.top = '0px';
				}
			} else if(this.getCurrentMoney() >= cardCost){
				shop.childNodes[i].style.order = 1; // Order set
				modifyCSSID('remove', imgID, 'inactive');
			} else if(this.getCurrentMoney() < cardCost){ // Can't afford card
				shop.childNodes[i].style.order = 2; // Order set
				modifyCSSID('add', imgID, 'inactive');
			}
		}
	}

	// Printme = true on new hand drawn or action card used
	this.updateMoney = function(value = this.money, printMe = false){
		if(value > this.money && printMe){
			updateTextPrint(this.playerIndex, '+' + (value - this.money) +  ' Money!', false);
		}
		this.money = value;
		var plusMoneyString = '';
		if(this.plusMoney !== 0){
			plusMoneyString = ' (+$' + this.plusMoney + ')';
		}
		document.getElementById(id_money + this.playerIndex).innerHTML = 'Money: ' + this.getCurrentMoney() + plusMoneyString;
		if(printMe){
			this.checkShopCostInactive();		
		}
	}

	this.updatePlusMoney = function(value = this.plusMoney){
		this.plusMoney = value;
	}

	this.updateActionsLeft = function(value = this.actionsLeft, printMe = false){
		if(value > this.actionsLeft && printMe){
			updateTextPrint(this.playerIndex, '+' + (value - this.actionsLeft) + ' Action!', false);
		}
		this.actionsLeft = value;
		document.getElementById(id_actionsLeft + this.playerIndex).innerHTML = 'Actions Left: ' + this.actionsLeft;
	}

	this.updateBuysLeft = function(value = this.buysLeft, printMe = false){
		if(value > this.buysLeft && printMe){
			updateTextPrint(this.playerIndex, '+' + (value - this.buysLeft) +  ' Buy!', false);
		}
		this.buysLeft = value;
		document.getElementById(id_buysLeft + this.playerIndex).innerHTML = 'Buys Left: ' + this.buysLeft;
	}

	this.getCurrentMoney = function(){
		return this.money + this.plusMoney;
	}

	// Init variable values and set them in HTML
	this.updateDeckLength();
	this.updateDiscardLength();
	this.updateActionsLeft(1);
	this.updateBuysLeft(1);
	this.updatePlusMoney(0);	
	this.updateMoney(0);	

	// Used on new hand or action used
	this.updateHTMLElements = function(){
		this.updateDeckLength();
		this.updateDiscardLength();
		this.updateMoney(this.money, true);
		this.updateActionsLeft();
		this.updateBuysLeft();
	}

	this.startTurn = function(){
		this.phase = 0;
		modifyCSSID('remove', id_board + this.playerIndex, 'invis');
		modifyCSSID('remove', id_info_stats + this.playerIndex, 'invis');
		modifyCSSID('remove', id_info_stats_main + this.playerIndex, 'invis');
		modifyCSSID('remove', id_info_cards + this.playerIndex, 'invis');
		modifyCSSID('remove', id_text + this.playerIndex, 'invis');
		modifyCSSID('remove', id_actionsLeft + this.playerIndex, 'invis');

		var el = document.getElementById(id_discard_top + id_card + this.playerIndex);
		if(el !== null){
			modifyCSSEl('remove', el, 'inactive')		
		}

		createButton(id_phase0, id_interact + this.playerIndex, 'skipButton', (function(){
			this.checkIfPhaseDone(true); // Go to next stage
		}).bind(this), ['interactButton', 'margin_left', 'margin_bottom_5']);
	}

	// Start Deck
	this.initDeck = function(){
		modifyCSSID('add', id_board + this.playerIndex, 'invis');
		modifyCSSID('add', id_info_stats + this.playerIndex, 'invis');
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

	this.updateHandCardOrder = function(){
		var handElement = document.getElementById('hand_' + this.playerIndex);
		for(var i = 0; i < handElement.childNodes.length; i++){
			var card = this.hand.getCard(getIDFromCard(handElement.childNodes[i].id));
			var order = getCssOrderCard(card, this.phase);
			handElement.childNodes[i].style.order = order;
			if(order === 4){
				modifyCSSEl('add', handElement.childNodes[i], 'inactive');
			}
		}
	}

	this.displayEntireHand = function(){
		var handElement = document.getElementById('hand_' + this.playerIndex);
		for(var i = 0; i < handElement.childNodes.length; i++){
			var id = handElement.childNodes[i].id;
			var imgID = getIDImgFromDiv(id);
			this.displayCard(imgID);
		}
		this.updateHTMLElements();
	}
 
	this.displayCard = function(id){
		modifyCSSID('remove', id, ['card_smaller', 'inactive']);
		modifyCSSID('add', id, 'card');
		modifyCSSID('remove', id, 'margin_left_1');
		modifyCSSID('add', id, 'margin_left_2');
		modifyCSSID('remove', id + id_name_post, 'size2_text_medium');
		modifyCSSID('add', id + id_name_post, 'size3_text_medium');
		modifyCSSID('remove', id + id_name_post, 'size2_centered_top');
		modifyCSSID('add', id + id_name_post, 'size3_centered_top');
		var newSize = getCssFontSize(this.hand.getCard(getIDFromCard(id)), width_biggest, true);
		var centerTexts = document.getElementById(id + id_centeredText);
		centerTexts.style.width = width_biggest;
		for(var j = 0; j < centerTexts.childNodes.length; j++){
			modifyCSSEl('add', centerTexts.childNodes[j], newSize);			
		}		
	}

	this.checkIfPhaseDone = function(nextStage){ // Boolean to see if next stage
		if(this.phase === 0){
			if(nextStage || this.actionsLeft === 0 || !this.hand.containsAction()){
				this.phase++;
				this.updateHandCardOrder();
				deleteButton('playActionID', id_interact + this.playerIndex);
				modifyCSSID('add', id_actionsLeft + this.playerIndex, 'invis')
				updateTextPrint(this.playerIndex, id_startBuyString);
				changeText('skipButton', id_phase1);
			}
		} else if(this.phase === 1){
			if(nextStage || this.buysLeft === 0 || this.getCurrentMoney() === 0){ // TODO: Decide. Maybe remove if money = 0, since if buysLeft, should be allowed to buy Copper
				this.phase++;
				if(!gameEnded){
					// TODO: @Ending Only show stats != 0
					updateTextPrint(this.playerIndex, 'Ending Turn ' + getStringNotZero(this.money, this.buysLeft, this.actionsLeft, this.plusMoney));
					deleteButton('interactButton', id_interact + this.playerIndex);
					this.discardHand();
					getPlayer(this.playerIndex).drawHand();
					changeTurn();
				}
			}			
		}
	}

	// Used to add a card to your hand
	this.addCardToHand = function(tempCard, string = 'Drew a card! '){
		var handAmount = this.hand.newCard(tempCard);
		updateTextPrint(this.playerIndex, string + tempCard.name + ' (Holding ' + handAmount + ')', false);
		this.generateHandCard(tempCard); // Generate Hand Card HTML
	}

	this.drawCard = function(){
		if(this.deckStack.length === 0){ // No more cards available to draw, needs to shuffle
			this.deckStack = this.discard;
			this.discard = [];
			shuffle(this.deckStack);
			removeChildren(id_discard_top + this.playerIndex);
			updateTextPrint(this.playerIndex, 'Shuffled Deck! (' + this.deckStack.length + ' cards)');
		}

		if(this.deckStack.length > 0){ // Draw a card
			var tempCard = this.deckStack.pop(); // Read pop
			this.addCardToHand(tempCard);
			return id_card + tempCard.id;
		} else { // If you have shuffled but there are still no cards
			updateTextPrint(this.playerIndex, 'Out of cards!'); // TODO: Check game functionality here, assume just get no more card
		}
	}

	// Generate HTML for Card in hand
	this.generateHandCard = function(tempCard){
		generateCardHTML(tempCard, id_card + tempCard.id, id_hand + this.playerIndex, false, 'card_smaller', ['inactive', getCssClassCard(tempCard)], function(card_HTMLid){
			var tempEl = document.getElementById(card_HTMLid);
			var playerID = getIDFromCard(tempEl.parentElement.id);
			var card_id = getIDFromCard(card_HTMLid);
			if(isTurn(playerID) && getPlayer(playerID).cards.phase === 0) {
				var currentPlayer = getPlayer(turn);
				var card = currentPlayer.cards.hand.getCard(card_id);
				if(card.cardType === CardType.ACTION_CARD && currentPlayer.cards.actionsLeft > 0){
					// Add use card button
					updateTextPrint(currentPlayer.index, 'Selected Action Card!', false);
					deleteButton('playActionID', id_interact + currentPlayer.index);
					createButton('Use <br>' + card.name + '?', id_interact + currentPlayer.index, 'playActionID', (function(){
						updateTextPrint(currentPlayer.index, 'Played Action Card ' + card.name + '!');
						currentPlayer.playActionCard(card);
					}).bind(this), 'interactButton');					
				}
			}
		}, getCssOrderCard(tempCard, this.phase));
	}

	this.discardHand = function(){
		var discardedCards = this.hand.discardedHand();
		updateTextPrint(this.playerIndex, 'Discarding hand!');
		var currentTop = '';
		if(this.discard.length > 0){ // TODO && Buy has been made
			currentTop = this.discard[this.discard.length - 1]; // TODO: test me
			console.log('DEBUG @currentTop ' + currentTop.name);
		}
		this.discard = this.discard.concat(this.board);
		this.discard = this.discard.concat(discardedCards);
		if(currentTop === ''){
			currentTop = this.discard[this.discard.length - 1];
		}
		this.showTopOfDiscard(currentTop);
		this.cleanUp();
	}

	this.showTopOfDiscard = function(tempCard){
		removeChildren(id_discard_top + this.playerIndex);
		generateCardHTML(tempCard, id_discard_top + id_card + this.playerIndex, id_discard_top + this.playerIndex, false, 'card_discard', [getCssClassCard(tempCard)]);
	}

	// Used on end to get all cards for a player
	this.endGetAllCards = function(){
		this.discardHand();
		return this.deckStack.concat(this.discard);
	}

	// Cleanup phase
	this.cleanUp = function(){
		this.updateDeckLength();
		this.updateDiscardLength();
		this.updateMoney(0, false);	
		this.updateActionsLeft(1, false);
		this.updateBuysLeft(1, false);
		this.updatePlusMoney(0);

		removeChildren(id_board + this.playerIndex);
		this.board = [];

		modifyCSSID('add', id_board + this.playerIndex, 'invis');
		modifyCSSID('add', id_info_stats_main + this.playerIndex, 'invis');
		modifyCSSID('add', id_text + this.playerIndex, 'invis');
		modifyCSSID('add', id_discard_top + id_card + this.playerIndex, 'inactive');
		removeChildren(id_board + this.playerIndex);
		removeChildren(id_hand + this.playerIndex);
		removeChildren(id_interact + this.playerIndex);
	}

	// New Card
	this.addNewCard = function(card, inDiscard = true, updateCapacity = true, string = 'Upgraded! '){
		if(inDiscard){	// Go to discard pile or hand directly
			this.discard.push(card);
			this.showTopOfDiscard(card);
		} else {
			this.addCardToHand(card, string); // String is what should be noted in the update string, 'Drew a Card', 'Upgraded! '
			this.displayCard(id_card + card.id);
		}
		if(updateCapacity){ // If a card is received from shop, updateCapacity. Otherwise if its from hand or something false
			var cap = getCapacity(card);
			var newCap = updateCapacity(card.name, cap - 1); // Reduce capacity of this card type
			if(newCap === 0){
				this.checkShopCostInactive();
			}			
		}
	}

	// Use action card
	this.useCard = function(cardParam){
		if(this.actionsLeft - 1 >= 0){
			this.actionsLeft--;
			var card = this.hand.useCard(cardParam);

			var actions = card.getActions();
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
				this.updatePlusMoney(this.plusMoney + actions.moreGold);
			}

			// Special card start

			if(card.name === 'Witch'){
				for(var i = 0; i < players.length; i++){
					if(i != this.playerIndex){
						var tempCard = generateNewCard(cards_global.get('Curse'));
						getPlayer(i).cards.addNewCard(tempCard);
					}
				}
			} else if(card.name === 'Council Room'){
				for(var i = 0; i < players.length; i++){
					if(i != this.playerIndex){
						getPlayer(i).cards.drawCard();
					}
				}
			}

			// Check if more interactions from player is required

			if(card.name === 'Mine'){
				this.activeActionCard = card.id;
				createButton('Mine Action: <br> Press to Skip', id_interact + this.playerIndex, 'mineUpgradeIDSkip', (function(){
					var currentDeck = getPlayer(turn).cards;
					currentDeck.activeActionCard = '';
					deleteButton('mineUpgradeID', id_interact + currentDeck.playerIndex);
					deleteButton('mineUpgradeIDSkip', id_interact + currentDeck.playerIndex);
					var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
					for(var i = 0; i < cardDivs.length; i++){
						var imgID = getIDImgFromDiv(cardDivs[i].id);
						modifyCSSID('remove', imgID, 'selected');								
					}
					currentDeck.checkIfPhaseDone(false);
				}).bind(this), 'interactButton');
				addHandCardClick(this.playerIndex, [CardType.TREASURE_CARD], function(card_HTMLid, actionCardID){
					var tempEl = document.getElementById(card_HTMLid);
					var playerID = getIDFromCard(tempEl.parentElement.id);
					var card_id = getIDFromCard(card_HTMLid);
					if(isTurn(playerID) && getPlayer(playerID).cards.phase === 0) {
						var card = getPlayerCard(turn, card_id);
						var currentDeck = getPlayer(turn).cards;
						modifyCSSChildren('remove', id_hand + currentDeck.playerIndex, 'selected');
						if(card.name != 'Gold' && currentDeck.activeActionCard === actionCardID){ // card.id => mine.id
							// Add use card button
							updateTextPrint(currentDeck.playerIndex, 'Selected Treasure Card!', false);
							modifyCSSID('add', id_card + card.id, 'selected');
							deleteButton('mineUpgradeID', id_interact + currentDeck.playerIndex);
							createButton('Upgrade ' + card.name + '?', id_interact + currentDeck.playerIndex, 'mineUpgradeID', (function(){
								deleteButton('mineUpgradeID', id_interact + currentDeck.playerIndex);
								deleteButton('mineUpgradeIDSkip', id_interact + currentDeck.playerIndex);
								// Upgrade the chosen treasure card
								let newCard = '';
								if(card.name === 'Copper'){
									newCard = generateNewCard(cards_global.get('Silver'));
								} else if(card.name === 'Silver'){
									newCard = generateNewCard(cards_global.get('Gold'));
								}
								modifyCSSID('remove', id_card + card.id, 'selected');
								currentDeck.hand.useCard(card); // Trash this card
								currentDeck.addNewCard(newCard, false); // Add card to hand instead of discard pile
								currentDeck.activeActionCard = '';
								updateTextPrint(currentDeck.playerIndex, 'Upgraded ' + card.name + ' to ' + newCard.name + '!');
								// Check next phase
								currentDeck.updateHTMLElements();
								currentDeck.checkIfPhaseDone(false);
							}).bind(this), 'interactButton');
						}
					}
				});
			} else if(card.name === 'Chapel'){
				this.activeActionCard = card.id;
				createButton('Chapel Action: <br> Press to Skip', id_interact + this.playerIndex, 'chapelIDSkip', (function(){
					var currentDeck = getPlayer(turn).cards;
					currentDeck.activeActionCard = '';
					deleteButton('chapelID', id_interact + currentDeck.playerIndex);
					deleteButton('chapelIDSkip', id_interact + currentDeck.playerIndex);
					var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
					for(var i = 0; i < cardDivs.length; i++){
						var imgID = getIDImgFromDiv(cardDivs[i].id);
						modifyCSSID('remove', imgID, 'selected');								
					}
					currentDeck.checkIfPhaseDone(false);
				}).bind(this), 'interactButton');
				addHandCardClick(this.playerIndex, [CardType.TREASURE_CARD, CardType.ACTION_CARD, CardType.VICTORY_CARD], function(card_HTMLid, actionCardID){
					var tempEl = document.getElementById(card_HTMLid);
					var playerID = getIDFromCard(tempEl.parentElement.id);
					var card_id = getIDFromCard(card_HTMLid);
					if(isTurn(playerID) && getPlayer(playerID).cards.phase === 0) {
						var card = getPlayerCard(turn, card_id);
						var currentDeck = getPlayer(turn).cards;
						if(currentDeck.activeActionCard === actionCardID){ // card.id => mine.id
							// Add use card button
							modifyCSSID('toggle', id_card + card.id, 'selected');	
							//updateTextPrint(currentDeck.playerIndex, 'Selected ' + card.name + '!', false);
							deleteButton('chapelID', id_interact + currentDeck.playerIndex); // Check me
							createButton('Trash the selected cards', id_interact + currentDeck.playerIndex, 'chapelID', (function(){
								deleteButton('chapelID', id_interact + currentDeck.playerIndex);
								deleteButton('chapelIDSkip', id_interact + currentDeck.playerIndex);
								
								var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
								var counter = 0;
								for(var i = cardDivs.length-1; i >= 0; i--){
									var imgID = getIDImgFromDiv(cardDivs[i].id);
									if(document.getElementById(imgID).classList.contains('selected')){
										counter++;
										modifyCSSID('remove', imgID, 'selected');
										var tempCard = getPlayerCard(currentDeck.playerIndex, getIDFromCard(imgID));
										currentDeck.hand.useCard(tempCard); // Trash this card										
									}
								}
								currentDeck.activeActionCard = '';
								updateTextPrint(currentDeck.playerIndex, 'Trashed ' + counter + ' cards!');
								// Check next phase
								currentDeck.updateHTMLElements();
								currentDeck.checkIfPhaseDone(false);
							}).bind(this), 'interactButton');
						}
					}
				});
			} else if(card.name === 'Cellar'){
				this.activeActionCard = card.id;
				createButton('Cellar Action: <br> Press to Skip', id_interact + this.playerIndex, 'cellarIDSkip', (function(){
					var currentDeck = getPlayer(turn).cards;
					currentDeck.activeActionCard = '';
					deleteButton('cellarID', id_interact + currentDeck.playerIndex);
					deleteButton('cellarIDSkip', id_interact + currentDeck.playerIndex);
					var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
					for(var i = 0; i < cardDivs.length; i++){
						var imgID = getIDImgFromDiv(cardDivs[i].id);
						modifyCSSID('remove', imgID, 'selected');								
					}
					currentDeck.checkIfPhaseDone(false);
				}).bind(this), 'interactButton');
				addHandCardClick(this.playerIndex, [CardType.TREASURE_CARD, CardType.ACTION_CARD, CardType.VICTORY_CARD], function(card_HTMLid, actionCardID){
					var tempEl = document.getElementById(card_HTMLid);
					var playerID = getIDFromCard(tempEl.parentElement.id);
					var card_id = getIDFromCard(card_HTMLid);
					if(isTurn(playerID) && getPlayer(playerID).cards.phase === 0) {
						var card = getPlayerCard(turn, card_id);
						var currentDeck = getPlayer(turn).cards;
						if(currentDeck.activeActionCard === actionCardID){ // card.id => mine.id
							// Add use card button
							modifyCSSID('toggle', id_card + card.id, 'selected');	
							//updateTextPrint(currentDeck.playerIndex, 'Selected ' + card.name + '!', false);
							deleteButton('cellarID', id_interact + currentDeck.playerIndex); // Check me
							createButton('Exchange Selected Cards', id_interact + currentDeck.playerIndex, 'cellarID', (function(){
								deleteButton('cellarID', id_interact + currentDeck.playerIndex);
								deleteButton('cellarIDSkip', id_interact + currentDeck.playerIndex);
								
								var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
								var counter = 0;
								for(var i = cardDivs.length-1; i >= 0; i--){
									var imgID = getIDImgFromDiv(cardDivs[i].id);
									if(document.getElementById(imgID).classList.contains('selected')){
										counter++;
										modifyCSSID('remove', imgID, 'selected');
										var tempCard = getPlayerCard(currentDeck.playerIndex, getIDFromCard(imgID));
										// Discard this card
										var newTempCard = currentDeck.hand.useCard(tempCard); 
										currentDeck.addNewCard(newTempCard, true, false); 
										// Draw new Card
										var cardHtml_id = currentDeck.drawCard(); 
										currentDeck.displayCard(cardHtml_id);
									}
								}
								currentDeck.activeActionCard = '';
								updateTextPrint(currentDeck.playerIndex, 'Exchanged ' + counter + ' cards!');
								// Check next phase
								currentDeck.updateHTMLElements();
								currentDeck.checkIfPhaseDone(false);
							}).bind(this), 'interactButton');
						}
					}
				});
			}
			else{ // Check next phase, no more inputs required from user
				this.checkIfPhaseDone(false);
			}

			// Special Card handling
			// (T) Trash Functionality
			// (C) Choose cards in hand functionality
			// (B) Basic yes / no
			// (U) Unique
			// (S) Choose a card in shop

			// (UC) Throne Room: Choose action card from hand, play twice.
			// (S) Workshop: Gain a card costing up to 4
			// (TS) Feast: Trash this card, Gain a card costing up to 5
			// (2 U) Moat: If attack is used, you can show this card to prevent being affected
			// (C) Militia: (Attack) Each other player discards down to 3 cards in their hand
			// (TC) MoneyLender: Trash a Copper from your hand, +3 Gold
			// (U) Spy: (Attack) Show top of deck, placer chooses if discard or put back on top of deck
			// (U) Thief:
			// (3 B) Chancellor: You may immediately put your entire deck into discard pile

			this.updateHTMLElements();

			this.board.push(card);
			
			generateCardHTML(card, id_board + card.id, id_board + this.playerIndex, false, 'card_smaller', [getCssClassCard(card)]);

			// Remove Use action button
			deleteButton('playActionID', id_interact + this.playerIndex);
		}
	}
}

function Hand(deckOfCards){
	this.amount = 0;
	this.allCards = new Map(); // Change me into a map
	this.treasureCards = [];
	this.victoryCards = [];
	this.actionCards = [];
	this.deckOfCards = deckOfCards;

	this.getCard = function(id){
		return this.allCards.get(id);
	}

	this.getAmount = function(){
		return this.amount;
	}

	this.getTreasure = function(){
		return this.treasureCards;
	}

	this.getVictory = function(){
		return this.victoryCards;
	}

	this.getAction = function(){
		return this.actionCards;
	}

	this.containsAction = function(){
		if(this.actionCards.length > 0){
			return true;
		}
		return false;
	}

	this.newCard = function(card){
		this.amount++;
		this.allCards.set(card.id, card);
		if(card.cardType === CardType.TREASURE_CARD){
			this.treasureCards.push(card);
			this.deckOfCards.updateMoney(this.deckOfCards.money + card.getValue());
			//updateTextPrint(this.deckOfCards.playerIndex, 'Money Update! ( + ' + card.getValue() + ')');
		} else if(card.cardType === CardType.VICTORY_CARD){
			this.victoryCards.push(card);
		} else if(card.cardType === CardType.ACTION_CARD){
			this.actionCards.push(card);
		}
		return this.amount; // Return can be used for 'Draw until certain amount'
	}

	this.useCard = function(card){
		var tempCard = this.getCard(card.id);
		if(card.name === 'Copper'){
			this.deckOfCards.updateMoney(this.deckOfCards.money - 1, true);
		} else if(card.name === 'Silver'){
			this.deckOfCards.updateMoney(this.deckOfCards.money - 2, true);
		} else if(card.name === 'Gold'){
			this.deckOfCards.updateMoney(this.deckOfCards.money - 3, true);
		}
		this.amount--;
		this.removeCardList(tempCard);
		this.allCards.delete(card.id); 
		var handEl = document.getElementById(id_hand + this.deckOfCards.playerIndex);
		var el = document.getElementById(id_card + card.id + id_div);
		handEl.removeChild(el);
		return tempCard;
	}

	// Remove card from the list
	this.removeCardList = function(card){
		switch(card.cardType){
			case CardType.ACTION_CARD: 
				var index = this.actionCards.indexOf(card);
				if(index == -1){
					throw 'index = -1 for ' + card.name + '. Shouldnt happen';
				}
				this.actionCards.splice(index, 1)[0]
				break;
			case CardType.TREASURE_CARD: 
				var index = this.treasureCards.indexOf(card);
				if(index == -1){
					throw 'index = -1 for ' + card.name + '. Shouldnt happen';
				}
				this.treasureCards.splice(index, 1)[0]
				break;
			case CardType.VICTORY_CARD: 
				var index = this.victoryCards.indexOf(card);
				if(index == -1){
					throw 'index = -1 for ' + card.name + '. Shouldnt happen';
				}
				this.victoryCards.splice(index, 1)[0]
				break;
		}
	}

	this.getHand = function(){ 
		var listOfCards = this.actionCards.concat(this.treasureCards).concat(this.victoryCards);
		return listOfCards;
	}

	this.discardedHand = function(){
		var listOfCards = this.getHand();
		this.treasureCards = [];
		this.victoryCards = [];
		this.actionCards = [];
		this.amount = 0;
		this.allCards = new Map();
		return listOfCards;
	}
}