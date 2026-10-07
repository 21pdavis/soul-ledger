import { describe, expect, it } from "vitest";
import { checkWiki } from "../../scripts/wiki-check";

const fm = (fields: Record<string, string>) =>
  "---\n" +
  Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n") +
  "\n---\n\nBody.\n";

const adr = (extra: Record<string, string> = {}) =>
  fm({
    type: "Decision Record",
    title: '"0001: Thing"',
    description: "Does a thing.",
    status: "stable",
    decision: "accepted",
    ...extra,
  });

/** A minimal valid bundle; tests break one thing at a time. */
function bundle(): Record<string, string> {
  return {
    "index.md":
      '---\nokf_version: "0.2"\n---\n\n# KB\n\n* [Vision](vision.md) - The vision.\n* [Log](log.md) - Changes.\n\n# Sections\n\n* [Decisions](decisions/) - ADRs.\n',
    "log.md":
      "# Log\n\n## 2026-10-07\n* **Decision**: Did it.\n\n## 2026-10-06\n* **Creation**: Began.\n",
    "vision.md": fm({ type: "Vision", title: "Vision", description: "The vision." }),
    "decisions/index.md": "# Decisions\n\n* [0001: Thing](0001-thing.md) - Does a thing.\n",
    "decisions/0001-thing.md": adr(),
  };
}

describe("checkWiki", () => {
  it("passes a well-formed bundle", () => {
    expect(checkWiki(bundle())).toEqual([]);
  });

  it("requires parseable frontmatter with a known type and a description", () => {
    const b = bundle();
    b["vision.md"] = "No frontmatter here.\n";
    b["decisions/0001-thing.md"] = fm({ type: "Essay", description: "Does a thing." });
    const errors = checkWiki(b);
    expect(errors).toContainEqual(expect.stringContaining("vision.md: missing YAML frontmatter"));
    expect(errors).toContainEqual(expect.stringContaining('unknown type "Essay"'));

    const c = bundle();
    c["vision.md"] = fm({ type: "Vision", title: "Vision" });
    expect(checkWiki(c)).toContainEqual(expect.stringContaining("vision.md: missing description"));
  });

  it("reports broken YAML instead of crashing", () => {
    const b = bundle();
    b["vision.md"] = "---\ntype: [unclosed\n---\n";
    expect(checkWiki(b)).toContainEqual(expect.stringContaining("vision.md: invalid frontmatter"));
  });

  it("requires every concept to be listed in its directory index", () => {
    const b = bundle();
    b["decisions/0002-other.md"] = adr({ title: '"0002: Other"', description: "Other." });
    expect(checkWiki(b)).toContainEqual(
      "decisions/0002-other.md: not listed in decisions/index.md (add: * [0002: Other](0002-other.md) - Other.)",
    );
  });

  it("requires index descriptions to match the concept's frontmatter", () => {
    const b = bundle();
    b["decisions/index.md"] = "# Decisions\n\n* [0001: Thing](0001-thing.md) - Stale text.\n";
    expect(checkWiki(b)).toContainEqual(
      'decisions/index.md: description for 0001-thing.md should be "Does a thing."',
    );
  });

  it("flags index entries pointing at missing concepts", () => {
    const b = bundle();
    b["decisions/index.md"] += "* [Gone](gone.md) - Missing.\n";
    expect(checkWiki(b)).toContainEqual(
      expect.stringContaining("decisions/index.md: broken link gone.md"),
    );
  });

  it("allows frontmatter only on the root index", () => {
    const b = bundle();
    b["decisions/index.md"] = "---\ntype: Reference\n---\n" + b["decisions/index.md"];
    expect(checkWiki(b)).toContainEqual(
      "decisions/index.md: index files must not have frontmatter",
    );
  });

  it("checks relative links, including directory links and anchors", () => {
    const b = bundle();
    b["vision.md"] +=
      "\nSee [ADR](decisions/0001-thing.md#why), [all](decisions/), [web](https://x.y), [top](#top).\n";
    expect(checkWiki(b)).toEqual([]);
    b["vision.md"] += "\nAnd [nope](decisions/0099-nope.md).\n";
    expect(checkWiki(b)).toContainEqual("vision.md: broken link decisions/0099-nope.md");
  });

  it("ignores links that leave the wiki", () => {
    const b = bundle();
    b["vision.md"] += "\nSee [rules](../CLAUDE.md).\n";
    expect(checkWiki(b)).toEqual([]);
  });

  it("requires superseded ADRs to be deprecated and point at existing successors", () => {
    const b = bundle();
    b["decisions/0001-thing.md"] = adr({ decision: "superseded", status: "deprecated" });
    expect(checkWiki(b)).toContainEqual("decisions/0001-thing.md: superseded but no superseded_by");

    b["decisions/0001-thing.md"] = adr({
      decision: "superseded",
      status: "deprecated",
      superseded_by: "[0002-missing.md]",
    });
    expect(checkWiki(b)).toContainEqual(
      "decisions/0001-thing.md: superseded_by target 0002-missing.md does not exist",
    );

    b["decisions/0001-thing.md"] = adr({ status: "deprecated" });
    expect(checkWiki(b)).toContainEqual(
      'decisions/0001-thing.md: status deprecated but decision is "accepted"',
    );
  });

  it("requires resolved open questions to name what resolved them", () => {
    const b = bundle();
    b["open-questions/index.md"] = "# Q\n\n* [Q](q.md) - A question.\n";
    b["open-questions/q.md"] = fm({
      type: "Open Question",
      title: "Q",
      description: "A question.",
      question_status: "resolved",
    });
    expect(checkWiki(b)).toContainEqual("open-questions/q.md: resolved but no resolved_by");
  });

  it("requires log dates in ISO form, newest first", () => {
    const b = bundle();
    b["log.md"] = "# Log\n\n## 2026-10-06\n* a\n\n## 2026-10-07\n* b\n\n## Oct 8\n* c\n";
    const errors = checkWiki(b);
    expect(errors).toContainEqual("log.md: heading 2026-10-07 is out of order (newest first)");
    expect(errors).toContainEqual('log.md: heading "Oct 8" is not an ISO YYYY-MM-DD date');
  });

  it("rejects CRLF line endings", () => {
    const b = bundle();
    b["vision.md"] = b["vision.md"].replace(/\n/g, "\r\n");
    expect(checkWiki(b)).toContainEqual("vision.md: uses CRLF line endings; use LF");
  });
});

