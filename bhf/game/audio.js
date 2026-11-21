// Black Hole Friday: sound. The FWAHBL chiptune player with new tunes (one per level + a boss tune),
// and beeps for everything that happens (the sim's events and the boss fights' events).
import { SONGS, createMusic } from '../../music.js';

const bars = (arr) => arr.join(' ').split(/\s+/).filter(Boolean);
// '.' = rest, '-' = hold. 16 steps per bar. All original.
Object.assign(SONGS, {
  bhf_menu: { bpm: 96,
    lead: bars(['A4 - - - . . E5 - D5 - - - C5 - B4 -', 'A4 - - - . . . . G4 - - - . . . .', 'A4 - - - . . E5 - F5 - - - E5 - D5 -', 'E5 - - - - - - - . . . . . . . .']),
    bass: bars(['A1 - - - A2 - - - A1 - - - A2 - - -', 'F1 - - - F2 - - - G1 - - - G2 - - -', 'A1 - - - A2 - - - D2 - - - D2 - - -', 'E2 - - - E2 - - - E1 - - - E2 - E2 -']),
    arp: bars(['A3 C4 E4 C4', 'A3 C4 E4 C4', 'A3 C4 E4 C4', 'A3 C4 E4 C4', 'F3 A3 C4 A3', 'F3 A3 C4 A3', 'G3 B3 D4 B3', 'G3 B3 D4 B3', 'A3 C4 E4 C4', 'A3 C4 E4 C4', 'D3 F3 A3 F3', 'D3 F3 A3 F3', 'E3 G#3 B3 G#3', 'E3 G#3 B3 G#3', 'E3 G#3 B3 G#3', 'E3 G#3 B3 E4']) },
  bhf_neon: { bpm: 122,   // wet streets: A minor synth, off-beat bass
    lead: bars(['E5 - - D5 C5 - A4 - . . C5 - D5 - E5 -', 'G5 - - E5 D5 - C5 - . . A4 - C5 - D5 -', 'E5 - - D5 C5 - A4 - . . F5 - E5 - D5 -', 'C5 - B4 - A4 - - - - - . . E4 - G4 -']),
    bass: bars(['A1 . A2 A1 . A2 A1 . A1 . A2 A1 . A2 G1 .', 'F1 . F2 F1 . F2 F1 . G1 . G2 G1 . G2 G1 .', 'A1 . A2 A1 . A2 A1 . D2 . D3 D2 . D3 D2 .', 'E1 . E2 E1 . E2 E1 . E1 . E2 E1 . E2 G#1 .']),
    arp: bars(['A3 E4 A4 E4 C4 E4 A4 E4 A3 E4 A4 E4 C4 E4 G4 E4', 'F3 C4 F4 C4 A3 C4 F4 C4 G3 D4 G4 D4 B3 D4 G4 D4', 'A3 E4 A4 E4 C4 E4 A4 E4 D4 F4 A4 F4 D4 F4 A4 F4', 'E4 G#4 B4 G#4 E4 G#4 B4 G#4 E4 G#4 B4 G#4 E4 G#4 B4 E5']),
    drums: bars(['K . H . S . H . K K H . S . H H']) },
  bhf_ice: { bpm: 104,    // thin air: E minor, glassy arps, a lot of space
    lead: bars(['B5 - - - - - G5 - E5 - - - - - . .', 'A5 - - - - - F#5 - D5 - - - - - . .', 'G5 - - - - - E5 - C5 - - - D5 - E5 -', 'F#5 - - - - - - - B4 - - - . . . .']),
    bass: bars(['E2 - - - - - - - E2 - - - B1 - - -', 'D2 - - - - - - - D2 - - - A1 - - -', 'C2 - - - - - - - C2 - - - D2 - - -', 'B1 - - - - - - - B1 - - - B1 - D#2 -']),
    arp: bars(['E4 B4 E5 G5 B4 E5 G5 B5 E4 B4 E5 G5 B4 E5 G5 B5', 'D4 A4 D5 F#5 A4 D5 F#5 A5 D4 A4 D5 F#5 A4 D5 F#5 A5', 'C4 G4 C5 E5 G4 C5 E5 G5 C4 G4 C5 E5 D4 A4 D5 F#5', 'B3 F#4 B4 D#5 F#4 B4 D#5 F#5 B3 F#4 B4 D#5 F#4 B4 D#5 F#5']),
    drums: bars(['K . . . . . H . S . . . . . H .']) },
  bhf_hive: { bpm: 128,   // something is in the walls: a low chromatic crawl over a heartbeat
    lead: bars(['C4 - - - . . Db4 - C4 - - - . . B3 -', 'C4 - - - . . Eb4 - Db4 - C4 - B3 - - .', 'C4 - - - . . Gb4 - F4 - - - Eb4 - Db4 -', 'C4 - B3 - C4 - Db4 - C4 - - - . . . .']),
    bass: bars(['C2 C2 . . C2 . . . C2 C2 . . C2 . Db2 .', 'C2 C2 . . C2 . . . C2 C2 . . B1 . B1 .', 'C2 C2 . . C2 . . . Gb1 Gb1 . . Gb1 . F1 .', 'F1 F1 . . G1 . . . C2 C2 . . C2 . . .']),
    arp: bars(['. . C5 . . . G4 . . . C5 . . . Gb4 .']),
    drums: bars(['K K . . S . . . K K . . S . H H']) },
  bhf_code: { bpm: 140,   // the system: D minor, straight sixteenths
    lead: bars(['D5 . D5 . A4 . D5 . F5 - E5 . D5 . C5 .', 'D5 . D5 . A4 . D5 . G5 - F5 . E5 - - .', 'Bb4 . Bb4 . F4 . Bb4 . D5 - C5 . Bb4 . A4 .', 'A4 - C#5 - E5 - A5 - G5 - E5 - C#5 - A4 .']),
    bass: bars(['D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 C2 C2 C3 C2', 'D2 D2 D3 D2 D2 D2 D3 D2 G1 G1 G2 G1 A1 A1 A2 A1', 'Bb1 Bb1 Bb2 Bb1 Bb1 Bb1 Bb2 Bb1 Bb1 Bb1 Bb2 Bb1 F1 F1 F2 F1', 'A1 A1 A2 A1 A1 A1 A2 A1 A1 A1 A2 A1 A1 A2 C#2 E2']),
    arp: bars(['D4 A4 D4 A4 F4 A4 D4 A4', 'D4 A4 D4 A4 F4 A4 E4 G4', 'D4 A4 D4 A4 F4 A4 D4 A4', 'G3 D4 G3 D4 A3 E4 A3 E4', 'Bb3 F4 Bb3 F4 D4 F4 Bb3 F4', 'Bb3 F4 Bb3 F4 A3 F4 A3 F4', 'A3 E4 A3 E4 C#4 E4 A3 E4', 'A3 E4 A3 E4 C#4 E4 G4 E4']),
    drums: bars(['K H H H S H H K K H K H S H S H']) },
  bhf_desert: { bpm: 112, // deep desert: E phrygian dominant over a hand drum
    lead: bars(['E4 - F4 G#4 - - A4 - B4 - - A4 G#4 - F4 -', 'E4 - - - . . G#4 A4 B4 - C5 - B4 - - .', 'D5 - C5 B4 - - A4 - G#4 - - A4 B4 - G#4 -', 'F4 - - E4 - - - - E4 - . . . . B3 -']),
    bass: bars(['E1 - - E2 . . E1 - E1 - - E2 . . E1 .', 'E1 - - E2 . . E1 - E1 - - E2 . . E2 .', 'D2 - - D3 . . D2 - E1 - - E2 . . E1 .', 'F1 - - F2 . . F1 - E1 - - E2 . . E1 .']),
    drums: bars(['K . . S . K S . K . S . . S K S']) },
  bhf_tenet: { bpm: 126,  // inversion: the tune is a palindrome, it plays the same backwards
    lead: bars(['D4 - F4 - A4 - C5 - D5 - C5 - A4 - F4 -', 'E4 - G4 - Bb4 - A4 - A4 - Bb4 - G4 - E4 -', 'F4 - A4 - C5 - D5 - C5 - A4 - F4 - D4 -', 'A3 - C#4 - E4 - A4 - A4 - E4 - C#4 - A3 -']),
    bass: bars(['D2 . D2 D2 . D2 . D2 D2 . D2 . D2 D2 . D2', 'G1 . G1 G1 . G1 . G1 G1 . G1 . G1 G1 . G1', 'Bb1 . Bb1 Bb1 . Bb1 . Bb1 Bb1 . Bb1 . Bb1 Bb1 . Bb1', 'A1 . A1 A1 . A1 . A1 A1 . A1 . A1 A1 . A1']),
    drums: bars(['K . H S . H . K K . H . S H . K']) },
  bhf_boss: { bpm: 164,   // boss: fast, tight, B minor
    lead: bars(['B4 B4 . B4 D5 . B4 . F#5 . E5 . D5 . C#5 .', 'B4 B4 . B4 D5 . B4 . G5 - F#5 - E5 - D5 .', 'G4 G4 . G4 B4 . G4 . D5 . C#5 . B4 . A4 .', 'F#4 . A#4 . C#5 . E5 . F#5 - - - F#4 - A#4 .']),
    bass: bars(['B1 B2 B1 B2 B1 B2 B1 B2 B1 B2 B1 B2 B1 B2 A2 B2', 'B1 B2 B1 B2 B1 B2 B1 B2 E2 E3 E2 E3 E2 E3 D3 E3', 'G1 G2 G1 G2 G1 G2 G1 G2 G1 G2 G1 G2 A1 A2 A1 A2', 'F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 A#1 C#2']),
    drums: bars(['K H S H K K S H K H S H K K S S']) },
});

