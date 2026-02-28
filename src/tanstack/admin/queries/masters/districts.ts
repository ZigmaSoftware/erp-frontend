import { useMemo } from "react";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { DistrictRecord, DistrictSelectOption } from "@/types/tanstack/masters";

const queryKey = masterQueryKeys.districts;

export function useDistrictsQuery() {
  return enterpriseQuery<DistrictRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.districts.list(),
  });
}

const normalizeNullable = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

export function useDistrictsSelectOptions() {
  const query = useDistrictsQuery();

  const selectOptions = useMemo<DistrictSelectOption[]>(() => {
    if (!query.data) return [];

    return query.data.map((district) => ({
      value: String(district.unique_id),
      label: district.name,
      isActive: Boolean(district.is_active),
      continentId: normalizeNullable(district.continent_id),
      countryId: normalizeNullable(district.country_id),
      stateId: normalizeNullable(district.state_id),
    }));
  }, [query.data]);

  return {
    ...query,
    selectOptions,
  } as const;
}
