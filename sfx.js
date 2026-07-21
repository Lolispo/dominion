// Author Petter Andersson
// Synthesized sound effects via the Web Audio API — no asset files, no dependencies.
'use strict'

var _actx = null;
var _sfxMuted = false;
var _VOL = 0.6; // master volume multiplier for all effects (tune here)

// Lazily create the audio context (starts suspended — no gesture needed to construct).
function _ctx(){
	if(!_actx){
		try { _actx = new (window.AudioContext || window.webkitAudioContext)(); }
		catch(e){ _actx = null; }
	}
	return _actx;
}

// Browsers require a user gesture to START audio. Resume the context on the first
// interaction so gameplay sounds (which follow clicks) play; sounds are skipped while
// the context is still suspended, which keeps the console free of autoplay warnings.
function _ready(){
	var c = _ctx();
	return !!(c && c.state === 'running');
}
(function _installGestureResume(){
	if(typeof window === 'undefined' || !window.addEventListener){ return; }
	var resume = function(){ var c = _ctx(); if(c && c.state === 'suspended'){ c.resume(); } };
	['pointerdown', 'keydown', 'touchstart'].forEach(function(ev){
		window.addEventListener(ev, resume, { passive: true });
	});
})();

function sfxMuted(){ return _sfxMuted; }
function sfxSetMuted(m){ _sfxMuted = !!m; }

// White-noise buffer source (for whoosh / shuffle).
function _noiseSource(ctx, seconds){
	var frames = Math.max(1, Math.floor(ctx.sampleRate * seconds));
	var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
	var data = buffer.getChannelData(0);
	for(var i = 0; i < frames; i++){ data[i] = Math.random() * 2 - 1; }
	var src = ctx.createBufferSource();
	src.buffer = buffer;
	return src;
}

// Short filtered-noise whoosh — a card being dealt.
function sfxDeal(){
	if(_sfxMuted || !_ready()){ return; }
	var ctx = _ctx();
	var t = ctx.currentTime;
	var src = _noiseSource(ctx, 0.16);
	var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.8;
	var g = ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(0.045 * _VOL, t + 0.02);
	g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
	src.connect(bp); bp.connect(g); g.connect(ctx.destination);
	src.start(t); src.stop(t + 0.15);
}

// A single soft blip — a coin/purchase.
function sfxBuy(){
	if(_sfxMuted || !_ready()){ return; }
	var ctx = _ctx();
	var t = ctx.currentTime;
	var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 1040;
	var g = ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(0.06 * _VOL, t + 0.01);
	g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
	o.connect(g); g.connect(ctx.destination);
	o.start(t); o.stop(t + 0.15);
}

// A richer two-note chime — an action card played.
function sfxAction(){
	if(_sfxMuted || !_ready()){ return; }
	var ctx = _ctx();
	var t = ctx.currentTime;
	[ {f: 523.25, at: 0.00}, {f: 783.99, at: 0.09} ].forEach(function(n){  // C5 then G5
		var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = n.f;
		var g = ctx.createGain();
		var s = t + n.at;
		g.gain.setValueAtTime(0.0001, s);
		g.gain.exponentialRampToValueAtTime(0.07 * _VOL, s + 0.02);
		g.gain.exponentialRampToValueAtTime(0.0001, s + 0.34);
		o.connect(g); g.connect(ctx.destination);
		o.start(s); o.stop(s + 0.36);
	});
}

// Soft noise swell — shuffling the deck.
function sfxShuffle(){
	if(_sfxMuted || !_ready()){ return; }
	var ctx = _ctx();
	var t = ctx.currentTime;
	var src = _noiseSource(ctx, 0.35);
	var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.2;
	var g = ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	// Two gentle swells to suggest riffling.
	[0.04, 0.20].forEach(function(off){
		g.gain.exponentialRampToValueAtTime(0.035 * _VOL, t + off);
		g.gain.exponentialRampToValueAtTime(0.008, t + off + 0.10);
	});
	g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
	src.connect(bp); bp.connect(g); g.connect(ctx.destination);
	src.start(t); src.stop(t + 0.35);
}