// ---- each level's tune opens with a section in the manner of its film's score, then goes into the level's own tune above ----
// These are new tunes written for this game. What they borrow is the SOUND of each score (the instruments' habits, the rhythm, the harmony),
// not its melodies: nothing here is a transcription.
const tile = (tr, n) => (tr ? Array.from({ length: n }, (_, i) => tr[i % tr.length]) : Array(n).fill('.'));
const prepend = (name, V) => { const S = SONGS[name], nA = S.lead.length, nV = V.lead.length; for (const k of ['lead', 'bass', 'arp', 'drums']) S[k] = tile(V[k], nV).concat(tile(S[k], nA)); };
const mirror = (tr) => { const ev = []; for (const n of tr) { if (n === '-' && ev.length && ev[ev.length - 1][0] !== '.') ev[ev.length - 1][1]++; else ev.push([n === '-' ? '.' : n, 1]); } return ev.reverse().flatMap(([n, l]) => [n, ...Array(l - 1).fill('-')]); };
const x2 = (a) => [a, a], REST = '. . . . . . . . . . . . . . . .';

// NEON RAIN: the big slow synth-brass tune over a pulsing sequencer bass and far-off timpani (the 1982 electronic-noir sound):
// long held notes that end in a falling run, bell sparkles on top.
prepend('bhf_neon', {
  lead: bars(['E5 - - - - - - - - - - - A5 - - -', 'G5 - - - - - - - E5 - - - - - - -', 'F5 - - - - - - - - - - - C6 - - -', 'A5 - - - - - - - - - G5 F5 E5 D5 C5 -',
    'D5 - - - - - - - - - - - F5 - - -', 'A5 - - - - - - - G5 - - - F5 - - -', 'E5 - - - - - - - - - - - G#5 - - -', 'B5 - - - - - - - - - A5 G#5 E5 D5 B4 -']),
  bass: bars([...x2('A1 A1 A2 A1 A1 A1 A2 A1 A1 A1 A2 A1 A1 A1 A2 A1'), ...x2('F1 F1 F2 F1 F1 F1 F2 F1 F1 F1 F2 F1 F1 F1 F2 F1'), ...x2('D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2'), 'E1 E1 E2 E1 E1 E1 E2 E1 E1 E1 E2 E1 E1 E1 E2 E1', 'E1 E1 E2 E1 E1 E1 E2 E1 E1 E1 E2 E1 E1 E2 G#1 B1']),
  arp: bars([...x2('E6 . . . . . C6 . . . . . A5 . . .'), ...x2('F6 . . . . . C6 . . . . . A5 . . .'), ...x2('F6 . . . . . D6 . . . . . A5 . . .'), ...x2('E6 . . . . . B5 . . . . . G#5 . . .')]),
  drums: bars(['K . . . . . . . S . . . . . K .']) });

