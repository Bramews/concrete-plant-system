# System Architecture

## Overview

The Concrete Plant Management System is built as a high-performance, role-based departmental platform using Next.js and Prisma.

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** SQLite (Relational, ACID compliant)
- **ORM:** Prisma 7
- **Styling:** Vanilla CSS with custom design system
- **Security:** JWT-based Auth, RBAC, Rate Limiting

## Modular Design

The system is divided into functional departments:

1. **Lab:** Mix designs and testing.
2. **Production:** Batching and execution.
3. **Inventory:** Raw material tracking.
4. **Sales:** Order management.
5. **Accounts:** Invoicing and expenses.
6. **Manager:** Governance and Oversight.

## Operational Flow

The system enforces a strict closed-loop flow:
`Order → Lab Approval → Production → Delivery Ticket → Invoicing → Results Record → Archival`

## Scaling & Performance

- **Indexing:** Heavily indexed tables for fast retrieval.
- **Caching:** AI Insights and heavy read actions are cached.
- **Atomic Operations:** Inventory deductions use database transactions to prevent race conditions.
