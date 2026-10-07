---
type: Decision Record
title: "0005: Stack is Next.js + R3F/drei + Framer Motion + Neon Postgres on Render"
description: The app is built with Next.js (TypeScript), React Three Fiber/drei and Framer Motion, stores data in Neon Postgres, and deploys on Render.
tags: [stack, architecture, hosting]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Decision

| Concern | Choice |
|---|---|
| Framework | Next.js (TypeScript) |
| 3D | React Three Fiber + drei (Three.js) |
| 2D animation and slide transitions | Framer Motion |
| Database / cache | Neon Postgres ([0001](0001-public-site-postgres-cache.md)) |
| Hosting | Render |

# Related

- [3D approach](../decisions/0013-custom-low-poly-models.md)
