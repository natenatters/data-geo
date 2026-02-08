'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SourceWithFiles, SourceFile, Tile } from '@/lib/types';
import { ERAS, SOURCE_TYPES, STAGES, PIPELINE_HELP, getStageGateErrors } from '@/lib/types';
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
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>('other');
  const [gateErrors, setGateErrors] = useState<string[] | null>(null);

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
    setGateErrors(null);
  }

  function startEditingBounds() {
    setEditingField('bounds');
    setBoundsDraft({
      w: source?.bounds_west?.toString() || '',
      s: source?.bounds_south?.toString() || '',
      e: source?.bounds_east?.toString() || '',
      n: source?.bounds_north?.toString() || '',
    });
    setGateErrors(null);
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

  async function handleAdvanceStage() {
    if (!source || source.stage >= 4) return;
    const errors = getStageGateErrors(source, source.stage + 1);
    if (errors.length > 0) {
      setGateErrors(errors);
      return;
    }
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: source.stage + 1 }),
    });
    setGateErrors(null);
    fetchSource();
  }

  async function handleRevertStage() {
    if (!source || source.stage <= 1) return;
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: source.stage - 1 }),
    });
    setGateErrors(null);
    fetchSource();
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
        <SourceForm source={source} />
      </div>
    );
  }

  const era = ERAS[source.era];
  const hasBounds = source.bounds_west !== null;
  const verifiedCount = source.tiles.filter(t => t.georeferenced).length;

  function toggleHelp(key: string) {
    setExpandedHelp(prev => prev === key ? null : key);
  }

  function HelpPanel({ helpKey }: { helpKey: string }) {
    if (expandedHelp !== helpKey) return null;
    const help = PIPELINE_HELP[helpKey];
    if (!help) return null;
    return (
      <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
        <div><span className="font-medium text-gray-700">What:</span> <span className="text-gray-600">{help.what}</span></div>
        <div><span className="font-medium text-gray-700">Why:</span> <span className="text-gray-600">{help.why}</span></div>
        <div><span className="font-medium text-gray-700">How:</span> <span className="text-gray-600">{help.how}</span></div>
        {help.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {help.links.map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors">
                {link.label} <span className="text-[10px]">&#8599;</span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

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

  function HelpButton({ helpKey }: { helpKey: string }) {
    return (
      <button
        onClick={() => toggleHelp(helpKey)}
        className={`text-xs shrink-0 w-5 h-5 rounded-full border transition-colors ${
          expandedHelp === helpKey
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
        }`}
        title="Help"
      >
        &#8505;
      </button>
    );
  }

  // --- Pipeline URL Row ---
  function UrlRow({ field, label, value }: { field: string; label: string; value: string | null }) {
    const isEditing = editingField === field;
    const isSaving = savingField === field;

    return (
      <div className="py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm shrink-0 ${value ? 'text-green-500' : 'text-gray-300'}`}>
            {value ? '\u2713' : '\u25CB'}
          </span>
          <span className="text-sm text-gray-700 font-medium flex-1">{label}</span>
          {value && <CopyButton text={value} field={field} />}
          <HelpButton helpKey={field} />
        </div>

        {isEditing ? (
          <div className="ml-6 mt-2 flex gap-2">
            <input
              type="url"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && draft.trim()) saveField(field, draft.trim());
                if (e.key === 'Escape') cancelEditing();
              }}
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
              autoFocus
              disabled={isSaving}
            />
            <button
              onClick={() => draft.trim() && saveField(field, draft.trim())}
              disabled={!draft.trim() || isSaving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? '...' : 'Save'}
            </button>
            <button onClick={cancelEditing} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        ) : value ? (
          <div className="ml-6 mt-1 flex items-center gap-2">
            <a href={value} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs truncate">{value}</a>
            <button onClick={() => startEditing(field, value)}
              className="text-xs text-gray-400 hover:text-gray-600 shrink-0">Edit</button>
          </div>
        ) : (
          <div className="ml-6 mt-1">
            <button onClick={() => startEditing(field)}
              className="text-xs text-blue-500 hover:text-blue-700">
              Paste URL...
            </button>
          </div>
        )}

        <HelpPanel helpKey={field} />
      </div>
    );
  }

  // --- Tiles Row ---
  function TilesRow() {
    const isSaving = savingField === 'tiles';

    async function toggleVerified(index: number) {
      const next = source!.tiles.map((t, i) =>
        i === index ? { ...t, georeferenced: !t.georeferenced } : t
      );
      await saveTiles(next);
    }

    async function removeTile(index: number) {
      if (!confirm('Remove this tile?')) return;
      const next = source!.tiles.filter((_, i) => i !== index);
      await saveTiles(next);
    }

    async function addTile() {
      if (!tileDraft.url.trim()) return;
      const next = [...source!.tiles, {
        url: tileDraft.url.trim(),
        label: tileDraft.label.trim() || `Sheet ${source!.tiles.length + 1}`,
        georeferenced: false,
      }];
      setAddingTile(false);
      setTileDraft({ url: '', label: '' });
      await saveTiles(next);
    }

    return (
      <div className="py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm shrink-0 ${verifiedCount > 0 ? 'text-green-500' : 'text-gray-300'}`}>
            {verifiedCount > 0 ? '\u2713' : '\u25CB'}
          </span>
          <span className="text-sm text-gray-700 font-medium">
            XYZ Tiles
            <span className="text-gray-400 font-normal ml-1.5">
              ({source!.tiles.length} total, {verifiedCount} verified)
            </span>
          </span>
          <div className="flex-1" />
          <button
            onClick={() => { setAddingTile(true); setGateErrors(null); }}
            className="text-xs text-blue-500 hover:text-blue-700 shrink-0"
          >
            + Add
          </button>
          <HelpButton helpKey="tiles" />
        </div>

        <div className="ml-6 mt-2 space-y-1">
          {source!.tiles.length === 0 && !addingTile && (
            <p className="text-xs text-gray-400 italic">No tiles yet</p>
          )}
          {source!.tiles.map((tile, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1 group">
              <button
                onClick={() => toggleVerified(i)}
                className={`shrink-0 ${tile.georeferenced ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                title={tile.georeferenced ? 'Verified — click to unverify' : 'Click to mark verified'}
                disabled={isSaving}
              >
                {tile.georeferenced ? '\u2713' : '\u25CB'}
              </button>
              <span className="text-gray-700 font-medium shrink-0">{tile.label}</span>
              <span className="text-gray-400 font-mono truncate">{tile.url}</span>
              <CopyButton text={tile.url} field={`tile-${i}`} />
              <button
                onClick={() => removeTile(i)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Remove tile"
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
                  if (e.key === 'Enter' && tileDraft.url.trim()) addTile();
                  if (e.key === 'Escape') { setAddingTile(false); setTileDraft({ url: '', label: '' }); }
                }}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://allmaps.xyz/maps/{hash}/{z}/{x}/{y}.png"
                autoFocus
              />
              <button onClick={addTile} disabled={!tileDraft.url.trim()}
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

        <HelpPanel helpKey="tiles" />
      </div>
    );
  }

  // --- Bounds Row ---
  function BoundsRow() {
    const isEditing = editingField === 'bounds';
    const isSaving = savingField === 'bounds';

    return (
      <div className="py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm shrink-0 ${hasBounds ? 'text-green-500' : 'text-gray-300'}`}>
            {hasBounds ? '\u2713' : '\u25CB'}
          </span>
          <span className="text-sm text-gray-700 font-medium flex-1">Spatial Extent</span>
          {!isEditing && (
            <button onClick={startEditingBounds}
              className="text-xs text-blue-500 hover:text-blue-700 shrink-0">
              {hasBounds ? 'Edit' : 'Set'}
            </button>
          )}
          <HelpButton helpKey="bounds" />
        </div>

        {isEditing ? (
          <div className="ml-6 mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">West (lon)</label>
                <input type="number" step="any" value={boundsDraft.w}
                  onChange={e => setBoundsDraft(prev => ({ ...prev, w: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">East (lon)</label>
                <input type="number" step="any" value={boundsDraft.e}
                  onChange={e => setBoundsDraft(prev => ({ ...prev, e: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">South (lat)</label>
                <input type="number" step="any" value={boundsDraft.s}
                  onChange={e => setBoundsDraft(prev => ({ ...prev, s: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">North (lat)</label>
                <input type="number" step="any" value={boundsDraft.n}
                  onChange={e => setBoundsDraft(prev => ({ ...prev, n: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving} />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveBounds(boundsDraft.w, boundsDraft.s, boundsDraft.e, boundsDraft.n)}
                disabled={isSaving}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                {isSaving ? '...' : 'Save'}
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
          <div className="ml-6 mt-1 text-xs text-gray-500 font-mono">
            W:{source!.bounds_west} S:{source!.bounds_south} E:{source!.bounds_east} N:{source!.bounds_north}
          </div>
        ) : (
          <div className="ml-6 mt-1 text-xs text-gray-400 italic">
            Not set — needed to position the overlay
          </div>
        )}

        <HelpPanel helpKey="bounds" />
      </div>
    );
  }

  // --- Gate errors for advance ---
  const nextStage = source.stage < 4 ? source.stage + 1 : null;
  const advanceErrors = nextStage ? getStageGateErrors(source, nextStage) : [];
  const canAdvance = nextStage !== null && advanceErrors.length === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{source.name}</h1>
            {source.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{source.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditingIdentity(true)}
              className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              Edit details
            </button>
            <button onClick={handleDelete}
              className="px-2.5 py-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
              Delete
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: era?.color || '#6b7280' }}>
            {era?.label || source.era}
          </span>
          <span className="text-xs text-gray-500">{SOURCE_TYPES[source.source_type]}</span>
          {(source.year_start || source.year_end) && (
            <>
              <span className="text-xs text-gray-300">&middot;</span>
              <span className="text-xs text-gray-500">
                {source.year_start || '?'} &ndash; {source.year_end || '?'}
              </span>
            </>
          )}
          <span className="text-xs text-gray-300">&middot;</span>
          <span className="text-xs text-gray-500">Stage {source.stage}: {STAGES[source.stage]}</span>
        </div>
      </div>

      {/* Pipeline Card */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Pipeline</h2>
        </div>
        <div className="px-4 divide-y divide-gray-100">
          <UrlRow field="source_url" label="Source URL" value={source.source_url} />
          <UrlRow field="iiif_url" label="IIIF Manifest" value={source.iiif_url} />
          <UrlRow field="georeference_url" label="Georeference Annotation" value={source.georeference_url} />
          <TilesRow />
          <BoundsRow />
        </div>

        {/* Stage Controls */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-3">
            {nextStage && (
              <button
                onClick={handleAdvanceStage}
                disabled={!canAdvance}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${canAdvance
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Advance to {STAGES[nextStage]}
              </button>
            )}
            {source.stage > 1 && (
              <button onClick={handleRevertStage}
                className="text-xs text-gray-400 hover:text-gray-600">
                Revert to {STAGES[source.stage - 1]}
              </button>
            )}
          </div>
          {/* Inline gate errors */}
          {!canAdvance && nextStage && (gateErrors !== null ? (
            <div className="mt-2 space-y-1">
              {gateErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-500">{err}</p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              Missing: {advanceErrors.map(e => e.replace(/^Stage \d requires /, '')).join(', ')}
            </p>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700">Notes</h2>
          {editingField !== 'notes' && (
            <button onClick={() => startEditing('notes', source.notes)}
              className="text-xs text-gray-400 hover:text-gray-600">
              {source.notes ? 'Edit' : 'Add'}
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
        ) : source.notes ? (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{source.notes}</p>
        ) : (
          <p className="text-xs text-gray-400 italic">No notes</p>
        )}
      </div>

      {/* Files */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Files
          {source.files.length > 0 && (
            <span className="text-gray-400 font-normal ml-1">({source.files.length})</span>
          )}
        </h2>

        {source.files.length > 0 && (
          <div className="space-y-1 mb-3">
            {source.files.map((file: SourceFile) => (
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
        )}

        <div className="flex items-center gap-2">
          <select
            value={uploadType}
            onChange={e => setUploadType(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-600"
          >
            {FILE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition-colors">
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
    </div>
  );
}
