/* =====================================================================
   A little surprise for Jass — script.js
   ---------------------------------------------------------------------
   1.  Settings you can edit (name, letter, replies)
   2.  Small helpers
   3.  Floating hearts & sparkles, click bursts   (kept deliberately light)
   4.  Screen-to-screen transitions
   5.  Screen 1: name check + unlocking animation
   6.  Screen 2–3: welcome + envelope
   7.  Screen 4: letter + response choices
   8.  Screen 5: final screen
   9.  Pausing decorations when nobody can see them
   10. Gentle music (Web Audio API, OFF until the visitor taps the toggle)

   Performance notes
   - Every animation is CSS (transform / opacity only). JavaScript never animates per frame.
   - Few decorative elements; fewer still on phones.
   - Events are delegated or attached once; one-shot buttons remove their own listener.
   - Nothing runs in the background: hidden tab, hidden screen and the unlocking overlay
     all pause the decorations, and the music timer stops with the tab.
   ===================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     1. SETTINGS — edit these to change the experience
     ------------------------------------------------------------------ */
  const SECRET_NAME = 'jass';   // compared in lower case, so JASS / jass / Jass all work

  const UNLOCK_TEXT = {
    wrong: 'Oops! This little surprise is made especially for Jass 💌',
    empty: 'Please type your name first 💗'
  };

  // One entry = one paragraph. The first line is styled as the greeting,
  // the last line as the signature.
  const LETTER = [
    'Hey Jass,',
    'I don’t know exactly how you’re feeling right now, but I wanted to say that I’m genuinely sorry if I hurt you or made you feel bad.',
    'I never wanted things to become awkward between us. Your friendship matters to me, and I don’t want a misunderstanding or a mistake to affect it.',
    'I’m not making excuses. I just wanted to acknowledge your feelings and let you know that I care.',
    'You don’t have to reply immediately or forgive me just because I made this website. Take your time.',
    'I genuinely hope we can talk whenever you’re comfortable.',
    'I’m sorry, Jass. 💗'
  ];

  const REPLIES = {
    talk:  'That means a lot. Thank you for giving me a chance to talk. 💗',
    time:  'Of course. Take all the time you need. I’ll respect that. 🌷',
    later: 'That’s okay too. Whenever you’re comfortable. 💌'
  };


  /* ------------------------------------------------------------------
     2. HELPERS
     ------------------------------------------------------------------ */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rand = (min, max) => min + Math.random() * (max - min);
  const fix = (n, d = 0) => n.toFixed(d);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // Resolves after the browser has painted the current state (replaces forced reflows)
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const liteQuery   = window.matchMedia('(max-width: 820px), (pointer: coarse)');   // phones, tablets, touch screens
  const reduced = () => motionQuery.matches;
  const lite    = () => liteQuery.matches;
  // Shorten waits when the visitor prefers reduced motion
  const t = (ms) => (reduced() ? Math.min(ms, 150) : ms);

  // Lower-case, trim, collapse spaces, drop invisible characters
  const normalise = (s) =>
    s.normalize('NFKC').replace(/[​-‍﻿]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();


  /* ------------------------------------------------------------------
     3. FLOATING HEARTS, SPARKLES, BURSTS
     ------------------------------------------------------------------ */
  const fxLayer    = $('#fx');
  const burstLayer = $('#burst');

  // Few elements on purpose: this is plenty to look magical and keeps phones smooth.
  function buildAmbient() {
    if (!fxLayer) return;
    $$('.fx-item', fxLayer).forEach((el) => el.remove());          // safe to call again (e.g. reduced-motion toggled)

    const small = lite();
    const hearts = small ? 6 : 10;
    const sparks = small ? 7 : 14;
    const still = reduced();
    const frag = document.createDocumentFragment();

    for (let i = 0; i < hearts; i++) {
      const dur = rand(14, 26);
      const el = document.createElement('span');
      el.className = 'fx-item fx-heart c' + (1 + (i % 3)) + (still ? ' is-static' : '');
      el.style.cssText =
        `--x:${fix(rand(0, 94), 1)}%;--size:${fix(rand(12, 28))}px;--dur:${fix(dur, 1)}s;--delay:${fix(-rand(0, dur), 1)}s;` +
        `--drift:${fix(rand(-50, 70))}px;--rot:${fix(rand(-35, 35))}deg;--o:${still ? '.35' : fix(rand(.4, .8), 2)};--y:${fix(rand(4, 94))}%`;
      frag.appendChild(el);
    }

    for (let i = 0; i < sparks; i++) {
      const dur = rand(2.8, 5.4);
      const el = document.createElement('span');
      el.className = 'fx-item fx-spark c' + (1 + (i % 3)) + (still ? ' is-static' : '');
      el.style.cssText =
        `--x:${fix(rand(2, 94), 1)}%;--y:${fix(rand(3, 92), 1)}%;--size:${fix(rand(8, 18))}px;--dur:${fix(dur, 1)}s;` +
        `--delay:${fix(-rand(0, dur), 1)}s;--o:.4`;
      frag.appendChild(el);
    }

    fxLayer.appendChild(frag);                                      // one DOM insertion for everything
  }

  // One shared listener removes finished bursts / rain hearts (instead of one listener per particle)
  function cleanupParticle(e) {
    const el = e.target;
    if (el.classList && (el.classList.contains('burst-p') || el.classList.contains('rain-p'))) el.remove();
  }
  if (burstLayer) burstLayer.addEventListener('animationend', cleanupParticle);
  if (fxLayer)    fxLayer.addEventListener('animationend', cleanupParticle);

  // A little puff of hearts & sparkles at a screen position
  function burst(x, y, count = 10) {
    if (reduced() || !burstLayer) return;
    const n = lite() ? Math.max(3, Math.round(count * 0.6)) : count;
    if (burstLayer.childElementCount > (lite() ? 36 : 70)) return;  // never pile up
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(36, 96);
      const p = document.createElement('span');
      p.className = 'burst-p ' + (i % 3 === 0 ? 'spark' : 'heart');
      p.style.cssText =
        `left:${fix(x)}px;top:${fix(y)}px;--s:${fix(rand(9, 18))}px;--dx:${fix(Math.cos(angle) * dist)}px;` +
        `--dy:${fix(Math.sin(angle) * dist - 28)}px;--rot:${fix(rand(-60, 60))}deg`;
      frag.appendChild(p);
    }
    burstLayer.appendChild(frag);
  }

  function burstFrom(el, count) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count);
  }

  // A gentle shower of hearts rising from the bottom (final screen). Sits behind the cards.
  function rain(count = 14) {
    if (reduced() || !fxLayer) return;
    const n = lite() ? Math.round(count * 0.65) : count;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'rain-p';
      p.style.cssText =
        `--x:${fix(rand(2, 94), 1)}%;--s:${fix(rand(14, 28))}px;--dur:${fix(rand(3.2, 5.6), 1)}s;` +
        `--drift:${fix(rand(-60, 60))}px;--rot:${fix(rand(-40, 40))}deg;animation-delay:${fix(rand(0, 1.4), 2)}s`;
      frag.appendChild(p);
    }
    fxLayer.appendChild(frag);
  }

  // Tiny sparkle when a main button is pressed. Added after the press has been painted,
  // so the button itself always reacts first. (Choice buttons and the envelope burst on click.)
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest && e.target.closest('.btn');
    if (!btn || btn.disabled) return;
    const x = e.clientX, y = e.clientY;
    requestAnimationFrame(() => burst(x, y, 6));
  }, { passive: true });


  /* ------------------------------------------------------------------
     4. SCREEN TRANSITIONS
     ------------------------------------------------------------------ */
  let current = $('#screen-unlock');
  let transitioning = false;

  async function goTo(id) {
    const next = document.getElementById(id);
    if (!next || next === current || transitioning) return;
    transitioning = true;

    const prev = current;
    current = next;

    prev.classList.remove('is-active');                 // CSS pauses everything inside it
    prev.classList.add('is-leaving');
    await wait(t(600));
    prev.hidden = true;                                 // fully removed from rendering
    prev.classList.remove('is-leaving');

    next.hidden = false;
    next.scrollTop = 0;
    await nextFrame();                                  // let the browser lay it out, so the entrance animates
    next.classList.add('is-active');

    const focusTarget = $('[data-focus]', next);
    if (focusTarget) focusTarget.focus({ preventScroll: true });

    transitioning = false;
  }


  /* ------------------------------------------------------------------
     5. SCREEN 1 — NAME CHECK + UNLOCKING ANIMATION
     ------------------------------------------------------------------ */
  const unlockForm = $('#unlock-form');
  const nameInput  = $('#name-input');
  const unlockMsg  = $('#unlock-msg');
  const unlockCard = $('#unlock-card');
  let unlocking = false;

  function setUnlockMessage(text) {
    if (unlockMsg.textContent !== text) unlockMsg.textContent = text;
    unlockMsg.classList.toggle('show', Boolean(text));
  }

  function shakeCard() {
    if (reduced()) return;
    unlockCard.classList.add('shake');                  // removed again when the animation ends (see below)
  }
  unlockCard.addEventListener('animationend', (e) => {
    if (e.target === unlockCard) unlockCard.classList.remove('shake');
  });

  unlockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (unlocking) return;

    const typed = normalise(nameInput.value);
    if (!typed) {
      setUnlockMessage(UNLOCK_TEXT.empty);
      shakeCard();
      return;
    }
    if (typed === SECRET_NAME) {
      setUnlockMessage('');
      runUnlock();
    } else {
      setUnlockMessage(UNLOCK_TEXT.wrong);
      shakeCard();
    }
  });

  // Only touch the DOM when there is actually a message to clear
  nameInput.addEventListener('input', () => {
    if (unlockMsg.classList.contains('show')) setUnlockMessage('');
  });

  async function runUnlock() {
    unlocking = true;
    nameInput.blur();                                   // closes the phone keyboard

    const overlay = $('#unlocking');
    const label = $('#unlock-label');

    pausedByOverlay = true; syncPause();                // background decorations rest during the lock animation
    overlay.classList.add('show');
    await wait(t(300));
    overlay.classList.add('progress');                  // ring fills
    await wait(t(1650));
    overlay.classList.add('opened');                    // padlock opens
    label.textContent = 'Unlocked ✨';
    burst(window.innerWidth / 2, window.innerHeight / 2, 18);
    await wait(t(1000));

    const moving = goTo('screen-welcome');
    overlay.classList.remove('show');
    pausedByOverlay = false; syncPause();
    await moving;
    overlay.classList.remove('progress', 'opened');
  }


  /* ------------------------------------------------------------------
     6. SCREEN 2–3 — WELCOME + ENVELOPE
     ------------------------------------------------------------------ */
  $('#open-surprise').addEventListener('click', () => goTo('screen-envelope'), { once: true });

  const envelope = $('#envelope');
  const envScene = $('#env-scene');

  // {once:true}: the listener removes itself after the first tap, so double taps can't replay anything
  envelope.addEventListener('click', async () => {
    envelope.classList.add('open');
    envScene.classList.add('opened');
    envelope.setAttribute('aria-label', 'Envelope opened');
    burstFrom(envelope, 12);

    await wait(t(2400));                                // flap opens, letter slides up
    buildLetter();
    await goTo('screen-letter');
    revealLetter();
  }, { once: true });


  /* ------------------------------------------------------------------
     7. SCREEN 4 — LETTER + RESPONSE CHOICES
     ------------------------------------------------------------------ */
  const letterBody = $('#letter-body');
  const ask        = $('#ask');
  let letterBuilt = false;
  let letterRevealed = false;

  // The letter text is only put on the page after the name has been entered correctly.
  function buildLetter() {
    if (letterBuilt) return;
    letterBuilt = true;
    const frag = document.createDocumentFragment();
    LETTER.forEach((text, i) => {
      const p = document.createElement('p');
      p.textContent = text;
      p.style.setProperty('--i', i);
      if (i === 0) p.className = 'greeting';
      if (i === LETTER.length - 1) p.className = 'sign';
      frag.appendChild(p);
    });
    letterBody.appendChild(frag);
  }

  async function revealLetter() {
    if (letterRevealed) return;
    letterRevealed = true;
    letterBody.classList.add('show');                   // paragraphs fade in one by one (CSS transition delays)

    await wait(reduced() ? 200 : 600 + LETTER.length * 600 + 1100);
    ask.hidden = false;
    await nextFrame();
    ask.classList.add('show');
  }

  const choicesBox  = $('#choices');
  const reply       = $('#reply');
  const replyWrap   = $('#reply-wrap');
  const continueBtn = $('#continue');
  let chosen = null;

  // One listener for all three response buttons
  choicesBox.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice');
    if (!btn || btn.dataset.choice === chosen) return;  // same answer again: nothing to update
    chosen = btn.dataset.choice;

    $$('.choice', choicesBox).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    choicesBox.classList.add('has-choice');

    // Replace the reply (a fresh element re-plays its fade-in)
    const p = document.createElement('p');
    p.textContent = REPLIES[chosen];
    reply.replaceChildren(p);

    continueBtn.hidden = false;
    burstFrom(btn, chosen === 'talk' ? 16 : 10);
    replyWrap.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
  });

  continueBtn.addEventListener('click', async () => {
    await goTo('screen-final');
    rain(14);
  });


  /* ------------------------------------------------------------------
     8. SCREEN 5 — FINAL
     ------------------------------------------------------------------ */
  $('#reread').addEventListener('click', () => goTo('screen-letter'));


  /* ------------------------------------------------------------------
     9. PAUSING DECORATIONS NOBODY CAN SEE
        CSS already pauses animations on hidden screens. This adds the
        hidden browser tab and the unlocking overlay.
     ------------------------------------------------------------------ */
  let pausedByTab = false;
  let pausedByOverlay = false;

  function syncPause() {
    root.classList.toggle('fx-paused', pausedByTab || pausedByOverlay);
  }

  document.addEventListener('visibilitychange', () => {
    pausedByTab = document.hidden;
    syncPause();
    Music.setHidden(document.hidden);
  });

  // If the visitor changes "reduce motion" while the page is open, rebuild the decorations to match
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', buildAmbient);


  /* ------------------------------------------------------------------
     10. GENTLE MUSIC — generated locally with the Web Audio API.
         Nothing plays (and no audio context exists) until the visitor
         taps the toggle.
     ------------------------------------------------------------------ */
  const Music = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;

    // Chords (MIDI notes): Cmaj7 → Am7 → Fmaj7 → G, 8 seconds each
    const CHORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]];
    // Soft pentatonic melody notes (C D E G A C)
    const SCALE = [72, 74, 76, 79, 81, 84];
    const CHORD_LEN = 8;
    const LOOKAHEAD = 3.2;      // seconds of music scheduled ahead…
    const TICK_MS = 1000;       // …so the scheduler only wakes once a second

    let ctx = null, master = null, bus = null, timer = null, playing = false;
    let nextChordAt = 0, nextNoteAt = 0, chordIndex = 0, noteIndex = 2;

    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

    function build() {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      bus = ctx.createGain();

      const tone = ctx.createBiquadFilter();           // rounds off harsh highs
      tone.type = 'lowpass'; tone.frequency.value = 2400; tone.Q.value = .3;

      const echo = ctx.createDelay(1.5);               // soft, dreamy echo
      echo.delayTime.value = .46;
      const echoTone = ctx.createBiquadFilter();
      echoTone.type = 'lowpass'; echoTone.frequency.value = 1500;
      const feedback = ctx.createGain(); feedback.gain.value = .36;
      const wet = ctx.createGain();      wet.gain.value = .55;

      bus.connect(tone);
      tone.connect(master);
      tone.connect(echo);
      echo.connect(echoTone);
      echoTone.connect(feedback);
      feedback.connect(echo);
      echoTone.connect(wet);
      wet.connect(master);
      master.connect(ctx.destination);
    }

    // Warm pad note (two slightly detuned sine waves)
    function pad(freq, at) {
      [-5, 5].forEach((cents) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        o.detune.value = cents;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(0.024, at + 2.2);
        g.gain.setValueAtTime(0.024, at + CHORD_LEN - 0.5);
        g.gain.linearRampToValueAtTime(0.0001, at + CHORD_LEN + 2);
        o.connect(g); g.connect(bus);
        o.start(at); o.stop(at + CHORD_LEN + 2.1);
      });
    }

    // Soft music-box style note
    function pluck(freq, at) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.08, at + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
      o.connect(g); g.connect(bus);
      o.start(at); o.stop(at + 3.3);

      const o2 = ctx.createOscillator();               // tiny sparkle overtone
      const g2 = ctx.createGain();
      o2.type = 'sine';
      o2.frequency.value = freq * 2;
      g2.gain.setValueAtTime(0.0001, at);
      g2.gain.exponentialRampToValueAtTime(0.02, at + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
      o2.connect(g2); g2.connect(bus);
      o2.start(at); o2.stop(at + 1.5);
    }

    // Schedules a short window of music ahead of the audio clock
    function tick() {
      if (!ctx) return;
      const horizon = ctx.currentTime + LOOKAHEAD;
      while (nextChordAt < horizon) {
        CHORDS[chordIndex % CHORDS.length].forEach((m) => pad(mtof(m), nextChordAt));
        chordIndex++;
        nextChordAt += CHORD_LEN;
      }
      while (nextNoteAt < horizon) {
        noteIndex = Math.max(0, Math.min(SCALE.length - 1, noteIndex + Math.floor(Math.random() * 5) - 2));
        pluck(mtof(SCALE[noteIndex]), nextNoteAt);
        nextNoteAt += 1.2 + Math.random() * 1.8;
      }
    }

    function stopTimer() { clearInterval(timer); timer = null; }

    async function start() {
      if (!AC) return false;
      try {
        if (!ctx) build();
        await ctx.resume();
        const now = ctx.currentTime;
        nextChordAt = now + 0.15;
        nextNoteAt = now + 1.4;
        chordIndex = 0;
        stopTimer();
        tick();
        timer = setInterval(tick, TICK_MS);
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0.6, now + 1.6);   // gentle fade-in
        playing = true;
        return true;
      } catch (err) {
        return false;
      }
    }

    function stop() {
      if (!ctx) return;
      playing = false;
      stopTimer();
      const c = ctx, m = master, now = c.currentTime;
      m.gain.cancelScheduledValues(now);
      m.gain.setValueAtTime(m.gain.value, now);
      m.gain.linearRampToValueAtTime(0, now + 0.6);            // gentle fade-out
      setTimeout(() => {
        if (ctx === c && !playing) {                           // release the audio engine completely
          c.close().catch(() => {});
          ctx = master = bus = null;
        }
      }, 800);
    }

    // Tab hidden: suspend the audio engine AND the scheduler timer. Tab visible again: pick up where it left off.
    function setHidden(hidden) {
      if (!ctx) return;
      if (hidden) {
        stopTimer();
        ctx.suspend().catch(() => {});
      } else if (playing) {
        ctx.resume().catch(() => {});
        if (!timer) timer = setInterval(tick, TICK_MS);
      }
    }

    return { start, stop, setHidden, isPlaying: () => playing, supported: Boolean(AC) };
  })();

  const musicBtn   = $('#music-toggle');
  const musicLabel = $('.music-label', musicBtn);
  let musicBusy = false;

  function setMusicUI(on) {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicLabel.textContent = on ? 'Music on' : 'Music off';
  }

  if (!Music.supported) {
    musicBtn.disabled = true;
    musicLabel.textContent = 'No music';
  }

  musicBtn.addEventListener('click', async () => {
    if (musicBusy) return;                                     // ignore taps while the audio engine is starting
    musicBusy = true;
    if (Music.isPlaying()) {
      Music.stop();
      setMusicUI(false);
    } else {
      setMusicUI(await Music.start());
    }
    musicBusy = false;
  });


  /* ------------------------------------------------------------------
     START
     ------------------------------------------------------------------ */
  buildAmbient();
  requestAnimationFrame(() => {
    $('#screen-unlock').classList.add('is-active');
    // Desktop only: put the cursor in the name box (on phones this would pop the keyboard open)
    if (window.matchMedia('(pointer: fine)').matches) {
      setTimeout(() => nameInput.focus({ preventScroll: true }), 500);
    }
  });
})();
