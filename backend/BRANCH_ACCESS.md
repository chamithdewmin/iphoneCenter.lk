# Branch & role access

## Roles and scope

| Role     | Scope        | What they see |
|----------|--------------|----------------|
| **Admin**   | All branches | All branches, all stock, all sales, all reports. Can filter by branch (query `branchId`) to drill down. |
| **Manager** | One branch   | Only their assigned branch: that branch’s stock, sales, transfers involving that branch, reports for that branch. |
| **Staff**   | One branch   | Same as Manager: only their assigned branch. |

- **Admin**: `branch_id` is usually `null`. APIs accept optional `branchId` (query or body) to filter; if omitted, all branches.
- **Manager / Staff**: must have `branch_id` set. APIs always restrict to `user.branch_id`; any other `branchId` in the request is ignored or rejected (403).

## How it’s enforced

1. **Auth**: JWT and `/api/auth/profile` provide `role` and `branch_id` on `req.user`.
2. **branchGuard** (middleware): For non-admin, requires `branch_id`; if the request sends a `branchId`, it must match the user’s branch.
3. **Controllers**: Use `isAdmin(req)` (from `utils/helpers`) for branch logic:
   - **Admin**: use optional `req.query.branchId` or `req.body.branchId` when present.
   - **Non-admin**: use only `req.user.branch_id` and do not allow access to other branches.

## Endpoints

- **GET /api/branches** – Admin: all active branches. Manager/Staff: single branch (their own).
- **GET /api/branches/:id** – Admin: any branch. Manager/Staff: only their branch (403 otherwise).
- **GET /api/billing/sales** – Admin: optional `?branchId=`. Manager/Staff: only their branch’s sales.
- **GET /api/inventory/stock** – Admin: optional `?branchId=` (via setBranchContext). Manager/Staff: only their branch.
- **Reports** – Same pattern: Admin can pass `branchId`; Manager/Staff see only their branch.

## Frontend

- **Admin**: Dashboard (and any future screens that need it) shows a **Branch** dropdown (“All branches” + list). Passing `branchId` in API calls filters data to that branch.
- **Manager / Staff**: No branch dropdown; all data is already scoped to their branch by the backend.
