import { Building2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Seo from "../../components/Seo.jsx";
import { getBankDetails, saveBankDetails } from "../../services/bankDetailService.js";

const AdminBankDetailsPage = () => {
  const [form, setForm] = useState({ bankName: "", accountName: "", accountNumber: "", branch: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBankDetails()
      .then((data) => setForm({ bankName: data.bankName || "", accountName: data.accountName || "", accountNumber: data.accountNumber || "", branch: data.branch || "" }))
      .catch(() => toast.error("Failed to load bank details"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBankDetails(form);
      toast.success("Bank details saved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="mt-10 text-center text-sm text-gray-600">Loading...</p>;

  return (
    <>
      <Seo title="Bank Details" />
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ember text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Bank Details</h1>
            <p className="text-sm text-gray-600">Manage the bank account shown to customers at checkout.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Bank Name</label>
              <input className="input" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Account Name</label>
              <input className="input" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Account Number</label>
              <input className="input" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Branch</label>
              <input className="input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
            </div>
          </div>

          <button className="btn-primary mt-6 w-full" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Bank Details"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AdminBankDetailsPage;