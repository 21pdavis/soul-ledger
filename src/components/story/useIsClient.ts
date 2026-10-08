import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true once the browser has taken over. Lets a component
 * hold back anything that depends on the browser (like which controller to use) until it is known,
 * so nothing is rendered in one shape and then moved into another.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
