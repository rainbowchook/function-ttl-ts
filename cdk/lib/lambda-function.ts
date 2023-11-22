import * as path from 'node:path'

import { Construct } from 'constructs'
import { Role } from 'aws-cdk-lib/aws-iam'
import { Runtime} from 'aws-cdk-lib/aws-lambda'
import { Duration } from 'aws-cdk-lib'
import { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'

export class LambdaFn extends Construct {
  public readonly lambdaFunction: NodejsFunction
  constructor(
    scope: Construct,
    id: string,
    resources: { role: Role; table: ITable; s3Bucket: Bucket }
  ) {
    super(scope, id)

    const functionName = 'ProcessDynamoDBTTLRecords'
    const lambdaFunction = new NodejsFunction(this, 'Lambda', {
      functionName,
      runtime: Runtime.NODEJS_16_X,
      entry: path.join(__dirname, '../lambda/index.ts'),
      handler: 'handler',
      bundling: {
        sourceMap: true,
        externalModules: ['aws-sdk'],
      },
      description: 'DynamoDB TTL Processing Lambda',
      role: resources.role,
      timeout: Duration.seconds(60),
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        DYNAMODB_TABLE_NAME: resources.table.tableName,
        BUCKET_NAME: resources.s3Bucket.bucketName,
      },
    })

    this.lambdaFunction = lambdaFunction
  }
}
