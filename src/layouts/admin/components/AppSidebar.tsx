import { useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useSidebar } from "@/contexts/SideBarContext";
import { decryptSegment } from "@/utils/routeCrypto";
import { getAdminNavigation, type NavItem } from "../navigation";

const menuButtonBase =
  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold";

const AppSidebar: React.FC = () => {
  const { admin, masters } = useMemo(getAdminNavigation, []);
  const { isExpanded, isMobileOpen, setActiveItem, activeItem } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const showFullSidebar = isExpanded || isMobileOpen;

  /* ----------------------------------------
     Helpers
  ---------------------------------------- */
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
    return normalized.startsWith("/admin")
      ? normalized
      : `/admin${normalized}`;
  }, []);

  /* ----------------------------------------
     Decode encrypted route
  ---------------------------------------- */
  const currentDecodedPath = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const startIndex =
      segments[0] === "admin" || segments[0] === "admindashboard" ? 1 : 0;

    return {
      master: decryptSegment(segments[startIndex] ?? "") ?? null,
    };
  }, [location.pathname]);

  /* ----------------------------------------
     Sync sidebar active item
  ---------------------------------------- */
  useEffect(() => {
    if (currentDecodedPath.master === "admins") {
      setActiveItem("admins");
    } else if (
      currentDecodedPath.master === "masters" ||
      currentDecodedPath.master === "em-masters"
    ) {
      // IMPORTANT: EM Masters collapses into Masters context
      setActiveItem("masters");
    } else {
      setActiveItem(null);
    }
  }, [currentDecodedPath.master, setActiveItem]);

  /* ----------------------------------------
     Sidebar sections (EM removed)
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
    ],
    [admin, masters, findPrimaryPath]
  );

  /* ----------------------------------------
     Render
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
              const isActive = activeItem === section.key;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => {
                    setActiveItem(section.key);
                    navigate(withAdminPrefix(section.defaultPath), {
                      replace: true,
                    });
                  }}
                  className={`${menuButtonBase} ${
                    isActive
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
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
