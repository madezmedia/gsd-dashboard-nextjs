# Claude Design import

- Project: https://gsd-dashboard-nextjs.vercel.app/. this needs to be more polished its cur
- ID: `a378a26c-7385-439b-9979-e939d6de1e62`
- URL: https://claude.ai/design/p/a378a26c-7385-439b-9979-e939d6de1e62?file=GSD+Fleet+Template.dc.html
- Source: Design REST `GET /v1/design/projects/{id}` → base64 `data` chat tool inputs (`dc_write`)
- Note: MCP `read_file` requires interactive `/design consent` (`agent_design_projects`); REST file download needs broader OAuth scopes. Chat-history extraction used as import path.
