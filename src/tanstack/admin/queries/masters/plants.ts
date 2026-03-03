import { useMemo } from "react";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { PlantRecord, PlantSelectOption } from "@/types/tanstack/masters";

const normalizeNullable = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

const queryKey = masterQueryKeys.plants;

export function usePlantsQuery() {
  return enterpriseQuery<PlantRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.plants.list(),
  });
}

export function usePlantsSelectOptions() {
  const query = usePlantsQuery();

  const selectOptions = useMemo<PlantSelectOption[]>(() => {
    if (!query.data) return [];
    return query.data.map((plant) => ({
      value: String(plant.unique_id),
      label: plant.plant_name ?? String(plant.unique_id),
      isActive: plant.is_active !== false,
      siteId: normalizeNullable(plant.site_id),
    }));
  }, [query.data]);

  return {
    ...query,
    selectOptions,
  } as const;
}
