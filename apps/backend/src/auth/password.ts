import bcrypt from "bcryptjs";

const ROUNDS = 12;

const DUMMY_HASH = bcrypt.hashSync("password-that-matches-nothing", ROUNDS);

export function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, ROUNDS);
}

export function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export async function verifyPasswordAgainstNothing(
  plaintext: string,
): Promise<false> {
  await bcrypt.compare(plaintext, DUMMY_HASH);
  return false;
}
