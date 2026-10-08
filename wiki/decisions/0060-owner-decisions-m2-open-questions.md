---
type: Decision Record
title: "0060: M2 open questions closed: fonts, rank names, hero art, no unspent souls"
description: "The owner kept Limelight and Space Grotesk, accepted the rank tier names, allowed deadlock-api hero art with a Valve disclaimer, and dropped the unspent-souls stat."
tags: [m2, design, legal, data]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T20:00:00Z }
---

# Context

Four M2 open questions were still on the books. The owner answered all four on 2026-10-08. Two (fonts, rank names) were already accepted in [ADR 0055](0055-owner-confirmations-after-m2.md); this ADR restates them with the new detail so all four sit in one place.

# Decision

| # | Question | Decision |
|---|---|---|
| 1 | [Font pairing](../open-questions/m2-font-pairing.md) | Keep **Limelight** (display) with **Space Grotesk** (body). A big style pass is planned after M3 or later (backlog). |
| 2 | [Rank tier names](../open-questions/m2-rank-tier-names.md) | Accepted as in `src/story/ranks.ts`: Obscurus, Initiate, Seeker, Acolyte, Sentinel, Mystic, Ritualist, Emissary, Oracle, Phantom, Ascendant, Eternus. |
| 3 | [Hero art terms](../open-questions/m2-hero-art-terms.md) | Images served by deadlock-api assets **may be used**, following what deadlock-api itself does. The site must show a visible disclaimer: "not affiliated with or endorsed by Valve; Valve and its properties are trademarks of Valve Corporation". Be ready to **remove the art quickly** if Valve asks. |
| 4 | [Unspent souls](../open-questions/m2-unspent-souls-unit.md) | **Drop the stat entirely.** The project does not use it. |

# Reasoning and honest risk

- **Hero art.** This is a decision to accept a risk, not a finding that the images are licensed. Other sites using the images is not a licence. Valve's fan content policy was **not read**, and neither were the deadlock-api asset terms. If Valve objects, the monogram tiles ([ADR 0051](0051-m2-visual-motion-styling-stack.md)) are the fallback, so removal must stay a small change. The disclaimer is a backlog item for a code PR.
- **Unspent souls.** The unit was never verified, the stat is not in the OpenAPI spec, and web searches on 2026-10-08 found no mention of it anywhere. With no way to confirm it, the owner chose to drop it rather than show a doubtful number.

# Consequences

- **Supersedes** the unspent-souls parts of [ADR 0015](0015-v1-slides.md) (roast slide), [ADR 0053](0053-m2-copy-and-data-presentation.md) and [ADR 0055](0055-owner-confirmations-after-m2.md). The rest of those ADRs stands.
- The DB column `unspentGoldMinutes` and its parsing in `src/lib/stats/normalize.ts` stay in place, unused, in case of a revisit. The `SHOW_UNSPENT_SOULS_FIGURE` code path and the roast slide's unspent line are to be removed in a code PR.
- #36 (unit and missing-key bias) is closed as not planned.
- [ADR 0020](0020-squad-roles.md) and [ADR 0037](0037-squad-roles-without-backseat-gamer.md) define "The Hoarder" from this stat. Squad roles are not built, so this is a new [open question](../open-questions/hoarder-role-source.md).
- Backlog gains the post-M3 style pass and the Valve disclaimer.
