import { useCallback, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";

const ImageDropZone = ({ value, existingImage, onFileChange, onRemove }) => {
  const [dragOver, setDragOver] = useState(false);
  const preview = value instanceof File ? URL.createObjectURL(value) : existingImage;

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFileChange(file);
  }, [onFileChange]);

  const handleInput = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <div>
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="" className="h-24 w-44 rounded-lg border object-cover" loading="lazy" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition ${
            dragOver ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <Upload className="h-6 w-6" />
          <span className="font-medium">Drop an image here or click to browse</span>
          <span className="text-xs">JPG, PNG, WebP up to 10MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleInput} />
        </label>
      )}
    </div>
  );
};

export default ImageDropZone;
