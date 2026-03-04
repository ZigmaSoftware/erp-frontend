import { vehicleSupplierApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { VehicleSupplierRecord } from "@/types/tanstack/masters";
import { enterpriseQuery } from "../enterpriseQuery";

const queryKey = masterQueryKeys.vehicleSuppliers;

export function useVehicleSuppliersQuery() {
  return enterpriseQuery<VehicleSupplierRecord[]>({
    queryKey,
    queryFn: () => vehicleSupplierApi.list(),
  });
}
