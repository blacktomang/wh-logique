export const LOCATION_ZONES = ["A", "B", "C"] as const;
export type LocationZone = (typeof LOCATION_ZONES)[number];

export const LOCATION_TYPES = [
  "rack",
  "shelf",
  "bin",
  "floor",
  "cold_storage",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export interface Location {
  id: string;
  code: string;
  zone: LocationZone;
  type: LocationType;
}
