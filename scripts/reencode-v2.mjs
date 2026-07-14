// Standalone low-memory V2 re-encode. The in-script V2 pass died silently
// (OOM: subtitle-burn + 8K scale + 22 simultaneous audio decodes in one graph).
// This splits it into two light passes and reuses the existing raw capture,
// cue WAVs, and SRT — no re-record.
//
//   Pass A: mix the 22 delayed WAVs into ONE aac file (no video, tiny memory).
//   Pass B: raw → burn subtitles → scale 8K, with just that ONE pre-mixed audio.
//
// Start offsets are recovered from the SRT so audio and captions stay locked.
import { spawn, execFileSync } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const FFMPEG   = require("ffmpeg-static");
const OUT_DIR  = "E:\\Download";
const TMP_DIR  = path.join(OUT_DIR, "_mm_tmp");
const RAW_WEBM = path.join(OUT_DIR, "_mm_raw.webm");
const SRT_FILE = path.join(OUT_DIR, "matchmind-subtitles.srt");
const MIX_AAC  = path.join(TMP_DIR, "_voiceover_mix.m4a");
const OUT_V2   = path.join(OUT_DIR, "matchmind-demo-v8-8k-subtitled.mp4");

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log("\n$ ffmpeg", args.slice(0, 6).join(" "), "...");
    const p = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "inherit"] });
    p.on("close", code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
  });
}

// Recover each cue's start time (ms) from the SRT's first timestamp per block.
function startsFromSrt() {
  const txt = fs.readFileSync(SRT_FILE, "utf8");
  const times = [...txt.matchAll(/(\d\d):(\d\d):(\d\d),(\d\d\d)\s*-->/g)]
    .map(m => (+m[1]) * 3600000 + (+m[2]) * 60000 + (+m[3]) * 1000 + (+m[4]));
  return times;
}

async function main() {
  const wavs = fs.readdirSync(TMP_DIR).filter(f => /^cue_\d+\.wav$/.test(f)).sort()
    .map(f => path.join(TMP_DIR, f));
  const startsMs = startsFromSrt();
  if (wavs.length !== startsMs.length)
    throw new Error(`WAV count ${wavs.length} != SRT block count ${startsMs.length}`);
  console.log(`${wavs.length} cues, last start ${(startsMs.at(-1) / 1000).toFixed(1)}s`);

  // ── Pass A — premix voiceover to a single track (tiny memory) ──────────────
  const inputs = [];
  wavs.forEach(w => inputs.push("-i", w));
  const delays = wavs.map((_, i) => `[${i}:a]adelay=${startsMs[i]}|${startsMs[i]}[a${i}]`).join(";");
  const mix = wavs.map((_, i) => `[a${i}]`).join("") +
    `amix=inputs=${wavs.length}:normalize=0,volume=1.6[vo]`;
  await ffmpeg([
    "-y", ...inputs,
    "-filter_complex", `${delays};${mix}`,
    "-map", "[vo]", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
    MIX_AAC,
  ]);
  console.log("Premix saved:", MIX_AAC, `(${(fs.statSync(MIX_AAC).size / 1048576).toFixed(1)} MB)`);

  // ── Pass B — burn subtitles, scale to 8K, attach the single audio track ────
  const srtEsc = SRT_FILE.replace(/\\/g, "/").replace(":", "\\:");
  await ffmpeg([
    "-y", "-i", RAW_WEBM, "-i", MIX_AAC,
    "-vf", `subtitles='${srtEsc}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=28',scale=7680:4320:flags=lanczos`,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "libx264", "-preset", "ultrafast",
    "-x264-params", "rc-lookahead=0:ref=1:bframes=0", "-threads", "2",
    "-crf", "20", "-profile:v", "high", "-level", "6.2", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-c:a", "copy",
    "-shortest",
    OUT_V2,
  ]);
  console.log("V2 saved:", OUT_V2, `(${(fs.statSync(OUT_V2).size / 1048576).toFixed(1)} MB)`);
  console.log("\nDONE.");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
