# GSD Dashboard Integration Plan

## Goal
Fully implement and test the remaining GSD Dashboard interfaces (Kanban `/todo`, human approvals `/hitl`, and VM service panels `/services`) wired directly to your cloud fleet.

## Tasks
- [x] Task 1: Create NocoDB postgres proxy API route in dashboard → Verify: `curl -I http://localhost:3000/api/nocodb` returns 200/404 or config details.
- [x] Task 2: Implement `/hitl` page UI and Redis ZSET reader/writer → Verify: `/hitl` loads items from `acmi:user:mikey:hitl-queue` with Approve/Reject buttons.
- [x] Task 3: Build interactive drag-and-drop actions on the Kanban board (`/todo`) → Verify: Dragging a task updates its signals key status in VM Redis.
- [x] Task 4: Implement system health cards on the `/services` page → Verify: Health indicators fetch and match VM active services.
- [x] Task 5: Deploy Gitea-backed markdown sync webhook on the VM → Verify: Pushing docs to Gitea automatically updates `acmi:doc:*` keys in Redis.
- [x] Task 6: Audit design aesthetics, fonts, and responsiveness → Verify: Run `.agent/scripts/ux_audit.py` or check colors align with the warm paper guidelines.

## Done When
- [x] Dashboard `/docs` and `/todo` pages dynamically load from the VM database.
- [x] Human operator can approve or reject HITL block tickets directly from `/hitl`.
- [x] Dev server compiles cleanly with no console errors or warnings.
