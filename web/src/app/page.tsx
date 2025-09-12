import { getPrices } from '@/lib/getPrices';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// --------- helpers ----------
function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 10 ? 6 : 2 }).format(n);
}
function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 1000) return 'just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default async function Home() {
  const data = await getPrices();;

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="mx-auto max-w-5xl">
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
              <TableHead className="w-[10rem] text-gray-600">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&>tr:nth-child(odd)]:bg-gray-50/60">
            {data.map(({ name, error, price, updated, marketCap }) => {

              if (error || !price || !updated) return (
                <TableRow key={name}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              );

              return (
                <TableRow key={name}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="font-mono text-base tabular-nums">{formatUSD(price)}</TableCell>
                  <TableCell className="font-mono text-base tabular-nums">{marketCap ? formatUSD(marketCap) : '-'}</TableCell>
                  <TableCell className="text-gray-600"><time>{timeAgo(updated)}</time></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}