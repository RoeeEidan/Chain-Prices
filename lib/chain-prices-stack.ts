import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Nextjs } from 'cdk-nextjs-standalone';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

const { RPC_URL } = process.env;

if (!RPC_URL) throw new Error('Missing RPC_URL env var');

export class ChainPricesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pricesTable = new Table(this, 'PricesTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'ts', type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const ingestor = new NodejsFunction(this, 'PriceIngestor', {
      entry: join(__dirname, '..', 'lambdas', 'ingestor.ts'),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        RPC_URL: process.env.RPC_URL!,
        PRICES_TABLE_NAME: pricesTable.tableName,
      },
    });

    pricesTable.grantWriteData(ingestor);

    new Rule(this, 'IngestSchedule', {
      schedule: Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new LambdaFunction(ingestor)],
    });

    const nextjs = new Nextjs(this, 'NextjsApp', {
      nextjsPath: './web',
      environment: {
        RPC_URL: process.env.RPC_URL!,
        PRICES_TABLE_NAME: pricesTable.tableName,
      },
    });

    pricesTable.grantReadData(nextjs.serverFunction.lambdaFunction);

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: nextjs.distribution.distributionDomain,
    });

  }
}