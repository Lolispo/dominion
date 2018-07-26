// Author Petter Andersson
'use strict'

var cards_global = new Map();
var cards_global_id = new Map();
var cards_capacity = new Map();

var cards_treasure = new Map();
var cards_victory = new Map();
var cards_action = new Map();

var card_capacity_action = 2; //10; // Testing
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
			return this.value;
		} else if(cardType === CardType.ACTION_CARD){
			//console.log(this.drawCards, this.moreActions, this.moreBuys, this.moreGold);
			// Check if exist
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
	// Garden

	// Action Cards
	var market = new Card('Market', CardType.ACTION_CARD);
	market.setCost(5);
	market.addDrawCards(1);
	market.addAction(1);
	market.addBuys(1);
	market.addGold(1);
	var laboratory = new Card('Laboratory', CardType.ACTION_CARD);
	laboratory.setCost(5);
	laboratory.addDrawCards(2);
	laboratory.addAction(1);
	var village = new Card('Village', CardType.ACTION_CARD);
	village.setCost(3);
	village.addDrawCards(1);
	village.addAction(2);
	var smithy = new Card('Smithy', CardType.ACTION_CARD);
	smithy.setCost(4);
	smithy.addDrawCards(3);
	
	// Add Cards
	cards_global = new Map();
	cards_global.set('Copper', copper);
	cards_global.set('Silver', silver);
	cards_global.set('Gold', gold);

	cards_global.set('Estate', estate);
	cards_global.set('Duchey', duchey);
	cards_global.set('Province', province);

	cards_global.set('Market', market);
	cards_global.set('Laboratory', laboratory);
	cards_global.set('Village', village);
	cards_global.set('Smithy', smithy);


	cards_global_id = new Map();
	cards_global_id.set(copper.id, copper);
	cards_global_id.set(silver.id, silver);
	cards_global_id.set(gold.id, gold);

	cards_global_id.set(estate.id, estate);
	cards_global_id.set(duchey.id, duchey);
	cards_global_id.set(province.id, province);

	cards_global_id.set(market.id, market);
	cards_global_id.set(laboratory.id, laboratory);
	cards_global_id.set(village.id, village);
	cards_global_id.set(smithy.id, smithy);

	
	cards_capacity = new Map();
	cards_capacity.set('Copper', card_capacity_infinite);
	cards_capacity.set('Silver', card_capacity_infinite);
	cards_capacity.set('Gold', card_capacity_infinite);

	cards_capacity.set('Estate', card_capacity_infinite);
	cards_capacity.set('Duchey', card_capacity_victory);
	cards_capacity.set('Province', card_capacity_victory);

	cards_capacity.set('Market', card_capacity_action);
	cards_capacity.set('Laboratory', card_capacity_action);
	cards_capacity.set('Village', card_capacity_action);
	cards_capacity.set('Smithy', card_capacity_action);

	
	cards_treasure = new Map();
	cards_treasure.set('Copper', copper);
	cards_treasure.set('Silver', silver);
	cards_treasure.set('Gold', gold);

	cards_victory = new Map();
	cards_victory.set('Estate', estate);
	cards_victory.set('Duchey', duchey);
	cards_victory.set('Province', province);

	cards_action = new Map();
	cards_action.set('Market', market);
	cards_action.set('Laboratory', laboratory);
	cards_action.set('Village', village);
	cards_action.set('Smithy', smithy);
}