"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { searchPlaces, type GeocodeResult } from "@/lib/geocode";
import { saveMemory } from "@/lib/db";
import { emptyJournals } from "@/lib/journals";
import { markOnboardingComplete } from "@/lib/onboarding";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";
import { useMemories } from "@/lib/useMemories";
import { LoveLoading } from "@/components/LoveLoading";
import type { Memory, PartnerId } from "@/lib/types";

type Step = "welcome" | "met" | "tour";

const TOUR_ITEMS = [
  {
    title: "Map",
    body: "Every pin is a place you became more yourselves. Click the map or search a place to add the next one.",
  },
  {
    title: "Timeline",
    body: "Scroll the story in order, then jump back to the pin.",
  },
  {
    title: "Photos",
    body: "Gallery is a wall of shared moments. Album lets you filter and open them full screen.",
  },
  {
    title: "Journals",
    body: "Each of you has a voice on a memory. Share yours, or keep a line just for you.",
  },
];

const inputClass =
  "w-full min-h-11 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";
const inputStyle = {
  borderColor: "var(--theme-border)",
  backgroundColor: "var(--theme-bg)",
  color: "var(--theme-ink)",
  fontFamily: "var(--font-body)",
};

export function OnboardingWizard() {
  const router = useRouter();
  const { partner } = useCurrentPartner();
  const { memories, loading } = useMemories();
  const [step, setStep] = useState<Step>("welcome");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const existingMet = useMemo(
    () =>
      memories
        .filter((memory) => memory.type === "met")
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null,
    [memories]
  );

  function finish(memoryId?: string | null) {
    markOnboardingComplete();
    const id = memoryId ?? createdId ?? existingMet?.id;
    router.replace(id ? `/?memory=${id}` : "/");
  }

  if (loading && step !== "welcome") {
    return <LoveLoading variant="page" />;
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
        >
          Liebeskarte
        </p>
        <StepDots step={step} />

        {step === "welcome" && (
          <WelcomeStep onContinue={() => setStep("met")} onSkip={() => finish()} />
        )}
        {step === "met" && (
          <MetStep
            partner={partner}
            existingMet={existingMet}
            onCreated={(memory) => {
              setCreatedId(memory.id);
              setStep("tour");
            }}
            onContinue={() => setStep("tour")}
            onSkip={() => setStep("tour")}
          />
        )}
        {step === "tour" && (
          <TourStep onFinish={() => finish()} />
        )}
      </div>
    </div>
  );
}

function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["welcome", "met", "tour"];
  return (
    <ol className="mt-3 mb-8 flex gap-2" aria-label="Onboarding progress">
      {steps.map((item) => {
        const active = item === step;
        return (
          <li
            key={item}
            className="h-1.5 flex-1 rounded-full"
            style={{
              backgroundColor: active ? "var(--theme-accent)" : "var(--theme-border)",
            }}
            aria-current={active ? "step" : undefined}
          />
        );
      })}
    </ol>
  );
}

function WelcomeStep({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col">
      <h1
        className="text-3xl font-semibold leading-tight md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Every place we became us
      </h1>
      <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--theme-ink-muted)" }}>
        A private map journal for the two of you. Pin where you met, then keep adding the dinners,
        trips, and quiet afternoons that followed.
      </p>
      <div className="mt-auto flex flex-col gap-3 pt-10">
        <button
          type="button"
          onClick={onContinue}
          className="min-h-11 w-full rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          Start with where we met
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 w-full rounded-full border text-sm font-medium"
          style={{ borderColor: "var(--theme-border)", color: "var(--theme-ink)" }}
        >
          Skip for now
        </button>
      </div>
    </section>
  );
}

