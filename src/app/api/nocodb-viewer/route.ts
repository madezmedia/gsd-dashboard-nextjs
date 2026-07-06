import { NextResponse } from "next/server";

const NOCODB_URL = process.env.NOCODB_URL || "https://nocodb-u70402.vm.elestio.app";
const NOCODB_API_KEY = process.env.NOCODB_API_KEY || "nc_pat_DdPSCZ7WnU3Ra7TdSxmMXgEvlkpiI5GxJnYwUKad";
const BASE_ID = "pm9mqdzjuh98a0n";

const TABLES = {
  documents: "m0mqrqpi5imzs2h",
  procedures: "mebqs35sgusbb7g",
  glossary: "m0n81ajtbpwmryl"
};

async function fetchTableRecords(tableId: string) {
  try {
    const url = `${NOCODB_URL}/api/v3/data/${BASE_ID}/${tableId}/records?limit=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": NOCODB_API_KEY,
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[NocoDB Viewer API] Table ${tableId} fetch failed:`, text);
      return [];
    }
    const data = await res.json();
    return data.list || data.records || [];
  } catch (e: any) {
    console.error(`Error fetching table ${tableId}:`, e.message);
    return [];
  }
}

export async function GET() {
  try {
    const [documents, procedures, glossary] = await Promise.all([
      fetchTableRecords(TABLES.documents),
      fetchTableRecords(TABLES.procedures),
      fetchTableRecords(TABLES.glossary)
    ]);
    return NextResponse.json({
      success: true,
      data: {
        documents,
        procedures,
        glossary
      }
    });
  } catch (err: any) {
    console.error("NocoDB viewer API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
