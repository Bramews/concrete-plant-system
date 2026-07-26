# Audit Policy

## 1. Compliance Statement

All system actions that modify state or access sensitive data are logged in an append-only, tamper-evident audit trail.

## 2. Log Retention

- **Operational Logs:** Retained for 2 years online.
- **Audit Logs:** Retained for 10 years in archival storage.
- **Backups:** Daily backups retained for 30 days; monthly for 1 year.

## 3. Data Integrity (Evidence Mode)

- Audit logs are signed with a server-side cryptographic key (`AUDIT_SIGNING_KEY`).
- Each log entry contains a high-resolution server timestamp.
- Deletion or modification of audit logs is programmatically restricted at the database level.

## 4. Access Control

- **Self-Audit:** Users can view their own activity history.
- **Supervision:** Department managers can view all actions within their scope.
- **Full Audit:** System Administrators and designated Auditors have full access to global logs via Evidence Mode.

## 5. Audit Export

- Audit logs can be exported in CSV format for offline analysis.
- Exports are only available to users with the `MANAGER` role.
