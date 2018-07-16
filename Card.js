// Author Petter Andersson
'use strict'

var Cards = new Map();
var Cards_Treasure = new Map();
var Cards_Victory = new Map();
var Cards_Action = new Map();

var CardType = {
	TREASURE_CARD: 0,
	VICTORY_CARD: 1,
	ACTION_CARD: 2,
	properties: {
		0: {name: "treasure", value: 0},
		1: {name: "victory", value: 1},
		2: {name: "action", value: 2}
	}
};

function Card(name, cardType){
	this.name = name;
	this.cardType = cardType;
	this.value;
	this.cost;

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
		} else if(cardType === ACTION_CARD){
			console.log(this.drawCards, this.moreActions, this.moreBuys, this.moreGold);
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

function initCards(){
	// Treasure Cards
	var copper = new Card("Copper", CardType.TREASURE_CARD);
	copper.setValue(1);
	copper.setCost(0);
	var silver = new Card("Silver", CardType.TREASURE_CARD);
	silver.setValue(2);
	silver.setCost(3);
	var gold = new Card("Gold", CardType.TREASURE_CARD);
	gold.setValue(3);
	gold.setCost(6);

	// Victory Cards
	var estate = new Card("Estate", CardType.VICTORY_CARD);
	estate.setValue(1);
	estate.setCost(2);
	var duchey = new Card("Duchey", CardType.VICTORY_CARD);
	duchey.setValue(3);
	duchey.setCost(5);
	var province = new Card("Province", CardType.VICTORY_CARD);
	province.setValue(6);
	province.setCost(8);
	// Garden

	// Action Cards
	var market = new Card("Market", CardType.ACTION_CARD);
	market.setCost(5);
	market.addDrawCards(1);
	market.addAction(1);
	market.addBuys(1);
	market.addGold(1);
	var laboratory = new Card("Laboratory", CardType.ACTION_CARD);
	laboratory.setCost(5);
	laboratory.addDrawCards(2);
	laboratory.addAction(1);
	var village = new Card("Village", CardType.ACTION_CARD);
	village.setCost(3);
	village.addDrawCards(1);
	village.addAction(2);
	var smithy = new Card("Smithy", CardType.ACTION_CARD);
	smithy.setCost(4);
	smithy.addDrawCards(3);
	

	// Add Cards
	Cards = new Map();
	Cards.set("Copper", copper);
	Cards.set("Silver", silver);
	Cards.set("Gold", gold);

	Cards.set("Estate", estate);
	Cards.set("Duchey", duchey);
	Cards.set("Province", province);

	Cards.set("Market", market);
	Cards.set("Laboratory", laboratory);
	Cards.set("Village", village);
	Cards.set("Smithy", smithy);

	Cards_Treasure = new Map();
	Cards_Treasure.set("Copper", copper);
	Cards_Treasure.set("Silver", silver);
	Cards_Treasure.set("Gold", gold);

	Cards_Victory = new Map();
	Cards_Victory.set("Estate", estate);
	Cards_Victory.set("Duchey", duchey);
	Cards_Victory.set("Province", province);

	Cards_Action = new Map();
	Cards_Action.set("Market", market);
	Cards_Action.set("Laboratory", laboratory);
	Cards_Action.set("Village", village);
	Cards_Action.set("Smithy", smithy);

	console.log('DEBUG @Card @initCards: ', Cards);
}