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
		var pile = document.getElementById('pile_deck_' + this.playerIndex);
		if(pile){
			modifyCSSEl(this.deckStack.length === 0 ? 'add' : 'remove', pile, 'pile-empty');
			modifyCSSEl(this.deckStack.length === 0 ? 'remove' : 'add', pile, 'pile-deck');
			setPileCount(pile, this.deckStack.length);
		}
		document.getElementById(id_deck + this.playerIndex).innerHTML = 'Deck: ' + this.deckStack.length + ' cards';
	}

	this.updateDiscardLength = function(){
		var pile = document.getElementById('pile_discard_' + this.playerIndex);
		if(pile){
			modifyCSSEl(this.discard.length === 0 ? 'add' : 'remove', pile, 'pile-empty');
			setPileCount(pile, this.discard.length);
		}
		document.getElementById(id_discard + this.playerIndex).innerHTML = 'Discard: ' + this.discard.length + ' cards';
	}

	this.checkShopCostInactive = function(){
		var shop = document.getElementById('shopCards');
		for(var i = 0; i < shop.childNodes.length; i++){
			var imgID = getIDImgFromDiv(shop.childNodes[i].id);
			var card = cards_global_id.get(getIDFromCard(imgID));
			var cardCost = card.cost;
			if(getCapacity(card) === 0){
				// Mark out of stock (order stays grouped by type; affordability is shown by greying)
				if(document.getElementById(imgID + '_out') === null){
					var properties = new Map();
					properties.set('id', imgID + '_out');
					properties.set('src', 'res/outOfStockSmaller.png');
					modifyCSSID('add', imgID + id_div, 'inactive');
					var el = initNewUIElement('img', properties, shop.childNodes[i].id, ['outOfStock', 'position_absolute']);
					el.style.left = '0px';
					el.style.top = '0px';
				}
			} else if(this.getCurrentMoney() >= cardCost){
				modifyCSSID('remove', imgID + id_div, 'inactive');
			} else if(this.getCurrentMoney() < cardCost){ // Can't afford card
				modifyCSSID('add', imgID + id_div, 'inactive');
			}
		}
	}

	// Printme = true on new hand drawn or action card used
	this.updateMoney = function(value = this.money, printMe = false){
		var increased = value > this.money;
		if(value > this.money && printMe){
			updateTextPrint(this.playerIndex, '+' + (value - this.money) +  ' Money!', false);
		}
		this.money = value;
		var plusMoneyString = '';
		if(this.plusMoney !== 0){
			plusMoneyString = ' (+$' + this.plusMoney + ')';
		}
		document.getElementById(id_money + this.playerIndex).innerHTML = COIN_ICON + ' ' + this.getCurrentMoney() + plusMoneyString;
		if(increased){
			bumpCounter(document.getElementById(id_money + this.playerIndex));
		}
		if(printMe){
			this.checkShopCostInactive();
		}
	}

	this.updatePlusMoney = function(value = this.plusMoney){
		this.plusMoney = value;
	}

	this.updateActionsLeft = function(value = this.actionsLeft, printMe = false){
		var increased = value > this.actionsLeft;
		if(value > this.actionsLeft && printMe){
			updateTextPrint(this.playerIndex, '+' + (value - this.actionsLeft) + ' Action!', false);
		}
		this.actionsLeft = value;
		document.getElementById(id_actionsLeft + this.playerIndex).innerHTML = 'Actions Left: ' + this.actionsLeft;
		if(increased){
			bumpCounter(document.getElementById(id_actionsLeft + this.playerIndex));
		}
	}

	this.updateBuysLeft = function(value = this.buysLeft, printMe = false){
		var increased = value > this.buysLeft;
		if(value > this.buysLeft && printMe){
			updateTextPrint(this.playerIndex, '+' + (value - this.buysLeft) +  ' Buy!', false);
		}
		this.buysLeft = value;
		document.getElementById(id_buysLeft + this.playerIndex).innerHTML = 'Buys Left: ' + this.buysLeft;
		if(increased){
			bumpCounter(document.getElementById(id_buysLeft + this.playerIndex));
		}
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

		var el = document.getElementById(id_discard_top + id_card + this.playerIndex + id_div);
		if(el !== null){
			modifyCSSEl('remove', el, 'inactive')
		}

		createButton(id_phase0, 'skipButton', id_interact + this.playerIndex, (function(){
			this.checkIfPhaseDone(true); // Go to next stage
		}).bind(this), ['interactButton', 'margin_left', 'margin_bottom_5']);
	}

	// Start Deck
	this.initDeck = function(){
		modifyCSSID('add', id_board + this.playerIndex, 'invis');
		modifyCSSID('add', id_info_stats_main + this.playerIndex, 'invis');
		modifyCSSID('add', id_text + this.playerIndex, 'invis');

		for(var i = 0; i < 7; i++){
			this.discard.push(generateNewCard(cards_global.get('Copper')));
		}
		for(var i = 0; i < 3; i++){
			this.discard.push(generateNewCard(cards_global.get('Estate')));
		}
		if(this.discard.length !== 10){
			console.warn('Wrong size of ' + this.discard.length);
		}
	}

	this.getPhase = function(){
		return this.phase;
	}

	// Used between phases to update order of cards, action cards get lower priority in later phases
	this.updateHandCardOrder = function(){
		//console.log('@ updateHandCardOrder - Callback needs to be before this');
		var handElement = document.getElementById('hand_' + this.playerIndex);
		for(var i = 0; i < handElement.childNodes.length; i++){
			var card = this.hand.getCard(getIDFromCard(handElement.childNodes[i].id));
			if(card !== undefined){
				var order = getCssOrderCard(card, this.phase);
				handElement.childNodes[i].style.order = order;
				if(order === 4){
					modifyCSSEl('add', handElement.childNodes[i], 'inactive');
				}	
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
		var div = document.getElementById(id + id_div);
		if(div){ modifyCSSEl('remove', div, 'inactive'); modifyCSSEl('add', div, 'size-hand'); }
	}

	this.checkIfPhaseDone = function(nextStage = false){ // Boolean to see if next stage
		if(this.phase === 0){
			if(nextStage || this.actionsLeft === 0 || !this.hand.containsAction()){
				this.phase++;
				this.updateHandCardOrder();
				this.activeActionCard = '';
				var cardDivs = document.getElementById(id_hand + this.playerIndex).childNodes;
				for(var i = 0; i < cardDivs.length; i++){
					var imgID = getIDImgFromDiv(cardDivs[i].id);
					var el = document.getElementById(imgID + id_div);
					if(el !== undefined){
						modifyCSSEl('remove', el, 'selected');
					}
				}
				deleteButton('playActionID', id_interact + this.playerIndex);
				deleteButton('mineUpgradeID', id_interact + this.playerIndex);
				deleteButton('mineUpgradeIDSkip', id_interact + this.playerIndex);
				deleteButton('chapelID', id_interact + this.playerIndex);
				deleteButton('chapelIDSkip', id_interact + this.playerIndex);
				deleteButton('cellarID', id_interact + this.playerIndex);
				deleteButton('cellarIDSkip', id_interact + this.playerIndex);
				modifyCSSID('add', id_actionsLeft + this.playerIndex, 'invis')
				changeText('skipButton', id_phase1);
			}
		} else if(this.phase === 1){
			if(nextStage || this.buysLeft === 0 || this.getCurrentMoney() < 2){ // Decided. Currently: Not allowed copper buys, as last buy
				this.phase++;
				if(!gameEnded){
					updateTextPrint(this.playerIndex, 'Ending Turn ' + getStringNotZero((this.money + this.plusMoney), this.buysLeft, this.actionsLeft));
					deleteButton('interactButton', id_interact + this.playerIndex);
					this.hand.discardHandAnimation().then(function(){
						var currentPlayer = getPlayer(turn);
						currentPlayer.cards.discardHand();
						currentPlayer.drawHand(true); // silent: deals in when its owner's turn starts
						changeTurn();
					});
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

	this.drawCard = function(silent){
		if(this.deckStack.length === 0){ // No more cards available to draw, needs to shuffle
			this.deckStack = this.discard;
			this.discard = [];
			shuffle(this.deckStack);
			removeChildren(id_discard_top + this.playerIndex);
			if(typeof sfxShuffle === 'function'){ sfxShuffle(); }
			updateTextPrint(this.playerIndex, 'Shuffled Deck! (' + this.deckStack.length + ' cards)');
		}

		if(this.deckStack.length > 0){ // Draw a card
			var tempCard = this.deckStack.pop(); // Read pop
			this.addCardToHand(tempCard);
			var rootId = id_card + tempCard.id;
			if(!silent){
				var handCardDiv = document.getElementById(rootId + id_div);
				if(handCardDiv){ handCardDiv.style.visibility = 'hidden'; }
				flyCardDeal(rootId, deckAnchorEl(this.playerIndex), handCardDiv).then(function(){
					if(handCardDiv){ handCardDiv.style.visibility = 'visible'; }
				});
			}
			return rootId;
		} else { // If you have shuffled but there are still no cards
			updateTextPrint(this.playerIndex, 'Out of cards!');
			return null;
		}
	}

	// Generate HTML for Card in hand
	this.generateHandCard = function(tempCard){
		renderCard(tempCard, id_card + tempCard.id, id_hand + this.playerIndex, {
			size: 'hand', cssClass: ['inactive'], order: getCssOrderCard(tempCard, this.phase),
			callback: function(card_HTMLid){
				var tempEl = document.getElementById(card_HTMLid);
				var playerID = getIDFromCard(tempEl.parentElement.id);
				var card_id = getIDFromCard(card_HTMLid);
				if(isTurn(playerID) && getPlayer(playerID).cards.phase === 0) {
					var currentPlayer = getPlayer(turn);
					var card = currentPlayer.cards.hand.getCard(card_id);
					if(card.cardType === CardType.ACTION_CARD && currentPlayer.cards.actionsLeft > 0 && currentPlayer.cards.activeActionCard === ''){
						// Add use card button
						deleteButton('playActionID', id_interact + currentPlayer.index);
						var cardDivs = document.getElementById(id_hand + currentPlayer.index).childNodes;
						for(var i = 0; i < cardDivs.length; i++){
							var imgID = getIDImgFromDiv(cardDivs[i].id);
							modifyCSSID('remove', imgID + id_div, 'selected');
						}
						modifyCSSID('add', id_card + card.id + id_div, 'selected');
						createButton('Use <br>' + card.name + '?', 'playActionID', id_interact + currentPlayer.index, (function(){
							updateTextPrint(currentPlayer.index, 'Played Action Card ' + card.name + '!');
							currentPlayer.playActionCard(card);
						}).bind(this), 'interactButton');
					}
				}
			}
		});
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
		renderCard(tempCard, id_discard_top + id_card + this.playerIndex, id_discard_top + this.playerIndex, { size: 'discard' });
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
		modifyCSSID('add', id_discard_top + id_card + this.playerIndex + id_div, 'inactive');
		removeChildren(id_hand + this.playerIndex);
		removeChildren(id_interact + this.playerIndex);
	}

	// New Card
	this.addNewCard = function(card, inDiscard = true, shouldUpdateCapacity = true, string = 'Upgraded! '){
		if(inDiscard){	// Go to discard pile or hand directly
			this.discard.push(card);
			this.showTopOfDiscard(card);
		} else {
			this.addCardToHand(card, string); // String is what should be noted in the update string, 'Drew a Card', 'Upgraded! '
			this.displayCard(id_card + card.id);
		}
		if(shouldUpdateCapacity){ // If a card is received from shop, updateCapacity. Otherwise if its from hand or something false
			var cap = getCapacity(card);
			var newCap = updateCapacity(card.name, cap - 1); // Reduce capacity of this card type
			if(newCap === 0){
				this.checkShopCostInactive();
			}			
		}
	}

	const useCardAnimationTime = 500;	// Time to wait before going forward
	// Use action card
	this.useCard = function(cardParam){
		this.actionsLeft--;
		if(typeof sfxPlay === 'function'){ sfxPlay(); }
		//console.log('DEBUG @useCard');
		var card = this.hand.useCard(cardParam);
		var currentDeck = getPlayer(turn).cards;
		popCard(id_card + cardParam.id).then(function(){
			currentDeck.useCardAfterAnimation(card);
		});
	}

	this.useCardAfterAnimation = function(card){
		var actions = card.getActions();
		if(actions.drawCards !== 0){
			for(var i = 0; i < actions.drawCards; i++){
				var html_id = this.drawCard();
				if(html_id !== null){
					this.displayCard(html_id);				
				}
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

		// Staggered "+N" float chips so multi-effect cards (e.g. Festival) read one effect at a time
		if(typeof floatGain === 'function'){
			var self = this;
			var plural = function(n, word){ return '+' + n + ' ' + word + (n > 1 ? 's' : ''); };
			var steps = [];
			if(actions.drawCards !== 0){ steps.push({ get: function(){ return deckAnchorEl(self.playerIndex); }, txt: plural(actions.drawCards, 'Card'), tint: '#f4ecd8' }); }
			if(actions.moreActions !== 0){ steps.push({ get: function(){ return document.getElementById(id_actionsLeft + self.playerIndex); }, txt: plural(actions.moreActions, 'Action'), tint: '#8ecae6' }); }
			if(actions.moreBuys !== 0){ steps.push({ get: function(){ return document.getElementById(id_buysLeft + self.playerIndex); }, txt: plural(actions.moreBuys, 'Buy'), tint: '#b8e0a0' }); }
			if(actions.moreGold !== 0){ steps.push({ get: function(){ return document.getElementById(id_money + self.playerIndex); }, txt: '+$' + actions.moreGold, tint: '#e2b13c' }); }
			steps.forEach(function(s, i){
				setTimeout(function(){
					var el = s.get();
					floatGain(el, s.txt, s.tint);
					if(typeof bumpCounter === 'function'){ bumpCounter(el); }
				}, 190 * i);
			});
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
			createButton('Mine Action: <br> Press to Skip', 'mineUpgradeIDSkip', id_interact + this.playerIndex, (function(){
				var currentDeck = getPlayer(turn).cards;
				currentDeck.activeActionCard = '';
				deleteButton('mineUpgradeID', id_interact + currentDeck.playerIndex);
				deleteButton('mineUpgradeIDSkip', id_interact + currentDeck.playerIndex);
				var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
				for(var i = 0; i < cardDivs.length; i++){
					var imgID = getIDImgFromDiv(cardDivs[i].id);
					modifyCSSID('remove', imgID + id_div, 'selected');
				}
				currentDeck.checkIfPhaseDone();
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
						modifyCSSID('add', id_card + card.id + id_div, 'selected');
						deleteButton('mineUpgradeID', id_interact + currentDeck.playerIndex);
						createButton('Upgrade ' + card.name + '?', 'mineUpgradeID', id_interact + currentDeck.playerIndex, (function(){
							deleteButton('mineUpgradeID', id_interact + currentDeck.playerIndex);
							deleteButton('mineUpgradeIDSkip', id_interact + currentDeck.playerIndex);
							// Upgrade the chosen treasure card
							let newCard = '';
							if(card.name === 'Copper'){
								newCard = generateNewCard(cards_global.get('Silver'));
							} else if(card.name === 'Silver'){
								newCard = generateNewCard(cards_global.get('Gold'));
							}
							modifyCSSID('remove', id_card + card.id + id_div, 'selected');
							currentDeck.hand.useCard(card); // Trash this card
							currentDeck.addNewCard(newCard, false); // Add card to hand instead of discard pile
							currentDeck.activeActionCard = '';
							updateTextPrint(currentDeck.playerIndex, 'Upgraded ' + card.name + ' to ' + newCard.name + '!');
							// Check next phase
							currentDeck.updateHTMLElements();
							setTimeout(function(){
								currentDeck.checkIfPhaseDone(); // Mine
							}, useCardAnimationTime); 
						}).bind(this), 'interactButton');
					}
				}
			});
		} else if(card.name === 'Chapel'){
			this.activeActionCard = card.id;
			createButton('Chapel Action: <br> Press to Skip', 'chapelIDSkip', id_interact + this.playerIndex, (function(){
				var currentDeck = getPlayer(turn).cards;
				currentDeck.activeActionCard = '';
				deleteButton('chapelID', id_interact + currentDeck.playerIndex);
				deleteButton('chapelIDSkip', id_interact + currentDeck.playerIndex);
				var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
				for(var i = 0; i < cardDivs.length; i++){
					var imgID = getIDImgFromDiv(cardDivs[i].id);
					modifyCSSID('remove', imgID + id_div, 'selected');
				}
				currentDeck.checkIfPhaseDone();
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
						modifyCSSID('toggle', id_card + card.id + id_div, 'selected');
						deleteButton('chapelID', id_interact + currentDeck.playerIndex); // Check me
						createButton('Trash the selected cards', 'chapelID', id_interact + currentDeck.playerIndex, (function(){
							deleteButton('chapelID', id_interact + currentDeck.playerIndex);
							deleteButton('chapelIDSkip', id_interact + currentDeck.playerIndex);

							var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
							var counter = 0;
							for(var i = cardDivs.length-1; i >= 0; i--){
								var imgID = getIDImgFromDiv(cardDivs[i].id);
								if(document.getElementById(imgID + id_div).classList.contains('selected')){
									counter++;
									modifyCSSID('remove', imgID + id_div, 'selected');
									var tempCard = getPlayerCard(currentDeck.playerIndex, getIDFromCard(imgID));
									currentDeck.hand.useCard(tempCard); // Trash this card
								}
							}
							currentDeck.activeActionCard = '';
							updateTextPrint(currentDeck.playerIndex, 'Trashed ' + counter + ' cards!');
							// Check next phase
							currentDeck.updateHTMLElements();
							setTimeout(function(){
								currentDeck.checkIfPhaseDone(); // Chapel
							}, useCardAnimationTime); 
						}).bind(this), 'interactButton');
					}
				}
			});
		} else if(card.name === 'Cellar'){
			this.activeActionCard = card.id;
			createButton('Cellar Action: <br> Press to Skip', 'cellarIDSkip', id_interact + this.playerIndex, (function(){
				var currentDeck = getPlayer(turn).cards;
				currentDeck.activeActionCard = '';
				deleteButton('cellarID', id_interact + currentDeck.playerIndex);
				deleteButton('cellarIDSkip', id_interact + currentDeck.playerIndex);
				var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
				for(var i = 0; i < cardDivs.length; i++){
					var imgID = getIDImgFromDiv(cardDivs[i].id);
					modifyCSSID('remove', imgID + id_div, 'selected');
				}
				currentDeck.checkIfPhaseDone();
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
						modifyCSSID('toggle', id_card + card.id + id_div, 'selected');
						deleteButton('cellarID', id_interact + currentDeck.playerIndex); // Check me
						createButton('Exchange Selected Cards', 'cellarID', id_interact + currentDeck.playerIndex, (function(){
							deleteButton('cellarID', id_interact + currentDeck.playerIndex);
							deleteButton('cellarIDSkip', id_interact + currentDeck.playerIndex);
							
							var cardDivs = document.getElementById(id_hand + currentDeck.playerIndex).childNodes;
							var counter = 0;
							for(var i = cardDivs.length-1; i >= 0; i--){
								var imgID = getIDImgFromDiv(cardDivs[i].id);
								if(document.getElementById(imgID + id_div).classList.contains('selected')){
									counter++;
									modifyCSSID('remove', imgID + id_div, 'selected');
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
							setTimeout(function(){
								currentDeck.checkIfPhaseDone(); // Cellar
							}, useCardAnimationTime); 
						}).bind(this), 'interactButton');
					}
				}
			});
		}
		else{ // Check next phase, no more inputs required from user
			// Make sure it is after animation is finished
			getPlayer(turn).cards.checkIfPhaseDone();
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

		renderCard(card, id_board + card.id, id_board + this.playerIndex, { size: 'board' });

		// Remove Use action button
		deleteButton('playActionID', id_interact + this.playerIndex);
	}
}

function Hand(deckOfCards){
	this.amount = 0;
	this.allCards = new Map(); // Map over cards from id:s
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
		var rootId = id_card + card.id;
		var div = document.getElementById(rootId + id_div);
		if(div){ div.style.opacity = '0'; div.style.transition = 'opacity ' + (prefersReducedMotion()?'1ms':'180ms'); }
		var playerIndex = this.deckOfCards.playerIndex;
		setTimeout(function(){
			if(div && div.parentNode){ div.parentNode.removeChild(div); }
			reflowHand(document.getElementById(id_hand + playerIndex));
		}, prefersReducedMotion()?1:180);
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

	this.discardHandAnimation = function(){
		var listOfCards = this.getHand();
		var pid = this.deckOfCards.playerIndex;
		var handEl = document.getElementById(id_hand + pid);
		var discard = discardAnchorEl(pid);
		var flights = listOfCards.map(function(card){
			var rootId = id_card + card.id;
			return flyCard(rootId, document.getElementById(rootId + id_div), discard, {fade:true}).then(function(){
				var el = document.getElementById(rootId + id_div);
				if(el && el.parentNode){ el.parentNode.removeChild(el); }
			});
		});
		return Promise.all(flights);
	}
}