import { useMemo } from "react";
import { equipmentTypeApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type {
  EquipmentTypeRecord,
  EquipmentTypeSelectOption,
} from "@/types/tanstack/masters";
import { enterpriseQuery } from "../enterpriseQuery";

const queryKey = masterQueryKeys.equipmentTypes;

export function useEquipmentTypesQuery() {
  return enterpriseQuery<EquipmentTypeRecord[]>({
    queryKey,
    queryFn: () => equipmentTypeApi.list(),
  });
}

export function useEquipmentTypesSelectOptions() {
  const query = useEquipmentTypesQuery();

  const selectOptions = useMemo<EquipmentTypeSelectOption[]>(() => {
    if (!query.data) return [];

    return query.data.map((record) => ({
      value: String(record.unique_id),
      label: record.name ?? record.equipment_type_name ?? "Unknown",
      isActive: record.is_active !== false,
    }));
  }, [query.data]);

  return {
    ...query,
    selectOptions,
  } as const;
}
