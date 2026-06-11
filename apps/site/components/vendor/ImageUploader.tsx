"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";

export interface UploadedImage {
  url:  string;
  id?:  number;
  name: string;
}

interface ImageUploaderProps {
  images:   UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?:     number; // default 8
}

interface UploadItem {
  key:      string;
  name:     string;
  preview:  string;
  status:   "uploading" | "done" | "error";
  error?:   string;
  url?:     string;
}

export default function ImageUploader({
  images,
  onChange,
  max = 8,
}: ImageUploaderProps) {
  const inputRef         = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue,    setQueue]    = useState<UploadItem[]>([]);

  function objectKey() {
    return Math.random().toString(36).slice(2);
  }

  const uploadFile = useCallback(
    async (file: File) => {
      const key     = objectKey();
      const preview = URL.createObjectURL(file);

      setQueue((q) => [
        ...q,
        { key, name: file.name, preview, status: "uploading" },
      ]);

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res  = await fetch("/api/vendor/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok) {
          setQueue((q) =>
            q.map((item) =>
              item.key === key
                ? { ...item, status: "error", error: data.error ?? "Upload failed" }
                : item
            )
          );
          return;
        }

        setQueue((q) =>
          q.map((item) =>
            item.key === key ? { ...item, status: "done", url: data.url } : item
          )
        );

        onChange([...images, { url: data.url, id: data.id, name: file.name }]);
      } catch {
        setQueue((q) =>
          q.map((item) =>
            item.key === key
              ? { ...item, status: "error", error: "Network error" }
              : item
          )
        );
      } finally {
        // Free the blob URL once the upload settles
        setTimeout(() => URL.revokeObjectURL(preview), 30_000);
      }
    },
    [images, onChange]
  );

  function processFiles(files: FileList | null) {
    if (!files) return;
    const remaining = (max ?? 8) - images.length;
    const toUpload  = Array.from(files).slice(0, remaining);
    toUpload.forEach(uploadFile);
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node | null)) {
      setDragging(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    e.target.value = "";
  }

  function removeImage(url: string) {
    onChange(images.filter((img) => img.url !== url));
  }

  function dismissError(key: string) {
    setQueue((q) => q.filter((item) => item.key !== key));
  }

  function moveImage(from: number, to: number) {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  const isFull    = images.length >= (max ?? 8);
  const uploading = queue.filter((q) => q.status === "uploading");
  const errors    = queue.filter((q) => q.status === "error");

  return (
    <div className="iup-wrap">
      {/* ── Existing images grid ── */}
      {images.length > 0 && (
        <div className="iup-grid">
          {images.map((img, i) => (
            <div key={img.url} className="iup-item">
              {i === 0 && <div className="iup-main-badge">Main</div>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.name} className="iup-img" />
              <div className="iup-item-actions">
                {i > 0 && (
                  <button
                    type="button"
                    className="iup-action-btn"
                    title="Move left"
                    onClick={() => moveImage(i, i - 1)}
                  >
                    ←
                  </button>
                )}
                {i < images.length - 1 && (
                  <button
                    type="button"
                    className="iup-action-btn"
                    title="Move right"
                    onClick={() => moveImage(i, i + 1)}
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  className="iup-action-btn iup-action-btn--remove"
                  title="Remove"
                  onClick={() => removeImage(img.url)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* In-progress slots */}
          {uploading.map((item) => (
            <div key={item.key} className="iup-item iup-item--uploading">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="" className="iup-img iup-img--dim" />
              <div className="iup-progress-overlay">
                <div className="iup-spinner" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── In-progress when no existing images ── */}
      {images.length === 0 && uploading.length > 0 && (
        <div className="iup-grid">
          {uploading.map((item) => (
            <div key={item.key} className="iup-item iup-item--uploading">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="" className="iup-img iup-img--dim" />
              <div className="iup-progress-overlay">
                <div className="iup-spinner" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Errors ── */}
      {errors.map((item) => (
        <div key={item.key} className="iup-error">
          <span>
            <strong>{item.name}</strong>: {item.error}
          </span>
          <button
            type="button"
            className="iup-error-dismiss"
            onClick={() => dismissError(item.key)}
          >
            ✕
          </button>
        </div>
      ))}

      {/* ── Drop zone ── */}
      {!isFull && (
        <div
          className={`iup-zone${dragging ? " iup-zone--active" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          aria-label="Upload images"
        >
          <div className="iup-zone-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="iup-zone-label">
            {dragging ? "Drop to upload" : "Drag images here"}
          </div>
          <div className="iup-zone-sub">
            or click to browse &nbsp;·&nbsp; JPEG, PNG, WebP &nbsp;·&nbsp; max 8 MB
          </div>
          {images.length > 0 && (
            <div className="iup-zone-count">
              {images.length} / {max} images added
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            style={{ display: "none" }}
            onChange={onInputChange}
          />
        </div>
      )}

      {isFull && (
        <p className="iup-limit-note">
          Maximum of {max} images reached.{" "}
          <button
            type="button"
            className="iup-limit-remove"
            onClick={() => onChange(images.slice(0, -1))}
          >
            Remove last
          </button>
        </p>
      )}
    </div>
  );
}
