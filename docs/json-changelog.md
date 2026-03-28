# JSON Changelog

A plain log of changes made to any JSON file in the project.

---

**Date:** 2026-03-27  
**File:** `src/redwoods_compass_questions_v0.6.json`  
**Change:** `People` → Replaced 1 generic split-time question (`id: people_split_time`, "Do most teammates at your organization split time on multiple teams?") and its 2 conditional follow-ups with 2 separate question trees differentiated by role:  
- **Makers tree** (`id: people_makers_split_time`): "Do the individuals maintaining or building the design system split their time across other non-system projects?" → If YES: "Is there a formal agreement or process defining how that split is managed?" / If NO: "Do these maintainers periodically rotate into product teams to build features?"  
- **Consumers tree** (`id: people_consumers_split_time`): "Do the product designers and engineers (consumers) split their time across multiple products or teams simultaneously?" → If YES: "Is there a formal resource planning process for this allocation?" / If NO: "Would the organization be open to a rotation program (e.g., embedding consumers into the system team)?"  
Net change: +3 questions (3 → 6) in the `People` category's `Organizational Resilience & Allocation` / new `Makers: Allocation & Resilience` and `Consumers: Allocation & Resilience` subcategories.

---

**Date:** 2026-03-27  
**File:** `src/redwoods_compass_questions_v0.6.json`  
**Change:** Added `"weight"` field to every question object. Valid values: `1` (full weight, default), `0.5` (half weight), `0` (recorded in CSV but excluded from spider chart calculations). All existing questions default to `weight: 1`. This enables questions that are informational only (weight 0) or partially weighted (weight 0.5) without removing them from the results export.

---

**Date:** 2026-03-27  
**File:** `src/redwoods_compass_questions_v0.6.json`  
**Change:** `Resource Lifecycle` → All questions replaced. Removed 2 old questions ("Is there a team, group or individual responsible for deprecation management?" and "Are resources wound down over time?"). Added 6 new questions covering Definition of Done parity, intake process, documentation cadence, versioning/labeling, deprecation parity in docs, and migration guides.

---

**Date:** 2026-03-27  
**File:** `src/redwoods_compass_questions_v0.6.json`  
**Change:** `Resource Lifecycle` → `CategoryDescription` changed from "Measures the organization's ability to navigate process changes, deprecation, and team fluidity." to "Measures how resources (code, design, docs) are born, maintained, and retired. It focuses on the operational reality of the system's assets."

---

**Date:** 2026-03-28  
**File:** `src/redwoods_compass_questions_v0.6.json`  
**Change:** `Infrastructure` → `Question` changed from "Is the organization (or product) on a single code framework?" to "For your web applications are you using multiple frameworks?"

---

**Date:** 2026-03-28  
**File:** `src/redwoods_compass_questions_v0.6.json`  
**Change:** `Infrastructure` → Replaced 1 generic question ("Is the organization (or product) on a single tech stack?") with a conditional tree:  
- **Base** (`id: infra_multiple_platforms`): "Does your organisation build on multiple platforms?"  
- **YES follow-up**: "Are each of those platforms building in alignment with the same design system?"  
- **NO follow-up**: "Is your platform built using your design system?"

---

<!-- TEMPLATE (copy & paste for each change):

**Date:** YYYY-MM-DD  
**File:** `path/to/file.json`  
**Change:** [Question / field name] changed from "[old text]" to "[new text]"

---
-->
