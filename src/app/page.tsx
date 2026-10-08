import { App } from "@/components/app/App";

// The Valve non-affiliation notice is rendered by App itself (ScreenShell for entry, loading and
// error screens, a footer strip after the story), so swapping StoryStage cannot drop it.
export default function Home() {
  return <App />;
}
