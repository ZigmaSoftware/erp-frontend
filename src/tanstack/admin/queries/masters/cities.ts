import { useMemo } from "react";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { CityRecord, CitySelectOption } from "@/types/tanstack/masters";

const queryKey = masterQueryKeys.cities;

export function useCitiesQuery() {
  return enterpriseQuery<CityRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.cities.list(),
  });
}

const normalizeNullable = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

export function useCitiesSelectOptions() {
  const query = useCitiesQuery();

  const selectOptions = useMemo<CitySelectOption[]>(() => {
    if (!query.data) return [];

    return query.data.map((city) => ({
      value: String(city.unique_id),
      label: city.name,
      isActive: city.is_active !== false,
      continentId: normalizeNullable(city.continent_id),
      countryId: normalizeNullable(city.country_id),
      stateId: normalizeNullable(city.state_id),
      districtId: normalizeNullable(city.district_id),
    }));
  }, [query.data]);

  return {
    ...query,
    selectOptions,
  } as const;
}
