# DynamoDB Lambda S3 Data Archival

![Deploy CDK](https://github.com/rainbowchook/function-ttl-ts/actions/workflows/aws-cdk-lambda.yml/badge.svg)

<!--BEGIN STABILITY BANNER-->
---

![Stability: Stable](https://img.shields.io/badge/stability-Stable-success.svg?style=for-the-badge)

> **This is a stable example. It should successfully build out of the box**
>
> This example is built on Construct Libraries marked "Stable" and does not have any infrastructure prerequisites to build.
---
<!--END STABILITY BANNER-->

# Description

This project is intended to be sample code only.  Not for use in production.

DynamoDB items will be archived to an S3 bucket.  The Lambda function is triggered by DynamoDB TTL events and puts expired items into the S3 bucket as JSON objects.

This CDK project will deploy the following stack to your AWS cloud environment:

- DynamoDB table with TTL attribute configured
- S3 Bucket
- Lambda function triggered by the Dynamo event source, filtering for TTL events to put as JSON objects in the S3 bucket.
- Lambda execution role with policies for CloudWatch log access, and DynamoDB stream read permissions and S3 PutObject permissions granted.
- CloudWatch Alarm

# Requirements


# Build

Build the app from the project root folder in `/cdk` by using `cd cdk`.  Run the following to install AWS CDK, project dependencies and build TypeScript files:

```
npm install -g aws-cdk
npm install
npm run build
```

# Synthesise CloudFormation Template


# Deploy


# References

[Archiving DynamoDB TTL Items with Streams and Lambda](https://medium.com/@leeroy.hannigan/archiving-dynamodb-ttl-items-with-streams-and-lambda-17a8a4c20151)
[Automatically Archive Items to S3 Using DynamoDB Time to Live (TTL) with AWS Lambda and Amazon Kinesis Firehose](https://aws.amazon.com/blogs/database/automatically-archive-items-to-s3-using-dynamodb-time-to-live-with-aws-lambda-and-amazon-kinesis-firehose/)
[Working With Read and Write Operations > DynamoDB API > Working with Items](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html)
[Using DynamoDB Time-to-Live (TTL)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html)
[DynamoDB Streams and Time to Live](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-streams.html)
