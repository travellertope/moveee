
function dateToSeed(date) {
  let h = 0;
  for (const ch of date) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}
function makeRng(seed) {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0xffffffff;
  };
}

const PUZZLES_COUNT = 7;
const dates = ["2026-05-11", "2026-05-12"];

for (const date of dates) {
  const seed = dateToSeed(date);
  const rng = makeRng(seed);
  const idx = Math.floor(rng() * PUZZLES_COUNT);
  console.log(`Date: ${date}, Seed: ${seed}, Index: ${idx}`);
}
