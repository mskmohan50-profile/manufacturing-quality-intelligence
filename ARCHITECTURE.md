# Architecture Document — Multi-Tenant SaaS Evolution

## Overview
The current app is single-tenant: every record is scoped to one `userId`. Below is how it evolves into a multi-tenant SaaS platform serving multiple manufacturing organizations, on the existing Express + MongoDB stack.

---

## 1. Multiple Organizations

Add an `organizations` layer above users:

```
Organization → OrganizationMember (user + role) → Workspace → ProductionRecord
```

- `organizations` — id, name, slug, plan (free/pro/enterprise)
- `organizationMembers` — links a user to an org with a role
- `workspaces` — sub-groups within an org (e.g. "Plant A", "Plant B")
- `productionRecords` gains `orgId` and `workspaceId` fields

**Flow:** user logs in → fetch their orgs → pick active org (org switcher in header) → every API call is scoped to that `orgId`.

---

## 2. Workspace Isolation

MongoDB has no built-in row-level security, so isolation is enforced in code, not the database:

- A `requireOrgMembership` middleware runs before every org route, checks the user belongs to `orgId`, and attaches their role to the request
- Every query filters on `orgId` (and `workspaceId` when relevant) — e.g. `ProductionRecord.find({ orgId })`
- Uploaded files are stored under org-scoped paths (e.g. `uploads/:orgId/...`)

---

## 3. Role-Based Access Control (RBAC)

| Role | Can do |
|------|--------|
| Owner | Everything, incl. billing, delete org |
| Admin | Manage members/workspaces, full data access |
| Engineer | Upload, view/edit records, export |
| Viewer | Read-only |

A `requireRole('owner', 'admin', ...)` middleware sits after `requireOrgMembership` on write routes. The frontend also hides/shows actions based on the user's role for that org.

---

## 4. Audit Logging

Already exists (`auditlogs` collection: `userId`, `action`, `entityType`, `entityId`, `details`, insert-only). To go multi-tenant:

- Add `orgId` to every log entry
- Admins see the full org audit trail; regular users see only their own actions
- Retention can vary by plan (e.g. 30 days free, 1 year enterprise) via a TTL index or cleanup job
- Later: stream logs to an external SIEM (Datadog/Splunk)

Logged events: `upload`, `export_csv`, `export_pdf`, `login`, `logout`, `delete`, plus new multi-tenant events: `member_invite`, `role_change`, `workspace_create`.

---

## 5. Future AI Integration

```
Frontend → Express AI route → LLM API (OpenAI/Anthropic)
```

- **Anomaly detection** — flag abnormal temperature/pressure/vibration readings
- **Predictive maintenance** — forecast machine failure windows from historical data
- **Natural-language insights** — LLM-generated plain-English summaries of trends
- **Real SHAP values** — train a classifier server-side instead of the current mocked feature importance
- **Conversational analytics** — chat interface that turns questions into MongoDB aggregation queries

All of this is added as new Express routes calling out to an LLM/ML service — no change to the core data layer needed.

---

## 6. Scalability Considerations

| Concern | Strategy |
|---|---|
| Large datasets | Shard `productionRecords` by `orgId` |
| Query speed | Compound index on `{ orgId, workspaceId, productionDate }` |
| Read load | MongoDB replica set with reads offloaded to secondaries |
| Big file uploads | Web Workers for parsing + background jobs (BullMQ/Redis) |
| Live updates | Socket.io for real-time KPI pushes |
| Caching | Redis for frequently-viewed dashboard aggregations |
| Growth path | 0–1K users: single instance → 1K–10K: read replicas + aggregation → 10K–100K: sharding by org + workers → 100K+: multi-region |

---

## Simple Diagram

```
                 ┌────────────────────┐
                 │   React Frontend    │
                 │ Dashboard / Upload / │
                 │ Records / Reports    │
                 └──────────┬──────────┘
                            │  JWT + orgId
                            ▼
                 ┌────────────────────┐
                 │   Express API       │
                 │  requireAuth        │
                 │  requireOrgMembership│
                 │  requireRole         │
                 └──────────┬──────────┘
             ┌───────────────┼───────────────┐
             ▼                ▼               ▼
      ┌────────────┐  ┌─────────────┐  ┌────────────┐
      │  MongoDB    │  │ File Storage │  │  AI/LLM     │
      │  (org/role- │  │ (org-scoped) │  │  routes     │
      │  scoped)    │  │              │  │             │
      └────────────┘  └─────────────┘  └────────────┘
```

---

## Summary
The existing middleware pattern (`requireAuth` filtering by `userId`) extends naturally to `requireOrgMembership` + `requireRole` filtering by `orgId`. Audit logging just needs an `orgId` field. AI features slot in as new routes. No infrastructure rewrite is required — this is an incremental evolution, not a rebuild.