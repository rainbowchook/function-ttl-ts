import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DynamoDB } from './dynamodb-create'
import { LambdaRole } from './lambda-role'
import { LambdaFn } from './lambda-function'
import { Alarm, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch'

export class FunctionTTLGoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // create the DynamoDB table with TTL
    const { table } = new DynamoDB(this, 'TestDynamoDB')

    // create the lambda service execution role
    const { role } = new LambdaRole(this, 'LambdaRole')
    
    // create the lambda
    const { lambdaFunction } = new LambdaFn(this, 'LambdaFunction', { role })

    // create the CloudWatch alarm on lambda timeout
    if(lambdaFunction.timeout) {
      new Alarm(this, 'NewAlarm', {
        metric: lambdaFunction.metricDuration().with({
          statistic: 'Maximum'
        }),
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        threshold: lambdaFunction.timeout.toMilliseconds(),
        treatMissingData: TreatMissingData.IGNORE,
        alarmName: 'lambda-timeout-alarm'
      })
    }
  }
}
