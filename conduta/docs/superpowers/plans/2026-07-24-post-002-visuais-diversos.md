# Post 002 Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework only the generated visuals of Instagram post P002 so each carousel slide has a distinct editorial illustration related to its message.

**Architecture:** Keep the existing deterministic HTML/CSS renderer and add a slide-aware visual vocabulary inside `slideMarkup()`. The renderer will choose one visual scene per slide from the slide role and render it as accessible inline SVG/CSS, avoiding external assets, image text, patient imagery, and changes to other drafts.

**Tech Stack:** Node.js, HTML/CSS, Playwright Core screenshot renderer, Node test runner, Markdown draft source.

## Global Constraints

- Change only the visual treatment of `marketing/drafts/002-tres-perguntas-antes-de-abrir-mais-uma-aba.md` and the shared renderer behavior needed to support it.
- Preserve the Conduta palette, Inter typography, high contrast, and 1080 × 1350 output.
- Do not add dependencies, API keys, Instagram integration, or automatic publishing.
- Do not introduce clinical claims, patient data, diagnostic imagery, or text embedded inside generated illustrations.
- Keep the renderer deterministic and make the visual choice testable from parsed slide content.

---

### Task 1: Define the slide visual vocabulary in tests

**Files:**
- Modify: `marketing/pipeline/pipeline.test.js`
- Modify: `marketing/pipeline/renderer-html.js`

**Interfaces:**
- Consumes: normalized post slides with `kind`, `title`, and `body`.
- Produces: a deterministic visual scene identifier for each P002 slide, exposed through rendered HTML classes such as `visual-scene-cover`, `visual-scene-context`, `visual-scene-timeline`, `visual-scene-missing-data`, `visual-scene-escalation`, `visual-scene-product`, and `visual-scene-save`.

- [x] **Step 1: Write the failing assertions**

Add a renderer-level assertion using the existing sample post that checks that distinct slide roles produce distinct scene classes, including the cover, timeline, missing-data, product, and save scenes.

- [x] **Step 2: Run the focused test**

Run: `node --test marketing/pipeline/pipeline.test.js`

Expected: FAIL because the renderer currently emits the same `question-diagram` visual for every slide.

---

### Task 2: Implement distinct editorial illustrations

**Files:**
- Modify: `marketing/pipeline/renderer-html.js`
- Modify: `marketing/drafts/002-tres-perguntas-antes-de-abrir-mais-uma-aba.md`

**Interfaces:**
- Consumes: P002 slide text and the existing `visualElement` metadata.
- Produces: one accessible, inline visual per slide with no repeated diagram. Scenes are abstract and editorial: layered context sheets, a time axis, a magnifier over a missing slot, branching review paths, a Conduta-like structured analysis panel, and a save/review mark.

- [x] **Step 1: Replace the single visual branch**

Refactor the renderer into a small `visualForSlide(slide, index, post)` function. Return an empty string for posts without the approved P002 visual metadata. For P002, map the slide sequence to one scene each and keep all labels in normal HTML outside the illustration so generated art never contains unreadable text.

- [x] **Step 2: Add the visual styles**

Add shared scene geometry using the existing Conduta tokens: navy structural surfaces, teal action accents, light gray backgrounds, amber diagnostic markers, and mint medication markers only where semantically appropriate. Avoid identical cards, gradients, decorative second accents, and side-stripe borders.

- [x] **Step 3: Update the draft metadata**

Change the metadata from a generic repeated diagram to a specific visual sequence description that documents the six scene types and the final save/review mark.

- [x] **Step 4: Run focused tests**

Run: `node --test marketing/pipeline/pipeline.test.js`

Expected: PASS, including the distinct-scene assertions.

---

### Task 3: Render and visually verify only P002

**Files:**
- Generate/update: `marketing/generated/002-tres-perguntas-antes-de-abrir-mais-uma-aba/`

**Interfaces:**
- Consumes: the P002 draft and the updated deterministic renderer.
- Produces: seven PNG slides, `preview.html`, `post.json`, caption, and report for P002 only.

- [x] **Step 1: Render P002**

Run: `npm.cmd run marketing:render -- marketing/drafts/002-tres-perguntas-antes-de-abrir-mais-uma-aba.md`

Expected: seven slide PNGs and zero renderer alerts.

- [x] **Step 2: Inspect representative and adjacent scenes**

Open `slide-01.png`, `slide-03.png`, `slide-04.png`, `slide-06.png`, and `slide-07.png` with the local image viewer. Confirm that scenes differ, text remains readable, no illustration is clipped, and no clinical/patient imagery appears.

- [x] **Step 3: Run project checks**

Run: `npm.cmd run marketing:test`, `npm.cmd run marketing:validate`, `node --check marketing/pipeline/renderer-html.js`, and `git diff --check`.

Expected: all marketing tests pass, zero blocking validation errors, valid JavaScript syntax, and no whitespace errors.

---

## Self-review

- Scope is limited to P002 visuals and the renderer path required to produce them.
- No new dependency, external service, clinical behavior, or Instagram action is introduced.
- The visual scenes are distinct by slide role and are covered by focused tests.
- Output remains deterministic and reviewable as local PNG/HTML artifacts.
