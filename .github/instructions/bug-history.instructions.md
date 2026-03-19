---
description: This instruction file provides guidelines for documenting and managing bug fixing history.
---

<critical>MANDATORY POLICY: Any bug discovered during development MUST be fixed and documented here, even if it falls outside the scope of the current task or issue being worked on. Do not defer, ignore, or leave bugs for later — fix them immediately and add an entry below.</critical>

# Bug History — hhh-backoffice-frontend

Document every bug found and fixed during development. Include root cause, fix applied, and lesson learned so they don't recur.

---

## BUG-001: Cross-repo — Frontend contract types completely misaligned with backend DTOs

**Related repos:** `hhh-contracts-service`, `hhh-frontend` | **Severity:** Critical

**Symptom:** Creating a contract from the backoffice returns HTTP 422 with multiple validation errors. The request payload uses field names and structures that don't exist in the backend `ContractCreateDTO`.

**Root cause:** Frontend types were generated with an entirely different field schema than the backend DTOs. Multiple field name mismatches and extra/missing fields.

**Fix:** Aligned backoffice contract types to corrected backend schema.

**Status:** ✅ Fixed.

**Lesson:** When generating frontend types and backend DTOs separately, always cross-validate them against each other AND the design spec before merging.

---

## BUG-002: Contract type uses `action` instead of `faction`

**Issue:** #23 | **Severity:** Critical

**Symptom:** Creating or updating a contract from the backoffice returns HTTP 422 because the payload sends `action` instead of `faction`. The backend `ContractCreateDTO` requires `faction` (no default).

**Root cause:** `src/types/contract.ts` defines `Contract` with `action: string` instead of `faction: string`. Likely a typo or hallucination during code generation.

**Fix:** Renamed `action` → `faction` in `src/types/contract.ts`, updated `GeneralTab.tsx` form label and field binding, updated `ContractEditPage.tsx` validation and form initialization.

**Status:** ✅ Fixed.

**Lesson:** When generating TypeScript types for backend DTOs, verify field names match exactly. Run a test request against the backend to validate the payload schema before merging.
