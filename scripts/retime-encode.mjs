// Final v8 encode with time-base correction.
//
// Root cause found by anchor-frame measurement: Playwright numbers screencast
// frames at a fixed 25fps, but this page's continuous animations make Chromium
// deliver ~32fps — so the raw webm plays ~1.29x SLOWER than wall clock
// (329.16s of video for ~255.4s of real time). Narration cues were stamped in
// wall time, so mixing them over the stretched video drifts up to ~74s by the
// end. Linear stretch was confirmed at two independent anchors (hero, pricing).
//
// Fix: setpts compresses the video back to wall time; the premixed voiceover
// (already positioned at wall-time offsets) and the SRT then line up exactly.
// Bonus: duration drops to ~4:15, inside the hackathon's 5-minute cap.
import { spawn } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const FFMPEG   = require("ffmpeg-static");
const OUT_DIR  = "E:\\Download";
const RAW_WEBM = path.join(OUT_DIR, "_mm_raw.webm");
const MIX_AAC  = path.join(OUT_DIR, "_mm_tmp", "_voiceover_mix.m4a");
const SRT_FILE = path.join(OUT_DIR, "matchmind-subtitles.srt");
const OUT_V1   = path.join(OUT_DIR, "matchmind-demo-v8-8k-music-only.mp4");
const OUT_V2   = path.join(OUT_DIR, "matchmind-demo-v8-8k-subtitled.mp4");

// Wall-clock duration of the recording session, from the run log:
// last cue @248.3s + 5.7s spoken + 0.45s breath + 0.8s tail sleep ≈ 255.4s.
const WALL_S = 255.4;
const RAW_S  = 329.16; // ffprobe'd raw webm duration
const K = WALL_S / RAW_S; // ≈ 0.776

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log("\n$ ffmpeg", args.slice(0, 6).join(" "), "...");
    const p = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "inherit"] });
    p.on("close", code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
  });
}

const X264 = [
  "-c:v", "libx264", "-preset", "ultrafast",
  "-x264-params", "rc-lookahead=0:ref=1:bframes=0", "-threads", "2",
  "-crf", "20", "-profile:v", "high", "-level", "6.2", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
];

async function main() {
  console.log(`Retime factor K=${K.toFixed(4)} (raw ${RAW_S}s -> wall ${WALL_S}s)`);

  // ── V2 first (the judged cut): retime → subtitles → 8K, premixed audio ────
  const srtEsc = SRT_FILE.replace(/\\/g, "/").replace(":", "\\:");
  await ffmpeg([
    "-y", "-i", RAW_WEBM, "-i", MIX_AAC,
    "-vf", `setpts=PTS*${K.toFixed(6)},fps=25,subtitles='${srtEsc}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=28',scale=7680:4320:flags=lanczos`,
    "-map", "0:v:0", "-map", "1:a:0",
    ...X264,
    "-c:a", "copy",
    "-shortest",
    OUT_V2,
  ]);
  console.log("V2 saved:", OUT_V2, `(${(fs.statSync(OUT_V2).size / 1048576).toFixed(1)} MB)`);

  // ── V1: retimed video only ────────────────────────────────────────────────
  await ffmpeg([
    "-y", "-i", RAW_WEBM,
    "-vf", `setpts=PTS*${K.toFixed(6)},fps=25,scale=7680:4320:flags=lanczos`,
    ...X264, "-an",
    OUT_V1,
  ]);
  console.log("V1 saved:", OUT_V1, `(${(fs.statSync(OUT_V1).size / 1048576).toFixed(1)} MB)`);

  console.log("\nDONE — retimed to wall clock; V2 is the judged cut.");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
