# System Architecture Security Policy

## Overview

The Concrete Plant Management System is designed with a role-based siloed architecture to ensure maximum security and operational integrity.

## Core Security Tiers

1. **Network Tier:** Protected by Next.js Middleware with IP-based rate limiting.
2. **Access Tier:** Strict Role-Based Access Control (RBAC) enforced at both UI and Server Action levels.
3. **Data Tier:** SQLite database with atomic transactions for inventory and append-only audit logs.

## Integrity Measures

- All production data relies on Lab-approved mixes.
- Audit logs are signed with server-side timestamps.
- Direct database access is prohibited; all changes must pass through authenticated internal services.
