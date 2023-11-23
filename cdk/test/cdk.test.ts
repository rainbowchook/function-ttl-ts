import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as Cdk from '../lib/cdk-stack'

// Snapshot testing
test('Resources created', () => {
  // Instantiate the cdk app
  const app = new cdk.App()

  // create stack
  const stack = new Cdk.FunctionTTLProcessingStack(app, 'CdkLambdaStack')

  // prepare the stack for assertions
  const template = Template.fromStack(stack)

  // match with snapshot
  expect(template.toJSON()).toMatchSnapshot()
})

//Fine-grained testing
test('Empty Stack', () => {
  const app = new cdk.App()
  // WHEN
  const stack = new Cdk.FunctionTTLProcessingStack(app, 'MyTestStack')
  // THEN
  const template = Template.fromStack(stack)

  template.hasResourceProperties('AWS::DynamoDB::Table', {})
  template.hasResourceProperties('AWS::S3::Bucket', {})
  template.hasResourceProperties('Custom::S3BucketNotifications', {})
  template.hasResourceProperties('AWS::IAM::Role', {})
  template.hasResourceProperties('AWS::IAM::Policy', {})
  template.hasResourceProperties('AWS::Lambda::Function', {})
  template.hasResourceProperties('Custom::LogRetention', {})
  template.hasResourceProperties('AWS::CloudWatch::Alarm', {})
  template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
    FilterCriteria: {
      Filters: [
        {
          Pattern: //use Math.serializedJson()
            '{"userIdentity":{"type":["service"],"principalId":["dynamodb.amazonaws.com"]}}',
        },
      ],
    },
  })

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true,
    },
  })
})
