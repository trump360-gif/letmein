import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCODING_KEY = process.env.API_KEY_ENCRYPTION_SECRET || 'default-dev-secret-change-in-production-32ch'

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'beauti-salt', 32)
}

export function encrypt(text: string): string {
  if (!text) return ''
  const key = deriveKey(ENCODING_KEY)
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
    if (!ivHex || !authTagHex || !encrypted) return ''
    const key = deriveKey(ENCODING_KEY)
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return ''
  }
}

export function maskValue(value: string): string {
  if (!value) return ''
  if (value.length <= 4) return '****'
  return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 4, 20))
}
