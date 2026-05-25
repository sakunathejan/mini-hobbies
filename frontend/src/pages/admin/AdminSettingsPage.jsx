import { Eye, EyeOff, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Seo from "../../components/Seo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { updateAdminProfile } from "../../services/authService.js";
import { getAllSettings, updateSetting } from "../../services/settingService.js";

const AdminSettingsPage = () => {
  const { admin, refreshAdmin } = useAuth();
  const [profile, setProfile] = useState({ name: "", email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ freeShipping: false });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (admin) {
      setProfile((prev) => ({ ...prev, name: admin.name || "", email: admin.email || "" }));
    }
  }, [admin]);

  useEffect(() => {
    getAllSettings()
      .then(setSettings)
      .catch(() => toast.error("Failed to load settings."));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profile.newPassword && profile.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const payload = {};
      if (profile.name) payload.name = profile.name;
      if (profile.email && profile.email !== admin.email) payload.email = profile.email;
      if (profile.currentPassword && profile.newPassword) {
        payload.currentPassword = profile.currentPassword;
        payload.newPassword = profile.newPassword;
      }
      const res = await updateAdminProfile(payload);
      localStorage.setItem("mini_hobbies_admin_token", res.token);
      refreshAdmin(res.user);
      setProfile((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsLoading(true);
    try {
      await updateSetting(key, value);
      toast.success("Free Shipping updated.");
    } catch {
      toast.error("Failed to update setting.");
      setSettings((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <>
      <Seo title="Settings" description="Admin settings" />
      <div className="grid gap-8">
        <h1 className="text-2xl font-black">Settings</h1>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-2 text-lg font-bold">
            <Settings className="h-5 w-5" /> Profile
          </div>
          <form onSubmit={handleProfileSubmit} className="grid max-w-lg gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Name</label>
              <input className="input text-base" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
              <input className="input text-base" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <hr className="my-2" />
            <p className="text-sm text-gray-500">Leave password fields empty to keep current password.</p>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Current Password</label>
              <div className="relative">
                <input className="input w-full pr-10 text-base" type={showCurrent ? "text" : "password"} value={profile.currentPassword} onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">New Password</label>
              <div className="relative">
                <input className="input w-full pr-10 text-base" type={showNew ? "text" : "password"} value={profile.newPassword} onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Confirm New Password</label>
              <div className="relative">
                <input className="input w-full pr-10 text-base" type={showConfirm ? "text" : "password"} value={profile.confirmPassword} onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button disabled={loading} className="btn-primary inline-flex w-full sm:w-fit items-center justify-center gap-2 min-h-[48px] disabled:bg-gray-300">
              <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-2 text-lg font-bold">
            <Settings className="h-5 w-5" /> System Settings
          </div>
          <div className="grid max-w-lg gap-5">
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4">
              <div>
                <p className="font-semibold">Free Shipping</p>
                <p className="text-sm text-gray-500">When enabled, all orders get free delivery.</p>
              </div>
              <button
                disabled={settingsLoading}
                onClick={() => handleSettingChange("freeShipping", !settings.freeShipping)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.freeShipping ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.freeShipping ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

          </div>
        </section>
      </div>
    </>
  );
};

export default AdminSettingsPage;