// Author Petter Andersson
'use strict'

var cards_global = new Map();
var cards_global_shop = new Map();
var cards_global_id = new Map();
var cards_capacity = new Map();

/*
var cards_treasure = new Map();
var cards_victory = new Map();
var cards_action = new Map();
*/

var card_capacity_action = 10; //10; // Testing
var card_capacity_victory = 12;
var card_capacity_infinite = 200; // Not more should be required

var global_card_id = 0;
var emptyPiles = 0;
var gameEndEmptyPiles = 3;
var card_capacity_show = 40;

var CardType = {
	TREASURE_CARD: 0,
	VICTORY_CARD: 1,
	ACTION_CARD: 2,
	properties: {
		0: {name: 'treasure', value: 0},
		1: {name: 'victory', value: 1},
		2: {name: 'action', value: 2}
	}
};


function getCapacity(card){
	return cards_capacity.get(card.name);
}

function getCapacityString(card){
	var cap = getCapacity(card);
	if(cap < card_capacity_show){
		return cap;
	}
	return '';
}

function generateNewCard(card){
	// Reduce capacity
	if(cards_capacity.get(card.name) > 0){
		var newCard = {  // Copy of card, with id field being new
			...card,
			id: global_card_id++
		};
		return newCard;		
	} else{
		return null;
	}
}

function updateCapacity(cardName, newValue){
	cards_capacity.set(cardName, newValue);
	if(newValue === 0){
		if(cardName === 'Province'){
			console.log('Game ending!');
			gameEnded = true;
			endGame();
		} else{
			emptyPiles++;
			if(emptyPiles === gameEndEmptyPiles){
				console.log('Game ending!');
				gameEnded = true;
				endGame();
			}			
		}
	}
}


function Card(name, cardType){
	this.id = global_card_id++;
	this.name = name;
	this.cardType = cardType;
	this.value;
	this.cost;
	this.additionalDesc = '';
	this.drawCards = 0;
	this.moreActions = 0;
	this.moreBuys = 0;
	this.moreGold = 0;

	this.setCost = function(value){
		this.cost = value;
	}

	this.getCost = function(){
		return this.cost;
	}

	this.setValue = function(value){
		if(cardType === CardType.ACTION_CARD){
			throw 'Cant set value for action card';
		} else{
			this.value = value;
		}
	}

	this.getValue = function(){
		if(cardType === CardType.TREASURE_CARD || cardType === CardType.VICTORY_CARD){
			if(this.additionalDesc != ''){
				return this.additionalDesc;
			}
			return this.value;
		} else if(cardType === CardType.ACTION_CARD){
			var s = '';
			if(this.drawCards != 0){
				s += '+' + this.drawCards + ' Cards\n';
			}
			if(this.moreActions != 0){
				s += '+' + this.moreActions + ' Actions\n';
			}
			if(this.moreBuys != 0){
				s += '+' + this.moreBuys + ' Buys\n';
			}
			if(this.moreGold != 0){
				s += '+$' + this.moreGold + '\n'; // Gold
			}
			if(this.additionalDesc != ''){
				s += this.additionalDesc;
			}
			return s;
		}
	}

	// New method, get actions, change getvalue to printable stuff / or other way around
	this.getActions = function(){
		if(cardType === CardType.ACTION_CARD){
			return {drawCards: this.drawCards, moreActions: this.moreActions, moreBuys: this.moreBuys, moreGold: this.moreGold};
		}
	}

	this.addDrawCards = function(cardsNum){
		this.drawCards += cardsNum;
	}

	this.addAction = function(actionNum){
		this.moreActions += actionNum;
	}

	this.addBuys = function(buysNum){
		this.moreBuys += buysNum;
	}

	this.addGold = function(goldNum){
		this.moreGold += goldNum;
	}

	this.addAdditionalDesc = function(string){
		this.additionalDesc += string + '\n';
	}
}

function storeCard(card, card_capacity_value, showInShop = true){
	cards_global.set(card.name, card);	
	if(showInShop){
		cards_global_shop.set(card.name, card);
	}
	cards_global_id.set(card.id, card);
	cards_capacity.set(card.name, card_capacity_value);
}

