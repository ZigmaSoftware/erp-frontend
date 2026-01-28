import { useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useSidebar } from "@/contexts/SideBarContext";
import { decryptSegment } from "@/utils/routeCrypto";
import { getAdminNavigation, type NavItem } from "../navigation";

const menuButtonBase =
  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold";

const AppSidebar: React.FC = () => {
  const { admin, masters, emMasters } = useMemo(getAdminNavigation, []);
  const findPrimaryPath = useCallback((items: NavItem[]) => {
    for (const item of items) {
      if (item.path) return item.path;
      if (item.subItems?.length) return item.subItems[0]?.path;
    }
    return null;
  }, []);

  const withAdminPrefix = useCallback((path: string | null) => {
    if (!path) return "/admin";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized.startsWith("/admin") ? normalized : `/admin${normalized}`;
  }, []);

  const { isExpanded, isMobileOpen, setActiveItem, activeItem } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const showFullSidebar = isExpanded || isMobileOpen;

  /* ----------------------------------------
     Decode current encrypted route
  ---------------------------------------- */
  const currentDecodedPath = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);

    // Drop optional leading prefixes
    const startIndex =
      segments[0] === "admin" || segments[0] === "admindashboard" ? 1 : 0;

    const encMaster = segments[startIndex] ?? "";
    const encModule = segments[startIndex + 1] ?? "";

    return {
      master: decryptSegment(encMaster) ?? null,
      module: decryptSegment(encModule) ?? null,
    };
  }, [location.pathname]);

  /* ----------------------------------------
     Active path matcher (sub-item level)
  ---------------------------------------- */
  const isActive = useCallback(
    (path: string, allowNestedRoutes = false) => {
      if (!path) return false;

      const segments = path.split("/").filter(Boolean);
      const [encMaster, encModule] = segments;

      const decodedMaster = decryptSegment(encMaster || "");
      const decodedModule = decryptSegment(encModule || "");

      // fallback for non-encrypted routes
      if (!decodedMaster && !decodedModule) {
        if (location.pathname === path) return true;
        return (
          allowNestedRoutes &&
          location.pathname.startsWith(path.endsWith("/") ? path : `${path}/`)
        );
      }

      if (decodedMaster !== currentDecodedPath.master) return false;
      if (!decodedModule) return true;

      if (currentDecodedPath.module === decodedModule) return true;
      return (
        allowNestedRoutes &&
        currentDecodedPath.module?.startsWith(decodedModule)
      );
    },
    [currentDecodedPath, location.pathname]
  );

  /* ----------------------------------------
     Sync active section with URL
  ---------------------------------------- */
  useEffect(() => {
    const segments = location.pathname.split("/").filter(Boolean);

    // Handle non-encrypted dashboard landing routes
    if (segments[0] === "admindashboard") {
      if (segments[1] === "admins") {
        setActiveItem("admins");
        return;
      }
      if (segments[1] === "masters") {
        setActiveItem("masters");
        return;
      }
      if (segments[1] === "em-masters") {
        setActiveItem("em-masters");
        return;
      }
    }

    if (currentDecodedPath.master === "admins") {
      setActiveItem("admins");
    } else if (currentDecodedPath.master === "masters") {
      setActiveItem("masters");
    } else if (currentDecodedPath.master === "em-masters") {
      setActiveItem("em-masters");
    } else {
      setActiveItem(null);
    }
  }, [currentDecodedPath.master, location.pathname, setActiveItem]);

  /* ----------------------------------------
     Sections
  ---------------------------------------- */
  const sections = useMemo(
    () => [
      {
        key: "admins",
        label: "Admin",
        items: admin,
        defaultPath: findPrimaryPath(admin),
      },
      {
        key: "masters",
        label: "Masters",
        items: masters,
        defaultPath: findPrimaryPath(masters),
      },
      {
        key: "em-masters",
        label: "EM Masters",
        items: emMasters,
        defaultPath: findPrimaryPath(emMasters),
      },
    ],
    [admin, masters, emMasters, findPrimaryPath]
  );


  /* ----------------------------------------
     Layout (NO SHADOW)
  ---------------------------------------- */
  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen border-r border-[var(--admin-border)]/80
        bg-[var(--admin-surfaceAlt)]/95 text-[var(--admin-text)]
        backdrop-blur-2xl transition-all duration-300 ease-out
        ${showFullSidebar ? "w-[300px]" : "w-[140px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="flex h-full flex-col px-4 pb-6 pt-6">
        <div className="mt-[70px] flex-1 overflow-y-auto pr-2 no-scrollbar">
          <nav className="flex flex-col gap-2">
            {sections.map((section) => {
              const isSectionActive =
                activeItem === section.key ||
                section.items.some((item) =>
                  item.subItems?.some((sub) => isActive(sub.path, true))
                );

              return (
                <div key={section.key}>
                  {/* <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-mutedText)]">
                    {section.label}
                  </p> */}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveItem(section.key);
                      const target = withAdminPrefix(section.defaultPath);

                      navigate(target, { replace: true });
                    }}
                    className={`${menuButtonBase} ${
                      isSectionActive
                        ? "bg-[var(--admin-primarySoft)]/80 text-[var(--admin-primary)]"
                        : "text-[var(--admin-mutedText)] hover:bg-[var(--admin-surfaceMuted)]/80 hover:text-[var(--admin-primary)]"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        !showFullSidebar ? "mx-auto" : ""
                      }`}
                    >
                      {section.items[0]?.icon}
                    </span>

                    {showFullSidebar && (
                      <span className="text-sm font-semibold">
                        {section.label}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
