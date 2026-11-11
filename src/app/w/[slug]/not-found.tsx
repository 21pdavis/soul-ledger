import { NotFoundScreen } from "@/components/app/NotFoundScreen";
import { SHARED_COPY } from "@/story/copy";

/** A share link that does not exist (mistyped or removed). */
export default function SharedNotFound() {
  return (
    <NotFoundScreen
      title={SHARED_COPY.notFoundTitle}
      body={SHARED_COPY.notFoundBody}
      action={SHARED_COPY.lookUpOwn}
    />
  );
}
