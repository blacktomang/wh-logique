import type { Location } from "../types/location";
import type { Envelope } from "../types/api";
import { request } from "./client";

export function listLocations(): Promise<Envelope<Location[]>> {
  return request<Location[]>("/locations");
}
