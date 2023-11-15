import * as aws from 'aws-sdk'
import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda'
import { PutObjectRequest } from 'aws-sdk/clients/s3'

// Can use docClient to put a record back into DynamoDB on processing TTL event
// const docClient = new aws.DynamoDB.DocumentClient()
const s3 = new aws.S3()

const handler = async (event: DynamoDBStreamEvent): Promise<string> => {
  for (const record of event.Records) {
    console.log('Stream record: ', JSON.stringify(record, null, 2))
    
    if (record.eventName === 'REMOVE') {
      const item = aws.DynamoDB.Converter.unmarshall(
        record.dynamodb?.OldImage as aws.DynamoDB.AttributeMap
      )
      const tableName = process.env.DYNAMODB_TABLE_NAME as string

      // TTL processing logic
      console.log(
        `Item with ID ${item.id} has been deleted due to TTL expiry from ${tableName}`
      )

      // Put the record into S3
      await putRecordInS3(item)
    }
  }

  return 'TTL processing completed'
}

const putRecordInS3 = async (item: { [key: string]: any }) => {
  const bucketName = process.env.BUCKET_NAME as string
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

export default handler
