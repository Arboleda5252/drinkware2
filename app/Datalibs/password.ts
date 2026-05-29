import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 32;

export function isPasswordHash(value: string) {
  return value.startsWith(`${HASH_PREFIX}$`);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}$${salt}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedPassword: string) {
  if (!isPasswordHash(storedPassword)) {
    return storedPassword === password;
  }

  const [, salt, storedKeyEncoded] = storedPassword.split("$");
  if (!salt || !storedKeyEncoded) {
    return false;
  }

  const storedKey = Buffer.from(storedKeyEncoded, "base64url");
  const key = (await scrypt(password, salt, storedKey.length)) as Buffer;

  return storedKey.length === key.length && timingSafeEqual(storedKey, key);
}
