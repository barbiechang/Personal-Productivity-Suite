import { useState } from 'react'

interface FileEntry {
  id: string
  name: string
  size: number
  uploadedAt: string
}

export default function FileManager() {
  const [files, setFiles] = useState<FileEntry[]>([])

  function handleUpload(fileList: FileList | null) {
    if (!fileList) return
    const entries: FileEntry[] = Array.from(fileList).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      uploadedAt: new Date().toISOString(),
    }))
    setFiles((prev) => [...entries, ...prev])
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">File Manager</h2>

      <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-sm text-gray-500 hover:border-indigo-400">
        Drop files here or click to upload
        <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </label>

      <ul className="flex flex-col gap-2">
        {files.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <span>{f.name}</span>
            <span className="text-gray-400">{(f.size / 1024).toFixed(1)} KB</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