// THE ICE PLANET: a church organ going round and round in three-time while a clock ticks, and it only ever builds
// (the 2014 space-and-time sound). Four bars of the figure alone, four with it doubled, four with a long tune over the top. 12 steps to the bar here.
prepend('bhf_ice', {
  lead: bars(['E5 - - - C6 - - - B5 - - -', 'E5 - - - B5 - - - A5 - - -', 'E5 - - - A5 - - - G5 - - -', 'E5 - - - G5 - - - F#5 - - -',
    'E5 - C6 - B5 - E5 - C6 - B5 -', 'E5 - B5 - A5 - E5 - B5 - A5 -', 'E5 - A5 - G5 - E5 - A5 - G5 -', 'E5 - G5 - F#5 - E5 - G5 - F#5 -',
    'B5 - - - - - - - - - C6 -', 'A5 - - - - - - - - - B5 -', 'G5 - - - - - - - - - A5 -', 'F#5 - - - - - - - D6 - - -']),
  bass: bars(['C2 - - - - - - - - - - -', 'D2 - - - - - - - - - - -', 'E2 - - - - - - - - - - -', 'D2 - - - - - - - - - - -',
    'C2 - - - - - C3 - - - - -', 'D2 - - - - - D3 - - - - -', 'E2 - - - - - E3 - - - - -', 'D2 - - - - - D3 - - - - -',
    'C2 - C3 - C2 - C3 - C2 - C3 -', 'D2 - D3 - D2 - D3 - D2 - D3 -', 'E2 - E3 - E2 - E3 - E2 - E3 -', 'D2 - D3 - D2 - D3 - F#2 - B2 -']),
  arp: bars(['. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .',
    'C5 G4 E5 G4 C5 G4 E5 G4 C5 G4 E5 G4', 'D5 A4 F#5 A4 D5 A4 F#5 A4 D5 A4 F#5 A4', 'E5 B4 G5 B4 E5 B4 G5 B4 E5 B4 G5 B4', 'D5 A4 F#5 A4 D5 A4 F#5 A4 D5 A4 F#5 A4',
    'E5 - C6 - B5 - E5 - C6 - B5 -', 'E5 - B5 - A5 - E5 - B5 - A5 -', 'E5 - A5 - G5 - E5 - A5 - G5 -', 'E5 - G5 - F#5 - E5 - G5 - F#5 -']),
  drums: bars(['H . . . H . . . H . . .', 'H . . . H . . . H . . .', 'H . . . H . . . H . . .', 'H . . . H . . . H . . .',
    'K . . . H . . . H . . .', 'K . . . H . . . H . . .', 'K . . . H . . . H . . .', 'K . . . H . . . H . . .',
    'K . . . H . . . S . . .', 'K . . . H . . . S . . .', 'K . . . H . . . S . . .', 'K . . . H . S . S . S S']) });

