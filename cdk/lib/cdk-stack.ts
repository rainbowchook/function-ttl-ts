import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DynamoDB } from './dynamodb-create'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FunctionTTLGoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    //create the DynamoDB table with TTL
    const { table } = new DynamoDB(this, 'TestDynamoDB')
  }
}
