import plantsData from "@/data/plants.json";

export type Plant = {
  unique_id: string;
  plantName: string;
  siteName: string;
  is_active: boolean;
};

const STORAGE_KEY = "plants";

export const getPlants = (): Plant[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantsData));
  return plantsData;
};

export const savePlants = (plants: Plant[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
};

export const getPlantById = (id: string): Plant | undefined => {
  return getPlants().find((p) => p.unique_id === id);
};

export const updatePlant = (id: string, data: Partial<Plant>) => {
  const plants = getPlants();
  const updated = plants.map((p) =>
    p.unique_id === id ? { ...p, ...data } : p
  );
  savePlants(updated);
};

export const addPlant = (plant: Plant) => {
  const plants = getPlants();
  savePlants([...plants, plant]);
};
