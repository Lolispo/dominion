// Author Petter Andersson
'use strict'

var cardHandAmount = 5;

function Player(index){
	this.index = index;

	this.startTurn = function(){
		console.log('DEBUG: Starting turn for Player with index ' + this.index);
		this.cards.startTurn();
	}

	this.drawHand = function(){
		if(this.cards.getPhase() === 2){
			for(var i = 0; i < cardHandAmount; i++){
				this.cards.drawCard();
			}
			this.displayHand();			
		}
	}

	this.getCssClassCard = function(el, card){
		switch(card.cardType){
			case CardType.ACTION_CARD:
				addCSSClassEl(el, 'card_action');
				break;
			case CardType.VICTORY_CARD:
				addCSSClassEl(el, 'card_victory');
				break;
			case CardType.TREASURE_CARD:
			default:
				addCSSClassEl(el, 'card_treasure');
				break;
		}
	}

	this.displayHand = function(){
		var hand = this.cards.hand.getHand();
		updateTextPrint(this.index, 'Hand contains ' + hand.length + ' cards for Player ' + (this.index + 1));
		var handElement = document.getElementById('hand' + this.index);
		//updateTextPrint(this.index, 'DEBUG: Displaying hand! ');
		for(var i = 0; i < hand.length; i++){
			var el = document.createElement('div');
			el.id = "card_" + this.index + "_" + i;
			el.innerHTML = hand[i].name;
			this.getCssClassCard(el, hand[i]);
			el.classList.add('card');
			handElement.appendChild(el);
			el.addEventListener('click', function(res){
				var tempEl = document.getElementById(res.srcElement.id);
				if(tempEl.cardType === CardType.ACTION_CARD && isTurn(getPlayerFromCard(res.srcElement.id)) ) {
					// Add use card button
					updateTextPrint(this.index, 'Selected Action Card!');
					createButton(hand[i].name + "\nUse?", 'hand' + this.index, 'playActionID', (function(){
						updateTextPrint(this.index, 'Played Action Card ' + hand[i].name + '!');
						this.playActionCard(i, hand[i].name);
					}).bind(this));
				}
			});
			
		}
	}

	this.playActionCard = function(card_boardIndex, cardName){
		if(this.cards.getPhase() === 0){
			var hand = this.cards.hand.getHand();
			var card = hand[card_boardIndex];
			if(card.name === cardName){
				this.cards.useCard(card);		
			} else {
				// Find the cardName in hand and use that
				for(var i = 0; i < hand.length; i++){
					if(cardName === hand[i].name){
						this.cards.useCard(hand[i]);
					}
				}
			}			
		}
	}

	this.buyCard = function(){
		if(this.cards.getPhase() === 1){
			var card = Cards.get("Copper");
			// Choose card, generate a list of all available cards or something
			// 3 lists, one for every type

			// Check if you can afford card
			if(this.cards.money >= card.cost){
				// Confirm purchase
				createButton("Confirm Purchase for :\n" + card.name, "hand" + this.playerIndex, 'confirmPurchase', (function(){
					// Update money
					this.cards.money -= card.cost;
					this.cards.checkIfPhaseDone(false);
					// Add new card to discard pile
					this.cards.discard.push(card);
					updateTextPrint(this.playerIndex, 'Added card to deck: ' + card.name + 
						'! (' + (this.cards.money + card.cost) + ' - ' + card.cost + ' = ' + this.cards.money + ')');
					deleteButton('confirmPurchase', "hand" + this.playerIndex);
					deleteButton('cancelPurchase', "hand" + this.playerIndex);
				}).bind(this));
				createButton("Cancel Purchase", "hand" + this.playerIndex, 'cancelPurchase', (function(){
					deleteButton('confirmPurchase', "hand" + this.playerIndex);
					deleteButton('cancelPurchase', "hand" + this.playerIndex);
				}).bind(this));
			}
		}
	}

	this.initTextElement = function(){
		var div = document.getElementById('player' + this.index);
		var el = document.createElement('div');
		var text1 = document.createElement('div');
		var text2 = document.createElement('div');
		var text3 = document.createElement('div');
		text1.innerHTML = ('Player ' + (this.index + 1) + ' fst text\n');
		text2.innerHTML = ('Player ' + (this.index + 1) + ' snd text\n');
		text3.innerHTML = ('Player ' + (this.index + 1) + ' thr text\n');
		var textid = 'text' + this.index;
		el.id = textid;
		text1.id = textid + "_1";
		text2.id = textid + "_2";
		text3.id = textid + "_3";
		text1.classList.add('bold');
		text3.classList.add('third-message');
		el.appendChild(text1);
		el.appendChild(text2);
		el.appendChild(text3);
		div.appendChild(el);
	}



	this.initPlayer = function(){
		// Init HTML Elements
		initNewUIElement('player' + this.index, 'playArea', 'margin_bottom');
		this.initTextElement();
		initNewUIElement("board" + this.index, 'player' + this.index);
		initNewUIElement("hand" + this.index, 'player' + this.index, 'hand');
		initNewUIElement("info" + this.index, 'player' + this.index);
		initNewUIElement('money' + this.index, "info" + this.index);
		initNewUIElement('buysLeft' + this.index, "info" + this.index);
		initNewUIElement('actionsLeft' + this.index, "info" + this.index);
		// Init Deck of Cards
		this.cards = new DeckOfCards(index);
		this.cards.initDeck();
		console.log('Player ' + (this.index + 1) + ' created');
	}
}