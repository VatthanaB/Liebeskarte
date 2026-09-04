"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markOnboardingComplete } from "@/lib/onboarding";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";

type Step = "seal" | "began" | "you" | "gift";

const STEPS: Step[] = ["seal", "began", "you", "gift"];

const LOVE_PHRASES = [
  { lang: "en", text: "I love you." },
  { lang: "de", text: "Ich liebe dich." },
  { lang: "fr", text: "Je t'aime." },
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const { partner } = useCurrentPartner();
  const [step, setStep] = useState<Step>("seal");
  const [opened, setOpened] = useState(false);
  const [screenKey, setScreenKey] = useState(0);

  useEffect(() => {
    if (partner === "panda") {
      router.replace("/");
    }
  }, [partner, router]);

  if (partner === "panda") {
    return null;
  }

  function advance(next: Step) {
    setScreenKey((key) => key + 1);
    setStep(next);
  }

  function finish() {
    markOnboardingComplete();
    router.replace("/");
  }

  return (
    <div className="gift-letter flex min-h-dvh flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <span className="gift-letter__doodle gift-letter__doodle--a" aria-hidden="true">
        ♡
      </span>
      <span className="gift-letter__doodle gift-letter__doodle--b" aria-hidden="true">
        ✿
      </span>
      <span className="gift-letter__doodle gift-letter__doodle--c" aria-hidden="true">
        ♡
      </span>
      <span className="gift-letter__doodle gift-letter__doodle--d" aria-hidden="true">
        ✿
      </span>

      <div className="relative z-[1] mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        {step !== "seal" && (
          <HeartProgress step={step} />
        )}

        {step === "seal" && (
          <SealStep
            opened={opened}
            onOpen={() => {
              setOpened(true);
              window.setTimeout(() => advance("began"), 520);
            }}
          />
        )}

        {step === "began" && (
          <LetterScreen
            key={`began-${screenKey}`}
            kicker="How we began"
            title="None of it quite makes sense."
            lines={[
              "A goblin upstairs, on a Wednesday of all days.",
              "Saint Leonards, and a dinner invite neither of us needed to accept.",
              <>Then two words on my phone. <em>Hello Stranger.</em></>,
              "Take away any one of those and we never happen.",
              "That's the part I can't get over. It didn't have to.",
            ]}
            cta="And then"
            onContinue={() => advance("you")}
          />
        )}

        {step === "you" && (
          <LetterScreen
            key={`you-${screenKey}`}
            kicker="What you are to me"
            title="Two addresses, one home."
            lines={[
              "Dominion Road and Richmond Road. We kept ending up at one or the other, and I stopped keeping track of whose was whose.",
              "Then a Thursday, when I stopped being someone you were seeing and became your French boyfriend.",
              "Best title I've ever had.",
              <>That was the first time I wrote it down, too. <em>Because I love you very much.</em></>,
              "I meant it well before I wrote it. Writing it just made it real.",
            ]}
            cta="One more thing"
            onContinue={() => advance("gift")}
          />
        )}

        {step === "gift" && (
          <GiftStep key={`gift-${screenKey}`} onFinish={finish} />
        )}
      </div>
    </div>
  );
}

function HeartProgress({ step }: { step: Step }) {
  const index = STEPS.indexOf(step);
  return (
    <ol className="gift-letter__hearts mb-8 flex justify-center gap-2" aria-label="Letter progress">
      {STEPS.slice(1).map((item, heartIndex) => {
        const active = heartIndex + 1 <= index;
        return (
          <li
            key={item}
            className={`gift-letter__heart ${active ? "gift-letter__heart--on" : ""}`}
            aria-current={heartIndex + 1 === index ? "step" : undefined}
          >
            ♡
          </li>
        );
      })}
    </ol>
  );
}

function SealStep({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <div
        className={`gift-letter__envelope ${opened ? "gift-letter__envelope--open" : ""}`}
        aria-hidden="true"
      >
        <div className="gift-letter__envelope-flap" />
        <div className="gift-letter__envelope-body">
          <span className={`gift-letter__seal ${opened ? "gift-letter__seal--open" : ""}`}>♡</span>
        </div>
      </div>

      <p
        className="gift-letter__screen gift-letter__screen--in mt-10 text-xs uppercase tracking-[0.2em]"
        style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
      >
        For Henne
      </p>
      <h1
        className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-1 mt-3 text-3xl font-semibold leading-tight md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Happy birthday.
      </h1>
      <p
        className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-2 mt-4 max-w-sm text-sm leading-relaxed"
        style={{ color: "var(--theme-ink-muted)" }}
      >
        I made you something. It took a while, and it was made from very far away.
      </p>

      {!opened && (
        <div className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-3 mt-auto w-full pt-12">
          <button
            type="button"
            onClick={onOpen}
            className="min-h-11 w-full rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: "var(--theme-accent)" }}
          >
            Open me
          </button>
        </div>
      )}
    </section>
  );
}