// THE HIVE: the marines' music. A snare drum cadence that never lets up, low brass stabbing in threes, clipped bugle calls, strings sawing away underneath
// (the 1986 military-horror sound).
prepend('bhf_hive', {
  lead: bars(['. . . . . . . . G4 . G4 G4 C5 - - -', '. . . . . . . . C5 . C5 C5 Db5 - - -', 'Eb5 - - . D5 - - . C5 - - - - - G4 -', 'Ab4 - - - - - G4 - - - - - B4 - - -',
    '. . . . . . . . G4 . G4 G4 C5 - - -', 'Eb5 - . Eb5 - . Eb5 - F5 - - - Db5 - - -', 'G5 - - . F5 - - . Eb5 - - - Gb5 - - -', 'G5 - - - - - - - . . G4 G4 G4 . B4 .']),
  bass: bars(['C2 - . C2 - . C2 . . . C2 - . C2 . .', 'C2 - . C2 - . C2 . . . Db2 - . Db2 . .', 'C2 - . C2 - . C2 . . . C2 - . C2 . .', 'Ab1 - . Ab1 - . Ab1 . G1 - . G1 - . B1 .',
    'C2 - . C2 - . C2 . . . C2 - . C2 . .', 'Eb2 - . Eb2 - . Eb2 . . . Db2 - . Db2 . .', 'C2 - . C2 - . C2 . . . Gb1 - . Gb1 . .', 'G1 - . G1 - . G1 . G1 G1 . G1 G1 G1 B1 .']),
  arp: bars(['C4 C4 Eb4 C4 C4 C4 Eb4 C4 C4 C4 Eb4 C4 C4 C4 Eb4 C4', 'C4 C4 Eb4 C4 C4 C4 Eb4 C4 Db4 Db4 F4 Db4 Db4 Db4 F4 Db4', 'C4 C4 Eb4 C4 C4 C4 Eb4 C4 C4 C4 Eb4 C4 C4 C4 Eb4 C4', 'Ab3 Ab3 C4 Ab3 Ab3 Ab3 C4 Ab3 G3 G3 B3 G3 G3 G3 B3 G3',
    'C4 C4 Eb4 C4 C4 C4 Eb4 C4 C4 C4 Eb4 C4 C4 C4 Eb4 C4', 'Eb4 Eb4 G4 Eb4 Eb4 Eb4 G4 Eb4 Db4 Db4 F4 Db4 Db4 Db4 F4 Db4', 'C4 C4 Eb4 C4 C4 C4 Eb4 C4 Gb3 Gb3 Bb3 Gb3 Gb3 Gb3 Bb3 Gb3', 'G3 G3 B3 G3 G3 G3 B3 G3 G3 G3 B3 G3 G3 G3 B3 D4']),
  drums: bars(['K . S S . S S . K . S S S . S S', 'K . S S . S S . K . S S S . S S', 'K . S S . S S . K . S S S . S S', 'K . S S . S S . K S S S S S S S']) });

