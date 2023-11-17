import { Construct } from 'constructs'
import {
  Table,
  ITable,
  AttributeType,
  BillingMode,
  StreamViewType,
} from 'aws-cdk-lib/aws-dynamodb'
import { RemovalPolicy } from 'aws-cdk-lib'

export class DynamoDB extends Construct {
  public readonly table: ITable
  constructor(scope: Construct, id: string) {
    super(scope, id)
    const tableName = 'TTLTable-v3'
    const table = new Table(this, 'TestDynamoDBTable', {
      tableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
    })

    this.table = table
  }
}
