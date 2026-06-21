import { createHmac, createHash } from "crypto";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.R2_BUCKET_NAME ?? "moveee-media";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://media.themoveee.com";

const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const REGION = "auto";
const SERVICE = "s3";

function sha256(data: string | Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

function hmacSha256(key: Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function toHex(buf: Buffer): string {
  return buf.toString("hex");
}

function getSigningKey(dateStamp: string): Buffer {
  const kDate = hmacSha256(Buffer.from(`AWS4${SECRET_KEY}`), dateStamp);
  const kRegion = hmacSha256(kDate, REGION);
  const kService = hmacSha256(kRegion, SERVICE);
  return hmacSha256(kService, "aws4_request");
}

/**
 * Upload a file buffer directly to R2 (server-side, no presigned URL).
 * Returns the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const url = `${ENDPOINT}/${BUCKET}/${key}`;
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const payloadHash = toHex(sha256(body));

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    `/${BUCKET}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    toHex(sha256(canonicalRequest)),
  ].join("\n");

  const signingKey = getSigningKey(dateStamp);
  const signature = toHex(hmacSha256(signingKey, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }

  return `${R2_PUBLIC_URL}/${key}`;
}
