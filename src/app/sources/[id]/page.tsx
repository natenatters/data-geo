'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SourceWithFiles, SourceFile } from '@/lib/types';
import { STAGE_GATES, STAGES, getStageGateErrors } from '@/lib/types';
import SourceForm from '@/components/SourceForm';
import StageIndicator from '@/components/StageIndicator';

const FILE_TYPES = ['image', 'geotiff', 'geojson', 'czml', 'kml', 'other'] as const;

export default function SourceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [source, setSource] = useState<SourceWithFiles | null>(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>('other');

  function fetchSource() {
    fetch(`/api/sources/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setSource)
      .catch(() => router.push('/sources'));
  }

  useEffect(() => {
    fetchSource();
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this source and all its files?')) return;
    await fetch(`/api/sources/${id}`, { method: 'DELETE' });
    router.push('/sources');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filetype', uploadType);

    await fetch(`/api/sources/${id}/files`, { method: 'POST', body: formData });
    setUploading(false);
    e.target.value = '';
    fetchSource();
  }

  async function handleDeleteFile(fileId: number) {
    if (!confirm('Delete this file?')) return;
    await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    fetchSource();
  }

  async function handleRevertStage() {
    if (!source || source.stage <= 1) return;
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: source.stage - 1 }),
    });
    fetchSource();
  }

  async function handleAdvanceStage() {
    if (!source || source.stage >= 4) return;
    const errors = getStageGateErrors(source, source.stage + 1);
    if (errors.length > 0) {
      alert('Cannot advance:\n\n' + errors.join('\n'));
      return;
    }
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: source.stage + 1 }),
    });
    fetchSource();
  }

  if (!source) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Source</h1>
          <button
            onClick={() => { setEditing(false); fetchSource(); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <SourceForm source={source} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{source.name}</h1>
          {source.description && (
            <p className="text-gray-600 mt-1">{source.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Pipeline Stage</h2>
          <div className="flex gap-2">
            {source.stage > 1 && (
              <button
                onClick={handleRevertStage}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
              >
                Back to Stage {source.stage - 1}
              </button>
            )}
            {source.stage < 4 && (() => {
              const errors = getStageGateErrors(source, source.stage + 1);
              const canAdvance = errors.length === 0;
              return (
                <button
                  onClick={handleAdvanceStage}
                  disabled={!canAdvance}
                  className={`px-3 py-1.5 text-sm rounded ${canAdvance
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={canAdvance ? undefined : errors.join(', ')}
                >
                  Advance to Stage {source.stage + 1}
                </button>
              );
            })()}
          </div>
        </div>
        <StageIndicator stage={source.stage} size="lg" />

        {/* Show requirements for next stage */}
        {source.stage < 4 && (() => {
          const nextStage = source.stage + 1;
          const gate = STAGE_GATES[nextStage];
          if (!gate) return null;
          const errors = getStageGateErrors(source, nextStage);
          if (errors.length === 0) return null;
          return (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
              <p className="font-medium text-amber-800 mb-1">
                To reach Stage {nextStage} ({STAGES[nextStage]}):
              </p>
              <ul className="space-y-1">
                {gate.fields.map(field => {
                  const val = source[field];
                  const filled = val !== null && val !== undefined && val !== '';
                  return (
                    <li key={field} className={`flex items-center gap-1.5 ${filled ? 'text-green-700' : 'text-amber-700'}`}>
                      <span>{filled ? '\u2713' : '\u2022'}</span>
                      <span>{field.replace(/_/g, ' ')}</span>
                      {filled && <span className="text-xs text-green-600 truncate max-w-xs">({String(val)})</span>}
                    </li>
                  );
                })}
                {gate.check && (() => {
                  const checkErr = gate.check(source);
                  const passed = !checkErr;
                  return (
                    <li className={`flex items-center gap-1.5 ${passed ? 'text-green-700' : 'text-amber-700'}`}>
                      <span>{passed ? '\u2713' : '\u2022'}</span>
                      <span>tiles</span>
                      {passed && <span className="text-xs text-green-600">({source.tiles.length} tile{source.tiles.length !== 1 ? 's' : ''})</span>}
                    </li>
                  );
                })()}
              </ul>
            </div>
          );
        })()}
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Type</dt>
            <dd className="text-gray-900">{source.source_type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Era</dt>
            <dd className="text-gray-900 capitalize">{source.era}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Date Range</dt>
            <dd className="text-gray-900">
              {source.year_start || '?'} – {source.year_end || '?'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Source URL</dt>
            <dd className="text-gray-900 truncate">
              {source.source_url ? (
                <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {source.source_url}
                </a>
              ) : '—'}
            </dd>
          </div>
          {source.bounds_west && (
            <div className="col-span-2">
              <dt className="text-gray-500">Bounds</dt>
              <dd className="text-gray-900 font-mono text-xs">
                W:{source.bounds_west} S:{source.bounds_south} E:{source.bounds_east} N:{source.bounds_north}
              </dd>
            </div>
          )}
          {source.iiif_url && (
            <div className="col-span-2">
              <dt className="text-gray-500">IIIF URL</dt>
              <dd className="text-gray-900 truncate">
                <a href={source.iiif_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{source.iiif_url}</a>
              </dd>
            </div>
          )}
          {source.georeference_url && (
            <div className="col-span-2">
              <dt className="text-gray-500">Georeference URL</dt>
              <dd className="text-gray-900 truncate">
                <a href={source.georeference_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{source.georeference_url}</a>
              </dd>
            </div>
          )}
          {source.tiles.length > 0 && (
            <div className="col-span-2">
              <dt className="text-gray-500">Tiles ({source.tiles.length})</dt>
              <dd className="space-y-1 mt-1">
                {source.tiles.map((tile, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-700 font-medium w-20 shrink-0">{tile.label}</span>
                    <span className="text-gray-500 font-mono truncate">{tile.url}</span>
                  </div>
                ))}
              </dd>
            </div>
          )}
          {source.notes && (
            <div className="col-span-2">
              <dt className="text-gray-500">Notes</dt>
              <dd className="text-gray-900 whitespace-pre-wrap">{source.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Files */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Files</h2>

        {source.files.length > 0 && (
          <div className="space-y-2 mb-4">
            {source.files.map((file: SourceFile) => (
              <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">{file.filetype}</span>
                  <span className="text-gray-900">{file.filename}</span>
                  <span className="text-gray-400 text-xs">{file.filepath}</span>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <select
            value={uploadType}
            onChange={e => setUploadType(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            {FILE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded cursor-pointer">
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
