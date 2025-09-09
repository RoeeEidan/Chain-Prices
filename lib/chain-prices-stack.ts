import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Nextjs } from 'cdk-nextjs-standalone';

const { RPC_URL } = process.env;

if (!RPC_URL) throw new Error('Missing RPC_URL env var');
export class ChainPricesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nextjs = new Nextjs(this, 'NextjsApp', {
      nextjsPath: './web',
      environment: {
        RPC_URL: process.env.RPC_URL!
      },
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: nextjs.distribution.distributionDomain,
    });

  }
}