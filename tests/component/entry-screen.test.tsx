import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EntryScreen } from "@/components/app/EntryScreen";
import { defaultPrefs } from "@/lib/client/prefs";

const URL_A = "https://steamcommunity.com/id/gaben";

function setup(initial = defaultPrefs()) {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<EntryScreen initial={initial} onSubmit={onSubmit} />);
  return { onSubmit, user, input: screen.getByLabelText("Paste your Steam profile URL") };
}

describe("EntryScreen", () => {
  // #42: the server-rendered HTML is what a visitor can use before React has hydrated, and a native
  // submit there reloads the page and drops the URL. So the field and the button start disabled
  // (a disabled default button also blocks Enter in the form) and come alive once hydrated.
  it("renders the field and the submit button disabled in the server HTML, so nothing submits natively", () => {
    const html = renderToString(<EntryScreen initial={defaultPrefs()} onSubmit={() => {}} />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelector("input[type=text]")?.hasAttribute("disabled")).toBe(true);
    expect(doc.querySelector("button[type=submit]")?.hasAttribute("disabled")).toBe(true);
    // The window choice too: a pick made before hydration is reset by it (a lost input).
    const radios = [...doc.querySelectorAll("input[type=radio]")];
    expect(radios.length).toBeGreaterThan(0);
    for (const radio of radios) expect(radio.hasAttribute("disabled")).toBe(true);
  });

  it("has the field and the button enabled once running in the browser", () => {
    const { input } = setup();
    expect(input).toBeEnabled();
    expect(screen.getByRole("button", { name: /open the ledger/i })).toBeEnabled();
    for (const radio of screen.getAllByRole("radio")) expect(radio).toBeEnabled();
  });

  it("asks for a profile URL and says no login is needed", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: "Soul Ledger" })).toBeInTheDocument();
    expect(screen.getByLabelText("Paste your Steam profile URL")).toBeInTheDocument();
    expect(screen.getByText(/no login needed/i)).toBeInTheDocument();
  });

  it.each([
    ["nothing", ""],
    ["something that is not a Steam link", "https://example.com/hello"],
  ])(
    "shows an inline message and does not look anything up when you submit %s",
    async (_n, text) => {
      const { onSubmit, user, input } = setup();
      if (text) await user.type(input, text);
      await user.click(screen.getByRole("button", { name: /open the ledger/i }));
      expect(screen.getByRole("alert")).toHaveTextContent(
        "That doesn't look like a Steam profile URL.",
      );
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it("clears the message as soon as you edit the input", async () => {
    const { user, input } = setup();
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.type(input, "g");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("submits the trimmed URL with the default window (all time) on Enter or click", async () => {
    const { onSubmit, user, input } = setup();
    await user.type(input, `  ${URL_A}  {Enter}`);
    expect(onSubmit).toHaveBeenCalledWith(URL_A, { window: "all" });
  });

  it("offers All time (selected by default) and This patch, and submits the choice", async () => {
    const { onSubmit, user, input } = setup();
    const all = screen.getByRole("radio", { name: "All time" });
    const patch = screen.getByRole("radio", { name: "This patch" });
    expect(all).toBeChecked();
    expect(patch).not.toBeChecked();
    await user.click(patch);
    expect(patch).toBeChecked();
    await user.type(input, URL_A);
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));
    expect(onSubmit).toHaveBeenCalledWith(URL_A, { window: "patch" });
  });

  it("starts from the remembered URL and window", () => {
    setup({ url: URL_A, filters: { window: "patch" } });
    expect(screen.getByLabelText("Paste your Steam profile URL")).toHaveValue(URL_A);
    expect(screen.getByRole("radio", { name: "This patch" })).toBeChecked();
  });
});