function MetStep({
  partner,
  existingMet,
  onCreated,
  onContinue,
  onSkip,
}: {
  partner: PartnerId;
  existingMet: Memory | null;
  onCreated: (memory: Memory) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const [title, setTitle] = useState("Where we met");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      setSearchResults(await searchPlaces(searchQuery));
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(result: GeocodeResult) {
    setPlace(result);
    setPlaceName(result.placeName);
    setSearchResults([]);
    setSearchQuery("");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!place) {
      setError("Search for a place first.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const journals = emptyJournals();
      journals[partner] = { text: note.trim(), shared: true };
      const memory: Memory = {
        id: uuidv4(),
        title: title.trim() || "Where we met",
        date,
        lat: place.lat,
        lng: place.lng,
        placeName: placeName.trim() || place.placeName,
        address: place.address,
        type: "met",
        journals,
        photoIds: [],
        visibility: "shared",
        owner: partner,
        createdAt: now,
        updatedAt: now,
      };
      await saveMemory(memory);
      onCreated(memory);
    } catch (err) {
      console.error("[atlas:onboarding] save met failed", err);
      setError("Couldn't save that pin. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (existingMet) {
    return (
      <section className="flex flex-1 flex-col">
        <h1
          className="text-3xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          You already pinned it
        </h1>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--theme-ink-muted)" }}>
          {existingMet.title}
          {existingMet.placeName ? ` · ${existingMet.placeName}` : ""}. Next, a quick look at how
          the journal works.
        </p>
        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={onContinue}
            className="min-h-11 w-full rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: "var(--theme-accent)" }}
          >
            Continue
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-1 flex-col">
      <h1
        className="text-3xl font-semibold leading-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Where we met
      </h1>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--theme-ink-muted)" }}>
        One pin to start the map. You can edit it later, or add photos from the memory card.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span
            className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Search place
          </span>
          <div className="flex gap-2">
            <input
              className={inputClass}
              style={inputStyle}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="A café, a street, a city…"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={searching}
              className="min-h-11 shrink-0 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--theme-accent)" }}
            >
              {searching ? "…" : "Go"}
            </button>
          </div>
        </label>

        {searchResults.length > 0 && (
          <ul
            className="max-h-48 overflow-y-auto rounded-lg border"
            style={{ borderColor: "var(--theme-border)" }}
          >
            {searchResults.map((result) => (
              <li key={`${result.lat},${result.lng},${result.placeName}`}>
                <button
                  type="button"
                  onClick={() => selectPlace(result)}
                  className="min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-black/5 active:bg-black/5"
                >
                  <span className="block">{result.placeName}</span>
                  {result.address && result.address !== result.placeName && (
                    <span className="mt-0.5 block text-xs" style={{ color: "var(--theme-ink-muted)" }}>
                      {result.address}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {place && (
          <label className="block">
            <span
              className="mb-1 block text-xs uppercase tracking-wider"
              style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
            >
              Place name
            </span>
            <input
              className={inputClass}
              style={inputStyle}
              value={placeName}
              onChange={(event) => setPlaceName(event.target.value)}
            />
            {place.address && place.address !== placeName && (
              <span className="mt-1 block text-xs" style={{ color: "var(--theme-ink-muted)" }}>
                {place.address}
              </span>
            )}
          </label>
        )}

        <label className="block">
          <span
            className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Date
          </span>
          <input
            type="date"
            required
            className={inputClass}
            style={inputStyle}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <label className="block">
          <span
            className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            Title
          </span>
          <input
            className={inputClass}
            style={inputStyle}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="block">
          <span
            className="mb-1 block text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            A first note
          </span>
          <textarea
            className={`${inputClass} min-h-[6rem] resize-y py-3`}
            style={inputStyle}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional — what you remember from that place."
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 w-full rounded-full text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          {saving ? "Pinning…" : "Pin this place"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 w-full rounded-full border text-sm font-medium"
          style={{ borderColor: "var(--theme-border)", color: "var(--theme-ink)" }}
        >
          Skip this step
        </button>
      </div>
    </form>
  );
}

function TourStep({ onFinish }: { onFinish: () => void }) {
  return (
    <section className="flex flex-1 flex-col">
      <h1
        className="text-3xl font-semibold leading-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        How the journal works
      </h1>
      <ul className="mt-6 space-y-4">
        {TOUR_ITEMS.map((item) => (
          <li
            key={item.title}
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--theme-border)",
              backgroundColor: "var(--theme-surface)",
            }}
          >
            <p className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {item.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--theme-ink-muted)" }}>
              {item.body}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={onFinish}
          className="min-h-11 w-full rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          Open the map
        </button>
      </div>
    </section>
  );
}