// THE CODE: two brass chords that will not agree, swapping faster and faster until they hit, over a big-beat break and a funk bass line,
// with the green rain running down behind (the 1999 sound: half orchestra, half club).
prepend('bhf_code', {
  lead: bars(['A4 - - - - - - - Bb4 - - - - - - -', 'A4 - - - Bb4 - - - A4 - - - Bb4 - - -', 'D5 - Eb5 - D5 - Eb5 - D5 - Eb5 - D5 - Eb5 -', 'F5 G5 F5 G5 F5 G5 F5 G5 A5 - - - - - . .',
    'D5 - - - - - - - Eb5 - - - - - - -', 'D5 - - - Eb5 - - - D5 - - - Eb5 - - -', 'F5 - Gb5 - F5 - Gb5 - F5 - Gb5 - F5 - Gb5 -', 'A5 Bb5 A5 Bb5 A5 Bb5 A5 Bb5 C#6 - - - - - . .']),
  bass: bars(['D2 . D2 D3 . D2 . F2 . D2 . C2 D2 . A1 C2', 'D2 . D2 D3 . D2 . F2 . G2 . F2 D2 . C2 .', 'D2 . D2 D3 . D2 . F2 . D2 . C2 D2 . A1 C2', 'D2 . D2 D3 . D2 . F2 . G2 . F2 D2 . C2 .',
    'D2 . D2 D3 . D2 . F2 . D2 . C2 D2 . A1 C2', 'D2 . D2 D3 . D2 . F2 . G2 . F2 D2 . C2 .', 'Bb1 . Bb1 Bb2 . Bb1 . D2 . Bb1 . A1 Bb1 . F1 A1', 'A1 . A1 A2 . A1 . C#2 . A1 . E2 A1 A2 C#2 E2']),
  arp: bars([...Array(6).fill('A5 F5 D5 A4 F5 D5 A4 F4 D5 A4 F4 D4 A4 F4 D4 A3'), 'Bb5 F5 D5 Bb4 F5 D5 Bb4 F4 D5 Bb4 F4 D4 Bb4 F4 D4 Bb3', 'A5 E5 C#5 A4 E5 C#5 A4 E4 C#5 A4 E4 C#4 A4 E4 C#4 A3']),
  drums: bars(['K . . K . . S . . K K . S . . H', 'K . . K . . S . . K K . S . S S']) });

