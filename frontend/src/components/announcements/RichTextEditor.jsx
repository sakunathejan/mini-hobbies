import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Heading2, Heading3, Italic, Link, List, ListOrdered, Underline } from "lucide-react";

const TOOLBAR_ITEMS = [
  { icon: Bold, cmd: "bold", label: "Bold" },
  { icon: Italic, cmd: "italic", label: "Italic" },
  { icon: Underline, cmd: "underline", label: "Underline" },
  { type: "divider" },
  { icon: Heading2, cmd: "formatBlock", value: "h2", label: "Heading 2" },
  { icon: Heading3, cmd: "formatBlock", value: "h3", label: "Heading 3" },
  { type: "divider" },
  { icon: List, cmd: "insertUnorderedList", label: "Bullet List" },
  { icon: ListOrdered, cmd: "insertOrderedList", label: "Numbered List" },
  { type: "divider" },
  { icon: Link, cmd: "link", label: "Link" }
];

const RichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = useCallback((cmd, value) => {
    if (cmd === "link") {
      const url = window.prompt("Enter URL:");
      if (url) document.execCommand("createLink", false, url);
      return;
    }
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || "";
    onChange(html);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className={`w-full overflow-hidden rounded-md border transition ${isFocused ? "border-gray-900 ring-2 ring-gray-900/10" : "border-gray-300"}`}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-gray-50 px-2 py-1.5">
        {TOOLBAR_ITEMS.map((item, i) =>
          item.type === "divider" ? (
            <div key={i} className="mx-1 h-5 w-px bg-gray-300" />
          ) : (
            <button
              key={i}
              type="button"
              title={item.label}
              onMouseDown={(e) => { e.preventDefault(); exec(item.cmd, item.value); }}
              className="rounded p-1 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition"
            >
              <item.icon className="h-4 w-4" />
            </button>
          )
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", overflowWrap: "anywhere", maxWidth: "100%", minWidth: "0px", width: "100%" }}
        className="min-h-[140px] w-full resize-y px-4 py-3 text-sm outline-none [&_*]:[white-space:pre-wrap] [&_*]:[word-break:break-all] [&_*]:[overflow-wrap:anywhere] [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
      />
    </div>
  );
};

export default RichTextEditor;
