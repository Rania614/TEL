"use client";
import { useState } from "react";
import type { FileAsset, LearningMaterial } from "@/lib/types";
import { youtubeId, fmtSize } from "@/lib/labels";

export function YouTubeCard({ m }: { m: Pick<LearningMaterial, "title" | "description" | "url"> }) {
  const id = youtubeId(m.url);
  const [play, setPlay] = useState(false);
  return (
    <div className="card video-card" style={{ ["--c" as string]: "#fbdcda" }}>
      <div className="frame16">
        {id && play ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={m.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
        ) : id ? (
          <button className="thumb-btn" onClick={() => setPlay(true)} aria-label={`Play ${m.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          </button>
        ) : <div className="thumb" />}
      </div>
      <div className="body">
        <h3>{m.title}</h3>
        {m.description && <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>{m.description}</p>}
        {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".9rem" }}>Open on YouTube ↗</a>}
      </div>
    </div>
  );
}

export function FileView({ f, onRemove }: { f: Pick<FileAsset, "id" | "kind" | "originalName" | "size" | "mime">; onRemove?: () => void }) {
  const src = `/api/files/${f.id}`;
  return (
    <div className="file-item">
      <div className="spread">
        <span className="name">{f.kind === "AUDIO" ? "🎧" : f.kind === "IMAGE" ? "🖼" : f.kind === "PDF" ? "📄" : "📎"} {f.originalName} <span className="muted">· {fmtSize(f.size)}</span></span>
        <span className="row" style={{ gap: ".4rem" }}>
          <a href={src} target="_blank" rel="noopener noreferrer" className="btn ghost small">Open</a>
          {onRemove && <button type="button" className="btn danger small" onClick={onRemove}>Remove</button>}
        </span>
      </div>
      {f.kind === "AUDIO" && <Audio src={src} />}
      {f.kind === "IMAGE" && (
        <a href={src} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={f.originalName} loading="lazy" />
        </a>
      )}
    </div>
  );
}

export function MaterialCard({ m, file }: { m: LearningMaterial; file?: FileAsset | null }) {
  if (m.type === "YOUTUBE" && youtubeId(m.url)) return <YouTubeCard m={m} />;
  const icon = { YOUTUBE: "▶", LINK: "🔗", AUDIO: "🎧", PDF: "📄", IMAGE: "🖼", DOCUMENT: "📎" }[m.type];
  return (
    <div className="card" style={{ ["--c" as string]: "#cdeae4" }}>
      <h3>{icon} {m.title}</h3>
      {m.description && <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>{m.description}</p>}
      {file && <FileView f={file} />}
      {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer">Open link ↗</a>}
    </div>
  );
}

/** Chrome's MediaRecorder WebM files have no duration header; seek to the end once so the scrub bar works. */
export function Audio({ src }: { src: string }) {
  return (
    <audio controls preload="metadata" src={src}
      onLoadedMetadata={(e) => {
        const a = e.currentTarget;
        if (a.duration === Infinity) {
          const reset = () => { a.removeEventListener("timeupdate", reset); a.currentTime = 0; };
          a.addEventListener("timeupdate", reset);
          a.currentTime = 1e101;
        }
      }} />
  );
}
