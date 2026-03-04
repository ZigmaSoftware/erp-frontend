import { equipmentModelApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { EquipmentModelRecord } from "@/types/tanstack/masters";
import { enterpriseQuery } from "../enterpriseQuery";

const queryKey = masterQueryKeys.equipmentModels;

export function useEquipmentModelsQuery() {
  return enterpriseQuery<EquipmentModelRecord[]>({
    queryKey,
    queryFn: () => equipmentModelApi.list(),
  });
}
