import { useQuery } from "@tanstack/react-query";
import { listLocations } from "../api/locations";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"] as const,
    queryFn: listLocations,
  });
}
