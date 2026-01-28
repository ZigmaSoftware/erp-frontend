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
    encStaffCreation,
    encAdmins,
    encUserType,
    encUserCreation,
    encStaffUserType,
    encMainScreenType,
    encUserScreenAction,
    encMainScreen,
    encUserScreen,
    encUserScreenPermission,
    encPlantCreation,
    encEmMasters,
    encEquipmentType
  } = getEncryptedRoute();

  const home: NavItem[] = [
    { name: "Admin Home", icon: <LayoutGrid size={18} />, path: "/admins" },
  ];

  const admin: NavItem[] = [
    {
      name: "Admin",
      icon: <Settings size={18} />,
      subItems: [
        { name: "MainScreen Type", path: `/${encAdmins}/${encMainScreenType}` },
        { name: "UserScreen Action", path: `/${encAdmins}/${encUserScreenAction}` },
        { name: "MainScreen", path: `/${encAdmins}/${encMainScreen}` },
        { name: "User Screen", path: `/${encAdmins}/${encUserScreen}` },
        { name: "User Screen Permission", path: `/${encAdmins}/${encUserScreenPermission}` },
        { name: "User Type", path: `/${encAdmins}/${encUserType}` },
        { name: "User Creation", path: `/${encAdmins}/${encUserCreation}` },
        { name: "Staff User Type", path: `/${encAdmins}/${encStaffUserType}` },
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
        { name: "Staff Creation", path: `/${encMasters}/${encStaffCreation}` },
        { name: "Plant Creation", path: `/${encMasters}/${encPlantCreation}`}
      ],
    },
  ];

    const emMasters: NavItem[] = [
    {
      name: "EM Masters",
      icon: <Layers3 size={18} />,
      subItems: [
        { name: "Equipment Type Masters", path: `/${encEmMasters}/${encEquipmentType}` }
      ],
    },
  ];

  return { home, admin, masters, emMasters };
}
