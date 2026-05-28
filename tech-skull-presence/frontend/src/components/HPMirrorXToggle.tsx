import React, { useCallback, useEffect, useState } from 'react';
import { getMirrorX, setMirrorX } from '../api/deviceMappings';

interface HPMirrorXToggleProps {
  deviceId: string;
  /** Called after a successful toggle so the editor can refresh zones/targets. */
  onAfterChange?: () => void;
}

/**
 * Toggle to mirror the X axis of a tracking radar mounted flipped (e.g. an LD2450
 * installed upside-down so left/right come out inverted). The flag lives in the
 * device mapping; the backend negates target X and zone X consistently, so no
 * firmware re-flash is needed.
 */
export const HPMirrorXToggle: React.FC<HPMirrorXToggleProps> = ({ deviceId, onAfterChange }) => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const v = await getMirrorX(deviceId);
      if (!cancelled) setEnabled(v);
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const onToggle = useCallback(async () => {
    if (enabled === null) return;
    const next = !enabled;
    setSaving(true);
    setError(null);
    try {
      const result = await setMirrorX(deviceId, next);
      if (result === null) {
        setError('Sync the device first');
        return;
      }
      setEnabled(result);
      onAfterChange?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [deviceId, enabled, onAfterChange]);

  if (enabled === null) return null;

  return (
    <div
      className={`rounded-xl border backdrop-blur px-4 py-3 shadow-lg ${
        enabled ? 'border-amber-500/50 bg-amber-600/15' : 'border-slate-600/50 bg-slate-800/60'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Mirror X</span>
        <button
          type="button"
          disabled={saving}
          onClick={onToggle}
          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-amber-500' : 'bg-slate-600'
          }`}
          aria-pressed={enabled}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      <p className="max-w-[14rem] text-[11px] leading-snug text-slate-400">
        Flip left/right if the radar is mounted upside-down. No re-flash needed.
      </p>
      {error && <p className="mt-1 text-[11px] text-rose-300">{error}</p>}
    </div>
  );
};
