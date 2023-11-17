import * as path from 'node:path'

import { Construct } from 'constructs'
import { Role } from 'aws-cdk-lib/aws-iam'
import { Function, Runtime, Code, Architecture } from 'aws-cdk-lib/aws-lambda'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

export class LambdaFn extends Construct {
  public readonly lambdaFunction: Function
  constructor(
    scope: Construct,
    id: string,
    resources: { role: Role; table: ITable; s3Bucket: Bucket }
  ) {
    super(scope, id)

    const functionName = 'ProcessDynamoDBTTLRecords'
    const lambdaFunction = new Function(this, 'Lambda', {
      functionName,
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(path.join(__dirname, '../../lambda/build')),
      handler: 'index.handler',
      // runtime: Runtime.PROVIDED_AL2023,
      // code: Code.fromAsset(path.join(__dirname, '../cmd/lambda/bootstrap.zip')),
      // architecture: Architecture.X86_64,
      // handler: 'bootstrap',
      role: resources.role,
      timeout: Duration.seconds(60),
      environment: {
        DYNAMODB_TABLE_NAME: resources.table.tableName,
        BUCKET_NAME: resources.s3Bucket.bucketName,
      },
    })

    this.lambdaFunction = lambdaFunction
  }
}
