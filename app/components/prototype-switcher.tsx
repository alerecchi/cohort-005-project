// PROTOTYPE: Shared floating variant switcher for UI prototypes (hidden in production).
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Code2, X } from "lucide-react";

export interface PrototypeVariantMeta {
  key: string;
  name: string;
  summary: string;
}

interface PrototypeSwitcherProps {
  variants: PrototypeVariantMeta[];
  current: string;
  stateSnapshot?: Record<string, unknown>;
}

export function PrototypeSwitcher({
  variants,
  current,
  stateSnapshot,
}: PrototypeSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showState, setShowState] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const currentIndex = Math.max(
    0,
    variants.findIndex((v) => v.key === current)
  );
  const currentMeta = variants[currentIndex] ?? variants[0];

  function selectVariant(nextKey: string) {
    const next = new URLSearchParams(searchParams);
    next.set("variant", nextKey);
    setSearchParams(next, { replace: true });
  }

  function step(delta: number) {
    const nextIndex =
      (currentIndex + delta + variants.length) % variants.length;
    selectVariant(variants[nextIndex].key);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex flex-col items-center gap-2">
      {showState && stateSnapshot && (
        <div className="w-[min(92vw,480px)] rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 text-xs text-zinc-100 shadow-2xl backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="font-semibold text-zinc-300">
              Prototype State · {currentMeta.key} ({currentMeta.name})
            </span>
            <button
              type="button"
              onClick={() => setShowState(false)}
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close state inspector"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mb-2 text-[11px] text-zinc-400">{currentMeta.summary}</p>
          <pre className="max-h-48 overflow-auto rounded-md bg-zinc-900 p-2 font-mono text-[11px] leading-relaxed text-emerald-300">
            {JSON.stringify(stateSnapshot, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/95 px-2 py-1.5 text-xs text-zinc-100 shadow-2xl backdrop-blur">
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          Proto
        </span>

        <button
          type="button"
          onClick={() => step(-1)}
          className="rounded-full p-1 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          title="Previous variant (←)"
          aria-label="Previous variant"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="min-w-[210px] px-2 text-center font-medium">
          <span className="font-bold text-white">{currentMeta.key}</span>{" "}
          <span className="text-zinc-300">({currentMeta.name})</span>
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          className="rounded-full p-1 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          title="Next variant (→)"
          aria-label="Next variant"
        >
          <ChevronRight className="size-4" />
        </button>

        {stateSnapshot && (
          <button
            type="button"
            onClick={() => setShowState((s) => !s)}
            className={`ml-1 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              showState
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title="Inspect prototype state"
          >
            <Code2 className="size-3.5" />
            State
          </button>
        )}
      </div>
    </div>
  );
}
