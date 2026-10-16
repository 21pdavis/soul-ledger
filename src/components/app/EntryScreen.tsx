"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { validateProfileInput } from "@/lib/client/profile-input";
import type { Prefs } from "@/lib/client/prefs";
import { useIsClient } from "@/components/story/useIsClient";
import { ENTRY_COPY } from "@/story/copy";
import type { LookupFilters } from "@/story/filters";
import { FilterControls } from "./FilterControls";
import styles from "./EntryScreen.module.css";

interface Props {
  /** The remembered URL and filters to start from. */
  initial: Prefs;
  onSubmit: (input: string, filters: LookupFilters) => void;
  /**
   * Coming back from a story or an error: the button that had focus is gone, so focus moves to
   * the title and Tab goes on to the URL box. Not on a first visit, where focus is left alone.
   */
  focusTitle?: boolean;
}

export function EntryScreen({ initial, onSubmit, focusTitle = false }: Props) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusTitle) title.current?.focus();
  }, [focusTitle]);
  const [url, setUrl] = useState(initial.url);
  const [filters, setFilters] = useState(initial.filters);
  const [invalid, setInvalid] = useState(false);
  // Until React has hydrated, this form is plain HTML and its submit is the browser's own: it would
  // reload the page and drop what was typed (#42). The field and the button stay disabled until
  // the handler is attached, and so do the window choices (a pick made before hydration would be
  // reset by it). A disabled default button also stops Enter inside the form.
  const ready = useIsClient();
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateProfileInput(url);
    if (!result.ok) {
      setInvalid(true);
      return;
    }
    // This click is the user gesture browsers require before audio may play. M2 has no audio
    // layer (deferred, see the backlog and ADR 0052); when it lands (ADR 0006), unlock it here,
    // before the lookup starts.
    onSubmit(result.value, filters);
  }

  return (
    <div className={styles.entry}>
      <header className={styles.masthead}>
        <svg className={styles.ornament} viewBox="0 0 120 40" aria-hidden="true">
          <path d="M60 4 L60 36 M44 8 L60 4 L76 8 M30 14 L60 4 L90 14 M18 22 L60 4 L102 22" />
          <path d="M6 36 H114" />
        </svg>
        <h1 ref={title} tabIndex={-1} className={styles.title}>
          {ENTRY_COPY.title}
        </h1>
        <p className={styles.tagline}>{ENTRY_COPY.tagline}</p>
      </header>

      <form className={styles.panel} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={inputId} className={styles.label}>
            {ENTRY_COPY.inputLabel}
          </label>
          <input
            id={inputId}
            className={styles.input}
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={ENTRY_COPY.inputPlaceholder}
            value={url}
            disabled={!ready}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(e) => {
              setUrl(e.target.value);
              setInvalid(false);
            }}
          />
          {invalid && (
            <p id={errorId} role="alert" className={styles.error}>
              {ENTRY_COPY.invalidInput}
            </p>
          )}
          <p className={styles.hint}>{ENTRY_COPY.noLogin}</p>
        </div>

        <FilterControls value={filters} onChange={setFilters} disabled={!ready} />

        <button type="submit" className={styles.submit} disabled={!ready}>
          {ENTRY_COPY.submit}
        </button>
      </form>
    </div>
  );
}
