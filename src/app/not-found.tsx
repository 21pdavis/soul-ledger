import { NotFoundScreen } from "@/components/app/NotFoundScreen";
import { NOT_FOUND_COPY } from "@/story/copy";

export default function NotFound() {
  return (
    <NotFoundScreen
      title={NOT_FOUND_COPY.title}
      body={NOT_FOUND_COPY.body}
      action={NOT_FOUND_COPY.action}
    />
  );
}
