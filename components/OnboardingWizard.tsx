"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markOnboardingComplete } from "@/lib/onboarding";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";

type Step = "seal" | "began" | "you" | "gift";

const STEPS: Step[] = ["seal", "began", "you", "gift"];

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

      <div className="relative z-[1] mx-auto flex w-full max-w-md flex-1 flex-col">
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
            body={
              <>
                Goblin upstairs on a Wednesday — the first time we were in the same room. Then Saint
                Leonards, when you weren&apos;t even supposed to be there.{" "}
                <em>Hello Stranger.</em> And somehow, all of it led here.
              </>
            }
            cta="Keep reading"
            onContinue={() => advance("you")}
          />
        )}

        {step === "you" && (
          <LetterScreen
            key={`you-${screenKey}`}
            kicker="What you are to me"
            title="My favourite person in every castle."
            body={
              <>
                The princess-room castle on Dominion Road. The French castle on Richmond Road.
                The Thursday you became official — and the first time I wrote it plainly:{" "}
                <em>because I love you very much.</em>
              </>
            }
            cta="Almost there"
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
        className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-2 mt-4 max-w-xs text-sm leading-relaxed"
        style={{ color: "var(--theme-ink-muted)" }}
      >
        I made you something — from far away, with all my love.
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
  body,
  cta,
  onContinue,
}: {
  kicker: string;
  title: string;
  body: React.ReactNode;
  cta: string;
  onContinue: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col">
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
      <p
        className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-2 mt-5 text-sm leading-relaxed md:text-base"
        style={{ color: "var(--theme-ink-muted)" }}
      >
        {body}
      </p>
      <div className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-3 mt-auto pt-10">
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

function GiftStep({ onFinish }: { onFinish: () => void }) {
  return (
    <section className="flex flex-1 flex-col text-center">
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
      <p
        className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-2 mx-auto mt-5 max-w-sm text-sm leading-relaxed md:text-base"
        style={{ color: "var(--theme-ink-muted)" }}
      >
        This map is our story — the pins already there, and all the ones still waiting for us. I
        built it for you, from the other side of the world, so you&apos;d have something that
        keeps us close.
      </p>
      <p
        className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-3 mt-6 text-base italic"
        style={{ fontFamily: "var(--font-display)", color: "var(--theme-ink)" }}
      >
        Happy birthday, my love. I love you.
      </p>
      <div className="gift-letter__screen gift-letter__screen--in gift-letter__screen--delay-3 mt-auto w-full pt-10">
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
