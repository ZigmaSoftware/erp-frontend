import { vehicleRequestApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { VehicleRequestRecord } from "@/types/tanstack/masters";
import { enterpriseQuery } from "../enterpriseQuery";

const queryKey = masterQueryKeys.vehicleRequests;

export function useVehicleRequestsQuery() {
  return enterpriseQuery<VehicleRequestRecord[]>({
    queryKey,
    queryFn: () => vehicleRequestApi.list(),
  });
}
