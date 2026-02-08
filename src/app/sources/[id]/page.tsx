'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SourceWithFiles, SourceFile, Tile } from '@/lib/types';
import { STAGES, ERAS, SOURCE_TYPES } from '@/lib/types';
import type { Era, SourceType } from '@/lib/types';
import SourceForm from '@/components/SourceForm';

const FILE_TYPES = ['image', 'geotiff', 'geojson', 'czml', 'kml', 'other'] as const;

export default function SourceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [source, setSource] = useState<SourceWithFiles | null>(null);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [boundsDraft, setBoundsDraft] = useState({ w: '', s: '', e: '', n: '' });
  const [addingTile, setAddingTile] = useState(false);
  const [tileDraft, setTileDraft] = useState({ url: '', label: '' });
  const [savingField, setSavingField] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>('other');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  function fetchSource() {
    fetch(`/api/sources/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setSource)
      .catch(() => router.push('/sources'));
  }

  useEffect(() => { fetchSource(); }, [id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [settingsOpen]);

  async function saveField(field: string, value: string | null) {
    setSavingField(field);
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value || null }),
    });
    setEditingField(null);
    setDraft('');
    setSavingField(null);
    fetchSource();
  }

  async function saveTiles(tiles: Tile[]) {
    setSavingField('tiles');
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiles }),
    });
    setSavingField(null);
    fetchSource();
  }

  async function saveBounds(w: string, s: string, e: string, n: string) {
    setSavingField('bounds');
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bounds_west: w ? parseFloat(w) : null,
        bounds_south: s ? parseFloat(s) : null,
        bounds_east: e ? parseFloat(e) : null,
        bounds_north: n ? parseFloat(n) : null,
      }),
    });
    setEditingField(null);
    setSavingField(null);
    fetchSource();
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  function startEditing(field: string, currentValue?: string | null) {
    setEditingField(field);
    setDraft(currentValue || '');
  }

  function startEditingBounds() {
    setEditingField('bounds');
    setBoundsDraft({
      w: source?.bounds_west?.toString() || '',
      s: source?.bounds_south?.toString() || '',
      e: source?.bounds_east?.toString() || '',
      n: source?.bounds_north?.toString() || '',
    });
  }

  function cancelEditing() {
    setEditingField(null);
    setDraft('');
    setAddingTile(false);
    setTileDraft({ url: '', label: '' });
  }

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

  if (!source) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  const s = source;

  if (editingIdentity) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Source</h1>
          <button
            onClick={() => { setEditingIdentity(false); fetchSource(); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <SourceForm source={s} />
      </div>
    );
  }

  const hasBounds = s.bounds_west !== null;
  const yearRange = s.year_start
    ? s.year_end && s.year_end !== s.year_start
      ? `${s.year_start}–${s.year_end}`
      : `${s.year_start}`
    : null;

  function CopyButton({ text, field }: { text: string; field: string }) {
    return (
      <button
        onClick={() => copyToClipboard(text, field)}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
        title="Copy to clipboard"
      >
        {copied === field ? (
          <span className="text-green-500 text-xs">Copied</span>
        ) : (
          <span className="text-xs">&#128203;</span>
        )}
      </button>
    );
  }

  // Inline editable field for text/url values
  function EditableField({ field, label, value, type = 'text', placeholder }: {
    field: string; label: string; value: string | null; type?: 'text' | 'url'; placeholder?: string;
  }) {
    const isEditing = editingField === field;
    const isSaving = savingField === field;

    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-500 w-32 shrink-0 pt-0.5">{label}</span>
        {isEditing ? (
          <div className="flex gap-2 flex-1">
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveField(field, draft.trim() || null);
                if (e.key === 'Escape') cancelEditing();
              }}
              className="flex-1 border border-gray-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholder}
              autoFocus
              disabled={isSaving}
            />
            <button
              onClick={() => saveField(field, draft.trim() || null)}
              disabled={isSaving}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? '...' : 'Save'}
            </button>
            <button onClick={cancelEditing} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0 group">
            {value ? (
              type === 'url' ? (
                <a href={value} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate">{value}</a>
              ) : (
                <span className="text-sm text-gray-700">{value}</span>
              )
            ) : (
              <span className="text-sm text-gray-300 italic">Not set</span>
            )}
            {value && <CopyButton text={value} field={field} />}
            <button onClick={() => startEditing(field, value)}
              className="text-xs text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{s.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span
              className="px-1.5 py-0.5 rounded font-medium text-white"
              style={{ backgroundColor: ERAS[s.era]?.color || '#6b7280' }}
            >
              {ERAS[s.era]?.label || s.era}
            </span>
            {yearRange && <span className="text-gray-500">{yearRange}</span>}
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{SOURCE_TYPES[s.source_type]}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{STAGES[s.stage]}</span>
          </div>
        </div>
        <div className="relative shrink-0" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-10 min-w-[140px]">
              <button
                onClick={() => { setSettingsOpen(false); setEditingIdentity(true); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit details
              </button>
              <button
                onClick={() => { setSettingsOpen(false); handleDelete(); }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete source
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {s.description && (
        <p className="text-sm text-gray-600">{s.description}</p>
      )}

      {/* URLs & metadata */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <EditableField field="source_url" label="Source URL" value={s.source_url} type="url" placeholder="https://..." />
        <EditableField field="iiif_url" label="IIIF Manifest" value={s.iiif_url} type="url" placeholder="https://..." />
        <EditableField field="georeference_url" label="Georeference" value={s.georeference_url} type="url" placeholder="https://annotations.allmaps.org/..." />
      </div>

      {/* Tiles */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700">
            Tiles
            <span className="text-gray-400 font-normal ml-1.5">
              ({s.tiles.length} total{s.tiles.filter(t => t.georeferenced).length > 0 && `, ${s.tiles.filter(t => t.georeferenced).length} verified`})
            </span>
          </h2>
          <button
            onClick={() => setAddingTile(true)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            + Add
          </button>
        </div>

        <div className="space-y-1">
          {s.tiles.length === 0 && !addingTile && (
            <p className="text-xs text-gray-400 italic">No tiles</p>
          )}
          {s.tiles.map((tile, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1 group">
              <button
                onClick={async () => {
                  const next = s.tiles.map((t, j) =>
                    j === i ? { ...t, georeferenced: !t.georeferenced } : t
                  );
                  await saveTiles(next);
                }}
                className={`shrink-0 ${tile.georeferenced ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                title={tile.georeferenced ? 'Verified' : 'Click to verify'}
                disabled={savingField === 'tiles'}
              >
                {tile.georeferenced ? '\u2713' : '\u25CB'}
              </button>
              <span className="text-gray-700 font-medium shrink-0">{tile.label}</span>
              <span className="text-gray-400 font-mono truncate">{tile.url}</span>
              <CopyButton text={tile.url} field={`tile-${i}`} />
              <button
                onClick={async () => {
                  if (!confirm('Remove this tile?')) return;
                  const next = s.tiles.filter((_, j) => j !== i);
                  await saveTiles(next);
                }}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}

          {addingTile && (
            <div className="flex items-center gap-2 py-1">
              <input
                type="text"
                value={tileDraft.label}
                onChange={e => setTileDraft(prev => ({ ...prev, label: e.target.value }))}
                className="w-28 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Label"
              />
              <input
                type="url"
                value={tileDraft.url}
                onChange={e => setTileDraft(prev => ({ ...prev, url: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tileDraft.url.trim()) {
                    const next = [...s.tiles, {
                      url: tileDraft.url.trim(),
                      label: tileDraft.label.trim() || `Sheet ${s.tiles.length + 1}`,
                      georeferenced: false,
                    }];
                    setAddingTile(false);
                    setTileDraft({ url: '', label: '' });
                    saveTiles(next);
                  }
                  if (e.key === 'Escape') { setAddingTile(false); setTileDraft({ url: '', label: '' }); }
                }}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://allmaps.xyz/maps/{hash}/{z}/{x}/{y}.png"
                autoFocus
              />
              <button onClick={() => {
                if (!tileDraft.url.trim()) return;
                const next = [...s.tiles, {
                  url: tileDraft.url.trim(),
                  label: tileDraft.label.trim() || `Sheet ${s.tiles.length + 1}`,
                  georeferenced: false,
                }];
                setAddingTile(false);
                setTileDraft({ url: '', label: '' });
                saveTiles(next);
              }} disabled={!tileDraft.url.trim()}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                Save
              </button>
              <button onClick={() => { setAddingTile(false); setTileDraft({ url: '', label: '' }); }}
                className="px-1 py-1 text-xs text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bounds */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700">Spatial Extent</h2>
          {editingField !== 'bounds' && (
            <button onClick={startEditingBounds}
              className="text-xs text-gray-400 hover:text-gray-600">
              {hasBounds ? 'Edit' : 'Set'}
            </button>
          )}
        </div>

        {editingField === 'bounds' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {[
                { key: 'w' as const, label: 'West (lon)' },
                { key: 'e' as const, label: 'East (lon)' },
                { key: 's' as const, label: 'South (lat)' },
                { key: 'n' as const, label: 'North (lat)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[11px] text-gray-500 mb-0.5">{label}</label>
                  <input type="number" step="any" value={boundsDraft[key]}
                    onChange={e => setBoundsDraft(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={savingField === 'bounds'} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveBounds(boundsDraft.w, boundsDraft.s, boundsDraft.e, boundsDraft.n)}
                disabled={savingField === 'bounds'}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                {savingField === 'bounds' ? '...' : 'Save'}
              </button>
              <button onClick={cancelEditing}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              {hasBounds && (
                <button onClick={() => saveBounds('', '', '', '')}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 ml-auto">Clear</button>
              )}
            </div>
          </div>
        ) : hasBounds ? (
          <div className="text-xs text-gray-500 font-mono">
            W:{s.bounds_west} S:{s.bounds_south} E:{s.bounds_east} N:{s.bounds_north}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Not set</p>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700">Notes</h2>
          {editingField !== 'notes' && (
            <button onClick={() => startEditing('notes', s.notes)}
              className="text-xs text-gray-400 hover:text-gray-600">
              {s.notes ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        {editingField === 'notes' ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              disabled={savingField === 'notes'}
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveField('notes', draft.trim() || null)}
                disabled={savingField === 'notes'}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {savingField === 'notes' ? '...' : 'Save'}
              </button>
              <button onClick={cancelEditing}
                className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </div>
        ) : s.notes ? (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{s.notes}</p>
        ) : (
          <p className="text-xs text-gray-400 italic">No notes</p>
        )}
      </div>

      {/* Files */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">
            Files
            {s.files.length > 0 && (
              <span className="text-gray-400 font-normal ml-1">({s.files.length})</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={uploadType}
              onChange={e => setUploadType(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-600"
            >
              {FILE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition-colors">
              {uploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {s.files.length > 0 ? (
          <div className="space-y-1">
            {s.files.map((file: SourceFile) => (
              <div key={file.id} className="flex items-center justify-between py-1.5 px-2 -mx-1 rounded hover:bg-gray-50 group">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono text-gray-500">{file.filetype}</span>
                  <span className="text-gray-800 truncate">{file.filename}</span>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No files</p>
        )}
      </div>
    </div>
  );
}
