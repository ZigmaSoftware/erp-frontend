import { useMemo } from "react";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { SiteRecord, SiteSelectOption } from "@/types/tanstack/masters";

const normalizeNullable = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

const queryKey = masterQueryKeys.sites;

export function useSitesQuery() {
  return enterpriseQuery<SiteRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.sites.list(),
  });
}

export function useSitesSelectOptions() {
  const query = useSitesQuery();
  const selectOptions = useMemo<SiteSelectOption[]>(() => {
    if (!query.data) return [];

    return query.data.map((site) => ({
      value: String(site.unique_id),
      label: site.site_name ?? String(site.unique_id),
      isActive: site.is_active !== false,
      stateId: normalizeNullable(site.state_id),
      districtId: normalizeNullable(site.district_id),
    }));
  }, [query.data]);

  return {
    ...query,
    selectOptions,
  } as const;
}
