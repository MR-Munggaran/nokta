import { pbkdf2Sync, randomBytes } from "crypto";

const ITERATIONS = 100_000;
const KEY_LENGTH  = 32; // 256 bits
const DIGEST      = "sha256";

/**
 * Derive a 256-bit encryption key from a master password + salt.
 * The salt is stored in the couples table — it is not secret.
 */
export function deriveKey(masterPassword: string, salt: string): Buffer {
  return pbkdf2Sync(
    masterPassword,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );
}

/**
 * Generate a new random salt. Called once when a couple is first created.
 */
export function generateSalt(): string {
  return randomBytes(32).toString("hex");
}   