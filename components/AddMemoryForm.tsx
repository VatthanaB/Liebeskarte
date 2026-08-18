"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Memory, MilestoneType } from "@/lib/types";
import { MILESTONE_LABELS } from "@/lib/types";
import { searchPlaces, type GeocodeResult } from "@/lib/geocode";
import { saveMemory, savePhoto, getPhotosForMemory, deletePhoto } from "@/lib/db";
import { looksLikeHeic, preparePhotoFile } from "@/lib/photo-file";
import { useTheme } from "./ThemeProvider";

interface AddMemoryFormProps {
  initial?: Partial<Memory> & { lat: number; lng: number };
  onSave: (memory: Memory) => void;
  onCancel: () => void;
}

const MILESTONE_TYPES = Object.keys(MILESTONE_LABELS) as MilestoneType[];

export function AddMemoryForm({ initial, onSave, onCancel }: AddMemoryFormProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [placeName, setPlaceName] = useState(initial?.placeName ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [lat, setLat] = useState(initial?.lat ?? -36.8485);
  const [lng, setLng] = useState(initial?.lng ?? 174.7633);
  const [type, setType] = useState<MilestoneType>(initial?.type ?? "custom");
  const [journal, setJournal] = useState(initial?.journal ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotoIds, setExistingPhotoIds] = useState<string[]>(
    initial?.photoIds ?? []
  );
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [convertingPhotos, setConvertingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const memoryId = initial?.id ?? uuidv4();

  useEffect(() => {
    if (initial?.id) {
      getPhotosForMemory(initial.id).then((photos) => {
        setExistingPhotoUrls(photos.map((photo) => photo.url).filter(Boolean));
        setExistingPhotoIds(photos.map((photo) => photo.id));
      });
    }
  }, [initial?.id]);

  useEffect(() => {
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoFiles]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(place: GeocodeResult) {
    setLat(place.lat);
    setLng(place.lng);
    setPlaceName(place.placeName);
    setAddress(place.address);
    setSearchResults([]);
    setSearchQuery("");
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setPhotoError(null);
    setConvertingPhotos(files.some(looksLikeHeic));
    try {
      const prepared = await Promise.all(files.map(preparePhotoFile));
      setPhotoFiles((prev) => [...prev, ...prepared]);
    } catch (error) {
      console.error("[atlas] photo convert failed", error);
      setPhotoError("Couldn't read a HEIC photo. Try exporting it as JPEG.");
    } finally {
      setConvertingPhotos(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const photoIds = [...existingPhotoIds];

      const memory: Memory = {
        id: memoryId,
        title: title.trim(),
        date,
        lat,
        lng,
        placeName:
          placeName.trim() ||
          address.trim().split(",")[0]?.trim() ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: address.trim(),
        type,
        journal: journal.trim(),
        photoIds,
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
      };

      await saveMemory(memory);

      for (const file of photoFiles) {
        const photoId = uuidv4();
        await savePhoto({
          id: photoId,
          memoryId,
          file,
        });
        photoIds.push(photoId);
      }

      if (photoFiles.length > 0) {
        await saveMemory({ ...memory, photoIds });
      }
      onSave(memory);
    } finally {
      setSaving(false);
    }
  }

  async function removeExistingPhoto(photoId: string, index: number) {
    await deletePhoto(photoId);
    setExistingPhotoIds((prev) => prev.filter((id) => id !== photoId));
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2";
  const inputStyle = {
    borderColor: "var(--theme-border)",
    backgroundColor: "var(--theme-bg)",
    color: "var(--theme-ink)",
    fontFamily: "var(--font-body)",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] flex-col overflow-hidden rounded-xl ${theme.cardClass}`}
      style={{ backgroundColor: "var(--theme-surface)" }}
    >
      <div className="flex items-center justify-between border-b px-5 py-4"
        style={{ borderColor: "var(--theme-border)" }}
      >
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {initial?.id ? "Edit memory" : "Add memory"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xl opacity-60 hover:opacity-100"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Title
          </label>
          <input
            className={inputClass}
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="First trip to Wellington"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider"
              style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
            >
              Date
            </label>
            <input
              type="date"
              className={inputClass}
              style={inputStyle}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider"
              style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
            >
              Type
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={type}
              onChange={(e) => setType(e.target.value as MilestoneType)}
            >
              {MILESTONE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MILESTONE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Search place
          </label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              style={inputStyle}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Auckland, Paris, Tokyo..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--theme-accent)" }}
            >
              {searching ? "..." : "Go"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border"
              style={{ borderColor: "var(--theme-border)" }}
            >
              {searchResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectPlace(r)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-black/5"
                  >
                    <span className="block">{r.placeName}</span>
                    {r.address && r.address !== r.placeName && (
                      <span
                        className="mt-0.5 block text-xs"
                        style={{ color: "var(--theme-ink-muted)" }}
                      >
                        {r.address}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Place name
          </label>
          <input
            className={inputClass}
            style={inputStyle}
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="The cafe, our street, a park..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Address
          </label>
          <textarea
            className={`${inputClass} min-h-[4.5rem] resize-y`}
            style={inputStyle}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="134 Ponsonby Road, Grey Lynn, Auckland"
            rows={2}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Journal
          </label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            style={inputStyle}
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="Write about this moment..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Photos
          </label>
          <div className="flex flex-wrap gap-2">
            {existingPhotoUrls.map((url, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(existingPhotoIds[i], i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {photoPreviews.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={convertingPhotos}
              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed text-2xl disabled:opacity-50"
              style={{ borderColor: "var(--theme-border)", color: "var(--theme-ink-muted)" }}
            >
              {convertingPhotos ? "…" : "+"}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,image/heic,image/heif"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
          {convertingPhotos && (
            <p className="mt-2 text-xs" style={{ color: "var(--theme-ink-muted)" }}>
              Converting HEIC photo…
            </p>
          )}
          {photoError && (
            <p className="mt-2 text-xs text-red-600">{photoError}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 border-t px-5 py-4"
        style={{ borderColor: "var(--theme-border)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border py-2.5 text-sm font-medium"
          style={{ borderColor: "var(--theme-border)", color: "var(--theme-ink-muted)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          {saving ? "Saving..." : "Save memory"}
        </button>
      </div>
    </form>
  );
}
