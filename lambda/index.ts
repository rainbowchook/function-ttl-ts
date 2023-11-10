import * as aws from 'aws-sdk'
import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda'

const docClient = new aws.DynamoDB.DocumentClient()

const handler = async (event: DynamoDBStreamEvent): Promise<string> => {
  for (const record of event.Records) {
    if(record.eventName === 'REMOVE') {
      const item = aws.DynamoDB.Converter.unmarshall(record.dynamodb?.OldImage as aws.DynamoDB.AttributeMap)
      const tableName = process.env.DYNAMODB_TABLE_NAME as string

      // TTL processing logic
      console.log(`Item with ID ${item.id} has been deleted due to TTL expiry from ${tableName}`)
    }
  }

  return 'TTL processing completed'
}

export default handler
