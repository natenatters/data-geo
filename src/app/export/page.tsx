'use client';

import { useState } from 'react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function ExportPage() {
  const [configPreview, setConfigPreview] = useState<string | null>(null);

  async function previewConfig() {
    const res = await fetch(`${basePath}/data/export-config.json`);
    const text = await res.text();
    setConfigPreview(text);
  }

  function download(data: string, filename: string) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Export</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Export data from all Stage 4 (Map-Ready) sources for map viewer applications.
      </p>

      {/* Config Export */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Imagery Layer Config</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          JSON config describing imagery overlays and vector layers for the consumer Cesium app to load.
        </p>
        <div className="flex gap-2">
          <button
            onClick={previewConfig}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            Preview
          </button>
          <button
            onClick={async () => {
              const res = await fetch(`${basePath}/data/export-config.json`);
              const text = await res.text();
              download(text, 'imagery-config.json');
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Download Config
          </button>
        </div>
        {configPreview && (
          <pre className="mt-3 bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs overflow-auto max-h-64 text-gray-700 dark:text-gray-300">
            {configPreview}
          </pre>
        )}
      </div>
    </div>
  );
}
