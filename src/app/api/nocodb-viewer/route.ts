import { NextResponse } from "next/server";

const NOCODB_URL = process.env.NOCODB_URL || "https://nocodb-u70402.vm.elestio.app";
const NOCODB_API_KEY = process.env.NOCODB_API_KEY || "nc_pat_DdPSCZ7WnU3Ra7TdSxmMXgEvlkpiI5GxJnYwUKad";

const BASES = {
  docs: "pm9mqdzjuh98a0n",
  todos: "plrjwos5se3uu50",
  instructions: "p39nlm6sxyl5wc4"
};

const TABLES = {
  documents: { base: BASES.docs, id: "m0mqrqpi5imzs2h" },
  procedures: { base: BASES.docs, id: "mebqs35sgusbb7g" },
  glossary: { base: BASES.docs, id: "m0n81ajtbpwmryl" },
  tasks: { base: BASES.todos, id: "mtizkx4ji0accqt" },
  checklists: { base: BASES.todos, id: "m6wooprrf4sq52y" },
  agents: { base: BASES.instructions, id: "ma76tpu23a1ww61" },
  mcp: { base: BASES.instructions, id: "m6n2t7tdb2uavsc" }
};

async function fetchTableRecords(baseId: string, tableId: string) {
  try {
    const url = `${NOCODB_URL}/api/v3/data/${baseId}/${tableId}/records?limit=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": NOCODB_API_KEY,
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[NocoDB Viewer API] Base ${baseId} Table ${tableId} fetch failed:`, text);
      return [];
    }
    const data = await res.json();
    return data.list || data.records || [];
  } catch (e: any) {
    console.error(`Error fetching base ${baseId} table ${tableId}:`, e.message);
    return [];
  }
}

export async function GET() {
  try {
    const [documents, procedures, glossary, tasks, checklists, agents, mcp] = await Promise.all([
      fetchTableRecords(TABLES.documents.base, TABLES.documents.id),
      fetchTableRecords(TABLES.procedures.base, TABLES.procedures.id),
      fetchTableRecords(TABLES.glossary.base, TABLES.glossary.id),
      fetchTableRecords(TABLES.tasks.base, TABLES.tasks.id),
      fetchTableRecords(TABLES.checklists.base, TABLES.checklists.id),
      fetchTableRecords(TABLES.agents.base, TABLES.agents.id),
      fetchTableRecords(TABLES.mcp.base, TABLES.mcp.id)
    ]);
    return NextResponse.json({
      success: true,
      data: {
        documents,
        procedures,
        glossary,
        tasks,
        checklists,
        agents,
        mcp
      }
    });
  } catch (err: any) {
    console.error("NocoDB viewer API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
