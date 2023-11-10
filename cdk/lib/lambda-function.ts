import * as path from 'node:path'

import { Construct } from "constructs";
import { Role } from "aws-cdk-lib/aws-iam";
import { Function, Runtime, Code, Architecture } from "aws-cdk-lib/aws-lambda";
import { Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';

export class LambdaFn extends Construct {
  public readonly lambdaFunction: Function
  constructor(scope: Construct, id: string, resources: {role: Role, table: ITable}) {
    super(scope, id)

    const lambdaFunction = new Function(this, 'Lambda', {
      functionName: 'handle-ttl-lambda',
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(path.join(__dirname, '../../lambda')),
      handler: 'index.handler',
      // runtime: Runtime.PROVIDED_AL2023,
      // code: Code.fromAsset(path.join(__dirname, '../cmd/lambda/lambda-main')),
      // architecture: Architecture.X86_64,
      // handler: '',
      role: resources.role,
      timeout: Duration.seconds(60),
      environment: {
        DYNAMODB_TABLE_NAME: resources.table.tableName
      }
    })

    this.lambdaFunction = lambdaFunction
  }
}