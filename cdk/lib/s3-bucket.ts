import { Construct } from 'constructs'
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3'
import { RemovalPolicy } from 'aws-cdk-lib'

export class ResultsS3Bucket extends Construct {
  public readonly s3Bucket
  constructor(scope: Construct, id: string) {
    super(scope, id)
    const bucketName = process.env.S3_BUCKETNAME || 'test-report-bucket-v3'
    const s3Bucket = new Bucket(this, 'ProjectS3Bucket', {
      bucketName,
      eventBridgeEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY, // Use RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE in production
      versioned: false,
      encryption: BucketEncryption.S3_MANAGED,
    })

    this.s3Bucket = s3Bucket
  }
}
