import { Construct } from "constructs";
import { Effect, ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";

export class LambdaRole extends Construct {
  public readonly role
  constructor(scope: Construct, id: string, resources: { s3Bucket: Bucket }) {
    super(scope, id)

    const role = new Role(this, 'LambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ]
    })

    const customS3Policy = new PolicyStatement({
      sid: 'CustomS3Policy',
      effect: Effect.ALLOW,
      resources: [resources.s3Bucket.bucketArn + '/*'],
      actions: ['s3:PutObject']
    })

    role.attachInlinePolicy(new Policy(this, 'lambdaPolicy', {
      statements: [customS3Policy]
    }))

    this.role = role
  }
}