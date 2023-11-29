import * as cdk from 'aws-cdk-lib'
import { Capture, Match, Template } from 'aws-cdk-lib/assertions'
import * as Cdk from '../../lib/cdk-stack'
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda'
import { BillingMode, StreamViewType } from 'aws-cdk-lib/aws-dynamodb'

// Instantiate the cdk app
const app = new cdk.App()

// create stack
const stack = new Cdk.FunctionTTLProcessingStack(app, 'CdkLambdaStack')

// prepare the stack for assertions
const template = Template.fromStack(stack)

describe('FunctionTTLProcessingStack resources created', () => {
  // Snapshot testing
  test('Resources created matches the snapshot', () => {
    // match with snapshot
    expect(template.toJSON()).toMatchSnapshot()
  })

  test('S3 Bucket created', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1)
    template.resourceCountIs('Custom::S3BucketNotifications', 1)
  })

  test('DynamoDB table created', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 1)
  })

  test('Lambda function created', () => {
    template.resourcePropertiesCountIs(
      'AWS::Lambda::Function',
      { Runtime: Runtime.NODEJS_16_X.name, Environment: Match.anyValue() },
      1
    )
    template.resourceCountIs('AWS::Lambda::Function', 3)
    template.resourceCountIs('Custom::LogRetention', 1)
    template.resourceCountIs('AWS::Lambda::EventSourceMapping', 1)
  })

  test('CloudWatch Alarm created', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 1)
  })
})

describe('DynamoDB tests', () => {
  test('DynamoDB table has correct properties', () => {
    const ttlEnableCapture = new Capture()
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: BillingMode.PAY_PER_REQUEST,
      StreamSpecification: {
        StreamViewType: StreamViewType.NEW_AND_OLD_IMAGES,
      },
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: ttlEnableCapture,
      },
    })

    expect(ttlEnableCapture.asBoolean()).toBe<boolean>(true)
  })
})

describe('Lambda tests', () => {
  test('Lambda function has correct properties', () => {
    const dependencyCapture = new Capture()
    template.hasResource('AWS::Lambda::Function', {
      Properties: {
        Code: {
          S3Bucket: {
            'Fn::Sub': Match.stringLikeRegexp('^cdk-.*?-assets-.*?$'),
          },
        },
        Environment: {
          Variables: {
            NODE_OPTIONS: '--enable-source-maps',
            DYNAMODB_TABLE_NAME: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
          },
        },
        Handler: 'index.handler',
        Runtime: Runtime.NODEJS_16_X.name,
        Timeout: 60,
      },
      DependsOn: dependencyCapture,
    })
    expect(dependencyCapture).not.toBeNull()
    expect(dependencyCapture.asArray().length).toBeGreaterThanOrEqual(1)
  })

  test('Lambda function execution role has correct IAM permissions - write to CloudWatch & put object in S3', () => {
    console.log(template.findResources('AWS::IAM::Role'))
    const roleCapture = new Capture()
    const actionCapture = new Capture()
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      }),
      ManagedPolicyArns: [
        {
          'Fn::Join': Match.arrayWith([
            ['arn:', { Ref: 'AWS::Partition' }, roleCapture],
          ]),
        },
      ],
      Policies: Match.arrayWith([
        Match.objectLike({
          PolicyDocument: Match.objectLike({
            Statement: [
              {
                Action: actionCapture,
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    [
                      {
                        'Fn::GetAtt': Match.arrayWith([
                          Match.stringLikeRegexp('^.*?Bucket.*?$'),
                        ]),
                      },
                      '/*',
                    ],
                  ]),
                },
              },
            ],
            Version: '2012-10-17',
          }),
        }),
      ]),
    })

    expect(
      roleCapture.asString().match(/AWSLambdaBasicExecutionRole/)
    ).not.toBeNull()
    expect(actionCapture.asString()).toMatch(/s3:PutObject/)
  })

  test('Lambda has correct event source mapping - filters for DynamoDB TTL event stream', () => {
    template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      FilterCriteria: {
        Filters: [
          {
            Pattern: Match.serializedJson({
              userIdentity: {
                type: Match.arrayEquals(['service']),
                principalId: Match.arrayEquals(['dynamodb.amazonaws.com']),
              },
            }),
          },
        ],
      },
    })
  })

  test('Lambda event source mapping correctly configured to process DynamoDB stream events', () => {
    template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      MaximumRetryAttempts: 10,
      StartingPosition: StartingPosition.TRIM_HORIZON,
    })
  })

  test('Lambda role has IAM policy to read DynamoDB stream', () => {
    const roleCapture = new Capture()
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectEquals({
            Action: 'dynamodb:ListStreams',
            Effect: 'Allow',
            Resource: '*',
          }),
          Match.objectLike({
            Action: Match.arrayWith([
              'dynamodb:DescribeStream',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
            ]),
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': Match.arrayWith([
                Match.stringLikeRegexp('DynamoDBTable'),
                'StreamArn',
              ]),
            },
          }),
        ]),
      }),
      Roles: [ { Ref: roleCapture } ]
    })

    expect(roleCapture.asString().match(/LambdaRole/)).not.toBe(null)
  })

  test('Lambda not running in VPC', () => {
    template.hasResource('AWS::Lambda::Function', {
      Vpc: Match.absent(),
    })
  })
})

describe('S3 tests', () => {
  test('S3 bucket has correct properties', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          {
            ServerSideEncryptionByDefault: Match.objectEquals({
              SSEAlgorithm: 'AES256',
            }),
          },
        ]),
      }),
    })
  })
})

describe('CloudWatch tests', () => {
  test('CloudWatch Alarm created', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 1)
  })

  test('Cloudwatch Alarm for lambda configured with correct metrics', () => {
    const resourceCapture = new Capture()
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      DatapointsToAlarm: 1,
      Dimensions: Match.arrayWith([
        Match.objectLike({
          Name: 'FunctionName',
          Value: Match.objectEquals({
            Ref: resourceCapture,
          }),
        }),
      ]),
      EvaluationPeriods: 1,
      MetricName: 'Duration',
      Period: 300,
      Statistic: 'Maximum',
      Threshold: 60000,
      TreatMissingData: 'ignore',
    })
  })
})
