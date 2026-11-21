// Tiny chiptune player (WebAudio): pulse lead, triangle bass, square arps, noise drums.
// All tunes are original compositions written for this game.

const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function freq(n) {
  const m = /^([A-G][#b]?)(\d)$/.exec(n); if (!m) return 0;
  return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
}
const bars = (arr) => arr.join(' ').split(/\s+/).filter(Boolean);

// '.' = rest, '-' = hold previous note. 16 steps per bar.
export const SONGS = {
  title: { bpm: 104,   // ominous: E phrygian, low lead, tolling bass
    lead: bars(['E4 - - - . . F4 - E4 - - - . . B3 -', 'C4 - - - B3 - - - Bb3 - - - . . . .', 'E4 - - - . . G4 - F4 - E4 - D4 - F4 -', 'E4 - - - - - - - . . . . B3 - Bb3 -']),
    bass: bars(['E1 - E2 . E1 - E2 . E1 - E2 . F1 - F2 .', 'C2 - C2 . C2 - C2 . Bb1 - Bb1 . Bb1 - . .', 'E1 - E2 . E1 - E2 . G1 - G2 . F1 - F2 .', 'E1 - E2 . E1 - E2 . E1 - - - Bb1 - B1 -']),
    drums: bars(['K . . . . . . . S . . . . . . H']) },
  bridge: { bpm: 132,
    lead: bars(['A4 - - . A4 Bb4 A4 . E4 - - . F4 - E4 .', 'A4 - - . C5 Bb4 A4 . G#4 - - - . . . .', 'D5 - - . C5 Bb4 A4 . F4 - E4 . F4 - G#4 .', 'A4 - - - E4 - - - A3 - - - . . . .']),
    bass: bars(['A1 A2 . A1 A2 . A1 A2 Bb1 . A1 . G#1 . A1 .', 'A1 A2 . A1 A2 . A1 A2 F1 . F1 . E1 . E1 .', 'D2 D2 . D1 D2 . D1 D2 Bb1 . Bb1 . A1 . A1 .', 'E1 E2 . E1 E2 . E1 E2 E2 . F2 . G#2 . A2 .']),
    drums: bars(['K . . H S . . H K . K H S . H .']) },
  dungeon: { bpm: 108,
    lead: bars(['D5 - - - F5 - - - A5 - G5 - F5 - E5 -', 'D5 - - - C5 - - - A4 - - - - - - .', 'Bb4 - - - D5 - - - F5 - E5 - D5 - C#5 -', 'D5 - - - A4 - - - D5 - - - - - . .']),
    bass: bars(['D2 - - - D2 - - - D2 - - - C2 - - -', 'Bb1 - - - Bb1 - - - A1 - - - A1 - - -', 'Bb1 - - - Bb1 - - - G1 - - - A1 - - -', 'D2 - - - A1 - - - D2 - - - D2 - - -']),
    arp: bars(['D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 C4 E4 G4 E4', 'Bb3 D4 F4 D4 Bb3 D4 F4 D4 A3 C#4 E4 C#4 A3 C#4 E4 C#4', 'Bb3 D4 F4 D4 Bb3 D4 F4 D4 G3 Bb3 D4 Bb3 A3 C#4 E4 C#4', 'D4 F4 A4 F4 A3 C#4 E4 C#4 D4 F4 A4 F4 D4 F4 A4 D5']),
    drums: bars(['K . . . S . . . K . K . S . . H']) },
  volcano: { bpm: 172,
    lead: bars(['E5 E5 . E5 G5 . E5 . B5 . A5 . G5 . F#5 .', 'E5 E5 . E5 G5 . E5 . D5 . C5 . B4 - - .', 'C5 C5 . C5 E5 . C5 . G5 . F#5 . E5 . D5 .', 'B4 . D5 . F#5 . A5 . B5 - - - B4 - - .']),
    bass: bars(['E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 D3 E3', 'E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 G2 A2', 'C2 C3 C2 C3 C2 C3 C2 C3 C2 C3 C2 C3 C2 C3 C2 D2', 'B1 B2 B1 B2 B1 B2 B1 B2 B1 B2 B1 B2 B1 B2 D#2 F#2']),
    drums: bars(['K H S H K K S H K H S H K K S S']) },
  factory: { bpm: 140,   // mechanical, driving, C minor with a clanking ostinato
    lead: bars(['C4 . C4 . Eb4 . C4 . G4 - F4 . Eb4 . D4 .', 'C4 . C4 . Eb4 . C4 . Ab4 - G4 . F4 - - .', 'C4 . C4 . Eb4 . C4 . G4 - Bb4 . Ab4 . G4 .', 'F4 - Eb4 - D4 - B3 - C4 - - - . . . .']),
    bass: bars(['C2 C2 C3 C2 C2 C2 C3 C2 C2 C2 C3 C2 G1 G1 G2 G1', 'Ab1 Ab1 Ab2 Ab1 Ab1 Ab1 Ab2 Ab1 F1 F1 F2 F1 G1 G1 G2 G1', 'C2 C2 C3 C2 C2 C2 C3 C2 Eb2 Eb2 Eb3 Eb2 Bb1 Bb1 Bb2 Bb1', 'F1 F1 F2 F1 G1 G1 G2 G1 C2 C2 C3 C2 C2 . . .']),
    drums: bars(['K H H H S H K H K H H H S H S H']) },
  castle: { bpm: 120,   // grim march, D harmonic minor
    lead: bars(['D4 - - A3 D4 - E4 - F4 - - E4 D4 - C#4 -', 'D4 - - A3 D4 - F4 - A4 - G4 - F4 - E4 -', 'Bb4 - - A4 G4 - F4 - E4 - F4 - G4 - A4 -', 'F4 - E4 - D4 - C#4 - D4 - - - . . . .']),
    bass: bars(['D2 . D2 . D2 . D2 . Bb1 . Bb1 . A1 . A1 .', 'D2 . D2 . D2 . D2 . F1 . F1 . A1 . A1 .', 'G1 . G1 . G1 . G1 . A1 . A1 . A1 . C#2 .', 'D2 . A1 . D2 . A1 . D2 . . . . . . .']),
    drums: bars(['K . . . S . K . K . . . S . S S']) },
};
export const JINGLES = {
  over: { bpm: 100, lead: bars(['C5 - B4 - Bb4 - A4 - - - - - . . . .']), bass: bars(['C3 - - - - - - - F2 - - - - - - -']) },
  win: { bpm: 180, lead: bars(['C5 E5 G5 C6 . G5 C6 - - - . . . . . .']), bass: bars(['C3 . . . . . C3 - - - . . . . . .']) },
};

export function createMusic() {
  let ctx = null, master = null, noise = null, song = null, step = 0, nextT = 0, timer = null, on = true, current = null;
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 1.0; master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(type, f, t, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function drum(kind, t) {
    if (kind === 'K') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.connect(g).connect(master); o.start(t); o.stop(t + 0.16); return; }
    const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; flt.type = kind === 'H' ? 'highpass' : 'bandpass'; flt.frequency.value = kind === 'H' ? 7000 : 1800;
    const dur = kind === 'H' ? 0.04 : 0.12; g.gain.setValueAtTime(kind === 'H' ? 0.06 : 0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(flt).connect(g).connect(master); src.start(t); src.stop(t + dur + 0.01);
  }
  function lengthOf(track, i) { let n = 1; while (track[(i + n) % track.length] === '-' && n < 16) n++; return n; }
  function schedule() {
    if (!song) return;
    const spb = 60 / song.bpm / 4;
    while (nextT < ctx.currentTime + 0.12) {
      const L = song.lead.length;
      const i = step % L;
      const play = (track, type, vol, octave = 1) => {
        if (!track) return; const n = track[i % track.length];
        if (n && n !== '.' && n !== '-') tone(type, freq(n) * octave, nextT, spb * lengthOf(track, i % track.length) * 0.95, vol);
      };
      play(song.lead, 'square', 0.045);
      play(song.bass, 'triangle', 0.16);
      play(song.arp, 'square', 0.014);
      if (song.drums) { const d = song.drums[i % song.drums.length]; if (d && d !== '.') drum(d, nextT); }
      step++; nextT += spb;
      if (song.once && step >= L) { const back = song.back; song = null; if (back) api.play(back); return; }
    }
  }
  const api = {
    play(name) {
      if (current === name && song) return;
      current = name;
      if (!on) return;
      init(); if (ctx.state === 'suspended') ctx.resume();
      song = SONGS[name]; step = 0; nextT = ctx.currentTime + 0.05;
      if (!timer) timer = setInterval(schedule, 25);
    },
    jingle(name, resume = true) {
      if (!on) return; init();
      song = { ...JINGLES[name], once: true, back: resume ? current : null }; step = 0; nextT = ctx.currentTime + 0.05; current = null;
      if (!timer) timer = setInterval(schedule, 25);
    },
    stop() { song = null; current = null; },
    setOn(v) { on = v; if (!v) { song = null; } else if (current) { const c = current; current = null; this.play(c); } },
    unlock() { init(); if (ctx.state === 'suspended') ctx.resume(); },
  };
  return api;
}
