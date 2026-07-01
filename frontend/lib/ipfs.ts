/**
 * IPFS Upload & Resolution Utility
 *
 * Supports two providers, selected via the NEXT_PUBLIC_IPFS_PROVIDER env var:
 *
 *   "local"   — Uploads are proxied through the Next.js API route at
 *               /api/ipfs/upload (which forwards to IPFS Desktop at
 *               http://127.0.0.1:5001). Images resolve through the local
 *               gateway (http://127.0.0.1:8080).
 *               Perfect for Anvil development — uses your local IPFS node.
 *
 *   "pinata"  — Uploads via Pinata's REST API and resolves through their
 *               public gateway. Used for Sepolia / production deployments.
 *
 * Environment variables:
 *   NEXT_PUBLIC_IPFS_PROVIDER       "local" | "pinata"          (default: "local")
 *   NEXT_PUBLIC_LOCAL_IPFS_API      Local IPFS API URL in the      (default: http://127.0.0.1:5001)
 *                                   Next.js API route (server-side)
 *   NEXT_PUBLIC_LOCAL_IPFS_GATEWAY  Local IPFS gateway URL        (default: http://127.0.0.1:8080)
 *   NEXT_PUBLIC_PINATA_JWT          Pinata JWT (for "pinata")     (no default)
 *   NEXT_PUBLIC_PINATA_GATEWAY      Pinata gateway URL             (default: https://gateway.pinata.cloud)
 */

const IPFS_PROVIDER =
  process.env.NEXT_PUBLIC_IPFS_PROVIDER || "local";

const LOCAL_IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_LOCAL_IPFS_GATEWAY || "http://127.0.0.1:8080";

const PINATA_JWT =
  process.env.NEXT_PUBLIC_PINATA_JWT || "";

const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

/* -------------------------------------------------------------------------- */
/*  Gateway resolution                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns the base gateway URL appropriate for the configured provider.
 * Trailing slash is included so callers can append a CID directly.
 */
export function getGatewayBase(): string {
  if (IPFS_PROVIDER === "pinata") {
    return `${PINATA_GATEWAY}/ipfs/`;
  }
  return `${LOCAL_IPFS_GATEWAY}/ipfs/`;
}

/**
 * Resolve an `ipfs://` URI (or any URI) to an HTTP gateway URL.
 * Non-ipfs URIs are returned unchanged.
 */
export function resolveIPFS(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `${getGatewayBase()}${cid}`;
  }
  return uri;
}

/* -------------------------------------------------------------------------- */
/*  Upload helpers                                                            */
/* -------------------------------------------------------------------------- */

export interface UploadResult {
  cid: string;
  uri: `ipfs://${string}`;
}

/**
 * Upload a File to the configured IPFS provider.
 *
 * On success returns both the raw CID and the `ipfs://` URI form.
 * Throws a descriptive Error if the upload fails.
 */
export async function uploadToIPFS(file: File): Promise<UploadResult> {
  if (IPFS_PROVIDER === "pinata") {
    return uploadToPinata(file);
  }
  return uploadToLocal(file);
}

/* ---- Local IPFS Desktop ------------------------------------------------- */

async function uploadToLocal(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  // Use the Next.js API route proxy so the request stays same-origin
  // and avoids the CORS error (localhost → 127.0.0.1 is blocked by browsers).
  const res = await fetch("/api/ipfs/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error ??
        `Local IPFS upload failed (${res.status}). ` +
          "Is IPFS Desktop running? Check that the API is available."
    );
  }

  const data = await res.json();
  const cid = data.Hash as string;

  if (!cid) {
    throw new Error("Local IPFS returned an unexpected response — no Hash field.");
  }

  return { cid, uri: `ipfs://${cid}` };
}

/* ---- Pinata ------------------------------------------------------------- */

async function uploadToPinata(file: File): Promise<UploadResult> {
  if (!PINATA_JWT) {
    throw new Error(
      "NEXT_PUBLIC_PINATA_JWT is not set. " +
        "Get your JWT from https://app.pinata.cloud/developers/api-keys"
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(
      `Pinata upload failed (${res.status}): ${body}`
    );
  }

  const data = await res.json();
  const cid = data.IpfsHash as string;

  if (!cid) {
    throw new Error("Pinata returned an unexpected response — no IpfsHash field.");
  }

  return { cid, uri: `ipfs://${cid}` };
}

/* -------------------------------------------------------------------------- */
/*  Info helpers (used by the UI to display status)                           */
/* -------------------------------------------------------------------------- */

export function getProviderLabel(): string {
  return IPFS_PROVIDER === "pinata" ? "Pinata" : "Local IPFS Desktop";
}

export function getProviderShortLabel(): string {
  return IPFS_PROVIDER === "pinata" ? "Pinata" : "Local IPFS";
}
