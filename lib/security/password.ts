import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    if (!password || !hash) return false;
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error("[verifyPassword] Error:", err);
    return false;
  }
}
