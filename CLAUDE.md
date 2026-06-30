# CLAUDE.md

Guidelines to reduce common coding errors.

These rules favor correctness, clarity, verification, and restraint over speed.

For documentation tasks, also follow `DOCS.md`.

---

# Project Context

- **Project:** VS Code extension — PETSCII `.seq` file viewer for C64 BBS files
- **Language / stack:** TypeScript; VS Code Extension API (`CustomReadonlyEditorProvider`); webview HTML/CSS/JS
- **Font:** Style C64 TrueType (`"C64 Pro Mono"`) — not bundled; must be installed by user; family name is configurable via VS Code setting
- **Build:** `npm` — standard VS Code extension toolchain; package with `vsce`
- **Test:** Render against `.seq` files in `cbase-3.1/assets/bbs/seq/`; cross-check output against VICE or another C64 emulator
- **Key directories:** `extension/src/` (extension.ts, seqEditorProvider.ts, petsciiDecoder.ts, petsciiMaps.ts, colorPalette.ts), `media/` (viewer.js), `docs/plans/` (spec)
- **Spec:** `docs/plans/vscode-seq-viewer.md` — canonical reference for behaviour, encoding, architecture, and implementation order
- **Do not modify:** `.seq` test files in `cbase-3.1/assets/bbs/seq/` (belong to the source repo)

---

# Git Commits

Do not mention Claude, AI, or any AI tooling in commit messages, co-author trailers, or anywhere in git history.

Commits are attributed to the project's human contributors only.

---

# Override Clause

If a user request conflicts with a rule in this file:

1. Follow the user's explicit request.
2. State the conflict in the response.
3. Note any consequences.

Do not cite this file to refuse a clear instruction.

---

# Rule Priority

When rules conflict, follow this order:

1. Correctness
2. Verification
3. Simplicity
4. Surgical Changes
5. Consistency with Existing Code
6. Style Preferences

Never sacrifice a higher-priority rule to satisfy a lower-priority one.

---

# 1. Think Before Coding

Do not assume.

Do not hide uncertainty.

Surface tradeoffs.

Before writing code:

- State assumptions.
- Identify unknowns.
- Ask questions when necessary.
- Present multiple interpretations if they exist.
- Explain simpler alternatives when they exist.
- Stop and clarify unclear requirements.

Separate facts from assumptions.

Example:

- Fact: `process()` is called from two locations.
- Assumption: both callers require the new behavior.

Label assumptions explicitly.

## Push Back When

- The request is vague.
- The request conflicts with existing architecture.
- The request introduces unnecessary abstraction.
- The request adds complexity without clear benefit.
- The request depends on unverified assumptions.
- The request speculates about future requirements.

Do not silently comply with bad assumptions.

---

# 2. Clarification Rules

Ask a clarifying question when:

- Multiple reasonable interpretations exist.
- Different interpretations produce different implementations.
- Success cannot be verified without clarification.
- The requested change may be destructive.

Proceed with stated assumptions when:

- The interpretation is obvious.
- The risk of being wrong is low.
- The assumption can be verified quickly.

Do not ask questions that do not affect implementation.

Ask one specific question at a time. Do not ask a list.

---

# 3. Simplicity First

Write the minimum solution that satisfies the stated requirement.

Prefer:

- Direct implementations
- Existing patterns
- Existing dependencies
- Existing abstractions

Avoid:

- Premature abstraction
- Unused flexibility
- Future-proofing without a requirement
- Configuration without a use case
- Generalization for a single consumer

If your solution adds a layer of abstraction not already present in the surrounding code, justify it in a comment or remove it.

---

# 4. Surgical Changes

Touch only what the task requires.

When modifying existing code:

- Do not refactor unrelated areas.
- Do not reformat unrelated code.
- Do not rewrite comments unless they are incorrect.
- Match the surrounding style.
- Preserve existing behavior unless the task requires change.

Every change should have a direct connection to the request.

Remove only:

- Unused code you introduce
- Unused imports you introduce
- Unused variables you introduce

Do not remove pre-existing dead code unless requested.

---

# 5. Goal-Driven Work

Define success before implementation.

Convert requests into verifiable outcomes.

Examples:

- "Fix bug" → reproduce → fix → verify
- "Add validation" → define failure case → implement → verify
- "Refactor" → verify behavior remains unchanged

For tasks with three or more independent steps, structure the work as:

1. Change
   - Verification

2. Change
   - Verification

3. Change
   - Verification

If success cannot be verified, clarify the goal.

## Verification Mechanics

- Run tests: `vendor/bats/bin/bats tests/test-arguments.bats`
- Manual verification: invoke `./build.sh` against a known asset in `cbase-3.1/` and confirm expected output

Run verification after each change, not only at the end.

---

# 6. Evidence-Based Reasoning

Support conclusions with evidence.

Use:

- Code
- Tests
- Logs
- Error messages
- Reproduction steps
- Documentation

Clearly distinguish:

- Observed behavior
- Inferred behavior
- Assumptions

Do not claim certainty without evidence.

Do not invent root causes.

---

# 7. Risk-Based Rigor

Match rigor to risk.

| Context | Expected Rigor |
|----------|---------------|
| Script or prototype | Basic verification |
| Internal tool | Verification and reasonable testing |
| Production service | Strong validation and test coverage |
| Financial, medical, security-critical systems | Explicit validation, failure analysis, comprehensive testing |

Do not over-engineer low-risk systems.

Do not under-specify high-risk systems.

---

# 8. Validation and Failure Handling

Add validation only when a realistic failure mode exists.

Before adding a check, identify:

- What can fail
- Why it can fail
- What should happen when it fails

Avoid defensive code without a defined purpose.

Do not add recovery paths for hypothetical situations.

For critical assumptions, prefer explicit assertions over speculative recovery logic.

---

# 9. Architecture Alignment

Respect existing architecture.

When a request conflicts with current architecture:

1. Describe the conflict.
2. Explain the consequence.
3. Propose the smallest compatible solution.

Do not introduce new architectural patterns without justification.

Prefer consistency over novelty.

---

# 10. Dependency Discipline

Do not add dependencies when existing project tools can solve the problem.

Before introducing a dependency:

- Explain why it is needed.
- Explain why existing tools are insufficient.
- Consider maintenance cost.

Every dependency increases long-term complexity.

---

# 11. Test Discipline

Tests are part of the system.

Do not modify tests simply to make failures disappear.

Modify tests only when:

- Existing tests are incorrect.
- Requirements changed.
- New behavior requires coverage.

Preserve existing test intent.

When fixing bugs:

- Reproduce the issue when possible.
- Add or identify coverage.
- Verify the fix.

---

# Final Review Checklist

Before submitting:

**Core**

- Are assumptions explicit?
- Is every change required by the task?
- Can success be verified?
- Are claims supported by evidence?

**Extended**

- Did I ask necessary clarifying questions?
- Is the solution as simple as possible?
- Did I introduce unnecessary abstraction?
- Did I introduce unnecessary dependencies?
- Does the change respect existing architecture?
- Did I preserve test intent?

If not, revise.

---

# Working Signals

These guidelines are working if:

- Clarifying questions appear earlier.
- Assumptions are explicit.
- Diffs become smaller.
- Over-engineering decreases.
- Verification becomes routine.
- Fewer rewrites are required.
- Fewer unsupported claims are made.