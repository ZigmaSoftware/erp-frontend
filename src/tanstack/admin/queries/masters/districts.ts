import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { DistrictRecord } from "@/types/tanstack/masters";

const queryKey = masterQueryKeys.districts;

export function useDistrictsQuery() {
  return enterpriseQuery<DistrictRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.districts.list(),
  });
}
