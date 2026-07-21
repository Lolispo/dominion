// Author Petter Andersson
// Slay-the-Spire-style read-only deck browser: view all cards a player owns.
'use strict'

function closeDeckBrowser(){
	var el = document.getElementById('deckBrowser');
	if(el && el.parentNode){ el.parentNode.removeChild(el); }
	document.removeEventListener('keydown', _deckBrowserKey);
}

function _deckBrowserKey(e){ if(e.key === 'Escape'){ closeDeckBrowser(); } }

function openDeckBrowser(pid){
	closeDeckBrowser(); // never stack two
	var player = getPlayer(pid);
	if(!player){ return; }
	var cards = player.cards.getAllOwnedCards();

	// Group by card name -> {card, count}
	var groups = new Map();
	cards.forEach(function(c){
		var g = groups.get(c.name);
		if(g){ g.count++; } else { groups.set(c.name, { card: c, count: 1 }); }
	});

	// Backdrop + panel
	var overlay = document.createElement('div');
	overlay.id = 'deckBrowser';
	overlay.className = 'deck-browser-overlay';
	overlay.addEventListener('click', function(e){ if(e.target === overlay){ closeDeckBrowser(); } });

	var panel = document.createElement('div');
	panel.className = 'deck-browser-panel';
	overlay.appendChild(panel);

	var header = document.createElement('div');
	header.className = 'deck-browser-header';
	header.innerHTML = '<span>' + player.name + "'s Deck (" + cards.length + ' cards)</span>';
	var close = document.createElement('button');
	close.type = 'button'; close.className = 'deck-browser-close normalButton'; close.innerHTML = '✕';
	close.addEventListener('click', closeDeckBrowser);
	header.appendChild(close);
	panel.appendChild(header);

	var grid = document.createElement('div');
	grid.id = 'deckBrowserGrid';
	grid.className = 'deck-browser-grid';
	panel.appendChild(grid);
	document.body.appendChild(overlay);

	// Sort by type then cost (matches the shop grouping), render read-only cards with a xN badge.
	var items = Array.from(groups.values()).sort(function(a, b){
		var oa = getCssOrderCard(a.card, 1), ob = getCssOrderCard(b.card, 1);
		if(oa !== ob){ return oa - ob; }
		return (a.card.getCost() || 0) - (b.card.getCost() || 0);
	});
	items.forEach(function(item, i){
		var cell = document.createElement('div');
		cell.id = 'db_cell_' + i;
		cell.className = 'deck-browser-cell';
		grid.appendChild(cell);
		renderCard(item.card, 'db_card_' + i, 'db_cell_' + i, { size: 'shop' });
		var badge = document.createElement('div');
		badge.className = 'deck-browser-count';
		badge.innerHTML = '×' + item.count;
		cell.appendChild(badge);
	});

	document.addEventListener('keydown', _deckBrowserKey);
}