describe("checkWiki review fixes (PR #18)", () => {
  const question = (extra: Record<string, string>) =>
    fm({
      type: "Open Question",
      title: "Q",
      description: "A question.",
      question_status: "resolved",
      ...extra,
    });
  const withQuestion = (q: string) => ({
    ...bundle(),
    "open-questions/index.md": "# Q\n\n* [Q](q.md) - A question.\n",
    "open-questions/q.md": q,
  });

  it("accepts resolved_by as a list, like superseded_by", () => {
    expect(
      checkWiki(withQuestion(question({ resolved_by: "[../decisions/0001-thing.md]" }))),
    ).toEqual([]);
    expect(
      checkWiki(withQuestion(question({ resolved_by: "[../decisions/0099-nope.md]" }))),
    ).toContainEqual(
      "open-questions/q.md: resolved_by target ../decisions/0099-nope.md does not exist",
    );
  });

  it("rejects an empty superseded_by", () => {
    for (const empty of ["''", "null", "{}", "[]"]) {
      const b = bundle();
      b["decisions/0001-thing.md"] = adr({
        decision: "superseded",
        status: "deprecated",
        superseded_by: empty,
      });
      expect(checkWiki(b)).toContainEqual(
        "decisions/0001-thing.md: superseded but no superseded_by",
      );
    }
  });

  it("ignores links in inline code and ~~~ blocks", () => {
    const b = bundle();
    b["vision.md"] += "\nUse `[x](missing.md)` syntax.\n\n~~~\n[y](also-missing.md)\n~~~\n";
    expect(checkWiki(b)).toEqual([]);
  });

  it("handles parentheses and %-encoding in link targets, and directory links without a slash", () => {
    const b = bundle();
    b["decisions/index.md"] += "* [P](foo_(bar).md) - P.\n* [S](a%20b.md) - S.\n";
    b["decisions/foo_(bar).md"] = adr({ title: "P", description: "P." });
    b["decisions/a b.md"] = adr({ title: "S", description: "S." });
    b["vision.md"] += "\nSee [all](decisions).\n";
    expect(checkWiki(b)).toEqual([]);
  });

  it("finds the frontmatter end only on an exact --- line", () => {
    const b = bundle();
    b["vision.md"] = "---\ntype: Vision\nnote: |\n  ----x\ndescription: The vision.\n---\nBody\n";
    expect(checkWiki(b)).toEqual([]);
    b["vision.md"] = "---\n---\nBody\n";
    expect(checkWiki(b)).toContainEqual("vision.md: missing type");
  });

  it("rejects impossible log dates", () => {
    const b = bundle();
    b["log.md"] = "# Log\n\n## 2026-13-45\n* x\n";
    expect(checkWiki(b)).toContainEqual(
      'log.md: heading "2026-13-45" is not an ISO YYYY-MM-DD date',
    );
  });

  it("recognises ./-prefixed index entries", () => {
    const b = bundle();
    b["decisions/index.md"] = "# Decisions\n\n* [0001: Thing](./0001-thing.md) - Does a thing.\n";
    expect(checkWiki(b)).toEqual([]);
  });
});
