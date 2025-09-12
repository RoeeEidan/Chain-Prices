"use client";

import { useRef, useState, useId } from "react";

type Point = { ts: number; price: number };

function sample(points: Point[], max = 120): Point[] {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  const out: Point[] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  // ensure last point included
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out;
}

function formatUSD(n: number) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 10 ? 6 : 2 }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function SparkLine({
  points,
  width = 160,
  height = 40,
  strokeWidth = 2,
  hoverable = true,
}: {
  points: Point[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  hoverable?: boolean;
}) {
  // Hover state
  const [idx, setIdx] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);

  const gradientId = useId();

  const data = sample(points);

  if (!data || data.length === 0) return <div className="h-10 w-40 text-gray-400">-</div>;

  // Determine color based on trend
  const first = data[0].price;
  const last = data[data.length - 1].price;
  const isUp = last >= first;
  const colorClass = isUp ? 'text-green-700' : 'text-red-700';

  const min = Math.min(...data.map(p => p.price));
  const max = Math.max(...data.map(p => p.price));
  const range = max - min || 1;
  const n = data.length;

  const coords = data.map((p, i) => {
    const x = (i / (n - 1)) * (width - 2) + 1; // 1px padding
    const y = height - 1 - ((p.price - min) / range) * (height - 2);
    return [x, y] as const;
  });

  const d = coords
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`))
    .join(' ');

  const areaPath = `${d} L ${width - 1} ${height - 1} L 1 ${height - 1} Z`;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!hoverable || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, (x - 1) / (width - 2)));
    const i = Math.round(ratio * (n - 1));
    setIdx(i);
  }
  function onLeave() { setIdx(null); }

  const marker = idx != null ? coords[idx] : null;
  const point = idx != null ? data[idx] : null;



  return (
    <div className={`relative cursor-pointer ${colorClass}`} style={{ width, height }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="overflow-visible"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
        {marker && (
          <g>
            <line x1={marker[0]} x2={marker[0]} y1={0} y2={height} className="stroke-slate-400" strokeDasharray="2 3" />
            <circle cx={marker[0]} cy={marker[1]} r={3} fill="currentColor" />
          </g>
        )}
      </svg>
      {hoverable && point && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded bg-white px-2 py-1 text-xs shadow ring-1 ring-black/5"
          style={{ left: marker![0], top: 0 }}
        >
          <div className="font-medium tabular-nums">{formatUSD(point.price)}</div>
          <div className="text-gray-500">
            {new Date(point.ts).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}
    </div>
  );
}
