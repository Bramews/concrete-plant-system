# Access Control Matrix

| Department | Role       | View Data  | Create/Edit    | Approve/Reject | Settings Access | AI Insights |
| ---------- | ---------- | ---------- | -------------- | -------------- | --------------- | ----------- |
| Management | MANAGER    | Full       | Yes (System)   | Yes (Requests) | Full            | Read-Only   |
| Laboratory | LAB_TECH   | Lab Only   | Yes (Mixes)    | Yes (Tests)    | Lab Only        | No          |
| Production | OPERATOR   | Prod Only  | Yes (Batch)    | No             | No              | No          |
| Sales      | SALES      | Sales Only | Yes (Orders)   | No             | No              | No          |
| Accounting | ACCOUNTANT | Finance    | Yes (Invoices) | No             | No              | No          |
| Safety     | SAFETY     | Safety     | Yes (Reports)  | No             | No              | No          |

## Rules of Engagement

- **Silo Enforcement:** Users are redirected to their departmental path immediately after authentication.
- **Cross-Role Access:** Strictly prohibited; triggers "Access Denied" via server-side session checks.
- **Immutability:** Original order quantities and signed audit logs cannot be modified by any role.
