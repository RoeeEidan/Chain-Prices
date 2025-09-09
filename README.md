# Chain Prices: CDK + Next.js

Chain Prices is a full-stack project that combines AWS CDK (Cloud Development Kit) for infrastructure-as-code with a Next.js web application. The project is designed to deploy a serverless web app that displays blockchain price data, leveraging AWS services for scalability and reliability.

## Project Structure

- **bin/**: Entry point for the CDK app.
- **lib/**: CDK stack definitions and infrastructure code.
- **web/**: Next.js application source code and documentation.
- **cdk.json**: CDK configuration.
- **package.json**: Project dependencies and scripts.

## Prerequisites

- Node.js (v22 recommended)
- npm  (v11 recommended)
- AWS CLI configured with appropriate credentials
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) installed globally (`npm install -g aws-cdk`)

## Setup

1. **Install dependencies:**
	 ```sh
	 npm install
	 ```

2. **Configure environment variables:**
	 - Create a `.env` file with a RPC_URL (e.g https://eth-mainnet.g.alchemy.com/v2/<API_KEY>)


## Deployment

To deploy the full stack to AWS:

1. **Bootstrap your AWS environment (if not done before):**
	 ```sh
	 npx cdk bootstrap
	 ```

2. **Deploy the stack:**
	 ```sh
	 npx cdk deploy
	 ```

This will provision all required AWS resources and deploy the Next.js app.