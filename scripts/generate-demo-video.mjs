/**
 * MatchMind Demo Video Generator — v8 (1080p capture / 8K output, zero blank frames)
 *
 * v8 fixes the narration drift that v7 shipped with. v7 positioned voiceover at
 * FIXED timestamps and gated scenes with at(fixedTime); when a scene overran its
 * window the visuals fell progressively behind the narration (v7's capture ran
 * 282s against a planned 241s — 41s of accumulated drift, and -shortest then
 * lopped ~50s off the tail).
 *
 * v8 inverts the dependency: each narration line is spoken AT THE MOMENT its
 * visual is actually on screen. narrate(i) stamps the real elapsed time, then
 * holds the frame for exactly as long as that line takes to speak (measured from
 * the synthesized WAV). The SRT and the voiceover mix are both built from those
 * stamped times after recording — so narration, subtitle, and picture can never
 * drift apart, no matter how long a page took to load.
 *
 * Preserved from v7.1:
 *  - recordVideo size == CSS viewport (Playwright never upscales; a larger size
 *    pastes the page into the corner of a gray canvas — the v7.0 defect)
 *  - subtitles burned BEFORE the 8K upscale (libass sizes fonts to render res)
 *  - dark background injected into every document → any repaint is navy
 *  - low-memory x264 (ultrafast, no lookahead) — medium OOM'd at 8K here
 *  - raw capture + cue WAVs kept until output is visually verified
 */

import { chromium } from "playwright";
import { spawn, execFileSync } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const FFMPEG   = require("ffmpeg-static");
const SITE     = "https://matchmind-omega.vercel.app";
const OUT_DIR  = "E:\\Download";
const TMP_DIR  = path.join(OUT_DIR, "_mm_tmp");
const RAW_WEBM = path.join(OUT_DIR, "_mm_raw.webm");
const SRT_FILE = path.join(OUT_DIR, "matchmind-subtitles.srt");
const OUT_V1   = path.join(OUT_DIR, "matchmind-demo-v9-arena-8k-music-only.mp4");
const OUT_V2   = path.join(OUT_DIR, "matchmind-demo-v9-arena-8k-subtitled.mp4");

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── 0. Fetch real fixtures so the video NEVER shows mock data ────────────────
async function pickFixtures() {
  const res = await fetch(`${SITE}/api/matches`);
  const { matches } = await res.json();
  if (!matches?.length) throw new Error("No fixtures returned by /api/matches");
  const live = matches.filter(m => m.status === "live");
  const pre  = matches.filter(m => m.status === "pre");
  const a = live[0] ?? matches[0];
  const b = (pre[0] ?? live[1] ?? matches.find(m => m.id !== a.id));
  return { a, b };
}

// ── Cue table: narration text only. Timing is measured, not guessed. ─────────
// Order matches the scene walk below; narrate(i) fires each in sequence.
function buildCues(a, b) {
  const aName = `${a.homeTeam} vs ${a.awayTeam}`;
  const aScore = `${a.homeScore} to ${a.awayScore}`;
  const bName = `${b.homeTeam} vs ${b.awayTeam}`;
  return [
    /* 0  title */    "This is MatchMind — a real-time intelligence platform\nfor every World Cup 2026 match.",
    /* 1  hero  */    "Most fans watch with a phone in hand, splitting attention\nbetween score apps, odds tabs, and social commentary.",
    /* 2  hero  */    "MatchMind puts live scores, consensus odds from fifty-plus\nbookmakers, and AI-written match notes all in one place.",
    /* 3  hero  */    "The landing page loads instantly. Every part of the product\nworks without a login or an account.",
    /* 4  steps */    "Four steps: pick your team and tone, hook into the feed,\nlet moments trigger a read, track it your way.",
    /* 5  chain */    "Scroll past the commentary — a booth of three agents,\nthen streaks, minted moments, and a real Solana payment.",
    /* 6  list  */    "The match list pulls directly from the TxLINE feed —\nlive scores update in real time, no page reload needed.",
    /* 7  list  */    "Cards pulse for matches currently in play. Each one shows\nthe current minute and the odds from the market.",
    /* 8  filt  */    "Filter tabs switch between all matches,\nlive only, upcoming, or finished fixtures.",
    /* 9  A nav */    `Opening ${aName} — ${aScore}, live right now.\nReal TxLINE data, streaming as we record.`,
    /* 10 A pan */    "The left panel is the booth — each read signed by the agent\nwhose beat it is. The right panel is the live scoreboard.",
    /* 11 A evt */    "Click any event in the timeline and a written note\nappears in about a second and a half.",
    /* 12 A gnd */    "The AI reads only the facts the live feed provides.\nIt will not invent a player name or a made-up statistic.",
    /* 13 mint  */    "Every read can become a signed record — Mint moment writes\nthe score, minute, and price to Solana, wallet-signed.",
    /* 14 ask   */    "You can also ask it a question directly. It answers\nin plain language, grounded in what is on the pitch.",
    /* 15 B nav */    `Here is a second fixture: ${bName}.\nOdds and event log come straight from the same feed.`,
    /* 16 streak*/    "Before kickoff, call the one-X-two against the live line.\nA streak builds and climbs a division ladder — a miss resets it.",
    /* 17 poiss */    "Where the book has no live price yet, MatchMind derives one\nfrom score and time remaining with a Poisson model.",
    /* 18 wallet*/    "Connect a Solana wallet to link the on-chain layer.\nThe wallet panel explains exactly what linking does.",
    /* 19 pay   */    "On the pricing page, Grab a pass does something real —\na USDC payment on Solana, confirmed on-chain and receipted.",
    /* 20 close */    "MatchMind — live data, grounded AI, a streak worth\ndefending, built on Solana.",
    /* 21 close */    "matchmind-omega.vercel.app\ngithub.com/bryankwandou/matchmind",
  ];
}

function toSrtTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  const ms = String(Math.round((sec % 1) * 1000)).padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;
}

// SRT is built from the STAMPED start times + measured spoken durations.
function writeSrt(cues, starts, durs) {
  const srt = cues.map((text, i) =>
    `${i + 1}\n${toSrtTime(starts[i])} --> ${toSrtTime(starts[i] + durs[i] + 0.4)}\n${text}\n`
  ).join("\n");
  fs.writeFileSync(SRT_FILE, srt, "utf-8");
  console.log("SRT written:", SRT_FILE);
}

// ── Voiceover: one SAPI WAV per cue; also measure each one's real duration ────
function synthCueWavs(cues) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const files = [], durs = [];
  for (let i = 0; i < cues.length; i++) {
    const wav = path.join(TMP_DIR, `cue_${String(i).padStart(2, "0")}.wav`);
    const text = cues[i].replace(/\n/g, " ").replace(/'/g, "''");
    const ps = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
try { $s.SelectVoice('Microsoft Zira Desktop') } catch {}
$s.Rate = 1
$s.SetOutputToWaveFile('${wav.replace(/\\/g, "\\\\")}')
$s.Speak('${text}')
$s.Dispose()`;
    execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { stdio: "pipe" });
    files.push(wav);
    durs.push(probeDuration(wav));
  }
  console.log(`Voiceover: ${files.length} WAVs, spoken total ${durs.reduce((a, b) => a + b, 0).toFixed(1)}s`);
  return { files, durs };
}

function probeDuration(file) {
  try { execFileSync(FFMPEG, ["-i", file], { stdio: "pipe" }); }
  catch (e) {
    const m = e.stderr.toString().match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  }
  return 4; // conservative fallback
}

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log("\n$ ffmpeg", args.slice(0, 8).join(" "), "...");
    const p = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "inherit"] });
    p.on("close", code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
  });
}

// Title card shown from frame 0 — branded, never blank.
const TITLE_CARD = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#070a12;font-family:Segoe UI,Arial,sans-serif">
<div style="width:64px;height:64px;border-radius:14px;background:linear-gradient(135deg,#22c55e,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:#070a12">M</div>
<h1 style="color:#f2f5fa;font-size:64px;letter-spacing:-0.04em;margin:28px 0 10px">MatchMind</h1>
<p style="color:#8a94a8;font-size:22px;margin:0">Live World Cup intelligence &middot; TxLINE data &middot; grounded AI</p>
</body></html>`)}`;

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("MatchMind Demo Generator v8 — measured-sync narration\n");

  const { a, b } = await pickFixtures();
  console.log(`Fixture A (live): ${a.homeTeam} vs ${a.awayTeam} [${a.id}] ${a.homeScore}-${a.awayScore} @ ${a.minute}'`);
  console.log(`Fixture B:        ${b.homeTeam} vs ${b.awayTeam} [${b.id}] status=${b.status}`);

  const cues = buildCues(a, b);
  const { files: cueWavs, durs } = synthCueWavs(cues);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
  });

  await ctx.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = "html,body{background:#070a12 !important;}";
    (document.head || document.documentElement).appendChild(s);
  });

  const page = await ctx.newPage();

  const nav = async (url, waitSel, ms = 40000) => {
    await page.goto(url, { waitUntil: "load", timeout: ms });
    if (waitSel) {
      try { await page.waitForSelector(waitSel, { state: "visible", timeout: 15000 }); } catch {}
    }
    await page.evaluate(() => { window.scrollBy(0, 1); window.scrollTo(0, 0); });
    await sleep(900);
  };

  const safeClick = async (locator) => {
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
      await sleep(300);
      await locator.click({ force: true, timeout: 8000 });
      return true;
    } catch (e) {
      console.log("  [safeClick] skipped:", e.message.split("\n")[0]);
      return false;
    }
  };

  const t0 = Date.now();
  const starts = new Array(cues.length).fill(0);

  // The heart of v8: stamp the real elapsed time this line begins, then hold the
  // frame for exactly as long as the line is spoken (+ a short breath). Whatever
  // is on screen right now is what the viewer hears described — no drift possible.
  const narrate = async (i, breathMs = 450) => {
    starts[i] = (Date.now() - t0) / 1000;
    console.log(`  cue ${i} @ ${starts[i].toFixed(1)}s (${durs[i].toFixed(1)}s): ${cues[i].split("\n")[0].slice(0, 48)}`);
    await sleep(durs[i] * 1000 + breathMs);
  };

  // ── Title card ──────────────────────────────────────────────────────────────
  await page.goto(TITLE_CARD);
  await sleep(400);
  await narrate(0);

  // ── SCENE 1 — Landing, hero → steps → on-chain section ──────────────────────
  console.log("[SCENE 1] Landing...");
  await nav(SITE, "h1");
  await narrate(1);
  await narrate(2);
  await narrate(3);

  // scroll through How It Works while cue 4 plays
  for (let i = 0; i < 5; i++) { await page.evaluate(() => window.scrollBy({ top: 320, behavior: "smooth" })); await sleep(500); }
  await narrate(4);
  // scroll to the on-chain section while cue 5 plays
  for (let i = 0; i < 6; i++) { await page.evaluate(() => window.scrollBy({ top: 340, behavior: "smooth" })); await sleep(500); }
  await narrate(5);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(800);

  // ── SCENE 2 — Match list ────────────────────────────────────────────────────
  console.log("[SCENE 2] Match list...");
  await nav(`${SITE}/match`, 'a[href^="/match/"]');
  await narrate(6);

  const liveCard = page.locator('a[href^="/match/"]').first();
  if (await liveCard.count()) await liveCard.hover();
  await narrate(7);

  for (const label of ["LIVE", "UPCOMING", "FINISHED", "ALL"]) {
    const btn = page.locator("button").filter({ hasText: new RegExp(`^${label}$`, "i") }).first();
    if (await btn.count()) { await safeClick(btn); await sleep(700); }
  }
  await narrate(8);

  // ── SCENE 3 — Live match detail + Moment Mint ───────────────────────────────
  console.log(`[SCENE 3] ${a.homeTeam} vs ${a.awayTeam}...`);
  await nav(`${SITE}/match/${a.id}`, "main, h1");
  await sleep(4000); // let auto commentary land
  await narrate(9);
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: "smooth" }));
  await sleep(800);
  await narrate(10);

  const evtBtns = page.locator("button").filter({ hasText: /GOAL|KO|SUB|HT|FT|CARD|VAR/i });
  const n = await evtBtns.count();
  console.log(`  ${n} event buttons`);
  if (n) { await safeClick(evtBtns.nth(0)); await sleep(3500); }
  await narrate(11);
  if (n > 1) { await safeClick(evtBtns.nth(1)); await sleep(3500); }
  await narrate(12);

  // Moment Mint button lives inline on each AI commentary bubble
  const mintBtn = page.locator("button", { hasText: "Mint moment" }).first();
  if (await mintBtn.count()) await mintBtn.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(600);
  await narrate(13);

  // Ask-the-AI live demo
  const input = page.locator("input[placeholder*='Ask'], textarea[placeholder*='Ask']").first();
  if (await input.count() && await safeClick(input)) {
    await input.pressSequentially("Who is more likely to score next and why?", { delay: 40 });
    await sleep(400);
    await input.press("Enter");
    await sleep(7000); // let the grounded answer render before narrating it
  }
  await narrate(14);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(700);

  // ── SCENE 4 — Second fixture + Prediction Streak ────────────────────────────
  console.log(`[SCENE 4] ${b.homeTeam} vs ${b.awayTeam}...`);
  await nav(`${SITE}/match/${b.id}`, "main, h1");
  await sleep(2500);
  await narrate(15);

  await page.evaluate(() => window.scrollBy({ top: 260, behavior: "smooth" }));
  await sleep(1200);
  const oddsPickBtn = page.locator("button").filter({ hasText: /\d\.\d{2}/ }).first();
  if (await oddsPickBtn.count()) { await safeClick(oddsPickBtn); await sleep(2500); }
  await narrate(16);
  await narrate(17);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(700);

  // ── SCENE 5 — Wallet, Fan Pass payment, closing ─────────────────────────────
  console.log("[SCENE 5] Wallet, Fan Pass, closing...");
  await nav(SITE, "h1");
  const walletBtn = page.locator("button, [role='button']").filter({ hasText: /connect wallet/i }).first();
  if (await walletBtn.count() && await safeClick(walletBtn)) {
    await sleep(2500);
  }
  await narrate(18);
  await page.keyboard.press("Escape").catch(() => {});
  await sleep(400);

  await nav(`${SITE}/pricing`, "h1");
  await page.evaluate(() => window.scrollBy({ top: 260, behavior: "smooth" }));
  await sleep(1000);
  const grabPass = page.locator("button", { hasText: /Grab a pass/i }).first();
  if (await grabPass.count()) { await safeClick(grabPass); await sleep(1800); }
  await narrate(19);

  // Closing title card
  await page.goto(TITLE_CARD);
  await sleep(500);
  await narrate(20);
  await narrate(21);
  await sleep(800); // let the last frame breathe before cut

  console.log("[REC] closing browser...");
  const wallDur = (Date.now() - t0) / 1000;
  await ctx.close();
  await browser.close();

  const webms = fs.readdirSync(OUT_DIR)
    .filter(f => f.endsWith(".webm"))
    .map(f => ({ f, t: fs.statSync(path.join(OUT_DIR, f)).mtimeMs }))
    .sort((x, y) => y.t - x.t);
  if (!webms.length) throw new Error("No WebM produced");
  fs.renameSync(path.join(OUT_DIR, webms[0].f), RAW_WEBM);
  console.log(`Raw WebM: ${(fs.statSync(RAW_WEBM).size / 1048576).toFixed(1)} MB`);

  // Playwright numbers screencast frames at a fixed 25fps, but a page with
  // continuous animations delivers ~32fps — the webm then plays ~1.3x slower
  // than wall clock, and narration stamped in wall time drifts ahead (found
  // by anchor-frame measurement on v8.0). setpts compresses the video back to
  // the measured wall duration so audio, subtitles, and picture stay locked.
  const rawDur = probeDuration(RAW_WEBM);
  const K = wallDur / rawDur;
  console.log(`Time-base: wall ${wallDur.toFixed(1)}s, raw ${rawDur.toFixed(1)}s, setpts K=${K.toFixed(4)}`);

  // SRT + voiceover both built from the STAMPED start times → always in sync.
  writeSrt(cues, starts, durs);

  const X264 = [
    "-c:v", "libx264", "-preset", "ultrafast",
    "-x264-params", "rc-lookahead=0:ref=1:bframes=0", "-threads", "2",
    "-crf", "20", "-profile:v", "high", "-level", "6.2", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
  ];

  // ── ENCODE V1 — video only, 8K ────────────────────────────────────────────
  await ffmpeg([
    "-y", "-i", RAW_WEBM,
    "-vf", `setpts=PTS*${K.toFixed(6)},fps=25,scale=7680:4320:flags=lanczos`,
    ...X264, "-an",
    OUT_V1,
  ]);
  console.log("V1 saved:", OUT_V1, `(${(fs.statSync(OUT_V1).size/1048576).toFixed(1)} MB)`);

  // ── ENCODE V2 — voiceover positioned at stamped times + burned subtitles ──
  const srtEsc = SRT_FILE.replace(/\\/g, "/").replace(":", "\\:");
  const inputs = ["-i", RAW_WEBM];
  cueWavs.forEach(w => inputs.push("-i", w));
  const delays = cueWavs.map((_, i) => {
    const ms = Math.round(starts[i] * 1000);
    return `[${i + 1}:a]adelay=${ms}|${ms}[a${i}]`;
  }).join(";");
  const mix = cueWavs.map((_, i) => `[a${i}]`).join("") +
    `amix=inputs=${cueWavs.length}:normalize=0,volume=1.6[vo]`;

  await ffmpeg([
    "-y", ...inputs,
    "-filter_complex", `${delays};${mix}`,
    "-vf", `setpts=PTS*${K.toFixed(6)},fps=25,subtitles='${srtEsc}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=28',scale=7680:4320:flags=lanczos`,
    "-map", "0:v:0", "-map", "[vo]",
    ...X264,
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
    "-shortest",
    OUT_V2,
  ]);
  console.log("V2 saved:", OUT_V2, `(${(fs.statSync(OUT_V2).size/1048576).toFixed(1)} MB)`);

  console.log("Raw capture kept for verification:", RAW_WEBM);
  console.log("Cue WAVs kept for re-encode:", TMP_DIR);
  console.log(`\nDONE — narration measured-synced. Upload V2 to YouTube.\n  V2: ${OUT_V2}`);
}

main().catch(e => { console.error("\nFATAL:", e.message); process.exit(1); });
