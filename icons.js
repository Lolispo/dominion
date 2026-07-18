// Author Petter Andersson
'use strict'

var CARD_ICONS = new Map();

function svgWrap(inner){
	return "<svg class='card-icon' viewBox='0 0 48 48' aria-hidden='true'>" + inner + "</svg>";
}

// Treasure cards - coin stacks scaled by tier (1 / 2 / 3 coins)
CARD_ICONS.set('Copper', svgWrap(
	"<circle cx='24' cy='30' r='11' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<text x='24' y='35' text-anchor='middle' font-size='12' fill='currentColor'>1</text>"));
CARD_ICONS.set('Silver', svgWrap(
	"<circle cx='18' cy='30' r='10' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<circle cx='30' cy='30' r='10' fill='none' stroke='currentColor' stroke-width='3'/>"));
CARD_ICONS.set('Gold', svgWrap(
	"<circle cx='24' cy='17' r='9' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<circle cx='15' cy='32' r='9' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<circle cx='33' cy='32' r='9' fill='none' stroke='currentColor' stroke-width='3'/>"));

// Victory cards - house silhouette scaled/embellished by tier
CARD_ICONS.set('Estate', svgWrap(
	"<path d='M24 12 L38 24 H33 V37 H15 V24 H10 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<rect x='21' y='29' width='6' height='8' fill='currentColor'/>"));
CARD_ICONS.set('Duchey', svgWrap(
	"<path d='M24 8 L41 23 H35 V39 H13 V23 H7 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<rect x='21' y='27' width='6' height='12' fill='currentColor'/>"));
CARD_ICONS.set('Province', svgWrap(
	"<path d='M24 5 L44 23 H37 V43 H11 V23 H4 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<rect x='21' y='29' width='6' height='14' fill='currentColor'/>" +
	"<rect x='13' y='27' width='5' height='5' fill='currentColor'/>" +
	"<rect x='30' y='27' width='5' height='5' fill='currentColor'/>" +
	"<line x1='24' y1='5' x2='24' y2='2' stroke='currentColor' stroke-width='2' stroke-linecap='round'/>" +
	"<path d='M24 2 L30 4 L24 6 Z' fill='currentColor'/>"));
CARD_ICONS.set('Garden', svgWrap(
	"<path d='M18 14 L28 22 H24 V32 H12 V22 H8 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<path d='M36 20 C42 22 42 32 36 34 C30 32 30 22 36 20 Z' fill='currentColor'/>" +
	"<line x1='36' y1='20' x2='36' y2='34' stroke='currentColor' stroke-width='1.5'/>"));
CARD_ICONS.set('Curse', svgWrap(
	"<circle cx='24' cy='20' r='12' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<circle cx='19' cy='19' r='2.5' fill='currentColor'/>" +
	"<circle cx='29' cy='19' r='2.5' fill='currentColor'/>" +
	"<rect x='16' y='30' width='16' height='8' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<line x1='21' y1='30' x2='21' y2='38' stroke='currentColor' stroke-width='2'/>" +
	"<line x1='27' y1='30' x2='27' y2='38' stroke='currentColor' stroke-width='2'/>"));

// Action cards - thematic glyphs
CARD_ICONS.set('Cellar', svgWrap(
	"<path d='M14 40 V20 A10 10 0 0 1 34 20 V40 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<circle cx='28' cy='30' r='1.8' fill='currentColor'/>" +
	"<path d='M18 26 L24 32 L30 26' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/>"));
CARD_ICONS.set('Chapel', svgWrap(
	"<rect x='21' y='8' width='6' height='32' fill='currentColor'/>" +
	"<rect x='12' y='18' width='24' height='6' fill='currentColor'/>"));
CARD_ICONS.set('Village', svgWrap(
	"<path d='M14 34 V24 L20 16 L26 24 V34 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<path d='M24 36 V24 L32 14 L40 24 V36 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>"));
CARD_ICONS.set('Wood Cutter', svgWrap(
	"<line x1='12' y1='42' x2='32' y2='10' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>" +
	"<path d='M28 8 L40 12 L32 22 L24 16 Z' fill='currentColor'/>"));
CARD_ICONS.set('Smithy', svgWrap(
	"<rect x='20' y='8' width='8' height='20' fill='currentColor'/>" +
	"<path d='M10 30 h28 l-4 8 h-20 z' fill='currentColor'/>"));
CARD_ICONS.set('Council Room', svgWrap(
	"<circle cx='24' cy='26' r='9' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<circle cx='24' cy='10' r='3.2' fill='currentColor'/>" +
	"<circle cx='24' cy='42' r='3.2' fill='currentColor'/>" +
	"<circle cx='7' cy='26' r='3.2' fill='currentColor'/>" +
	"<circle cx='41' cy='26' r='3.2' fill='currentColor'/>"));
CARD_ICONS.set('Festival', svgWrap(
	"<line x1='14' y1='8' x2='14' y2='42' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>" +
	"<path d='M14 10 H34 L27 17 L34 24 H14 Z' fill='currentColor'/>" +
	"<line x1='8' y1='42' x2='20' y2='42' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>"));
CARD_ICONS.set('Laboratory', svgWrap(
	"<path d='M20 6 H28 V17 L38 40 H10 L20 17 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<line x1='13' y1='32' x2='35' y2='32' stroke='currentColor' stroke-width='2'/>" +
	"<circle cx='20' cy='26' r='1.6' fill='currentColor'/>" +
	"<circle cx='28' cy='22' r='1.6' fill='currentColor'/>"));
CARD_ICONS.set('Market', svgWrap(
	"<line x1='8' y1='14' x2='40' y2='14' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>" +
	"<line x1='24' y1='14' x2='24' y2='36' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>" +
	"<line x1='16' y1='36' x2='32' y2='36' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>" +
	"<path d='M4 14 L8 24 L12 14' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>" +
	"<path d='M36 14 L40 24 L44 14' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>"));
CARD_ICONS.set('Mine', svgWrap(
	"<line x1='12' y1='42' x2='34' y2='12' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>" +
	"<path d='M10 18 Q24 2 40 14' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round'/>"));
CARD_ICONS.set('Witch', svgWrap(
	"<path d='M24 6 L35 34 H13 Z' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" +
	"<ellipse cx='24' cy='36' rx='16' ry='4' fill='none' stroke='currentColor' stroke-width='3'/>" +
	"<rect x='16' y='27' width='16' height='4' fill='currentColor'/>"));

// Per-type fallback for any unmapped name
function getCardIcon(card){
	if(CARD_ICONS.has(card.name)){
		return CARD_ICONS.get(card.name);
	}
	switch(card.cardType){
		case CardType.TREASURE_CARD:
			return CARD_ICONS.get('Copper');
		case CardType.VICTORY_CARD:
			return CARD_ICONS.get('Estate');
		case CardType.ACTION_CARD:
		default:
			return svgWrap("<circle cx='24' cy='24' r='14' fill='none' stroke='currentColor' stroke-width='3'/>");
	}
}
