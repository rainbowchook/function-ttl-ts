# function-ttl-ts

![Deploy CDK](https://github.com/rainbowchook/function-ttl-ts/blob/main/.github/workflows/aws-cdk-lambda.yml/badge.svg)

# Description

This is a CDK project that synthesies a CloudFormation template to provision AWS infrastructure.  

CDK project written in TypeScript - deploys the following stack:

1. DynamoDB table with Time-to-Live (TTL) enabled and DynamoDBStream enabled
2. Lambda function is triggered by the Dynamo event source, filtering for TTL events
3. StreamRead permissions granted to the Lambda execution role
4. CloudWatchAlarm triggered on Lambda function breaching configured timeout
5. PutObject permissions granted to the Lambda execution role
6. S3 bucket where Lambda function puts JSON objects of events that have been processed.

The lambda function is written in TypeScript.
