"server-only";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, NativeAttributeValue } from '@aws-sdk/lib-dynamodb';

export const runtime = 'nodejs';

const { PRICES_TABLE_NAME } = process.env;
if (!PRICES_TABLE_NAME) throw new Error('Missing PRICES_TABLE_NAME');

const ddbDoc = DynamoDBDocumentClient.from(new DynamoDBClient());

const COINS = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  AAVE: 'Aave',
  COMP: 'Compound',
  LINK: 'Chainlink',
  UNI: 'Uniswap',
  SNX: 'Synthetix',
  YFI: 'Yearn Finance',
  USDC: 'USD Coin',
  DAI: 'Dai',
  USDT: 'Tether'
}

type PricePoint = { ts: number; price: number; marketCap?: number };
type CoinSeries = { id: string; name: string; prices: PricePoint[] };

async function getSeriesForId(pk: string, name: string, fromMs: number, toMs: number): Promise<CoinSeries> {
  const prices: PricePoint[] = [];
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined = undefined;
  do {
    const res = await ddbDoc.send(new QueryCommand({
      TableName: PRICES_TABLE_NAME,
      KeyConditionExpression: '#pk = :pk AND #ts BETWEEN :from AND :to',
      ExpressionAttributeNames: { '#pk': 'pk', '#ts': 'ts' },
      ExpressionAttributeValues: { ':pk': pk, ':from': fromMs, ':to': toMs },
      ScanIndexForward: true,
      ExclusiveStartKey,
      ProjectionExpression: '#ts, price, marketCap',
    }));
    for (const item of res.Items ?? []) {
      prices.push({ ts: item.ts as number, price: item.price as number, marketCap: item.marketCap as number | undefined });
    }
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, NativeAttributeValue> | undefined;
  } while (ExclusiveStartKey);
  return { id: pk, name, prices };
}

export async function getPrices(days = 7): Promise<CoinSeries[]> {
  const toMs = Date.now();
  const fromMs = toMs - days * 24 * 60 * 60 * 1000;
  return await Promise.all(
    Object.entries(COINS).map(([pk, name]) => getSeriesForId(pk, name, fromMs, toMs))
  );
}
