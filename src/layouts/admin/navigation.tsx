import type { ReactNode } from "react";
import {
  Layers3,
  Settings,
  LayoutGrid,
} from "lucide-react";

import { getEncryptedRoute } from "@/utils/routeCache";

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

export type AdminNavConfig = {
  home: NavItem[];
  admin: NavItem[];
  masters: NavItem[];
  emMasters: NavItem[];
};

export function getAdminNavigation(): AdminNavConfig {
  const {
    encMasters,
    encContinents,
    encCountries,
    encStates,
    encDistricts,
    encCities,
    encSiteCreation,
    encAdmins,
    encUserType,
    encUserCreation,
    encGroupPermission,
    encPlantCreation,
    encEmMasters,
    encEquipmentType,
    encEquipmentModel,
    encContractor,
    encVehicleSupplier,
    encVehicleRequest,
    encMachineryHire
  } = getEncryptedRoute();

  const home: NavItem[] = [
    { name: "Admin Home", icon: <LayoutGrid size={18} />, path: "/admins" },
  ];

  const admin: NavItem[] = [
    {
      name: "Admin",
      icon: <Settings size={18} />,
      subItems: [
        { name: "User Type", path: `/${encAdmins}/${encUserType}` },
        { name: "User Creation", path: `/${encAdmins}/${encUserCreation}` },
        { name: "Group Permission", path: `/${encAdmins}/${encGroupPermission}` },
      ],
    },
  ];

  const masters: NavItem[] = [
    {
      name: "Masters",
      icon: <Layers3 size={18} />,
      subItems: [
        { name: "Continent", path: `/${encMasters}/${encContinents}` },
        { name: "Country", path: `/${encMasters}/${encCountries}` },
        { name: "State", path: `/${encMasters}/${encStates}` },
        { name: "District", path: `/${encMasters}/${encDistricts}` },
        { name: "City", path: `/${encMasters}/${encCities}` },
        { name: "Site Creation", path: `/${encMasters}/${encSiteCreation}` },
        { name: "Plant Creation", path: `/${encMasters}/${encPlantCreation}`}
      ],
    },
  ];

    const emMasters: NavItem[] = [
    {
      name: "EM Masters",
      icon: <Layers3 size={18} />,
      subItems: [
        { name: "Equipment Type Masters", path: `/${encEmMasters}/${encEquipmentType}` },
        { name: "Equipment Model Masters", path: `/${encEmMasters}/${encEquipmentModel}` },
        { name: "Contractor Masters", path: `/${encEmMasters}/${encContractor}` },
        { name: "Vehicle Supplier Masters", path: `/${encEmMasters}/${encVehicleSupplier}` },
        { name: "Vehicle Request", path: `/${encEmMasters}/${encVehicleRequest}`},
        { name: "Machinery Hire", path: `/${encEmMasters}/${encMachineryHire}`}
      ],
    },
  ];

  return { home, admin, masters, emMasters };
}
