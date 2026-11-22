"use client";
import { useEffect, useRef, useState } from "react";
import { Audio } from "./Media";
import { MagicMicrophone, StudioBackdrop } from "./art/Scenes";

type State = "idle" | "requesting" | "recording" | "paused" | "recorded" | "error";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return "";
}
const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Records audio with MediaRecorder. Calls onSave(blob, filename) when the student keeps the take.
 * Handles: unsupported browsers, insecure origins (phones on http://LAN-IP), denied permission, no mic.
 */
export function AudioRecorder({ onSave, saving, compact }: { onSave: (b: Blob, name: string) => Promise<void> | void; saving?: boolean; compact?: boolean }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [url, setUrl] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const started = useRef(0);
  const acc = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);

  const cleanup = () => {
    if (timer.current) clearInterval(timer.current);
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => undefined);
    audioCtx.current = null;
  };
  useEffect(() => () => { cleanup(); if (url) URL.revokeObjectURL(url); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tick = () => setElapsed(acc.current + (Date.now() - started.current));

  function drawWave(analyser: AnalyserNode) {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      const w = (c.width = c.clientWidth * devicePixelRatio), h = (c.height = c.clientHeight * devicePixelRatio);
      ctx.clearRect(0, 0, w, h);
      const bars = 48, step = Math.floor(data.length / bars);
      for (let i = 0; i < bars; i++) {
        let peak = 0;
        for (let j = 0; j < step; j++) peak = Math.max(peak, Math.abs(data[i * step + j] - 128));
        const bh = Math.max(3, (peak / 128) * h * 1.6);
        ctx.fillStyle = `rgba(227,203,146,${0.45 + peak / 256})`;
        const bw = w / bars * 0.55;
        ctx.fillRect(i * (w / bars) + (w / bars - bw) / 2, (h - bh) / 2, bw, Math.min(bh, h));
      }
      raf.current = requestAnimationFrame(loop);
    };
    loop();
  }

  async function start() {
    setError("");
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setState("error");
      setError("Recording needs a secure page (https:// or localhost). On this connection, record with your phone's voice recorder and upload the file below.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error"); setError("This browser can't record audio here. Please upload an audio file instead."); return;
    }
    setState("requesting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      const mime = pickMime();
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        const type = r.mimeType || mime || "audio/webm";
        const b = new Blob(chunks.current, { type: type.split(";")[0] });
        blob.current = b;
        setUrl(URL.createObjectURL(b));
        setState("recorded");
        cleanup();
      };
      r.start(1000);
      rec.current = r;
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ac = new Ctx(); audioCtx.current = ac;
        const an = ac.createAnalyser(); an.fftSize = 1024;
        ac.createMediaStreamSource(s).connect(an);
        drawWave(an);
      } catch { /* visualisation is optional */ }
      acc.current = 0; started.current = Date.now(); setElapsed(0);
      timer.current = setInterval(tick, 250);
      setState("recording");
    } catch (e) {
      cleanup();
      const name = (e as DOMException).name;
      setState("error");
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Allow the microphone in your browser's site settings (the 🔒 icon by the address), then try again — or upload an audio file."
          : name === "NotFoundError" ? "No microphone was found on this device. Connect one, or upload an audio file."
          : "The microphone couldn't start. Close other apps using it and try again, or upload an audio file."
      );
    }
  }
  function pause() {
    if (rec.current?.state === "recording" && typeof rec.current.pause === "function") {
      rec.current.pause(); acc.current += Date.now() - started.current;
      if (timer.current) clearInterval(timer.current);
      setState("paused");
    }
  }
  function resume() {
    if (rec.current?.state === "paused") {
      rec.current.resume(); started.current = Date.now();
      timer.current = setInterval(tick, 250); setState("recording");
    }
  }
  function stop() {
    if (rec.current && rec.current.state !== "inactive") {
      if (rec.current.state === "recording") acc.current += Date.now() - started.current;
      setElapsed(acc.current);
      rec.current.stop();
    }
  }
  function discard() {
    if (url) URL.revokeObjectURL(url);
    setUrl(""); blob.current = null; setElapsed(0); setState("idle");
  }
  async function keep() {
    if (!blob.current) return;
    const ext = blob.current.type.includes("mp4") ? "m4a" : blob.current.type.includes("ogg") ? "ogg" : "webm";
    await onSave(blob.current, `recording-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.${ext}`);
    discard();
  }

  const live = state === "recording" || state === "paused";
  return (
    <div className={`studio${state === "recording" ? " recording" : ""}${compact ? " compact" : ""}`}>
      {!compact && <StudioBackdrop />}
      {!compact && <MagicMicrophone />}
      <div className="rec-time" aria-live="off">
        {state === "recording" && <span className="rec-dot" aria-hidden />} {fmt(elapsed)}
      </div>
      <canvas ref={canvas} className="wave" style={{ visibility: live ? "visible" : "hidden" }} aria-hidden />
      <p className="sr-only" aria-live="polite">{state === "recording" ? "Recording" : state === "paused" ? "Paused" : state === "recorded" ? "Recording ready to review" : ""}</p>

      {state === "recorded" && url && <div style={{ marginTop: ".5rem" }}><Audio src={url} /></div>}
      {error && <div className="alert error" role="alert" style={{ marginTop: ".6rem", textAlign: "start" }}>{error}</div>}

      <div className="controls">
        {(state === "idle" || state === "error") && <button type="button" className="btn" onClick={start}>● Start recording</button>}
        {state === "requesting" && <button type="button" className="btn" disabled><span className="spinner" /> Waiting for microphone…</button>}
        {state === "recording" && typeof MediaRecorder !== "undefined" && "pause" in MediaRecorder.prototype && <button type="button" className="btn dark" onClick={pause}>❚❚ Pause</button>}
        {state === "paused" && <button type="button" className="btn dark" onClick={resume}>▶ Resume</button>}
        {live && <button type="button" className="btn" onClick={stop}>■ Stop</button>}
        {state === "recorded" && <>
          <button type="button" className="btn" onClick={keep} disabled={saving}>{saving ? <span className="spinner" /> : "✓"} Keep this recording</button>
          <button type="button" className="btn danger" onClick={discard} disabled={saving}>✕ Delete &amp; re-record</button>
        </>}
      </div>
    </div>
  );
}
