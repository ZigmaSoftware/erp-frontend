import { Navigate, Route, Routes } from "react-router-dom";

import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import AdminHome from "@/pages/admin/AdminHome";
import AdminEncryptedRouter from "@/layouts/admin/encryptedRouting/AdminEncryptedRouter";

import { AdminLayout } from "@/layouts/admin/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ADMIN_ROLE } from "@/types/roles";

export default function App() {
  const withAdmin = (children: React.ReactNode) => (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Navigate to="/admindashboard" replace />} />
      <Route path="/admindashboard" element={withAdmin(<AdminHome />)} />
      <Route path="/admindashboard/admins" element={withAdmin(<AdminHome />)} />
      <Route path="/admindashboard/masters" element={withAdmin(<AdminHome />)} />

      <Route path="/:encMaster/:encModule" element={withAdmin(<AdminEncryptedRouter />)} />
      <Route path="/:encMaster/:encModule/new" element={withAdmin(<AdminEncryptedRouter />)} />
      <Route path="/:encMaster/:encModule/:id/edit" element={withAdmin(<AdminEncryptedRouter />)} />
      <Route path="/admin/:encMaster/:encModule" element={withAdmin(<AdminEncryptedRouter />)} />
      <Route path="/admin/:encMaster/:encModule/new" element={withAdmin(<AdminEncryptedRouter />)} />
      <Route path="/admin/:encMaster/:encModule/:id/edit" element={withAdmin(<AdminEncryptedRouter />)} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