function LetterScreen({
  kicker,
  title,
  lines,
  cta,
  onContinue,
}: {
  kicker: string;
  title: string;
  lines: React.ReactNode[];
  cta: string;
  onContinue: () => void;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p
          className="gift-letter__screen gift-letter__screen--in text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
        >
          {kicker}
        </p>
        <h1
          className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-1 mt-3 text-2xl font-semibold leading-snug md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        <LetterBody lines={lines} />
      </div>
      <div
        className="gift-letter__screen gift-letter__screen--in shrink-0 pt-10"
        style={{ animationDelay: `${0.26 + lines.length * 0.1}s` }}
      >
        <button
          type="button"
          onClick={onContinue}
          className="min-h-11 w-full rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          {cta}
        </button>
      </div>
    </section>
  );
}

function LetterBody({
  lines,
  startDelay = 0.16,
  className = "",
}: {
  lines: React.ReactNode[];
  startDelay?: number;
  className?: string;
}) {
  return (
    <div
      className={`mt-5 space-y-3 text-sm leading-relaxed md:text-base ${className}`.trim()}
      style={{ color: "var(--theme-ink-muted)" }}
    >
      {lines.map((line, index) => (
        <span
          key={index}
          className="gift-letter__screen gift-letter__screen--in block"
          style={{ animationDelay: `${startDelay + index * 0.1}s` }}
        >
          {line}
        </span>
      ))}
    </div>
  );
}

function LoveYouCycle() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    if (media.matches) return;

    let fadeTimer = 0;
    const cycleTimer = window.setInterval(() => {
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % LOVE_PHRASES.length);
        setVisible(true);
      }, 220);
    }, 2400);

    return () => {
      window.clearInterval(cycleTimer);
      window.clearTimeout(fadeTimer);
    };
  }, []);

  if (reduceMotion) {
    return (
      <span className="gift-letter__love">
        {LOVE_PHRASES.map((phrase) => (
          <span key={phrase.lang} lang={phrase.lang} className="block">
            {phrase.text}
          </span>
        ))}
      </span>
    );
  }

  const phrase = LOVE_PHRASES[index];

  return (
    <span className="gift-letter__love" aria-live="polite">
      <span
        className={`block ${visible ? "love-loading__phrase--in" : "love-loading__phrase--out"}`}
        lang={phrase.lang}
      >
        {phrase.text}
      </span>
    </span>
  );
}

function GiftStep({ onFinish }: { onFinish: () => void }) {
  const lines = [
    "This is a map of our places, in the order they happened.",
    "I put it together in Europe, in the weeks before you came out for the holidays.",
    "Every pin is somewhere we turned into this.",
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden text-center">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <span className="gift-letter__heart gift-letter__heart--pulse mx-auto text-2xl" aria-hidden="true">
          ♡
        </span>
        <p
          className="gift-letter__screen gift-letter__screen--in mt-6 text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
        >
          Your gift
        </p>
        <h1
          className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-1 mt-3 text-2xl font-semibold leading-snug md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Every place we became us.
        </h1>
        <LetterBody lines={lines} className="mx-auto max-w-sm" />
        <p
          className="gift-letter__screen gift-letter__screen--in mt-6 text-base italic"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--theme-ink)",
            animationDelay: `${0.16 + lines.length * 0.1}s`,
          }}
        >
          Happy birthday, my love. All of it, from here.
          <LoveYouCycle />
        </p>
      </div>
      <div
        className="gift-letter__screen gift-letter__screen--in mt-auto w-full shrink-0 pt-10"
        style={{ animationDelay: `${0.26 + lines.length * 0.1}s` }}
      >
        <button
          type="button"
          onClick={onFinish}
          className="min-h-11 w-full rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          Show me
        </button>
      </div>
    </section>
  );
}
