import { TypedChow } from '../server'
import S3 = require('aws-sdk/clients/s3')
import createDebug = require('debug')

const debug = createDebug('api:event:s3')

export interface S3Event {
  name: 'put-object'
  payload: {
    key: string
    body: S3.Body
    acl: S3.BucketCannedACL
  }
}

export default function s3(chow: TypedChow) {
  const { SPACES_ENDPOINT, SPACES_KEY, SPACES_SECRET, SPACES_BUCKET } = chow.env

  const s3 = new S3({
    endpoint: SPACES_ENDPOINT,
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET,
  })

  //
  // uplaod to s3 event
  //
  chow.event<S3Event>('put-object', async ({ event }) => {
    const { key, body, acl } = event.payload

    await s3
      .putObject({
        Bucket: SPACES_BUCKET,
        Key: key,
        Body: body,
        ACL: acl,
      })
      .promise()
  })
}
