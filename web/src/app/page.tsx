import { getPrices } from '@/lib/getPrices';
import { SparkLine } from '@/components/SparkLine';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// --------- helpers ----------
function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 10 ? 8 : 2 }).format(n);
}
function formatPct(n: number) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}
function percentChange(points: { price: number }[]) {
  if (!points.length) return undefined;
  const first = points[0].price;
  const last = points[points.length - 1].price;
  if (!first || !isFinite(first)) return undefined;
  return ((last - first) / first) * 100;
}
function timeAgo(timestamp: number) {
  const ms = Date.now() - timestamp;
  if (ms < 1000) return 'just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default async function Home() {
  const data = await getPrices();
  return (
    <main className="min-h-screen px-6 py-20">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">On-chain Prices</h1>
        </div>
      </header>

      <Table className="min-w-full table-fixed text-sm">
        <TableHeader className="sticky top-0 bg-white/80 backdrop-blur">
          <TableRow className="text-left">
            <TableHead className="w-[14rem] text-gray-600">Name</TableHead>
            <TableHead className="w-[12rem] text-gray-600">Price (USD)</TableHead>
            <TableHead className="w-[14rem] text-gray-600">Market Cap (USD)</TableHead>
            <TableHead className="w-[8rem] text-gray-600">1h %</TableHead>
            <TableHead className="w-[8rem] text-gray-600">24h %</TableHead>
            <TableHead className="w-[8rem] text-gray-600">7d %</TableHead>
            <TableHead className="w-[12rem] text-gray-600">7d</TableHead>
            <TableHead className="w-[10rem] text-gray-600">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&>tr:nth-child(odd)]:bg-gray-50/60">
          {data.map(({ id, name, prices }) => {

            if (!prices.length) {
              return (
                <TableRow key={id}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell><div className="h-10 w-40 text-gray-400">-</div></TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              );
            }
            const last = prices[prices.length - 1];
            const { price, ts, marketCap } = last;
            const now = Date.now();
            const hourMs = 60 * 60 * 1000;
            const dayMs = 24 * 60 * 60 * 1000;
            const last1h = prices.filter(p => p.ts >= now - hourMs);
            const last24 = prices.filter(p => p.ts >= now - dayMs);
            const pct1h = percentChange(last1h);
            const pct24 = percentChange(last24);
            const pct7 = percentChange(prices);

            return (
              <TableRow key={id}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell className="font-mono text-base tabular-nums">{formatUSD(price)}</TableCell>
                <TableCell className="font-mono text-base tabular-nums">{typeof marketCap === 'number' ? formatUSD(marketCap) : '-'}</TableCell>
                <TableCell className={pct1h == null ? '' : pct1h >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {pct1h == null ? '-' : formatPct(pct1h)}
                </TableCell>
                <TableCell className={pct24 == null ? '' : pct24 >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {pct24 == null ? '-' : formatPct(pct24)}
                </TableCell>
                <TableCell className={pct7 == null ? '' : pct7 >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {pct7 == null ? '-' : formatPct(pct7)}
                </TableCell>
                <TableCell>
                  <SparkLine points={prices} />
                </TableCell>
                <TableCell className="text-gray-600"><time>{timeAgo(ts)}</time></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </main>
  );
}
