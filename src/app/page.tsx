import { App } from "@/components/app/App";

// The Valve non-affiliation notice is rendered by App's ScreenShell on the entry, loading and
// error screens. The story itself must carry it too (summary slide): see StoryStage.
export default function Home() {
  return <App />;
}
