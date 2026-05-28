import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Shield, User, Mail, Phone, MapPin, Lock, Bell, Trash2, LogOut, Loader2, Plus, Pencil, X, Eye, EyeOff, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";
import {
  getCustomerProfile, updateCustomerProfile, changeCustomerPassword, updateCustomerPreferences, deleteCustomerAccount,
  getAddresses, addAddress, updateAddress, deleteAddress,
  resendVerification,
} from "../../services/customerAuthService.js";
import MyOrdersSection from "../../components/orders/MyOrdersSection.jsx";
import WarningBanner from "../../moderation-system/components/WarningBanner.jsx";
import { getMyModerationStatus } from "../../moderation-system/services/moderationService.js";

const TABS = ["Profile", "Orders", "Addresses", "Security", "Preferences"];

const initialAddress = { label: "Home", fullName: "", phone: "", addressLine: "", city: "", district: "", isDefault: false };

const DashboardPage = () => {
  const { customer, logout, refreshCustomer, setCustomerData } = useCustomerAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile
  const [profile, setProfile] = useState({ name: "", phone: "" });

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(initialAddress);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState({ emailNotifications: true, marketingEmails: false });

  // Moderation
  const [activeWarnings, setActiveWarnings] = useState([]);

  // Delete
  const [deletePw, setDeletePw] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Resend verification
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!customer) { navigate("/login", { replace: true }); return; }
    setProfile({ name: customer.name || "", phone: customer.phone || "" });
    setPrefs({ emailNotifications: customer.preferences?.emailNotifications ?? true, marketingEmails: customer.preferences?.marketingEmails ?? false });
    getMyModerationStatus().then((s) => {
      if (s.status === "suspended" || s.status === "banned") {
        navigate("/account/suspended", { replace: true });
        return;
      }
      if (s.status === "warned" && s.case) setActiveWarnings([s.case]);
      else setActiveWarnings([]);
    }).catch(() => {});
  }, [customer, navigate]);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  const loadAddresses = useCallback(async () => {
    try { setAddresses(await getAddresses()); } catch {}
  }, []);

  useEffect(() => { if (tab === "Addresses") loadAddresses(); }, [tab, loadAddresses]);

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage({ type: "", text: "" }), 4000); };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateCustomerProfile(profile);
      setCustomerData(updated);
      showMsg("success", "Profile updated.");
    } catch (err) { showMsg("error", err.response?.data?.message || "Update failed."); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { showMsg("error", "Passwords do not match."); return; }
    setSaving(true);
    try {
      await changeCustomerPassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMsg("success", "Password changed. Please log in again.");
      setTimeout(() => logout(), 2000);
    } catch (err) { showMsg("error", err.response?.data?.message || "Failed to change password."); }
    finally { setSaving(false); }
  };

  const handlePrefsUpdate = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      await updateCustomerPreferences(next);
      showMsg("success", "Preferences saved.");
    } catch { showMsg("error", "Failed to save preferences."); }
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress, addressForm);
      } else {
        await addAddress(addressForm);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm(initialAddress);
      await loadAddresses();
      showMsg("success", `Address ${editingAddress ? "updated" : "added"}.`);
    } catch (err) { showMsg("error", err.response?.data?.message || "Failed to save address."); }
    finally { setSaving(false); }
  };

  const handleAddressDelete = async (id) => {
    try {
      await deleteAddress(id);
      await loadAddresses();
      showMsg("success", "Address deleted.");
    } catch { showMsg("error", "Failed to delete address."); }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await deleteCustomerAccount({ password: deletePw });
      showMsg("success", "Account deleted.");
      setTimeout(() => { logout(); navigate("/"); }, 1500);
    } catch (err) { showMsg("error", err.response?.data?.message || "Failed to delete account."); }
    finally { setDeleting(false); }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendVerification();
      showMsg("success", "Verification email sent.");
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("already verified")) {
        refreshCustomer();
        showMsg("success", "Email already verified.");
      } else {
        showMsg("error", "Failed to send.");
      }
    }
    finally { setResending(false); }
  };

  if (!customer) return null;

  return (
    <>
      <Seo title="My Account" description="Manage your Mini Hobbies account." />
      <section className="bg-gray-50 py-8 sm:py-12">
        <div className="container-page">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">My account</h1>
              <p className="mt-1 text-sm text-gray-500">{customer.email}</p>
            </div>
            <button onClick={logout} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>

          {message.text && (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message.text}
            </div>
          )}

          {activeWarnings.length > 0 && (
            <div className="mt-4">
              <WarningBanner cases={activeWarnings} />
            </div>
          )}

          {!customer.emailVerified && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>Please verify your email address.</span>
              <button onClick={handleResendVerification} disabled={resending} className="font-semibold text-amber-900 underline hover:no-underline disabled:opacity-50">
                {resending ? "Sending..." : "Resend"}
              </button>
            </div>
          )}

          {/* Tab bar */}
          <div className="mt-6 flex gap-1 border-b border-gray-200">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-semibold transition border-b-2 -mb-[1px] ${tab === t ? "border-ember text-ember" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end">
            <Link to="/account/moderation" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
              <Shield className="h-3.5 w-3.5" />
              Moderation History
            </Link>
          </div>

          <div className="mt-6">
            {tab === "Profile" && (
              <div className="max-w-xl space-y-6">
                <form onSubmit={handleProfileUpdate} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-black">Personal info</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Full name</label>
                      <div className="relative mt-1">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input w-full pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Email</label>
                      <div className="relative mt-1">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input type="email" value={customer.email} disabled className="input w-full pl-10 bg-gray-50 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Phone</label>
                      <div className="relative mt-1">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input w-full pl-10" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary mt-5 min-h-[44px] disabled:bg-gray-300">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </form>
              </div>
            )}

            {tab === "Orders" && (
              <div>
                <h2 className="mb-2 text-lg font-black">My orders</h2>
                <p className="mb-5 text-sm text-gray-500">View and track all your orders.</p>
                <MyOrdersSection />
              </div>
            )}

            {tab === "Addresses" && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black">Saved addresses</h2>
                  {!showAddressForm && (
                    <button onClick={() => { setAddressForm(initialAddress); setEditingAddress(null); setShowAddressForm(true); }} className="btn-secondary text-sm min-h-[40px]">
                      <Plus className="h-4 w-4" /> Add address
                    </button>
                  )}
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddressSave} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700">Label</label>
                        <select value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="input mt-1">
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Full name</label>
                        <input type="text" required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className="input mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">Phone</label>
                        <input type="tel" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="input mt-1" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700">Address</label>
                        <input type="text" required value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} className="input mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">City</label>
                        <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="input mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700">District</label>
                        <input type="text" required value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} className="input mt-1" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-ember focus:ring-ember" />
                          Set as default address
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving} className="btn-primary text-sm min-h-[40px] disabled:bg-gray-300">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {saving ? "Saving..." : (editingAddress ? "Update" : "Add")}
                      </button>
                      <button type="button" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }} className="btn-secondary text-sm min-h-[40px]">Cancel</button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !showAddressForm && (
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No addresses saved yet.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-600">{addr.label}</span>
                          {addr.isDefault && <span className="ml-2 inline-block rounded-full bg-ember/10 px-3 py-0.5 text-xs font-semibold text-ember">Default</span>}
                          <p className="mt-2 text-sm font-semibold text-gray-900">{addr.fullName}</p>
                          <p className="text-sm text-gray-500">{addr.phone}</p>
                          <p className="text-sm text-gray-500">{addr.addressLine}, {addr.city}, {addr.district}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setAddressForm(addr); setEditingAddress(addr._id); setShowAddressForm(true); }} className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleAddressDelete(addr._id)} className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Security" && (
              <div className="max-w-xl space-y-6">
                <form onSubmit={handlePasswordChange} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-black">Change password</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Current password</label>
                      <div className="relative mt-1">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input type={showPw ? "text" : "password"} required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="input w-full pl-10 pr-10" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">New password</label>
                      <input type="password" required value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="input mt-1" placeholder="At least 8 characters" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Confirm new password</label>
                      <input type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="input mt-1" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary mt-5 min-h-[44px] disabled:bg-gray-300">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {saving ? "Updating..." : "Update password"}
                  </button>
                </form>

                {/* Delete account */}
                <div className="rounded-xl border border-red-200 bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-black text-red-700">Danger zone</h2>
                  <p className="mt-1 text-sm text-gray-500">Permanently delete your account and all associated data.</p>
                  {!showDelete ? (
                    <button onClick={() => setShowDelete(true)} className="btn-danger mt-4 min-h-[44px]">
                      <Trash2 className="h-4 w-4" /> Delete my account
                    </button>
                  ) : (
                    <form onSubmit={handleDeleteAccount} className="mt-4 space-y-3">
                      <p className="text-sm font-medium text-red-700">This action cannot be undone. Enter your password to confirm.</p>
                      <input type="password" required value={deletePw} onChange={(e) => setDeletePw(e.target.value)} className="input" placeholder="Your password" />
                      <div className="flex gap-2">
                        <button type="submit" disabled={deleting} className="btn-danger min-h-[44px] disabled:bg-gray-300">
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {deleting ? "Deleting..." : "Confirm delete"}
                        </button>
                        <button type="button" onClick={() => { setShowDelete(false); setDeletePw(""); }} className="btn-secondary min-h-[44px]">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {tab === "Preferences" && (
              <div className="max-w-xl space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-black">Notifications</h2>
                  <div className="mt-4 space-y-4">
                    <label className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Email notifications</p>
                        <p className="text-xs text-gray-500">Order updates and account alerts.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrefsUpdate("emailNotifications", !prefs.emailNotifications)}
                        className={`relative h-6 w-11 rounded-full transition ${prefs.emailNotifications ? "bg-ember" : "bg-gray-300"}`}
                      >
                        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.emailNotifications ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Marketing emails</p>
                        <p className="text-xs text-gray-500">New arrivals, deals, and collector news.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrefsUpdate("marketingEmails", !prefs.marketingEmails)}
                        className={`relative h-6 w-11 rounded-full transition ${prefs.marketingEmails ? "bg-ember" : "bg-gray-300"}`}
                      >
                        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.marketingEmails ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default DashboardPage;
