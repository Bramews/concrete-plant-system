# Backup and Disaster Recovery Policy

## Frequency

- **Full Database Backups:** Once every 24 hours at 02:00 UTC.
- **Incremental Backups:** Every 6 hours.

## Storage

- **Primary:** Local storage on production server.
- **Secondary (Off-site):** Encrypted cloud storage or remote secure volume.

## Verification

- Automated integrity checks follow every backup operation.
- **Monthly Restore Drill:** Mandatory manual restoration test in a staging environment to ensure data portability and integrity.

## Retention

- Daily backups kept for 30 days.
- Weekly snapshots kept for 6 months.
- Annual archives kept for 5 years.
