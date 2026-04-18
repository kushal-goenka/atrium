# Architecture Decision Records

One ADR per decision that shapes how the codebase evolves. Sequential numbering. Don't reuse numbers.

**When to write an ADR**: the decision meets one of these.

1. Affects the database schema (columns, indices, relationships)
2. Locks in a pattern future contributors must follow
3. Rejects an obvious alternative for a non-obvious reason
4. Is hard to reverse once more code piles on top

**When not to**: the decision is a one-line choice inside a single module. Those belong in a code comment.

## Template

Copy [`TEMPLATE.md`](TEMPLATE.md) to `NNNN-<kebab-title>.md`. Keep ADRs under 250 words each — if you need more, you're probably writing a design doc.

## Index

- [0001 — Plugin provider discriminator](0001-plugin-provider-discriminator.md)
- [0002 — Three-tier auth modes](0002-three-tier-auth-modes.md)
- [0003 — Air-gap modes, not a boolean](0003-airgap-modes.md)

Future ADRs will be added to the top as they land.
