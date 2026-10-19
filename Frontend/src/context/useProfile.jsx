import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext.jsx";
import { getProfile, updateProfile } from "../api/profile.jsx";


export default function useProfile({ toForm, toPayload, validate }) {
  const { user } = useAuth();

  const [ profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await getProfile(user.id);
      setProfile(data);
      setForm(toForm(data));
    } catch (err) {
      setLoadError(err.response?.data?.message || "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, toForm]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const startEdit = () => setEditing(true);

  const cancelEdit = () => {
    setForm(toForm(profile));
    setErrors({});
    setEditing(false);
  };

  const save = async (e) => {
    e?.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, toPayload(form));
      setProfile(updated);
      setForm(toForm(updated));
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    form,
    errors,
    editing,
    loading,
    saving,
    loadError,
    reload: load,
    handleChange,
    startEdit,
    cancelEdit,
    save,
  };
}