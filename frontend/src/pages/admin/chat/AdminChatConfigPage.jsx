import { useEffect, useState } from "react";
import { Save, RotateCcw, FlaskConical, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { getChatConfig, updateChatConfig, updateChatConfigBulk, resetChatConfigKey, testChatResponse } from "../../../services/adminChatService.js";

const Toggle = ({ label, desc, value, onChange }) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-xs text-gray-500">{desc}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-amber-700" : "bg-gray-300"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
    </button>
  </div>
);

const Section = ({ title, children }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5">
    <h2 className="text-lg font-bold mb-4">{title}</h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const AdminChatConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [tab, setTab] = useState("behavior");

  useEffect(() => {
    getChatConfig()
      .then(setConfig)
      .catch(() => toast.error("Failed to load config"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateChatConfigBulk(config);
      toast.success("Configuration saved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (key) => {
    try {
      await resetChatConfigKey(key);
      const fresh = await getChatConfig();
      setConfig(fresh);
      toast.success(`${key} reset to default.`);
    } catch {
      toast.error("Reset failed.");
    }
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    setTestLoading(true);
    try {
      const result = await testChatResponse(testInput);
      setTestResult(result);
    } catch {
      toast.error("Test failed.");
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-black">Chatbot Settings</h1>
        <div className="mt-6 space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-gray-100" />)}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "behavior", label: "Behavior", icon: BookOpen },
    { id: "features", label: "Features", icon: FlaskConical },
    { id: "test", label: "Response Tester", icon: FlaskConical }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Chatbot Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Configure chatbot behavior, features, and test responses.</p>
        </div>
        {tab !== "test" && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save All"}
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition ${tab === t.id ? "border-b-2 border-amber-700 text-amber-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "behavior" && (
        <div className="mt-6 space-y-6">
          <Section title="Response Tone">
            <div className="flex items-center gap-3">
              {["casual", "formal", "collector"].map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleToggle("behavior", "tone", tone)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${config?.behavior?.tone === tone ? "bg-amber-800 text-white" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </Section>
          <Section title="Response Style">
            <div className="flex items-center gap-3">
              {["short", "detailed"].map((len) => (
                <button
                  key={len}
                  onClick={() => handleToggle("behavior", "responseLength", len)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${config?.behavior?.responseLength === len ? "bg-amber-800 text-white" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  {len}
                </button>
              ))}
            </div>
            <Toggle label="Use Emoji" desc="Add emojis to bot responses" value={config?.behavior?.useEmoji ?? true} onChange={(v) => handleToggle("behavior", "useEmoji", v)} />
          </Section>
        </div>
      )}

      {tab === "features" && (
        <div className="mt-6 space-y-6">
          <Section title="Feature Toggles">
            {config?.features && Object.entries(config.features).map(([key, value]) => (
              <Toggle
                key={key}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                desc={`Enable/disable ${key} feature`}
                value={value}
                onChange={(v) => handleToggle("features", key, v)}
              />
            ))}
          </Section>
          <Section title="Sales Configuration">
            <div>
              <label className="block text-xs font-medium text-gray-600">Max Product Suggestions</label>
              <input
                type="number"
                min={1}
                max={10}
                value={config?.sales?.maxProductSuggestions ?? 5}
                onChange={(e) => handleToggle("sales", "maxProductSuggestions", Number(e.target.value))}
                className="mt-1 w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <Toggle label="Boost Best Sellers" desc="Prioritize top-selling products in chat" value={config?.sales?.boostBestSellers ?? true} onChange={(v) => handleToggle("sales", "boostBestSellers", v)} />
            <Toggle label="Boost Discounted Items" desc="Highlight discounted products" value={config?.sales?.boostDiscountedItems ?? true} onChange={(v) => handleToggle("sales", "boostDiscountedItems", v)} />
          </Section>
          <div className="flex items-center gap-2">
            {["behavior", "features", "sales", "appearance"].map((key) => (
              <button key={key} onClick={() => handleReset(key)} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                <RotateCcw className="h-3 w-3" /> Reset {key}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "test" && (
        <div className="mt-6 space-y-6">
          <Section title="Test Chatbot Response">
            <p className="text-xs text-gray-500">Type a customer message and see how the chatbot responds with current settings.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="e.g. Do you have Ferrari Hot Wheels?"
                onKeyDown={(e) => e.key === "Enter" && handleTest()}
              />
              <button onClick={handleTest} disabled={testLoading || !testInput.trim()} className="rounded-lg bg-amber-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50">
                {testLoading ? "..." : "Test"}
              </button>
            </div>

            {testResult && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase text-amber-700">Bot Response</p>
                  <p className="mt-1 whitespace-pre-wrap">{testResult.botResponse?.text || "(no text)"}</p>

                  {testResult.botResponse?.products?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-amber-700">Products ({testResult.botResponse.products.length}):</p>
                      {testResult.botResponse.products.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 rounded bg-white px-3 py-1.5 text-xs">
                          {p.image && <img src={p.image} alt="" className="h-6 w-6 rounded object-cover" />}
                          <span className="font-medium">{p.name}</span>
                          <span className="text-gray-500">— LKR {p.price?.toLocaleString("en-LK")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {testResult.botResponse?.suggestions?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-amber-700">Suggestions:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {testResult.botResponse.suggestions.map((s, i) => (
                          <span key={i} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {testResult.knowledgeMatch?.matched && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
                    <p className="text-xs font-semibold uppercase text-green-700">Knowledge Base Match</p>
                    <p className="mt-1 font-medium">{testResult.knowledgeMatch.question}</p>
                    <p className="mt-0.5 text-xs text-gray-600">{testResult.knowledgeMatch.answer}</p>
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
                  <p><strong>Applied Config:</strong> Tone: {testResult.appliedConfig?.tone} | Emoji: {testResult.appliedConfig?.useEmoji ? "On" : "Off"}</p>
                </div>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
};

export default AdminChatConfigPage;
