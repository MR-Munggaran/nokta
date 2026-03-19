import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH  = 12; // 96 bits — recommended for GCM

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv:         string; // base64
  authTag:    string; // base64
}

/**
 * Encrypt any JSON-serializable data with AES-256-GCM.
 * A new random IV is generated for every encryption call.
 */
export function encrypt(data: unknown, key: Buffer): EncryptedPayload {
  const iv     = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext  = JSON.stringify(data);
  const encrypted  = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    ciphertext: encrypted.toString("base64"),
    iv:         iv.toString("base64"),
    authTag:    cipher.getAuthTag().toString("base64"),
  };
}

/**
 * Decrypt an EncryptedPayload back to its original data.
 * Throws if the auth tag is invalid (tampered or wrong key).
 */
export function decrypt<T = unknown>(payload: EncryptedPayload, key: Buffer): T {
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as T;
}