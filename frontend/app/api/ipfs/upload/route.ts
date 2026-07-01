/**
 * API Route:  POST /api/ipfs/upload
 *
 * Proxies the file to the local IPFS Desktop API at
 * http://127.0.0.1:5001/api/v0/add.
 *
 * This exists because browsers block direct fetch() to 127.0.0.1:5001
 * from localhost:3000 (CORS).  By proxying through Next.js the request
 * stays same-origin and the browser is happy.
 *
 * The route is *only* active when NEXT_PUBLIC_IPFS_PROVIDER=local
 * (the default).  For the Pinata provider the upload goes directly to
 * api.pinata.cloud from the browser.
 */

import { NextRequest, NextResponse } from "next/server";

const LOCAL_IPFS_API =
  process.env.NEXT_PUBLIC_LOCAL_IPFS_API || "http://127.0.0.1:5001";

const IPFS_PROVIDER = process.env.NEXT_PUBLIC_IPFS_PROVIDER || "local";

export async function POST(request: NextRequest) {
  // Guard: only works for the local provider
  if (IPFS_PROVIDER !== "local") {
    return NextResponse.json(
      { error: "This endpoint is only available for the local IPFS provider." },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();

    const res = await fetch(`${LOCAL_IPFS_API}/api/v0/add`, {
      method: "POST",
      body: formData,
      // We don't forward any headers from the client request — IPFS Desktop
      // doesn't need them.
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      return NextResponse.json(
        {
          error: `Local IPFS returned status ${res.status}`,
          detail: text,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Unknown error connecting to local IPFS";
    return NextResponse.json(
      {
        error: `Failed to reach local IPFS. Is IPFS Desktop running on port 5001?`,
        detail: msg,
      },
      { status: 502 }
    );
  }
}
