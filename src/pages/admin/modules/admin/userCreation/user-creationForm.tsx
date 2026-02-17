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

import type { UserType } from "../types/admin.types";
import { userTypeApi, userCreationApi } from "@/helpers/admin";

/* ================= ROUTES ================= */
const { encAdmins, encUserCreation } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encUserCreation}`;

/* ================= HELPERS ================= */
const normalizeList = (payload: any) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload?.data?.results ?? [];

/* ================= COMPONENT ================= */
export default function UserCreationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ---------- FORM STATE ---------- */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  const [roles, setRoles] = useState<UserType[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);

  /* ================= LOAD ROLES ================= */
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await userTypeApi.list();
        setRoles(normalizeList(res));
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Unable to load roles", "error");
      }
    };

    loadRoles();
  }, []);

  /* ================= LOAD USER (EDIT) ================= */
  useEffect(() => {
    if (!isEdit || !id) return;

    const loadUser = async () => {
      try {
        const u = await userCreationApi.get(id);

        setUsername(u.username ?? "");
        setEmail(u.email ?? "");
        setFirstName(u.first_name ?? "");
        setLastName(u.last_name ?? "");
        setIsActive(Boolean(u.is_active));
        setIsStaff(Boolean(u.is_staff));

        // If backend returns role_ids or roles
        if (u.role_ids) {
          setRoleIds(u.role_ids.map(String));
        } else if (u.roles) {
          setRoleIds(u.roles.map((r: any) => String(r.id)));
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Unable to load user", "error");
      }
    };

    loadUser();
  }, [id, isEdit]);

  /* ================= ROLE TOGGLE ================= */
  const toggleRole = (roleId: string) => {
    setRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!username.trim()) {
      Swal.fire("Validation Error", "Username is required", "error");
      return false;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      Swal.fire("Validation Error", "Invalid email format", "error");
      return false;
    }

    if (!isEdit && !password.trim()) {
      Swal.fire("Validation Error", "Password is required", "error");
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      payload.role_ids = roleIds;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        await userCreationApi.update(id, payload);
      } else {
        await userCreationApi.create(payload);
      }

      await Swal.fire({
        icon: "success",
        title: isEdit ? "User Updated" : "User Created",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Something went wrong";

      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <ComponentCard title={isEdit ? "Edit User" : "Add User"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div>
            <Label>Username *</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* First Name */}
          <div>
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div>
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Password (Create only) */}
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
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Status (Active)</Label>
          </div>

          {/* Staff */}
          <div className="flex items-center gap-3">
            <Switch checked={isStaff} onCheckedChange={setIsStaff} />
            <Label>Staff User</Label>
          </div>
        </div>

        {/* Roles */}
        <div className="mt-6">
          <Label>Roles</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {roles.length === 0 && (
              <p className="text-sm text-gray-500">No roles available.</p>
            )}

            {roles.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={roleIds.includes(String(role.id))}
                  onCheckedChange={() => toggleRole(String(role.id))}
                />
                <span>{role.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 px-4 py-2 text-white rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom px-4 py-2 text-white rounded"
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Update"
              : "Save"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
