import React, { useCallback, useEffect, useState } from 'react';
import { ingressAware, updateDeviceEntity } from '../api/client';

interface HPZoneModeControlProps {
  deviceId: string;
  /** select.${name}_radar_modo_zonas — the LD2450 zone_type select. */
  zoneModeEntityId: string;
}

interface SelectState {
  current: string;
  options: string[];
}

const fetchSelectState = async (entityId: string): Promise<SelectState | null> => {
  try {
    const res = await fetch(ingressAware(`api/live/ha/states/${entityId}`));
    if (!res.ok) return null;
    const data = (await res.json()) as {
      state?: string;
      attributes?: { options?: string[] };
    };
    if (typeof data?.state !== 'string') return null;
    return {
      current: data.state,
      options: Array.isArray(data.attributes?.options) ? data.attributes!.options! : [],
    };
  } catch {
    return null;
  }
};

const describeMode = (mode: string): string => {
  const m = mode.toLowerCase();
  if (m.includes('filter') || m.includes('filtro')) return 'Targets inside the zones are IGNORED — presence elsewhere still detected.';
  if (m.includes('detection') || m.includes('detec')) return 'Only targets INSIDE the zones are reported.';
  if (m.includes('disab') || m.includes('desact')) return 'Zones do nothing — full-room detection.';
  return '';
};

/**
 * LD2450 zone-mode control for the Zone Editor toolbar.
 *
 * The LD2450 applies one global mode to all defined zones via its `zone_type`
 * select:
 *   - Detection → report only targets inside the zones
 *   - Filter    → ignore targets inside the zones (exclusion)
 *   - Disabled  → zones inactive
 *
 * Setting "Filter" + drawing a zone is how you make Home Assistant ignore
 * presence in a specific area of the room.
 */
export const HPZoneModeControl: React.FC<HPZoneModeControlProps> = ({ deviceId, zoneModeEntityId }) => {
  const [state, setState] = useState<SelectState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchSelectState(zoneModeEntityId);
      if (!cancelled) setState(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [zoneModeEntityId]);

  const onChange = useCallback(
    async (value: string) => {
      if (!state || value === state.current) return;
      setSaving(true);
      setError(null);
      const prev = state.current;
      setState({ ...state, current: value });
      try {
        await updateDeviceEntity(deviceId, zoneModeEntityId, value);
      } catch (err) {
        setState((s) => (s ? { ...s, current: prev } : s));
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [deviceId, zoneModeEntityId, state]
  );

  if (!state) return null;

  const isFilter = state.current.toLowerCase().includes('filter') || state.current.toLowerCase().includes('filtro');

  return (
    <div
      className={`rounded-xl border backdrop-blur px-4 py-3 shadow-lg ${
        isFilter ? 'border-rose-500/50 bg-rose-600/15' : 'border-slate-600/50 bg-slate-800/60'
      }`}
    >
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
        Zone Mode {isFilter && <span className="text-rose-300">· exclusion</span>}
      </div>
      <select
        value={state.current}
        disabled={saving || state.options.length === 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-100 focus:border-aqua-500 focus:outline-none disabled:opacity-60"
      >
        {(state.options.length > 0 ? state.options : [state.current]).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <p className="mt-1.5 max-w-[14rem] text-[11px] leading-snug text-slate-400">
        {describeMode(state.current) || 'LD2450 zone behaviour'}
      </p>
      {error && <p className="mt-1 text-[11px] text-rose-300">{error}</p>}
    </div>
  );
};
