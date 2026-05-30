/** Muted placeholder shown in a chart card when there's no data yet. */
export function ChartEmpty({ message, height = 200 }: { message: string; height?: number }) {
  return (
    <div
      className="text-muted flex items-center justify-center text-center text-sm"
      style={{ height }}
    >
      {message}
    </div>
  );
}
