
# Chain Prices Web (Next.js)

This is the Next.js frontend for the Chain Prices project. It displays real-time blockchain price data in a modern web interface, designed to be deployed as a serverless app using AWS services.

## Features

- Displays on-chain price data for multiple blockchains
- Responsive, accessible UI
- Fetches data from serverless backend (see project root for infrastructure)
- Built with Next.js App Router and TypeScript

## Prerequisites

- Node.js (v22 recommended)
- npm (v11 recommended)
- `RPC_URL` environment variable in `.env.local` for API endpoints

## Installing dependencies
	```sh
	npm install
	```

## Running Locally

Start the development server:

```sh
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

To build the app for production:

```sh
npm run build
```

To start the production server:

```sh
npm start
```

## Deployment

This app is designed to be deployed as part of the full Chain Prices stack using AWS CDK. See the main [README](../README.md) for deployment instructions.