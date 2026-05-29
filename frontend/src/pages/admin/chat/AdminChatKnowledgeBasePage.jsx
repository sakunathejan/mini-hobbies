import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Edit3, Trash2, Upload, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "../../../components/ui/Pagination.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import useFetch from "../../../hooks/useFetch.js";
import { getKnowledgeBase, createKnowledgeEntry, updateKnowledgeEntry, deleteKnowledgeEntry, importKnowledge, testKnowledgeMatch } from "../../../services/adminChatService.js";

const CATEGORIES = ["faq", "policy", "shipping", "product", "brand", "payment", "custom"];

const CATEGORY_COLORS = {
  faq: "bg-blue-100 text-blue-700",
  policy: "bg-purple-100 text-purple-700",
  shipping: "bg-cyan-100 text-cyan-700",
  product: "bg-emerald-100 text-emerald-700",
  brand: "bg-pink-100 text-pink-700",
  payment: "bg-amber-100 text-amber-700",
  custom: "bg-gray-100 text-gray-700"
};

const KnowledgeForm = ({ entry, onSave, onCancel }) => {
  const [question, setQuestion] = useState(entry?.question || "");
  const [answer, setAnswer] = useState(entry?.answer || "");
  const [category, setCategory] = useState(entry?.category || "faq");
  const [tags, setTags] = useState(entry?.tags?.join(", ") || "");
  const [priority, setPriority] = useState(entry?.priority ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { question: question.trim(), answer: answer.trim(), category, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), priority };
      if (entry) {
        await updateKnowledgeEntry(entry._id, payload);
        toast.success("Knowledge entry updated.");
      } else {
        await createKnowledgeEntry(payload);
        toast.success("Knowledge entry created.");
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          placeholder="e.g. Do you deliver everywhere?"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Answer</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          placeholder="Detailed answer..."
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-gray-600">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Priority (0-100)</label>
          <input type="number" min={0} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Tags (comma-separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" placeholder="delivery, shipping, koombiyo" />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-amber-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50">
          {saving ? "Saving..." : entry ? "Update" : "Add Entry"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium transition hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
};

const ImportModal = ({ onClose, onImported }) => {
  const [jsonInput, setJsonInput] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    let entries;
    try {
      entries = JSON.parse(jsonInput);
    } catch {
      toast.error("Invalid JSON format.");
      return;
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      toast.error("JSON must be an array of entries.");
      return;
    }
    setImporting(true);
    try {
      const result = await importKnowledge(entries);
      toast.success(`Imported ${result.success} entries. ${result.failed} failed.`);
      onImported();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Import Knowledge</h2>
        <p className="mt-1 text-xs text-gray-500">Paste a JSON array of {`{ question, answer, category?, tags?, priority? }`}</p>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          rows={8}
          className="mt-3 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          placeholder='[{"question": "Do you deliver everywhere?", "answer": "We deliver via Koombiyo...", "category": "shipping"}]'
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleImport} disabled={importing || !jsonInput.trim()} className="rounded-lg bg-amber-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50">
            {importing ? "Importing..." : "Import"}
          </button>
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium transition hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const TestModal = ({ onClose }) => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!question.trim()) return;
    setTesting(true);
    try {
      const r = await testKnowledgeMatch(question);
      setResult(r);
    } catch {
      toast.error("Test failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Test Knowledge Match</h2>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="Type a customer question..."
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
          />
          <button onClick={handleTest} disabled={testing} className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50">
            {testing ? "..." : "Test"}
          </button>
        </div>
        {result && (
          <div className="mt-4 rounded-lg border p-4 text-sm">
            <p><strong>Question:</strong> {result.question}</p>
            <p className="mt-1"><strong>Matched:</strong> {result.matched ? "✅ Yes" : "❌ No"}</p>
            {result.matched && (
              <>
                <p className="mt-2"><strong>Answer:</strong></p>
                <p className="mt-0.5 rounded bg-gray-50 p-2 text-xs">{result.answer}</p>
                <p className="mt-1 text-xs text-gray-500">Category: {result.category} | Confidence: {result.confidence}/10</p>
              </>
            )}
          </div>
        )}
        <button onClick={onClose} className="mt-4 text-xs text-gray-500 hover:underline">Close</button>
      </div>
    </div>
  );
};

const AdminChatKnowledgeBasePage = () => {
  const { data, setData, loading, error } = useFetch(getKnowledgeBase, []);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showTest, setShowTest] = useState(false);

  const knowledge = Array.isArray(data?.knowledge) ? data.knowledge : [];
  const totalPages = data?.totalPages || 1;

  const handleSave = () => {
    setShowForm(false);
    setEditing(null);
    getKnowledgeBase({ page, limit: 20, search, category: category || undefined }).then(setData);
  };

  const handleDelete = async () => {
    try {
      await deleteKnowledgeEntry(deleteTarget._id);
      toast.success("Knowledge entry deleted.");
      handleSave();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (entry) => {
    setEditing(entry);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Knowledge Base</h1>
          <p className="mt-1 text-sm text-gray-600">{data?.total || 0} entries — Manage chatbot answers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTest(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium transition hover:bg-gray-50">
            <FileText className="h-3.5 w-3.5" /> Test Match
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium transition hover:bg-gray-50">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-900">
            <Plus className="h-3.5 w-3.5" /> Add Entry
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-bold mb-4">{editing ? "Edit Entry" : "New Knowledge Entry"}</h2>
          <KnowledgeForm entry={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {!loading && !error && knowledge.length === 0 && (
        <div className="mt-6"><EmptyState title="No entries" message="Add knowledge entries to help the chatbot answer questions." /></div>
      )}

      {!loading && !error && knowledge.length > 0 && (
        <div className="mt-6 space-y-2">
          {knowledge.map((entry) => (
            <div key={entry._id} className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.custom}`}>
                      {entry.category}
                    </span>
                    {!entry.isActive && <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">Inactive</span>}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{entry.question}</p>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{entry.answer}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-400">
                    {entry.tags?.length > 0 && <span>Tags: {entry.tags.join(", ")}</span>}
                    <span>Priority: {entry.priority}</span>
                    <span>Used: {entry.usageCount || 0}x</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => handleEdit(entry)} className="rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-amber-700">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(entry)} className="rounded p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete knowledge entry?"
        message={`Remove "${deleteTarget?.question}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={handleSave} />}
      {showTest && <TestModal onClose={() => setShowTest(false)} />}
    </div>
  );
};

export default AdminChatKnowledgeBasePage;
