import { useLocations } from "../hooks/useLocations";
import { useErrorToast } from "../hooks/useErrorToast";
import { ApiError } from "../api/client";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { formatLabel } from "../utils/format";

export function LocationsPage() {
  const { data, isPending, isError, error } = useLocations();
  useErrorToast(error, "Failed to load locations");

  if (isPending) return <Spinner />;
  if (isError) {
    return <ErrorAlert message={error instanceof ApiError ? error.message : "Failed to load locations"} />;
  }

  const locations = data?.data ?? [];

  return (
    <section>
      <PageHeader
        eyebrow="Warehouse map"
        title="Locations"
        description="A clear view of every storage position, zone, and handling type."
      />
      {locations.length === 0 ? (
        <EmptyState message="No locations yet" description="Locations will appear here once they are added to the warehouse." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-[0_16px_42px_rgb(54_83_66/0.08)]">
          <div className="flex items-center justify-between border-b border-ink-950/8 bg-sage-50/60 px-5 py-4">
            <p className="text-sm font-bold text-ink-800">Storage directory</p>
            <p className="font-mono text-xs font-semibold tabular-nums text-ink-600">{locations.length} {locations.length === 1 ? "LOCATION" : "LOCATIONS"}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-ink-950/10 text-ink-600">
                <tr>
                  {['Location code', 'Zone', 'Storage type'].map((heading) => <th key={heading} className="px-5 py-3.5 text-[0.7rem] font-bold tracking-[0.09em] uppercase">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/7">
                {locations.map((location) => (
                  <tr key={location.id} className="transition-colors hover:bg-sage-50/55">
                    <td className="px-5 py-4"><span className="font-mono text-sm font-bold tabular-nums text-ink-950">{location.code}</span></td>
                    <td className="px-5 py-4"><span className="inline-grid h-8 min-w-8 place-items-center rounded-md bg-amber-400/20 px-2 font-bold text-ink-950 ring-1 ring-amber-400/35">{location.zone}</span></td>
                    <td className="px-5 py-4 font-medium text-ink-800">{formatLabel(location.type)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
