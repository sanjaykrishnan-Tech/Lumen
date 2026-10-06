import argon2 from 'argon2'

export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id })

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

// Verified against when the email doesn't exist, so a login attempt takes
// about the same time either way and can't be used to enumerate accounts.
export const DUMMY_HASH = await hashPassword('lumen-dummy-password')
