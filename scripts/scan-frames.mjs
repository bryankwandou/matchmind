// Frame luminance scan — proves (or disproves) blank/white frames in the demo video.
import { execFileSync } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";

const require = createRequire(import.meta.url);
const FFMPEG = require("ffmpeg-static");
const VIDEO = process.argv[2] ?? "E:/Download/matchmind-demo-v7-8k-subtitled.mp4";
// Relative filename dodges ffmpeg's filter-option colon parsing on Windows paths.
const OUT = "yavg-scan.txt";

execFileSync(FFMPEG, [
  "-y", "-i", VIDEO,
  "-vf", `scale=192:108,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=${OUT}`,
  "-f", "null", "-",
], { stdio: "pipe" });

const txt = fs.readFileSync(OUT, "utf8");
fs.unlinkSync(OUT);
const frames = [...txt.matchAll(/pts_time:([\d.]+)[\s\S]*?YAVG=([\d.]+)/g)]
  .map((m) => ({ t: +m[1], y: +m[2] }));

const ys = frames.map((f) => f.y);
const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
const white = frames.filter((f) => f.y > 180);
const light = frames.filter((f) => f.y > 120);

console.log(`video: ${VIDEO}`);
console.log(`frames: ${frames.length} | avgY: ${avg.toFixed(1)} | maxY: ${Math.max(...ys).toFixed(1)} | minY: ${Math.min(...ys).toFixed(1)}`);
console.log(`light frames (Y>120): ${light.length}`, light.slice(0, 12).map((f) => `${f.t.toFixed(1)}s(Y${f.y.toFixed(0)})`).join(", "));
console.log(`WHITE frames (Y>180): ${white.length} = ${(white.length / frames.length * 100).toFixed(4)}%`, white.slice(0, 12).map((f) => `${f.t.toFixed(1)}s`).join(", "));
