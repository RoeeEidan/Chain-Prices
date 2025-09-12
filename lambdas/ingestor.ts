import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Contract, JsonRpcProvider, formatUnits } from 'ethers';

const { RPC_URL, PRICES_TABLE_NAME } = process.env;

if (!RPC_URL) throw new Error('Missing RPC_URL');
if (!PRICES_TABLE_NAME) throw new Error('Missing PRICES_TABLE_NAME');

const ddbDoc = DynamoDBDocumentClient.from(new DynamoDBClient());
const provider = new JsonRpcProvider(RPC_URL);

const PRICE_FEED_ABI = [
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const ERC20_ABI = [
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];

type Address = `0x${string}`;
const COINS: Record<string, { feed: Address; erc20?: Address }> = {
  BTC: { feed: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c' },
  ETH: { feed: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419' },
  AAVE: { feed: '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9', erc20: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
  COMP: { feed: '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5', erc20: '0xc00e94Cb662C3520282E6f5717214004A7f26888' },
  LINK: { feed: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c', erc20: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
  UNI:  { feed: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e', erc20: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
  SNX:  { feed: '0xdc3ea94cd0ac27d9a86c180091e7f78c683d3699', erc20: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F' },
  YFI:  { feed: '0x7c5d4f8345e66f68099581db340cd65b078c41f4', erc20: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e' },
  USDC: { feed: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', erc20: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  DAI:  { feed: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9', erc20: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  USDT: { feed: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D', erc20: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
};

export const handler = async () => {
  console.log('Starting price ingestion');

  const items: Array<{ pk: string, ts: number, price: number, marketCap?: number }> = [];

  for (const [id, { feed: priceFeed, erc20 }] of Object.entries(COINS)) {
    try {
      console.log('Fetching', id, priceFeed);
      const feed = new Contract(priceFeed, PRICE_FEED_ABI, provider);
      const [tuple, decs] = await Promise.all([feed.latestRoundData(), feed.decimals()]);
      const [, answer, , updatedAt] = tuple as [unknown, bigint, unknown, bigint, unknown];
      const decimals = Number(decs);
      const price = Number(answer) / 10 ** decimals;
      const ts = Number(updatedAt) * 1000; // milliseconds to match UI expectations
      if (!Number.isFinite(price) || ts <= 0) continue;
      let marketCap: number | undefined = undefined;
      if (erc20) {
        try {
          const token = new Contract(erc20, ERC20_ABI, provider);
          const [supply, tokenDecs] = await Promise.all([token.totalSupply(), token.decimals()]);
          const supplyNum = parseFloat(formatUnits(supply, Number(tokenDecs)));
          marketCap = supplyNum * price;
        } catch (e) {
          console.error('Failed to fetch supply for', id, e);
        }
      }
      items.push({ pk: id, ts, price, marketCap });
      console.log('Fetched', id, price, ts);
    } catch (e) {
      console.error('Failed to fetch', id, e);
    }
  }

  if (items.length === 0) return;

  const chunks: Array<typeof items> = [];
  for (let i = 0; i < items.length; i += 25) chunks.push(items.slice(i, i + 25));

  for (const chunk of chunks) {
    const res = await ddbDoc.send(new BatchWriteCommand({
      RequestItems: {
        [PRICES_TABLE_NAME!]: chunk.map((Item) => ({ PutRequest: { Item } }))
      }
    }));
    const unprocessed = res.UnprocessedItems?.[PRICES_TABLE_NAME!];
    if (unprocessed && unprocessed.length > 0) {
      console.error(`DynamoDB batch write had ${unprocessed.length} unprocessed items`);
    }
  }

  console.log('Price ingestion complete');
};
