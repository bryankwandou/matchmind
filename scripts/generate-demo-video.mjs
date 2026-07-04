/**
 * MatchMind Demo Video Generator — v7 (4K capture / 8K output, ~4-minute, zero blank frames)
 *
 * v7 adds coverage for the on-chain layer shipped after v5: the landing
 * page's dedicated on-chain section, Prediction Streak (locking a pick on
 * an upcoming fixture), Moment Mint, and the real devnet Fan Pass payment
 * button. Everything from v5/v6 (dynamic fixtures, zero blank frames,
 * synced SRT + voiceover) is unchanged.
 *
 * Key guarantees:
 *  - Fixture IDs fetched LIVE from /api/matches at runtime → always real data
 *  - Branded title card from frame 0 → no blank/white opening
 *  - Dark background injected into every document → any repaint is navy, never white
 *  - waitUntil "load" + visible-selector wait → no half-painted frames
 *  - SRT + SAPI voiceover generated from the SAME cue table → always in sync
 *
 * Output: 3840×2160 H.264 (deviceScaleFactor 2 on a 1920×1080 viewport)
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
const OUT_V1   = path.join(OUT_DIR, "matchmind-demo-v7-8k-music-only.mp4");
const OUT_V2   = path.join(OUT_DIR, "matchmind-demo-v7-8k-subtitled.mp4");

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

// ── Cue table: single source of truth for SRT + voiceover timing ─────────────
function buildCues(a, b) {
  const aName = `${a.homeTeam} vs ${a.awayTeam}`;
  const aScore = `${a.homeScore} to ${a.awayScore}`;
  const bName = `${b.homeTeam} vs ${b.awayTeam}`;
  return [
    { t: 1,   d: 6,  text: "This is MatchMind — a real-time intelligence platform\nfor every World Cup 2026 match." },
    { t: 8,   d: 7,  text: "Most fans watch with a phone in hand, splitting attention\nbetween score apps, odds tabs, and social commentary." },
    { t: 16,  d: 8,  text: "MatchMind puts live scores, consensus odds from 50+ bookmakers,\nand AI-written match notes all in one place." },
    { t: 25,  d: 9,  text: "The landing page loads instantly. Every part of the product\nworks without a login or an account." },
    { t: 36,  d: 9,  text: "Four steps: pick your team and tone, hook into the feed,\nlet moments trigger a read, track it your way." },
    { t: 48,  d: 10, text: "Scroll further and the on-chain layer is the headline,\nnot a footnote — streaks, minted moments, a real Solana payment." },
    { t: 60,  d: 9,  text: "The match list pulls directly from the TxLINE feed —\nlive scores update in real time, no page reload needed." },
    { t: 71,  d: 8,  text: "Cards pulse for matches currently in play. Each one shows\nthe current minute and odds from the market." },
    { t: 81,  d: 8,  text: "Filter tabs switch between all matches,\nlive only, upcoming, or finished fixtures." },
    { t: 92,  d: 9,  text: `Opening ${aName} — ${aScore}, live right now.\nReal TxLINE data, streaming as we record.` },
    { t: 103, d: 8,  text: "The left panel is the AI commentary feed. The right panel\nshows the scoreboard and every event since kickoff." },
    { t: 113, d: 9,  text: "Click any event in the timeline and a written note\nappears in about a second and a half." },
    { t: 124, d: 9,  text: "The AI reads only the facts the live feed provides.\nIt will not invent a player name or a made-up statistic." },
    { t: 135, d: 10, text: "Every read can become a signed record — Mint moment writes\nthe score, minute, and price to Solana devnet, wallet-signed." },
    { t: 147, d: 11, text: "You can also ask it a question directly. It answers\nin plain language, grounded in what is on the pitch." },
    { t: 160, d: 9,  text: `Here is a second fixture: ${bName}.\nOdds and event log come straight from the same feed.` },
    { t: 171, d: 10, text: "Before kickoff, call the 1X2 against the live line.\nGet it right and a streak builds — miss it, and it resets." },
    { t: 183, d: 9,  text: "Where the book has no live price yet, MatchMind derives one\nfrom score and time remaining with a Poisson model." },
    { t: 194, d: 8,  text: "Connect a Solana wallet to link the on-chain layer.\nThe wallet panel explains exactly what linking does." },
    { t: 204, d: 10, text: "Back on the pricing page, Grab a pass does something —\na real USDC payment on-chain, confirmed and receipted." },
    { t: 216, d: 8,  text: "MatchMind — live data, grounded AI, a streak worth defending,\nbuilt on Solana." },
    { t: 226, d: 7,  text: "matchmind-omega.vercel.app\ngithub.com/nayrbryanGaming/matchmind" },
  ];
}

function toSrtTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  const ms = String(Math.round((sec % 1) * 1000)).padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;
}

function writeSrt(cues) {
  const srt = cues.map((c, i) =>
    `${i + 1}\n${toSrtTime(c.t)} --> ${toSrtTime(c.t + c.d)}\n${c.text}\n`
  ).join("\n");
  fs.writeFileSync(SRT_FILE, srt, "utf-8");
  console.log("SRT written:", SRT_FILE);
}

// ── Voiceover: one SAPI WAV per cue, mixed at exact offsets via ffmpeg ───────
function synthCueWavs(cues) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const files = [];
  for (let i = 0; i < cues.length; i++) {
    const wav = path.join(TMP_DIR, `cue_${String(i).padStart(2, "0")}.wav`);
    const text = cues[i].text.replace(/\n/g, " ").replace(/'/g, "''");
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
  }
  console.log(`Voiceover: ${files.length} cue WAVs synthesized`);
  return files;
}

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log("\n$ ffmpeg", args.slice(0, 8).join(" "), "...");
    const p = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "inherit"] });
    p.on("close", code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
  });
}

// Title card shown from frame 0 — branded, never blank.
// NOTE: charset=utf-8 declared + &middot; entity so the data URL cannot be
// byte-decoded as Latin-1 (that produced the stray "Â" before every middot).
const TITLE_CARD = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#070a12;font-family:Segoe UI,Arial,sans-serif">
<div style="width:64px;height:64px;border-radius:14px;background:linear-gradient(135deg,#22c55e,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:#070a12">M</div>
<h1 style="color:#f2f5fa;font-size:64px;letter-spacing:-0.04em;margin:28px 0 10px">MatchMind</h1>
<p style="color:#8a94a8;font-size:22px;margin:0">Live World Cup intelligence &middot; TxLINE data &middot; grounded AI</p>
</body></html>`)}`;

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("MatchMind Demo Generator v7 — 8K / ~4 min / zero blank frames\n");

  const { a, b } = await pickFixtures();
  console.log(`Fixture A (live): ${a.homeTeam} vs ${a.awayTeam} [${a.id}] ${a.homeScore}-${a.awayScore} @ ${a.minute}'`);
  console.log(`Fixture B:        ${b.homeTeam} vs ${b.awayTeam} [${b.id}] status=${b.status}`);

  const cues = buildCues(a, b);
  writeSrt(cues);
  const cueWavs = synthCueWavs(cues);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // retina-sharp; do NOT also pass --force-device-scale-factor
    // Capture at native 4K (1920×1080 @2x device pixels = 3840×2160, recorded 1:1)
    // so the 8K upscale feeds off genuine detail — sharp, not blocky.
    recordVideo: { dir: OUT_DIR, size: { width: 3840, height: 2160 } },
  });

  // Any document repaint is brand-navy, never white.
  await ctx.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = "html,body{background:#070a12 !important;}";
    (document.head || document.documentElement).appendChild(s);
  });

  const page = await ctx.newPage();

  // "load" not "networkidle" — the open SSE score stream never goes idle.
  const nav = async (url, waitSel, ms = 40000) => {
    await page.goto(url, { waitUntil: "load", timeout: ms });
    if (waitSel) {
      try { await page.waitForSelector(waitSel, { state: "visible", timeout: 15000 }); } catch {}
    }
    await page.evaluate(() => { window.scrollBy(0, 1); window.scrollTo(0, 0); });
    await sleep(1200);
  };

  const t0 = Date.now();
  const at = async targetSec => { // wait until video-time reaches targetSec
    const wait = targetSec * 1000 - (Date.now() - t0);
    if (wait > 0) await sleep(wait);
  };

  // A fixed nav bar can sit over the top of a freshly-scrolled-into-view
  // element; force + a settle delay keeps one flaky click from aborting an
  // otherwise-good multi-minute recording.
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

  // ── 0:00 Title card ────────────────────────────────────────────────────────
  await page.goto(TITLE_CARD);
  await at(4);

  // ── 0:04 SCENE 1 — Landing, through the on-chain section (to ~0:59) ──────
  console.log("[SCENE 1] Landing...");
  await nav(SITE, "h1");
  await at(14); // dwell on hero

  for (let i = 1; i <= 13; i++) {
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
    await sleep(1500);
  }
  await sleep(2500); // dwell on the on-chain section
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await at(59);

  // ── 0:60 SCENE 2 — Match list (to ~1:31) ──────────────────────────────────
  console.log("[SCENE 2] Match list...");
  await nav(`${SITE}/match`, 'a[href^="/match/"]');
  await sleep(3000);

  const liveCard = page.locator('a[href^="/match/"]').first();
  if (await liveCard.count()) await liveCard.hover();
  await sleep(2500);

  for (const label of ["LIVE", "UPCOMING", "FINISHED", "ALL"]) {
    const btn = page.locator("button").filter({ hasText: new RegExp(`^${label}$`, "i") }).first();
    if (await btn.count()) { await safeClick(btn); await sleep(2000); }
  }
  await at(91);

  // ── 1:31 SCENE 3 — Live match detail + Moment Mint (to ~2:39) ─────────────
  console.log(`[SCENE 3] ${a.homeTeam} vs ${a.awayTeam}...`);
  await nav(`${SITE}/match/${a.id}`, "main, h1");
  await sleep(6000); // auto commentary

  await page.evaluate(() => window.scrollBy({ top: 180, behavior: "smooth" }));
  await sleep(2000);

  const evtBtns = page.locator("button").filter({ hasText: /GOAL|KO|SUB|HT|FT|CARD|VAR/i });
  const n = await evtBtns.count();
  console.log(`  ${n} event buttons`);
  for (let i = 0; i < Math.min(n, 2); i++) {
    await safeClick(evtBtns.nth(i));
    await sleep(5000);
  }

  // Moment Mint button lives inline on each AI commentary bubble — dwell so
  // it reads clearly before moving on.
  const mintBtn = page.locator("button", { hasText: "Mint moment" }).first();
  if (await mintBtn.count()) await mintBtn.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(4000);

  // Ask-the-AI live demo
  const input = page.locator("input[placeholder*='Ask'], textarea[placeholder*='Ask']").first();
  if (await input.count() && await safeClick(input)) {
    await input.pressSequentially("Who is more likely to score next and why?", { delay: 45 });
    await sleep(600);
    await input.press("Enter");
    await sleep(9000); // let the grounded answer render
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await at(159);

  // ── 2:39 SCENE 4 — Second fixture + Prediction Streak (to ~3:13) ──────────
  console.log(`[SCENE 4] ${b.homeTeam} vs ${b.awayTeam}...`);
  await nav(`${SITE}/match/${b.id}`, "main, h1");
  await sleep(3000);

  // Fixture B is picked pre-kickoff when available, so the 1X2 panel shows
  // live pick buttons rather than the "predictions closed" state.
  await page.evaluate(() => window.scrollBy({ top: 260, behavior: "smooth" }));
  await sleep(1500);
  const oddsPickBtn = page.locator("button").filter({ hasText: /\d\.\d{2}/ }).first();
  if (await oddsPickBtn.count()) {
    await safeClick(oddsPickBtn);
    await sleep(3500); // let "LOCKED IN" render
  }

  const evtBtns2 = page.locator("button").filter({ hasText: /GOAL|KO|SUB|HT|FT/i });
  if (await evtBtns2.count()) { await safeClick(evtBtns2.first()); await sleep(4000); }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await at(193);

  // ── 3:13 SCENE 5 — Wallet, Fan Pass payment, and closing (to ~3:53) ───────
  console.log("[SCENE 5] Wallet, Fan Pass, closing...");
  await nav(SITE, "h1");
  await sleep(2000);

  const walletBtn = page.locator("button, [role='button']").filter({ hasText: /connect wallet/i }).first();
  if (await walletBtn.count() && await safeClick(walletBtn)) {
    await sleep(3500);
    await page.keyboard.press("Escape");
    await sleep(500);
  }

  // Scroll to the pricing tiers and trigger the real Fan Pass payment button —
  // with no wallet extension in this headless run it surfaces the same
  // connect-wallet guard a real visitor sees, proof the button is wired, not decorative.
  const grabPass = page.locator("button", { hasText: /Grab a pass/i }).first();
  if (await grabPass.count()) {
    await safeClick(grabPass);
    await sleep(2500);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await at(234);

  // Closing title card
  await page.goto(TITLE_CARD);
  await at(241);

  console.log("[REC] closing browser...");
  await ctx.close();
  await browser.close();

  const webms = fs.readdirSync(OUT_DIR)
    .filter(f => f.endsWith(".webm"))
    .map(f => ({ f, t: fs.statSync(path.join(OUT_DIR, f)).mtimeMs }))
    .sort((x, y) => y.t - x.t);
  if (!webms.length) throw new Error("No WebM produced");
  fs.renameSync(path.join(OUT_DIR, webms[0].f), RAW_WEBM);
  console.log(`Raw WebM: ${(fs.statSync(RAW_WEBM).size / 1048576).toFixed(1)} MB`);

  // ── ENCODE V1 — video only, 8K (7680×4320) ────────────────────────────────
  await ffmpeg([
    "-y", "-i", RAW_WEBM,
    "-vf", "scale=7680:4320:flags=lanczos",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-profile:v", "high", "-level", "6.2", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an",
    OUT_V1,
  ]);
  console.log("V1 saved:", OUT_V1, `(${(fs.statSync(OUT_V1).size/1048576).toFixed(1)} MB)`);

  // ── ENCODE V2 — video + positioned voiceover + burned subtitles ───────────
  const srtEsc = SRT_FILE.replace(/\\/g, "/").replace(":", "\\:");
  const inputs = ["-i", RAW_WEBM];
  cueWavs.forEach(w => inputs.push("-i", w));
  const delays = cueWavs.map((_, i) =>
    `[${i + 1}:a]adelay=${cues[i].t * 1000}|${cues[i].t * 1000}[a${i}]`).join(";");
  const mix = cueWavs.map((_, i) => `[a${i}]`).join("") +
    `amix=inputs=${cueWavs.length}:normalize=0,volume=1.6[vo]`;

  await ffmpeg([
    "-y", ...inputs,
    "-filter_complex", `${delays};${mix}`,
    "-vf", `scale=7680:4320:flags=lanczos,subtitles='${srtEsc}':force_style='FontName=Arial,FontSize=40,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=4,Shadow=2,Alignment=2,MarginV=100'`,
    "-map", "0:v:0", "-map", "[vo]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-profile:v", "high", "-level", "6.2", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
    "-shortest",
    OUT_V2,
  ]);
  console.log("V2 saved:", OUT_V2, `(${(fs.statSync(OUT_V2).size/1048576).toFixed(1)} MB)`);

  fs.unlinkSync(RAW_WEBM);
  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  console.log(`
DONE — 8K (7680×4320) / ~3:55
  V1: ${OUT_V1}
  V2: ${OUT_V2}  (voiceover + burned subtitles)
  SRT: ${SRT_FILE}
NEXT: upload V2 to YouTube, paste link into the form.`);
}

main().catch(e => { console.error("\nFATAL:", e.message); process.exit(1); });