// Init Cards
function initCards(){
	// Treasure Cards
	var copper = new Card('Copper', CardType.TREASURE_CARD);
	copper.setValue(1);
	copper.setCost(0);
	var silver = new Card('Silver', CardType.TREASURE_CARD);
	silver.setValue(2);
	silver.setCost(3);
	var gold = new Card('Gold', CardType.TREASURE_CARD);
	gold.setValue(3);
	gold.setCost(6);

	// Victory Cards
	var estate = new Card('Estate', CardType.VICTORY_CARD);
	estate.setValue(1);
	estate.setCost(2);
	var duchey = new Card('Duchey', CardType.VICTORY_CARD);
	duchey.setValue(3);
	duchey.setCost(5);
	var province = new Card('Province', CardType.VICTORY_CARD);
	province.setValue(6);
	province.setCost(8);
	var garden = new Card('Garden', CardType.VICTORY_CARD);
	garden.setCost(4);
	garden.addAdditionalDesc('Cards / 10');
	var curse = new Card('Curse', CardType.VICTORY_CARD);
	curse.setCost(0);
	curse.setValue(-1);

	// Action Cards
	var village = new Card('Village', CardType.ACTION_CARD);
	village.setCost(3);
	village.addDrawCards(1);
	village.addAction(2);
	var woodCutter = new Card('WoodCutter', CardType.ACTION_CARD);
	woodCutter.setCost(3);
	woodCutter.addBuys(1);
	woodCutter.addGold(2);
	var smithy = new Card('Smithy', CardType.ACTION_CARD);
	smithy.setCost(4);
	smithy.addDrawCards(3);
	var councilRoom = new Card('CouncilRoom', CardType.ACTION_CARD);
	councilRoom.setCost(5);
	councilRoom.addDrawCards(4);
	councilRoom.addBuys(1);
	councilRoom.addAdditionalDesc('Each other player draws a card');
	var festival = new Card('Festival', CardType.ACTION_CARD);
	festival.setCost(5);
	festival.addAction(2);
	festival.addBuys(1);
	festival.addGold(2);
	var laboratory = new Card('Laboratory', CardType.ACTION_CARD);
	laboratory.setCost(5);
	laboratory.addDrawCards(2);
	laboratory.addAction(1);
	var market = new Card('Market', CardType.ACTION_CARD);
	market.setCost(5);
	market.addDrawCards(1);
	market.addAction(1);
	market.addBuys(1);
	market.addGold(1);
	var mine = new Card('Mine', CardType.ACTION_CARD);
	mine.setCost(5);
	mine.addAdditionalDesc('You may choose a Treasure card from your hand to upgrade to the next tier'); 
	// Mine original Desc: 'You may trash a Treasure from your hand. Gain a Treasure to your hand costing up to 3 more than it'
	var witch = new Card('Witch', CardType.ACTION_CARD);
	witch.setCost(5);
	witch.addDrawCards(2);
	witch.addAdditionalDesc('Each other player gains a Curse');

	// Add Cards
	cards_global = new Map();
	cards_global_shop = new Map();
	cards_global_id = new Map();
	cards_capacity = new Map();

	storeCard(copper, card_capacity_infinite);
	storeCard(silver, card_capacity_infinite);
	storeCard(gold, card_capacity_infinite);

	storeCard(estate, card_capacity_infinite);
	storeCard(duchey, card_capacity_victory);
	storeCard(province, card_capacity_victory);
	storeCard(garden, card_capacity_victory);
	storeCard(curse, card_capacity_infinite, false); // Don't show in shop

	storeCard(village, card_capacity_action);
	storeCard(woodCutter, card_capacity_action);
	storeCard(smithy, card_capacity_action);
	storeCard(councilRoom, card_capacity_action);
	storeCard(festival, card_capacity_action);
	storeCard(laboratory, card_capacity_action);
	storeCard(market, card_capacity_action);
	storeCard(mine, card_capacity_action);
	storeCard(witch, card_capacity_action);
}
