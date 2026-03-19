import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// This key encrypts the session cookie itself.
// Must be exactly 32 bytes. Set SESSION_SECRET in .env.local.
function getSessionSecret(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in .env.local");
  }
  return Buffer.from(secret.slice(0, 32), "utf8");
}

const COOKIE_NAME = "nokta_session";
const ALGORITHM   = "aes-256-gcm";

interface SessionData {
  encryptionKey: string; // hex-encoded derived key
  lockedAt?:     number; // timestamp — set on lock
}

// ─── WRITE SESSION ────────────────────────────────────────────────────────────

export async function setEncryptionKey(encryptionKey: Buffer): Promise<void> {
  const data: SessionData = { encryptionKey: encryptionKey.toString("hex") };
  const plaintext = JSON.stringify(data);

  const secret   = getSessionSecret();
  const iv       = randomBytes(12);
  const cipher   = createCipheriv(ALGORITHM, secret, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag  = cipher.getAuthTag();

  // Format: iv.authTag.ciphertext (all base64)
  const token = [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   60 * 60 * 8, // 8 hours
  });
}

// ─── READ SESSION ─────────────────────────────────────────────────────────────

export async function getEncryptionKey(): Promise<Buffer | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const [ivB64, authTagB64, ciphertextB64] = token.split(".");
    const secret   = getSessionSecret();
    const decipher = createDecipheriv(ALGORITHM, secret, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, "base64")),
      decipher.final(),
    ]);

    const data: SessionData = JSON.parse(decrypted.toString("utf8"));

    // Check if locked
    if (data.lockedAt) return null;

    return Buffer.from(data.encryptionKey, "hex");
  } catch {
    return null;
  }
}

// ─── LOCK SESSION ─────────────────────────────────────────────────────────────

export async function lockSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  try {
    const [ivB64, authTagB64, ciphertextB64] = token.split(".");
    const secret   = getSessionSecret();
    const decipher = createDecipheriv(ALGORITHM, secret, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, "base64")),
      decipher.final(),
    ]);

    const data: SessionData = JSON.parse(decrypted.toString("utf8"));
    data.lockedAt = Date.now();

    // Re-encrypt with lockedAt set
    const newPlaintext = JSON.stringify(data);
    const newIv        = randomBytes(12);
    const cipher       = createCipheriv(ALGORITHM, secret, newIv);
    const encrypted    = Buffer.concat([cipher.update(newPlaintext, "utf8"), cipher.final()]);
    const authTag      = cipher.getAuthTag();

    const newToken = [
      newIv.toString("base64"),
      authTag.toString("base64"),
      encrypted.toString("base64"),
    ].join(".");

    cookieStore.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 8,
    });
  } catch {
    // If anything fails, clear the session entirely
    cookieStore.delete(COOKIE_NAME);
  }
}

// ─── CLEAR SESSION ────────────────────────────────────────────────────────────

export async function clearEncryptionSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}