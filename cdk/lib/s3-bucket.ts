import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

export class ResultsS3Bucket extends Construct {
  public readonly s3Bucket;
  constructor(scope: Construct, id: string) {
    super(scope, id)
    const bucketName = 'report-bucket'
    const s3Bucket = new Bucket(this, 'ProjectS3Bucket', {
      bucketName,
      eventBridgeEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY
    })

    this.s3Bucket = s3Bucket
  }
}