/* =====================================================================
   A little surprise for Jass — script.js
   ---------------------------------------------------------------------
   1.  Settings you can edit (name, letter, replies)
   2.  Small helpers
   3.  Floating hearts & sparkles, click bursts
   4.  Screen-to-screen transitions
   5.  Screen 1: name check + unlocking animation
   6.  Screen 2–3: welcome + envelope
   7.  Screen 4: letter + response choices
   8.  Screen 5: final screen
   9.  Gentle music (Web Audio API, OFF until the visitor taps the toggle)
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
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;
  // Shorten waits when the visitor prefers reduced motion
  const t = (ms) => (reduced() ? Math.min(ms, 150) : ms);

  // Lower-case, trim, collapse spaces, drop invisible characters
  const normalise = (s) =>
    s.normalize('NFKC').replace(/[​-‍﻿]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();


  /* ------------------------------------------------------------------
     3. FLOATING HEARTS, SPARKLES, BURSTS
     ------------------------------------------------------------------ */
  function buildAmbient() {
    const fx = $('#fx');
    if (!fx) return;
    const small = window.innerWidth < 600;
    const heartCount = small ? 12 : 20;
    const sparkCount = small ? 14 : 26;
    const still = reduced();

    for (let i = 0; i < heartCount; i++) {
      const el = document.createElement('span');
      const dur = rand(13, 26);
      el.className = 'fx-item fx-heart c' + (1 + (i % 3));
      el.style.setProperty('--x', rand(0, 96).toFixed(1) + '%');
      el.style.setProperty('--size', rand(12, 30).toFixed(0) + 'px');
      el.style.setProperty('--dur', dur.toFixed(1) + 's');
      el.style.setProperty('--delay', (-rand(0, dur)).toFixed(1) + 's');   // negative = already mid-flight
      el.style.setProperty('--drift', rand(-50, 70).toFixed(0) + 'px');
      el.style.setProperty('--rot', rand(-35, 35).toFixed(0) + 'deg');
      el.style.setProperty('--o', rand(.4, .8).toFixed(2));
      if (still) { el.classList.add('is-static'); el.style.setProperty('--y', rand(4, 94).toFixed(0) + '%'); el.style.setProperty('--o', '.35'); }
      fx.appendChild(el);
    }

    for (let i = 0; i < sparkCount; i++) {
      const el = document.createElement('span');
      const dur = rand(2.6, 5.2);
      el.className = 'fx-item fx-spark c' + (1 + (i % 3));
      el.style.setProperty('--x', rand(2, 96).toFixed(1) + '%');
      el.style.setProperty('--y', rand(3, 94).toFixed(1) + '%');
      el.style.setProperty('--size', rand(8, 20).toFixed(0) + 'px');
      el.style.setProperty('--dur', dur.toFixed(1) + 's');
      el.style.setProperty('--delay', (-rand(0, dur)).toFixed(1) + 's');
      if (still) { el.classList.add('is-static'); el.style.setProperty('--o', '.4'); }
      fx.appendChild(el);
    }
  }

  // A little puff of hearts & sparkles at a screen position
  function burst(x, y, count = 10) {
    if (reduced()) return;
    const layer = $('#burst');
    if (!layer || layer.childElementCount > 90) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const angle = rand(0, Math.PI * 2);
      const dist = rand(36, 96);
      p.className = 'burst-p ' + (i % 3 === 0 ? 'spark' : 'heart');
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--s', rand(9, 18).toFixed(0) + 'px');
      p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(0) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist - 28).toFixed(0) + 'px');
      p.style.setProperty('--rot', rand(-60, 60).toFixed(0) + 'deg');
      p.addEventListener('animationend', () => p.remove(), { once: true });
      layer.appendChild(p);
    }
  }

  function burstFrom(el, count) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count);
  }

  // A gentle shower of hearts rising from the bottom (used on the final screen)
  function rain(count = 18) {
    if (reduced()) return;
    const layer = $('#fx');                      // behind the card, so hearts never cover the words
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'rain-p';
      p.style.setProperty('--x', rand(2, 96).toFixed(1) + '%');
      p.style.setProperty('--s', rand(14, 30).toFixed(0) + 'px');
      p.style.setProperty('--dur', rand(3.2, 5.6).toFixed(1) + 's');
      p.style.setProperty('--drift', rand(-60, 60).toFixed(0) + 'px');
      p.style.setProperty('--rot', rand(-40, 40).toFixed(0) + 'deg');
      p.style.animationDelay = rand(0, 1.4).toFixed(2) + 's';
      p.addEventListener('animationend', () => p.remove(), { once: true });
      layer.appendChild(p);
    }
  }

  // Tiny sparkle on every button press (pointer only; keyboard users just get the normal focus ring)
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('.btn, .choice, .envelope');
    if (target && !target.disabled) burst(e.clientX, e.clientY, 6);
  });


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

    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    await wait(t(600));
    prev.hidden = true;
    prev.classList.remove('is-leaving');

    next.hidden = false;
    next.scrollTop = 0;
    void next.offsetWidth;                       // force a reflow so the entrance animates
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
    unlockMsg.textContent = text;
    unlockMsg.classList.toggle('show', Boolean(text));
  }

  function shakeCard() {
    if (reduced()) return;
    unlockCard.classList.remove('shake');
    void unlockCard.offsetWidth;
    unlockCard.classList.add('shake');
  }

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

  nameInput.addEventListener('input', () => setUnlockMessage(''));

  async function runUnlock() {
    unlocking = true;
    nameInput.blur();                            // closes the phone keyboard

    const overlay = $('#unlocking');
    const label = $('#unlock-label');

    overlay.classList.add('show');
    await wait(t(300));
    overlay.classList.add('progress');           // ring fills
    await wait(t(1650));
    overlay.classList.add('opened');             // padlock opens
    label.textContent = 'Unlocked ✨';
    burst(window.innerWidth / 2, window.innerHeight / 2, 18);
    await wait(t(1000));

    const moving = goTo('screen-welcome');
    overlay.classList.remove('show');
    await moving;
    overlay.classList.remove('progress', 'opened');
  }


  /* ------------------------------------------------------------------
     6. SCREEN 2–3 — WELCOME + ENVELOPE
     ------------------------------------------------------------------ */
  $('#open-surprise').addEventListener('click', () => goTo('screen-envelope'));

  const envelope = $('#envelope');
  const envScene = $('#env-scene');
  let envelopeOpened = false;

  envelope.addEventListener('click', async () => {
    if (envelopeOpened) return;
    envelopeOpened = true;

    envelope.classList.add('open');
    envScene.classList.add('opened');
    envelope.setAttribute('aria-label', 'Envelope opened');
    burstFrom(envelope, 12);

    await wait(t(2400));                         // flap opens, letter slides up
    buildLetter();
    await goTo('screen-letter');
    revealLetter();
  });


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
    LETTER.forEach((text, i) => {
      const p = document.createElement('p');
      p.textContent = text;
      p.style.setProperty('--i', i);
      if (i === 0) p.className = 'greeting';
      if (i === LETTER.length - 1) p.className = 'sign';
      letterBody.appendChild(p);
    });
  }

  function revealLetter() {
    if (letterRevealed) return;
    letterRevealed = true;
    letterBody.classList.add('show');            // paragraphs fade in one by one (CSS transition delays)

    const total = reduced() ? 200 : 600 + LETTER.length * 600 + 1100;
    setTimeout(() => {
      ask.hidden = false;
      void ask.offsetWidth;
      ask.classList.add('show');
    }, total);
  }

  const choiceButtons = $$('.choice');
  const choicesBox    = $('#choices');
  const reply         = $('#reply');
  const replyWrap     = $('#reply-wrap');
  const continueBtn   = $('#continue');

  choiceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.choice;

      choiceButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      choicesBox.classList.add('has-choice');

      // Replace the reply (a new element re-plays its fade-in)
      reply.textContent = '';
      const p = document.createElement('p');
      p.textContent = REPLIES[key];
      reply.appendChild(p);

      continueBtn.hidden = false;
      burstFrom(btn, key === 'talk' ? 16 : 10);
      replyWrap.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
    });
  });

  continueBtn.addEventListener('click', async () => {
    await goTo('screen-final');
    rain(18);
  });


  /* ------------------------------------------------------------------
     8. SCREEN 5 — FINAL
     ------------------------------------------------------------------ */
  $('#reread').addEventListener('click', () => goTo('screen-letter'));


  /* ------------------------------------------------------------------
     9. GENTLE MUSIC — generated locally with the Web Audio API.
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
      const horizon = ctx.currentTime + 1.6;
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

    async function start() {
      if (!AC) return false;
      try {
        if (!ctx) build();
        await ctx.resume();
        const now = ctx.currentTime;
        nextChordAt = now + 0.15;
        nextNoteAt = now + 1.4;
        chordIndex = 0;
        clearInterval(timer);
        tick();
        timer = setInterval(tick, 400);
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
      clearInterval(timer);
      const c = ctx, m = master, now = c.currentTime;
      m.gain.cancelScheduledValues(now);
      m.gain.setValueAtTime(m.gain.value, now);
      m.gain.linearRampToValueAtTime(0, now + 0.6);            // gentle fade-out
      setTimeout(() => {
        if (ctx === c && !playing) {
          c.close().catch(() => {});
          ctx = master = bus = null;
        }
      }, 800);
    }

    // Pause while the tab is hidden, resume when it comes back
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else if (playing) ctx.resume().catch(() => {});
    });

    return { start, stop, isPlaying: () => playing, supported: Boolean(AC) };
  })();

  const musicBtn   = $('#music-toggle');
  const musicLabel = $('.music-label', musicBtn);

  function setMusicUI(on) {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicLabel.textContent = on ? 'Music on' : 'Music off';
  }

  if (!Music.supported) {
    musicBtn.disabled = true;
    musicLabel.textContent = 'No music';
  }

  musicBtn.addEventListener('click', async () => {
    if (Music.isPlaying()) {
      Music.stop();
      setMusicUI(false);
    } else {
      const ok = await Music.start();
      setMusicUI(ok);
    }
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
