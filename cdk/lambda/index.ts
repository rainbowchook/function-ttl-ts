import * as aws from 'aws-sdk'
import { Handler, DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda'
import { PutObjectRequest } from 'aws-sdk/clients/s3'

const s3 = new aws.S3()

export const handler: Handler = async (
  event: DynamoDBStreamEvent
): Promise<string> => {
  console.log('Stream event: ', JSON.stringify(event, null, 2))
  for (const record of event.Records) {
    console.log('Stream record: ', JSON.stringify(record, null, 2))

    if (isTTLEventRecord(record)) {
      const item = parseTTLEventRecord(record)

      // Put the record into S3
      await putRecordInS3(item)
    }
  }

  return 'TTL processing completed'
}

const isTTLEventRecord = (record: DynamoDBRecord): boolean =>
  record.eventName === 'REMOVE' && record.userIdentity ? true : false

const parseTTLEventRecord = (
  record: DynamoDBRecord
): { [key: string]: any } => {
  const item = aws.DynamoDB.Converter.unmarshall(
    record.dynamodb?.OldImage as aws.DynamoDB.AttributeMap
  )
  const tableName: string = process.env.DYNAMODB_TABLE_NAME!

  // TTL processing logic
  console.log(
    `Item with ID ${item.id} has been deleted due to TTL expiry from ${tableName}`
  )

  return item
}

const putRecordInS3 = async (item: { [key: string]: any }) => {
  const bucketName: string = process.env.BUCKET_NAME!
  const key = `records/${item.id}.json`
  const body = JSON.stringify(item)

  const params: PutObjectRequest = {
    Bucket: bucketName,
    Key: key,
    Body: body,
  }

  try {
    await s3.putObject(params).promise()
    console.log(`Record for item with ID ${item.id} has been put into S3`)
  } catch (error) {
    console.error(`Error putting record into S3 bucket ${bucketName}: ${error}`)
  }
}
