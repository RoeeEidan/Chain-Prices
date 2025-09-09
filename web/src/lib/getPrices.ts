"server-only"

import { JsonRpcProvider, Contract } from 'ethers';
export const runtime = 'nodejs';

const RPC = process.env.RPC_URL!;

const ABI = [
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
]

const FEEDS: Record<string, { address: `0x${string}`, name: string }> = {
    'ETH': {
        address: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419',
        name: 'Ethereum'
    },
    'BTC': {
        address: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
        name: 'Bitcoin'
    },
    'LINK': {
        address: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
        name: 'Chainlink'
    },
    'UNI': {
        address: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
        name: 'Uniswap'
    },
    'AAVE': {
        address: '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9',
        name: 'Aave'
    },
    'COMP': {
        address: '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5',
        name: 'Compound'
    },
    'SNX': {
        address: '0xdc3ea94cd0ac27d9a86c180091e7f78c683d3699',
        name: 'Synthetix'
    },
    'YFI': {
        address: '0x7c5d4f8345e66f68099581db340cd65b078c41f4',
        name: 'Yearn Finance'
    },
    'USDC': {
        address: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
        name: 'USD Coin'
    },
    'DAI': {
        address: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
        name: 'Dai'
    },
    'USDT': {
        address: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
        name: 'Tether'
    },
};

const provider = new JsonRpcProvider(RPC);

type PriceOk = {
    name: string;
    price: number;
    updated: string;
};
type PriceErr = {
    name: string;
    error: string
};

export async function getPrices(): Promise<Record<string, PriceOk | PriceErr>> {
    const entries = await Promise.all(
        Object.entries(FEEDS).map(async ([key, { address, name }]) => {
            try {
                const feed = new Contract(address, ABI, provider);
                const [tuple, decs] = await Promise.all([feed.latestRoundData(), feed.decimals()]);
                const [_, answer, , updatedAt] = tuple as [bigint, bigint, bigint, bigint, bigint];
                if (answer <= BigInt(0)) throw new Error(`${key}: non-positive answer`);
                const decimals = Number(decs);
                const price = Number(answer) / 10 ** decimals;
                const updated = new Date(Number(updatedAt) * 1000).toISOString();
                return [key, { name, price, updated }]
            } catch (e) {
                return [key, { name, error: 'Failed to load price data' }]
            }
        })
    );
    return Object.fromEntries(entries);
}
