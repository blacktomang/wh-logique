import type { CSSProperties } from "react";

const rowWidths = [
  ["58%", "78%", "64%", "42%", "72%"],
  ["72%", "62%", "76%", "50%", "68%"],
  ["52%", "86%", "58%", "46%", "74%"],
  ["66%", "70%", "70%", "38%", "64%"],
  ["60%", "82%", "62%", "54%", "70%"],
  ["76%", "66%", "74%", "44%", "66%"],
];

function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`skeleton-shimmer block rounded-md bg-sage-100 ${className}`}
      style={style}
    />
  );
}

export function ItemListSkeleton() {
  return rowWidths.map((widths, rowIndex) => (
    <tr key={rowIndex}>
      {widths.map((width, columnIndex) => (
        <td key={columnIndex} className="px-5 py-5">
          <SkeletonBlock className="h-3.5" style={{ width }} />
        </td>
      ))}
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <SkeletonBlock className="h-10 w-16" />
          <SkeletonBlock className="h-10 w-14" />
          <SkeletonBlock className="h-10 w-18" />
        </div>
      </td>
    </tr>
  ));
}
