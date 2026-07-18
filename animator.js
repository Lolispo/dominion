// Author Petter Andersson
'use strict'

function prefersReducedMotion(){
	return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rectOf(el){ return el.getBoundingClientRect(); }

// Short scale pulse to draw attention when a counter (money/actions/buys) increases.
function bumpCounter(el){
	if(!el || prefersReducedMotion()){ return; }
	el.animate([{ transform:'scale(1)' },{ transform:'scale(1.35)' },{ transform:'scale(1)' }],
		{ duration: 260, easing: 'ease-out' });
}

// Fly a clone of a card from fromEl's position to toEl's position.
function flyCard(cardRootId, fromEl, toEl, opts){
	opts = opts || {};
	return new Promise(function(resolve){
		var source = document.getElementById(cardRootId + '_div');
		var layer = document.getElementById('flight-layer');
		if(!fromEl || !toEl || !layer){ return resolve(); }

		var from = rectOf(fromEl), to = rectOf(toEl);
		var clone = source ? source.cloneNode(true) : document.createElement('div');
		clone.id = ''; clone.classList.add('dcard');
		clone.querySelectorAll('[id]').forEach(function(n){ n.id = ''; });
		clone.style.visibility = 'visible';
		clone.style.left = from.left + 'px';
		clone.style.top  = from.top + 'px';
		clone.style.width = from.width + 'px';
		clone.style.height = from.height + 'px';
		layer.appendChild(clone);

		var dx = to.left - from.left, dy = to.top - from.top;
		var scale = to.width / Math.max(from.width, 1);
		var dur = prefersReducedMotion() ? 1 : 380;

		var anim = clone.animate([
			{ transform: 'translate(0,0) scale(1)', opacity: 1 },
			{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')', opacity: opts.fade ? 0 : 1 }
		], { duration: dur, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });

		anim.onfinish = function(){ if(clone.parentNode){ clone.parentNode.removeChild(clone); } resolve(); };
	});
}

// Deal a card face-DOWN from the deck and flip it face-up as it lands (the "being dealt" feel).
// Deals are queued and started with a stagger, so a 5-card draw cascades one card at a time.
var _dealQueue = [];
var _dealPlaying = false;
var DEAL_STAGGER = 135; // ms between successive deal starts
var DEAL_DURATION = 560;

function flyCardDeal(cardRootId, fromEl, toEl){
	return new Promise(function(resolve){
		var source = document.getElementById(cardRootId + '_div');
		var layer = document.getElementById('flight-layer');
		if(!fromEl || !toEl || !layer || !source || prefersReducedMotion()){ return resolve(); }
		_dealQueue.push({ cardRootId: cardRootId, fromEl: fromEl, toEl: toEl, resolve: resolve });
		if(!_dealPlaying){ _playDealQueue(); }
	});
}

function _playDealQueue(){
	if(_dealQueue.length === 0){ _dealPlaying = false; return; }
	_dealPlaying = true;
	_animateDeal(_dealQueue.shift());      // start one flight (non-blocking)
	setTimeout(_playDealQueue, DEAL_STAGGER); // next card starts after the stagger, overlapping this one
}

// Build and run a single face-down flip flight. Rects are read at play time so staggered cards land correctly.
function _animateDeal(item){
	var source = document.getElementById(item.cardRootId + '_div');
	var layer = document.getElementById('flight-layer');
	if(!source || !layer){ return item.resolve(); }
	if(typeof sfxDeal === 'function'){ sfxDeal(); }

	var from = rectOf(item.fromEl), to = rectOf(item.toEl);
	var dx = to.left - from.left, dy = to.top - from.top;

	var wrap = document.createElement('div');
	wrap.className = 'deal-flight';
	wrap.style.left = from.left + 'px';
	wrap.style.top  = from.top + 'px';
	wrap.style.width  = to.width + 'px';
	wrap.style.height = to.height + 'px';

	var flip = document.createElement('div');
	flip.className = 'deal-flip';

	var back = document.createElement('div');
	back.className = 'deal-face dcard-back';

	var front = source.cloneNode(true);
	front.id = '';
	front.querySelectorAll('[id]').forEach(function(n){ n.id = ''; });
	front.classList.add('deal-face', 'deal-front');
	front.style.visibility = 'visible';
	front.style.margin = '0';
	front.style.width = '100%';
	front.style.height = '100%';

	flip.appendChild(back);
	flip.appendChild(front);
	wrap.appendChild(flip);
	layer.appendChild(wrap);

	// Clean straight glide from the deck to the card's slot (no mid-flight balloon).
	wrap.animate([
		{ transform: 'translate(0,0) scale(.9)' },
		{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)' }
	], { duration: DEAL_DURATION, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });

	// Hold face-down for the first half, then flip to reveal the face on landing.
	var flipAnim = flip.animate([
		{ transform: 'rotateY(0deg)' },
		{ transform: 'rotateY(0deg)', offset: 0.5 },
		{ transform: 'rotateY(180deg)' }
	], { duration: DEAL_DURATION, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });

	flipAnim.onfinish = function(){ if(wrap.parentNode){ wrap.parentNode.removeChild(wrap); } item.resolve(); };
}

// Floating "+N" chip that rises and fades from an element — shows a gained resource.
function floatGain(el, text, tint){
	if(!el || prefersReducedMotion()){ return; }
	var layer = document.getElementById('flight-layer');
	if(!layer){ return; }
	var r = el.getBoundingClientRect();
	var chip = document.createElement('div');
	chip.className = 'gain-chip';
	chip.innerHTML = text;
	if(tint){ chip.style.color = tint; }
	chip.style.left = (r.left + r.width / 2) + 'px';
	chip.style.top = (r.top - 4) + 'px';
	layer.appendChild(chip);
	var a = chip.animate([
		{ opacity: 0, transform: 'translate(-50%,0) scale(.8)' },
		{ opacity: 1, transform: 'translate(-50%,-16px) scale(1)', offset: .25 },
		{ opacity: 1, transform: 'translate(-50%,-34px) scale(1)', offset: .7 },
		{ opacity: 0, transform: 'translate(-50%,-52px) scale(1)' }
	], { duration: 1000, easing: 'ease-out' });
	a.onfinish = function(){ if(chip.parentNode){ chip.parentNode.removeChild(chip); } };
}

// Big centered flash announcing whose turn it is.
function showTurnFlash(text, color){
	var layer = document.getElementById('flight-layer');
	if(!layer){ return; }
	var el = document.createElement('div');
	el.className = 'turn-flash';
	el.innerHTML = text;
	if(color){ el.style.borderColor = color; }
	layer.appendChild(el);
	var dur = prefersReducedMotion() ? 700 : 1500;
	var a = el.animate([
		{ opacity: 0, transform: 'translate(-50%,-50%) scale(.82)' },
		{ opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .18 },
		{ opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .72 },
		{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.06)' }
	], { duration: dur, easing: 'ease-out' });
	a.onfinish = function(){ if(el.parentNode){ el.parentNode.removeChild(el); } };
}

// Re-deal a player's existing hand from their deck pile — the "being dealt your hand" moment at turn start.
function dealInHand(pid){
	var hand = document.getElementById(id_hand + pid);
	var deck = deckAnchorEl(pid);
	if(!hand || !deck || prefersReducedMotion()){ return; }
	Array.prototype.slice.call(hand.children).forEach(function(div){
		if(!div.id){ return; }
		var rootId = div.id.slice(0, -id_div.length); // 'card_<id>_div' -> 'card_<id>'
		div.style.visibility = 'hidden';
		flyCardDeal(rootId, deck, div).then(function(){ div.style.visibility = 'visible'; });
	});
}

// Pop (scale up briefly) a played action card before its effects resolve.
function popCard(cardRootId){
	return new Promise(function(resolve){
		var div = document.getElementById(cardRootId + '_div');
		if(!div || prefersReducedMotion()){ return resolve(); }
		var a = div.animate([
			{ transform:'scale(1)' }, { transform:'scale(1.25)', offset:.4 }, { transform:'scale(1)' }
		], { duration: 420, easing:'cubic-bezier(.22,.61,.36,1)' });
		a.onfinish = resolve;
	});
}

// FLIP: cards in handEl glide to their new positions after a DOM change.
function reflowHand(handEl){
	return new Promise(function(resolve){
		if(!handEl || prefersReducedMotion()){ return resolve(); }
		var kids = Array.prototype.slice.call(handEl.children);
		var first = kids.map(rectOf);
		requestAnimationFrame(function(){
			var pending = 0;
			kids.forEach(function(el, i){
				var last = rectOf(el);
				var dx = first[i].left - last.left, dy = first[i].top - last.top;
				if(dx || dy){
					pending++;
					var a = el.animate([
						{ transform: 'translate(' + dx + 'px,' + dy + 'px)' },
						{ transform: 'translate(0,0)' }
					], { duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)' });
					a.onfinish = function(){ if(--pending === 0){ resolve(); } };
				}
			});
			if(pending === 0){ resolve(); }
		});
	});
}