// DEEP DESERT: one low note that never moves, war drums a long way off, and a voice crying out over the top in the desert's own scale;
// then the pipes come in underneath (the 2021 sound).
prepend('bhf_desert', {
  lead: bars(['. . . . . . . . B4 - - - - - C5 B4', 'A4 - G#4 - A4 B4 - - - - - - . . . .', '. . . . . . . . E5 - - - - - F5 E5', 'D5 - C5 - B4 - G#4 A4 B4 - - - - - - -',
    'E5 - - - - - F5 G#5 A5 - - - G#5 F5 E5 -', 'D5 - E5 F5 E5 - - - - - D5 C5 B4 - - -', 'C5 - - - - - B4 A4 G#4 - - - A4 - B4 -', 'E4 - - - - - - - - - - - . . . .']),
  bass: bars(['E1 - - - - - - - - - - - E1 - - -', 'E1 - - - - - - - - - - - E1 - - -', 'E1 - - - - - - - - - - - E1 - - -', 'E1 - - - - - - - - - - - E1 - - -',
    'E1 - - - - - E2 - E1 - - - - - - -', 'E1 - - - - - E2 - E1 - - - - - - -', 'F1 - - - - - F2 - F1 - - - - - - -', 'E1 - - - - - - - E1 - E1 - E1 E1 E1 E1']),
  arp: bars([REST, REST, REST, REST, 'E4 - B4 - E4 - B4 - E4 - B4 - E4 F4 E4 B3', 'E4 - B4 - E4 - B4 - E4 - B4 - E4 F4 E4 B3', 'F4 - C5 - F4 - C5 - F4 - C5 - F4 G#4 F4 C4', 'E4 - B4 - E4 - B4 - E4 - B4 - E4 - - -']),
  drums: bars(['K . . . . . . . . . K . K . . .', 'K . . . . . . . . . K . K . . .', 'K . . . . . . . . . K . K . . .', 'K . . . . . . . . . K . K . K K',
    'K . . K . . K . S . K . K . S .', 'K . . K . . K . S . K . K . S .', 'K . . K . . K . S . K . K . S .', 'K . . K . . K . S . K K K K S S']) });

// INVERSION: a hammering synth bass on one note, four on the floor, and sounds that swell up out of nothing and stop dead, as if played backwards
// (the 2020 sound). The second four bars are the first four played in reverse, note for note.
{ const P = 'D2 D2 D3 D2 D2 D3 D2 D2 D2 D2 D3 D2 D2 D3 D2 D2', tr = (n) => P.replace(/D/g, n);
  const lead = bars(['. . . . . . . . . . D4 F4 A4 C5 D5 .', '. . . . . . . . . . F4 A4 C5 E5 F5 .', 'D5 - - - - - - - . . Bb4 D5 F5 G5 A5 .', 'G5 - - - E5 - - - C5 - - - E5 G5 C6 .']);
  const bass = bars([P, P, tr('Bb').replace(/Bb2/g, 'Bb1').replace(/Bb3/g, 'Bb2'), tr('C')]);
  const arp = bars(['. . A4 . . . A4 . . . A4 . . . A4 .', '. . A4 . . . A4 . . . A4 . . . A4 .', '. . F4 . . . F4 . . . F4 . . . F4 .', '. . G4 . . . G4 . . . G4 . . . G4 .']);
  prepend('bhf_tenet', { lead: lead.concat(mirror(lead)), bass: bass.concat(mirror(bass)), arp: arp.concat(mirror(arp)), drums: bars(['K . H . S . H . K . H . S . H .']) }); }

