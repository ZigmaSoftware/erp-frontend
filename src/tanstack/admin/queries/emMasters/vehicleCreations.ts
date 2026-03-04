import { vehicleCreationApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { VehicleCreationRecord } from "@/types/tanstack/masters";
import { enterpriseQuery } from "../enterpriseQuery";

const queryKey = masterQueryKeys.vehicleCreations;

export function useVehicleCreationsQuery() {
  return enterpriseQuery<VehicleCreationRecord[]>({
    queryKey,
    queryFn: () => vehicleCreationApi.list(),
  });
}
