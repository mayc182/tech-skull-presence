import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ingressAware, updateDeviceEntity } from '../api/client';

interface ZoneEndEntities {
  zone1: string;
  zone2: string;
  zone3: string;
}

interface HPDistanceBandsPanelProps {
  deviceId: string;
  zoneEndEntities: ZoneEndEntities;
  /** Current detected distance in cm (live). Pass null when no target. */
  liveDistanceCm: number | null;
  /** Live zone occupancy flags (any subset). */
  zoneOccupancy?: { zone1?: boolean; zone2?: boolean; zone3?: boolean };
  /** Max range of the visualization in cm. Defaults to 600 (LD2410 typical). */
  maxRangeCm?: number;
}

interface BandValues {
  zone1: number;
  zone2: number;
  zone3: number;
}

const fetchEntityNumberState = async (entityId: string): Promise<number | null> => {
  try {
    const res = await fetch(ingressAware(`api/live/ha/states/${entityId}`));
    if (!res.ok) return null;
    const data = (await res.json()) as { state?: string | number };
    const n = Number(data?.state);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

/**
 * Visual editor for the 3 distance-based "zones" on LD2410-style devices.
 * Renders an SVG horizontal axis with 3 colored bands separated by editable
 * boundaries (`zone1EndDistance`, `zone2EndDistance`, `zone3EndDistance`).
 * Shows the live `liveDistanceCm` as a vertical marker and highlights the
 * currently-occupied band via `zoneOccupancy`.
 */
export const HPDistanceBandsPanel: React.FC<HPDistanceBandsPanelProps> = ({
  deviceId,
  zoneEndEntities,
  liveDistanceCm,
  zoneOccupancy,
  maxRangeCm = 600,
}) => {
  const [bands, setBands] = useState<BandValues | null>(null);
  const [saving, setSaving] = useState<keyof BandValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const settledRef = useRef(false);

  // Fetch initial band values from HA when entities are known.
  useEffect(() => {
    let cancelled = false;
    settledRef.current = false;
    (async () => {
      const [v1, v2, v3] = await Promise.all([
        fetchEntityNumberState(zoneEndEntities.zone1),
        fetchEntityNumberState(zoneEndEntities.zone2),
        fetchEntityNumberState(zoneEndEntities.zone3),
      ]);
      if (cancelled) return;
      if (v1 != null && v2 != null && v3 != null) {
        setBands({ zone1: v1, zone2: v2, zone3: v3 });
        settledRef.current = true;
      } else {
        setError('Could not read current band values from Home Assistant');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zoneEndEntities.zone1, zoneEndEntities.zone2, zoneEndEntities.zone3]);

  const persist = useCallback(
    async (key: keyof BandValues, value: number, optimistic: BandValues) => {
      setSaving(key);
      setError(null);
      try {
        await updateDeviceEntity(deviceId, zoneEndEntities[key], value);
        setBands(optimistic);
      } catch (err) {
        setError(`Failed to save ${key}: ${(err as Error).message}`);
      } finally {
        setSaving(null);
      }
    },
    [deviceId, zoneEndEntities]
  );

  const handleInputCommit = useCallback(
    (key: keyof BandValues, raw: string) => {
      if (!bands) return;
      const value = parseInt(raw, 10);
      if (!Number.isFinite(value) || value < 0 || value > maxRangeCm) return;
      // Enforce ordering: zone1 < zone2 < zone3.
      if (key === 'zone1' && value >= bands.zone2) return;
      if (key === 'zone2' && (value <= bands.zone1 || value >= bands.zone3)) return;
      if (key === 'zone3' && value <= bands.zone2) return;
      if (value === bands[key]) return;
      const optimistic = { ...bands, [key]: value };
      void persist(key, value, optimistic);
    },
    [bands, maxRangeCm, persist]
  );

  if (!bands && !error) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Distance Bands</h2>
        <p className="text-sm text-slate-400">Loading current values from Home Assistant…</p>
      </div>
    );
  }

  if (!bands) {
    return (
      <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Distance Bands</h2>
        <p className="text-sm text-rose-300">{error ?? 'Unknown error'}</p>
      </div>
    );
  }

  // ──────── SVG layout ────────
  const W = 600;
  const H = 96;
  const pad = 20;
  const trackW = W - pad * 2;
  const trackY = 32;
  const trackH = 22;
  const toX = (cm: number) => pad + (Math.max(0, Math.min(cm, maxRangeCm)) / maxRangeCm) * trackW;
  const liveX = liveDistanceCm != null ? toX(liveDistanceCm) : null;

  const bandDefs = [
    { id: 'zone1' as const, start: 0,           end: bands.zone1, color: '#10b981', label: 'Z1', occupied: zoneOccupancy?.zone1 },
    { id: 'zone2' as const, start: bands.zone1, end: bands.zone2, color: '#f59e0b', label: 'Z2', occupied: zoneOccupancy?.zone2 },
    { id: 'zone3' as const, start: bands.zone2, end: bands.zone3, color: '#ef4444', label: 'Z3', occupied: zoneOccupancy?.zone3 },
  ];

  const ticks: number[] = [];
  for (let cm = 0; cm <= maxRangeCm; cm += 100) ticks.push(cm);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Distance Bands</h2>
        <span className="text-xs uppercase tracking-wider text-slate-500">LD2410 · 1D zones</span>
      </div>

      {error && (
        <div className="mb-3 rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">{error}</div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Track background (range beyond zone3) */}
        <rect x={pad} y={trackY} width={trackW} height={trackH} fill="#1e293b" rx={4} />

        {/* Colored bands */}
        {bandDefs.map((band) => {
          const x = toX(band.start);
          const w = Math.max(0, toX(band.end) - x);
          if (w <= 0) return null;
          return (
            <g key={band.id}>
              <rect
                x={x}
                y={trackY}
                width={w}
                height={trackH}
                fill={band.color}
                opacity={band.occupied ? 0.95 : 0.55}
                stroke={band.occupied ? '#ffffff' : 'none'}
                strokeWidth={band.occupied ? 1.5 : 0}
              />
              {w > 26 && (
                <text
                  x={x + w / 2}
                  y={trackY + trackH / 2 + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {band.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Tick marks + labels */}
        {ticks.map((cm) => (
          <g key={cm}>
            <line x1={toX(cm)} x2={toX(cm)} y1={trackY + trackH} y2={trackY + trackH + 5} stroke="#64748b" strokeWidth={1} />
            <text x={toX(cm)} y={trackY + trackH + 17} textAnchor="middle" fill="#94a3b8" fontSize="10">
              {cm}
            </text>
          </g>
        ))}

        {/* Live distance marker (yellow arrow + line) */}
        {liveX != null && liveDistanceCm != null && liveDistanceCm > 0 && (
          <g>
            <line x1={liveX} x2={liveX} y1={trackY - 8} y2={trackY + trackH + 2} stroke="#fbbf24" strokeWidth={2} />
            <polygon points={`${liveX},${trackY - 10} ${liveX - 5},${trackY - 20} ${liveX + 5},${trackY - 20}`} fill="#fbbf24" />
          </g>
        )}
      </svg>

      {/* Editable values */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {(['zone1', 'zone2', 'zone3'] as const).map((key) => (
          <label key={key} className="flex flex-col text-xs text-slate-400">
            <span className="mb-1">
              Zone {key.slice(-1)} end <span className="text-slate-500">(cm)</span>
            </span>
            <input
              type="number"
              min={0}
              max={maxRangeCm}
              step={1}
              defaultValue={bands[key]}
              key={`${key}-${bands[key]}`}
              disabled={saving !== null}
              onBlur={(e) => handleInputCommit(key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-60"
            />
            {saving === key && <span className="mt-1 text-amber-400">Saving…</span>}
          </label>
        ))}
      </div>

      {liveDistanceCm != null && liveDistanceCm > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Live target at <span className="font-medium text-amber-300">{liveDistanceCm} cm</span>
        </p>
      )}
    </div>
  );
};
