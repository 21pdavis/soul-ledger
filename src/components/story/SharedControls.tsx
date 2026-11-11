import { SHARED_COPY } from "@/story/copy";
import { formatPatchDate } from "@/story/format";

/** "Shared Nov 11, 2026 · numbers from that day": the date is UTC, like the patch dates. */
export function SharedLine({ at, className }: { at: string; className?: string }) {
  return <p className={className}>{SHARED_COPY.line(formatPatchDate(at))}</p>;
}

/** The two shared-mode actions that stand in for Refresh. */
export function SharedActions({
  onSeeLatest,
  onLookUpOwn,
  buttonClassName,
  className,
}: {
  onSeeLatest?: () => void;
  onLookUpOwn: () => void;
  buttonClassName: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <button type="button" className={buttonClassName} onClick={onSeeLatest}>
        {SHARED_COPY.seeLatest}
      </button>
      <button type="button" className={buttonClassName} onClick={onLookUpOwn}>
        {SHARED_COPY.lookUpOwn}
      </button>
    </div>
  );
}
