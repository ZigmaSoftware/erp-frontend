import api from "@/api";

export type PaginatedResult<T> = {
  count: number;
  page: number;
  total_pages: number;
  results: T[];
};

export const continentApi = {
  listPaginated: async (
    page = 1,
    limit = 5
  ): Promise<PaginatedResult<any>> => {
    const { data } = await api.get(
      `/masters/continents/?page=${page}&limit=${limit}`
    );
    return data;
  },

  update: (id: string, payload: any) =>
    api.patch(`/masters/continents/${id}/`, payload),

  remove: (id: string) =>
    api.delete(`/masters/continents/${id}/`)
};