export const LEVEL_SONG = { neon: 'bhf_neon', ice: 'bhf_ice', hive: 'bhf_hive', code: 'bhf_code', desert: 'bhf_desert', tenet: 'bhf_tenet' };

export function createAudio() {
  const music = createMusic();
  let actx = null, muted = localStorage.getItem('bhf_mute') === '1';
  // the cover (TAP TO PLAY): no sound at all, and no audio context, until the first tap opens the gate. A song asked for before then
  // (the home screen's, at load) is remembered and starts on that tap.
  let gated = true, want = null, cur = null, held = false;
  music.setOn(!muted);
  function beep(f0, f1, dur, type = 'square', vol = 0.05, delay = 0) {
    if (muted || gated) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  }
  const run = (ns, d, type = 'square', vol = 0.05, len = 0.09) => ns.forEach((n, i) => beep(n, n, len, type, vol, i * d));
  const SFX = {
    // the run
    jump: () => beep(300, 620, 0.12), djump: () => beep(500, 980, 0.12), tjump: () => beep(700, 1400, 0.14),
    stomp: () => { beep(220, 80, 0.12, 'square', 0.07); beep(600, 900, 0.08, 'square', 0.04, 0.05); },
    unikill: () => run([523, 659, 784, 1047], 0.06), batkill: () => beep(900, 300, 0.1), spit: () => beep(120, 220, 0.15, 'sawtooth', 0.03),
    token: () => { beep(988, 988, 0.05); beep(1319, 1319, 0.12, 'square', 0.05, 0.05); },
    bonk: () => { beep(180, 120, 0.06, 'square', 0.07); beep(784, 1568, 0.18, 'triangle', 0.05, 0.04); },
    smash: () => { beep(200, 60, 0.15, 'square', 0.07); beep(900, 1800, 0.1, 'square', 0.04, 0.03); },
    throw: () => beep(300, 500, 0.1, 'triangle', 0.03), squelch: () => beep(90, 60, 0.08, 'triangle', 0.03),
    crumble: () => beep(160, 60, 0.2, 'sawtooth', 0.04), creak: () => beep(240, 200, 0.06, 'triangle', 0.03),
    hit: () => beep(180, 50, 0.3, 'sawtooth', 0.08), splat: () => beep(140, 60, 0.07, 'triangle', 0.04), puke: () => beep(90, 150, 0.25, 'sawtooth', 0.03),
    patch: () => run([392, 523, 659, 784], 0.05, 'triangle', 0.06, 0.1), twins: () => run([523, 659, 784, 1047, 1319, 1568], 0.07, 'square', 0.06, 0.1),
    pend: () => run([880, 660, 440], 0.08), pwarn: () => beep(1000, 1000, 0.05),
    die: () => [400, 300, 200, 100].forEach((n, i) => beep(n, n * 0.8, 0.18, 'sawtooth', 0.07, i * 0.15)),
    // each level's own dangers
    vent: () => beep(900, 200, 0.22, 'sawtooth', 0.025), rain: () => beep(140, 60, 0.5, 'sawtooth', 0.03), lock: () => { beep(1400, 1400, 0.04); beep(1400, 1400, 0.04, 'square', 0.05, 0.08); },
    drop: () => beep(700, 200, 0.2, 'triangle', 0.04), thud: () => beep(110, 50, 0.1, 'square', 0.06),
    ride: () => run([262, 330, 392, 523, 659, 784], 0.05, 'sawtooth', 0.06, 0.12), shield: () => beep(1200, 200, 0.3, 'triangle', 0.07),
    bomb: () => { beep(80, 30, 0.6, 'sawtooth', 0.1); beep(1600, 100, 0.5, 'square', 0.05); },
    // the black hole coin: taken, a tick that climbs as the count does, and the pay-out
    hole: () => { beep(1200, 150, 0.35, 'sine', 0.08); beep(200, 900, 0.3, 'triangle', 0.05, 0.1); },
    chick: (v) => { const p = 260 + Math.min(1900, Math.sqrt(+v || 0) * 34); beep(p, p * 1.06, 0.05, 'square', 0.035); },
    bank: () => run([523, 784, 1047, 1319, 1568, 2093], 0.06, 'square', 0.06, 0.14),
    // the bosses
    zap: () => { beep(2200, 300, 0.1, 'square', 0.05); beep(1500, 90, 0.16, 'sawtooth', 0.05, 0.03); beep(70, 35, 0.22, 'sine', 0.16, 0.02); },      // something electrical blows
    boss: () => { for (let i = 0; i < 3; i++) { beep(440, 880, 0.18, 'sawtooth', 0.05, i * 0.3); beep(880, 440, 0.12, 'sawtooth', 0.04, i * 0.3 + 0.18); } },
    good: () => { beep(660, 990, 0.08, 'square', 0.05); beep(990, 1320, 0.1, 'square', 0.04, 0.06); },          // a clean dodge / a point scored
    bosshit: () => { beep(200, 60, 0.18, 'square', 0.08); beep(700, 1400, 0.12, 'square', 0.05, 0.04); },         // you hurt the boss
    warn: () => beep(880, 880, 0.07, 'square', 0.04), thump: () => beep(90, 40, 0.14, 'sine', 0.2), whoosh: () => beep(200, 900, 0.18, 'sawtooth', 0.025),
    shot: () => beep(1200, 300, 0.1, 'square', 0.04), roar: () => { beep(110, 50, 0.6, 'sawtooth', 0.08); beep(160, 70, 0.6, 'square', 0.04, 0.05); },
    win: () => run([523, 659, 784, 1047, 784, 1047, 1319], 0.08, 'square', 0.06, 0.12),
    portal: () => { beep(200, 1200, 0.5, 'sine', 0.07); beep(300, 1800, 0.5, 'triangle', 0.03, 0.05); },
    warp: () => { beep(1400, 200, 0.45, 'sine', 0.08); beep(900, 100, 0.45, 'triangle', 0.04, 0.05); },
    tunnel: () => { beep(80, 620, 1.5, 'sawtooth', 0.03); beep(1900, 260, 1.5, 'sine', 0.045, 0.05); beep(300, 1500, 0.3, 'triangle', 0.04, 1.35); },
    arrive: () => { beep(260, 1300, 0.22, 'triangle', 0.06); beep(1300, 700, 0.2, 'sine', 0.04, 0.12); },
  };
  return {
    events(list) { const seen = new Set(); for (const e of list) { const [k, val] = e.split(':'); if (!seen.has(k) && SFX[k]) { seen.add(k); SFX[k](val); } } },
    sfx: (k) => SFX[k] && SFX[k](),
    song: (name) => { cur = name; if (gated) want = name; else music.play(name); },
    stop: () => { want = null; cur = null; music.stop(); },
    // page hidden (phone call, app switch, another tab): stop the music; back again: the same song from the top, and the audio woken up
    pause() { if (gated || held) return; held = true; music.stop(); },
    resume() { if (!held) return; held = false; try { music.unlock(); } catch {} try { if (actx && actx.state !== 'running') actx.resume(); } catch {} if (cur) music.play(cur); },
    jingle: (n, back) => { if (!gated) music.jingle(n, back); },
    unlock() { if (gated) return; try { music.unlock(); } catch {} try { if (actx && actx.state === 'suspended') actx.resume(); } catch {} },
    open() { if (!gated) return; gated = false; try { music.unlock(); } catch {} if (want) { const w = want; want = null; music.play(w); } },
    get gated() { return gated; },
    get muted() { return muted; },
    toggle() { muted = !muted; localStorage.setItem('bhf_mute', muted ? '1' : '0'); music.setOn(!muted); return muted; },
  };
}
