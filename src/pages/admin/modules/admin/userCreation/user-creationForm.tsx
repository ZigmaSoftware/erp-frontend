import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { getEncryptedRoute } from "@/utils/routeCache";
import { Eye, EyeOff } from "lucide-react";
import { userTypeApi, userCreationApi } from "@/helpers/admin";

/* =======================
   ROUTES
   ======================= */
const { encAdmins, encUserCreation } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encUserCreation}`;

const normalizeList = (payload: any) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload?.data?.results ?? [];

/* =======================
   COMPONENT
   ======================= */
export default function UserCreationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------- STATE ---------- */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  const [roles, setRoles] = useState<any[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);

  /* ---------- ROLES ---------- */
  useEffect(() => {
    userTypeApi
      .list()
      .then((res) => {
        setRoles(normalizeList(res));
      })
      .catch((err) => {
        Swal.fire("Error", "Unable to load roles", "error");
        console.error("Role load failed:", err);
      });
  }, []);

  /* ---------- EDIT ---------- */
  useEffect(() => {
    if (!isEdit || !id) return;

    userCreationApi
      .get(id)
      .then((u) => {
        setUsername(u.username ?? "");
        setEmail(u.email ?? "");
        setFirstName(u.first_name ?? "");
        setLastName(u.last_name ?? "");
        setIsActive(Boolean(u.is_active));
        setIsStaff(Boolean(u.is_staff));
      })
      .catch((err) => {
        Swal.fire("Error", "Unable to load user", "error");
        console.error("User load failed:", err);
      });
  }, [id, isEdit]);

  /* ---------- ROLE TOGGLE ---------- */
  const toggleRole = (roleId: string) => {
    setRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!username.trim()) {
      Swal.fire({ icon: "error", title: "Username is required" });
      return;
    }

    if (!isEdit && !password.trim()) {
      Swal.fire({ icon: "error", title: "Password is required" });
      return;
    }

    const payload: any = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      is_staff: isStaff,
      is_active: isActive,
    };

    if (!isEdit) {
      payload.password = password;
      if (roleIds.length > 0) {
        payload.role_ids = roleIds;
      }
    }

    try {
      setLoading(true);
      if (isEdit) {
        if (!id) {
          throw new Error("Missing user id");
        }
        await userCreationApi.update(id, payload);
      } else {
        await userCreationApi.create(payload);
      }

      Swal.fire({ icon: "success", title: "Saved Successfully" });
      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Save failed", text: JSON.stringify(err.response?.data) });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <ComponentCard title={isEdit ? "Edit User" : "Add User"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Username *</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div>
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {!isEdit && (
            <div>
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Status (Active)</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isStaff} onCheckedChange={setIsStaff} />
            <Label>Staff User</Label>
          </div>
        </div>

        <div className="mt-6">
          <Label>Roles</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {roles.length === 0 && (
              <p className="text-sm text-gray-500">No roles available.</p>
            )}
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={roleIds.includes(String(role.id))}
                  onCheckedChange={() => toggleRole(String(role.id))}
                  disabled={isEdit}
                />
                <span>{role.name}</span>
              </label>
            ))}
          </div>
          {isEdit && (
            <p className="text-xs text-gray-500 mt-2">
              Role assignment is available during user creation only.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={() => navigate(ENC_LIST_PATH)} className="bg-red-400 px-4 py-2 text-white rounded">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="bg-green-custom px-4 py-2 text-white rounded">
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}