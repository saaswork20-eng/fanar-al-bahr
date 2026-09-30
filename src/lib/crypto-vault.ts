import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM
const DEFAULT_FALLBACK_SECRET = 'e4c84918e5b619cbbf4514be0df81e5b3263da2957f864fa9c62391295cb9c02';

function getVaultSecret(): Buffer {
  const secretHex = process.env.KEY_VAULT_SECRET || DEFAULT_FALLBACK_SECRET;
  return Buffer.from(secretHex.slice(0, 64), 'hex');
}

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  tag: string;
}

/**
 * Encrypts a raw digital serial key using AES-256-GCM.
 * Keys are never stored in plain text.
 */
export function encryptDigitalKey(plainKey: string): EncryptedPayload {
  const key = getVaultSecret();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return {
    cipherText: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypts an encrypted digital key in memory for single-use reveal.
 */
export function decryptDigitalKey(cipherText: string, ivHex: string, tagHex: string): string {
  const key = getVaultSecret();
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masks a serial key for preview before safe reveal (e.g., ****-****-****-W97K)
 */
export function maskDigitalKey(fullKey: string): string {
  if (!fullKey || fullKey.length < 8) return '••••-••••-••••';
  const lastFour = fullKey.slice(-4);
  return `••••-••••-••••-${lastFour}`;
}
