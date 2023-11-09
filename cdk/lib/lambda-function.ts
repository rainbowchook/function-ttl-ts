import * as path from 'node:path'

import { Construct } from "constructs";
import { Role } from "aws-cdk-lib/aws-iam";
import { Function, Runtime, Code, Architecture } from "aws-cdk-lib/aws-lambda";
import { Duration } from 'aws-cdk-lib';

export class LambdaFn extends Construct {
  public readonly lambdaFunction: Function
  constructor(scope: Construct, id: string, resources: {role: Role}) {
    super(scope, id)

    const lambdaFunction = new Function(this, 'Lambda', {
      functionName: 'handle-ttl-lambda',
      runtime: Runtime.PROVIDED_AL2023,
      code: Code.fromAsset(path.join(__dirname, '../cmd/lambda/lambda-main')),
      architecture: Architecture.X86_64,
      handler: '',
      role: resources.role,
      timeout: Duration.seconds(60),
      environment: {}
    })

    this.lambdaFunction = lambdaFunction
  }
}