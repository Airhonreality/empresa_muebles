import type { S3ClientConfig } from '@aws-sdk/client-s3'

export function buildR2S3Config(params: {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
}): S3ClientConfig {
  const { accountId, accessKeyId, secretAccessKey } = params

  return {
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  }
}
