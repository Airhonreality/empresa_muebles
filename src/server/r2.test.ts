import { describe, expect, it } from 'vitest'
import { buildR2S3Config } from './r2'

describe('buildR2S3Config', () => {
  it('uses path-style addressing against the Cloudflare R2 endpoint', () => {
    const config = buildR2S3Config({
      accountId: 'abc123',
      accessKeyId: 'key-1',
      secretAccessKey: 'secret-1',
    })

    expect(config.endpoint).toBe('https://abc123.r2.cloudflarestorage.com')
    expect(config.forcePathStyle).toBe(true)
    expect(config.region).toBe('auto')
    expect(config.credentials).toEqual({
      accessKeyId: 'key-1',
      secretAccessKey: 'secret-1',
    })
  })
})
