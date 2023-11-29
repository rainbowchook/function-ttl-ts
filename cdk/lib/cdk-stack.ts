import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DynamoDB } from './dynamodb-create'
import { LambdaRole } from './lambda-role'
import { LambdaFn } from './lambda-function'
import { Alarm, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch'
import { ResultsS3Bucket } from './s3-bucket'
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import {
  FilterCriteria,
  FilterRule,
  StartingPosition,
} from 'aws-cdk-lib/aws-lambda'

export class FunctionTTLProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // create the DynamoDB table with TTL
    const { table } = new DynamoDB(this, 'TestDynamoDB')

    // create the S3 bucket to put TTL processing result
    const { s3Bucket } = new ResultsS3Bucket(this, 'ReportS3Bucket')

    // create the lambda service execution role
    const { role } = new LambdaRole(this, 'LambdaRole', { s3Bucket })

    // create the lambda
    const { lambdaFunction } = new LambdaFn(this, 'LambdaFunction', {
      role,
      table,
      s3Bucket,
    })

    // grant permissions to principal to DescribeStream, GetRecords, GetShardIterator, ListStreams
    table.grantStreamRead(lambdaFunction)

    // use the DynamoDB stream as an event source for AWS Lambda
    lambdaFunction.addEventSource(
      new DynamoEventSource(table, {
        batchSize: 5,
        startingPosition: StartingPosition.TRIM_HORIZON,
        retryAttempts: 10,
        filters: [
          // FilterCriteria.filter({ eventName: FilterRule.isEqual('REMOVE') }),
          FilterCriteria.filter({
            userIdentity: {
              type: FilterRule.isEqual('service'),
              principalId: FilterRule.isEqual('dynamodb.amazonaws.com'),
            },
          }),
        ],
      })
    )

    // create the CloudWatch alarm on lambda timeout
    if (lambdaFunction.timeout) {
      new Alarm(this, 'NewAlarm', {
        metric: lambdaFunction.metricDuration().with({
          statistic: 'Maximum',
        }),
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        threshold: lambdaFunction.timeout.toMilliseconds(),
        treatMissingData: TreatMissingData.IGNORE,
        alarmName: 'lambda-timeout-alarm',
      })
    }

    //output the DynamoDB table name
    new CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName,
      description: 'DynamoDB Table with TTL attribute',
    })

    //output the S3 bucket name
    new CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket name',
    })

    // output the Lambda function name
    new CfnOutput(this, 'TTLProcessingLambdaOutput', {
      value: lambdaFunction.functionArn,
    })
    
    // output the url for CloudWatch logs for the lambda
    new CfnOutput(this, 'LambdaLogsUrl', {
      exportName: 'LambdaLogs',
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${lambdaFunction.functionName}`
    })

    // output the AWS CLI command to put item into DynamoDB table
    new CfnOutput(this, 'InsertItemWithTTLToDynamoDBCommand', {
      exportName: 'InsertItemWithTTLToDynamoDBCommand',
      value: `aws dynamodb put-item --table-name ${s3Bucket.bucketName} --item '{"id":{"S":"<Unique ID string>"},"ttl":{"N":"<UTC date string>"}}'`
    })
  }
}
