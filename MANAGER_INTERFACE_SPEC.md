# MANAGER_INTERFACE_SPEC.md

**Status**: FROZEN
**Version**: 1.3.0 (Engineering Seal)
**Enforcement**: STRICT (No deviation allowed)
**Engineering Lock**: 🔒 ACTIVE

## 0. ROUTES & ACCESS

- **Main Dashboard**: `/system/manager`
- **Role Required**: `MANAGER`, `SYSTEM_OWNER`
- **Middleware Enforced**: YES (via `/system` prefix)

## 1. API CONTRACT & DATA STRUCTURES

### 1.1 Operational Pulse (Status Bar)

- **Source**: Server Action `getOperationalPulse`
- **Role Required**: `MANAGER` or `SYSTEM_OWNER`
- **Strict Return Type**:
  ```typescript
  {
    production: "stable" | "warning" | "stopped";
    materials: "ok" | "low" | "critical";
    lab: "clear" | "rejection_pending";
  }
  ```
- **UI Behavior**:
  - Maps statuses to specific colors/icons ONLY. No text transformation logic in backend.

### 1.2 Attention Queue (Actionable Items)

- **Source**: Server Action `getAttentionItems`
- **Role Required**: `MANAGER` or `SYSTEM_OWNER`
- **Strict Return Type**:
  ```typescript
  Array<{
    type: "LAB_REJECTION" | "ORDER_MATERIAL_CHECK";
    refId: string; // Format: "LAB-{id}" or "ORD-{id}"
    severity: "high" | "medium" | "low";
    details?: string; // Pre-localized summary
    timestamp?: Date;
  }>;
  ```
- **Interactions**:
  - `LAB_REJECTION`: Allows "ACK" (Acknowledge) action.
  - `ORDER_MATERIAL_CHECK`: View only.

### 1.3 Quick Simulation

- **Source**: Server Action `runSimulation(mixCode, volumeM3)`
- **Role Required**: `MANAGER` or `SYSTEM_OWNER`
- **Input**: `mixCode` (string), `volumeM3` (number)
- **Strict Return Type**:
  ```typescript
  {
    result: "possible" | "risky" | "impossible";
    blockingMaterial: string | null; // Name of invalid/missing/insufficient material
    deficitKg: number; // Exact amount missing
  }
  ```
- **Audit**: Must Log Action `SIMULATION_RUN`.

### 1.4 Lab Notifications

- **Action**: `acknowledgeLabNotification(refId)`
- **Input**: `refId` (e.g., "LAB-1021")
- **Role Required**: `MANAGER` or `SYSTEM_OWNER`
- **Effect**: Updates `MaterialRejection` status to `APPROVED` (Acknowledged).
- **Audit**: Must Log Action `LAB_ACK`.

### 1.5 Orders (Limited Access)

- **Action**: `getManagerOrders()` (View Only - Active Orders)
- **Action**: `createManagerOrder(data)` (If agreed - Strict validation)
- **Role Required**: `MANAGER` or `SYSTEM_OWNER`
- **Audit**: Must Log Action `ORDER_CREATE` / `ORDER_VIEW`.

## 2. AUDIT LOGGING (REQUIRED)

- **Model**: `AuditLog`
- **Triggers**:
  - Simulation Run
  - Lab Rejection ACK
  - Order Creation
- **Fields**: `userId`, `action`, `details`, `timestamp`.

## 3. RBAC MATRIX (Access Control)

| Operation                    | Role    | Permission   |
| :--------------------------- | :------ | :----------- |
| View Pulse                   | Manager | ✅ ALLOWED   |
| View Attention Items         | Manager | ✅ ALLOWED   |
| Run Simulation               | Manager | ✅ ALLOWED   |
| Acknowledge Lab Rejection    | Manager | ✅ ALLOWED   |
| **Edit/Create Mix Design**   | Manager | ❌ FORBIDDEN |
| **Edit Material Stock**      | Manager | ❌ FORBIDDEN |
| **Approve Lab Test Results** | Manager | ❌ FORBIDDEN |
| **Manage Users**             | Manager | ❌ FORBIDDEN |
| **System Settings**          | Manager | ❌ FORBIDDEN |

- **Enforcement**: Must be checked at the top of every Server Action using `requireRole`.

## 4. NON-NEGOTIABLE RULES (The "Kill Switch")

1.  **Single Source of Truth**: This document is the only authority. Code must match this spec exactly.
2.  **No "Improvements"**: Do not add buttons, fields, or logic not explicitly defined here.
3.  **No Unverified API calls**: Every backend action must strictly validate input and permissions.
4.  **UI = Output**: The UI should not contain business logic. It only renders the state returned by the backend.
5.  **Freeze Protocol**: Any change requires a formal update to this document version before code modification.

## 5. GLOSSARY (Strict Definitions)

- **Manager**: Role responsible for _monitoring_ system state and _acknowledging_ alerts. No edit/write access to production data.
- **Order**: A client request for concrete. Managers can _View_ active lists but cannot modify approved orders.
- **Simulation**: A _read-only_ calculation to check material feasibility. Does NOT reserve stock or create batches.
- **ACK (Acknowledge)**: An explicit action by the Manager to confirm they have seen a critical alert (e.g., Lab Rejection). This _unblocks_ the system workflow associated with that alert (if blocked).

## 6. ERROR HANDLING STANDARDS

- **Format**: All Errors must throw/return specific messages, not generic.
- **Forbidden**: "Something went wrong", "Unknown Error".
- **Required Examples**:
  - `ERR_STOCK_ZERO`: Material stock is zero.
  - `ERR_MIX_NOT_FOUND`: Mix code invalid.
  - `ERR_LAB_ID_INVALID`: RefId format wrong.

## 7. EDGE CASES & LOGIC

- **Zero Stock**: Simulation returns `impossible` + `blockingMaterial`.
- **Lab Rejection + Active Order**:
  - If a material used in an Active Order is Rejected:
  - Pulse: `materials` -> `critical`.
  - Attention: Item `ORDER_MATERIAL_CHECK` -> `severity: high`.
- **List vs Details**:
  - `getManagerOrders` returns _List View_ (Summary).
  - _Details View_ requires specific ID fetch (not implemented yet, strictly List for now).

## 8. DEFINITION OF DONE

- [ ] All Server Action return types match Section 1 exactly.
- [ ] All Server Actions have `requireRole` checks.
- [ ] No extra UI elements exist beyond what is needed to display Section 1 data.
- [ ] Simulation performs NO database writes.
- [ ] `npm run build` passes with no type errors ensuring contract validity.
- [ ] Manager Route is `/system/manager` and protected by Middleware.
