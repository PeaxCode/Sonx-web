"use client";

import { GENRES } from "@/lib/billing-config";
import { PROMPT_IDEAS } from "@/lib/prompt-ideas";
import { useCreateOptional } from "./create-context";

/** Ideas that fill the Create form in one tap; only on /create, where the form can take them. */
export function PromptIdeas() {
  const create = useCreateOptional();
  if (!create) return null;
  return (
    <section aria-labelledby="ideas-title" className="mt-10">
      <h3 id="ideas-title" className="text-lg font-semibold tracking-[-0.02em]">Try an idea</h3>
      <p className="mt-1 text-sm text-fog">Tap one to fill in the form, then make it your own.</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {PROMPT_IDEAS.map((idea) => (
          <li key={idea.label}>
            <button type="button"
              onClick={() => create.requestFill({ prompt: idea.prompt, genre: idea.genre, instrumental: Boolean(idea.instrumental) })}
              className="flex h-full w-full flex-col items-start gap-0.5 rounded-[18px] border border-paper/[0.08] bg-paper/[0.03] px-4 py-3 text-left transition hover:border-paper/20 hover:bg-paper/[0.06]">
              <span className="text-sm font-medium">{idea.label}</span>
              <span className="text-xs text-fog">
                {GENRES.find((genre) => genre.id === idea.genre)?.name}{idea.instrumental ? ", instrumental" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
