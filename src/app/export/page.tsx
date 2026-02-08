'use client';

import { useState } from 'react';

export default function ExportPage() {
  const [czmlPreview, setCzmlPreview] = useState<string | null>(null);
  const [configPreview, setConfigPreview] = useState<string | null>(null);

  async function previewCzml() {
    const res = await fetch('/api/export/czml');
    const text = await res.text();
    setCzmlPreview(text);
  }

  async function previewConfig() {
    const res = await fetch('/api/export/config');
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
      <h1 className="text-2xl font-bold text-gray-900">Export</h1>
      <p className="text-sm text-gray-600">
        Generate export files from all Stage 4 (Map-Ready) sources for map viewer applications.
      </p>

      {/* CZML Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Combined CZML Document</h2>
        <p className="text-sm text-gray-500 mb-3">
          Generates a CZML document with all cesium-ready vector sources, including time-dynamic availability for the historical timeline.
        </p>
        <div className="flex gap-2">
          <button
            onClick={previewCzml}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Preview
          </button>
          <button
            onClick={async () => {
              const res = await fetch('/api/export/czml');
              const text = await res.text();
              download(text, 'manchester-historical.czml');
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Download CZML
          </button>
        </div>
        {czmlPreview && (
          <pre className="mt-3 bg-gray-50 rounded p-3 text-xs overflow-auto max-h-64 text-gray-700">
            {czmlPreview}
          </pre>
        )}
      </div>

      {/* Config Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Imagery Layer Config</h2>
        <p className="text-sm text-gray-500 mb-3">
          Generates a JSON config file describing imagery overlays and vector layers for the consumer Cesium app to load.
        </p>
        <div className="flex gap-2">
          <button
            onClick={previewConfig}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Preview
          </button>
          <button
            onClick={async () => {
              const res = await fetch('/api/export/config');
              const text = await res.text();
              download(text, 'imagery-config.json');
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Download Config
          </button>
        </div>
        {configPreview && (
          <pre className="mt-3 bg-gray-50 rounded p-3 text-xs overflow-auto max-h-64 text-gray-700">
            {configPreview}
          </pre>
        )}
      </div>
    </div>
  );
}
