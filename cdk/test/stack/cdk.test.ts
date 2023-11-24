import * as cdk from 'aws-cdk-lib'
import { Capture, Match, Template } from 'aws-cdk-lib/assertions'
import * as Cdk from '../../lib/cdk-stack'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
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

  //Fine-grained testing
  test('Specified resources created', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 1)
    template.resourceCountIs('AWS::S3::Bucket', 1)
    template.resourcePropertiesCountIs(
      'AWS::Lambda::Function',
      { Runtime: Runtime.NODEJS_16_X.name, Environment: Match.anyValue() },
      1
    )

    template.hasResourceProperties('AWS::DynamoDB::Table', {})
    template.hasResourceProperties('AWS::S3::Bucket', {})
    template.hasResourceProperties('Custom::S3BucketNotifications', {})
    template.hasResourceProperties('AWS::IAM::Role', {})
    template.hasResourceProperties('AWS::IAM::Policy', {})
    template.hasResourceProperties('AWS::Lambda::Function', {})
    template.hasResourceProperties('Custom::LogRetention', {})
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {})
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
    console.log(template.findResources('AWS::DynamoDB::Table', {}))

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

  test('Lambda function execution role has correct IAM permissions', () => {
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

  test('Lambda has correct event source mapping', () => {
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

  test('Lambda not running in VPC', () => {
    template.hasResource('AWS::Lambda::Function', {
      Vpc: Match.absent(),
    })
  })
})

describe('S3 tests', () => {})

describe('CloudWatch tests', () => {})
