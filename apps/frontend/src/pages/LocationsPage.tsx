import { useLocations } from "../hooks/useLocations";
import { ApiError } from "../api/client";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { EmptyState } from "../components/EmptyState";

export function LocationsPage() {
  const { data, isPending, isError, error } = useLocations();

  if (isPending) return <Spinner />;
  if (isError) {
    return <ErrorAlert message={error instanceof ApiError ? error.message : "Failed to load locations"} />;
  }

  const locations = data?.data ?? [];

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <h1>Locations</h1>
      {locations.length === 0 ? (
        <EmptyState message="No locations found." />
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Code</th>
              <th style={{ textAlign: "left" }}>Zone</th>
              <th style={{ textAlign: "left" }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id}>
                <td>{location.code}</td>
                <td>{location.zone}</td>
                <td>{location.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
