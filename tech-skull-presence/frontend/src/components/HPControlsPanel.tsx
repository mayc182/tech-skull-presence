import React, { useCallback, useEffect, useState } from 'react';
import { ingressAware, updateDeviceEntity } from '../api/client';
import { getDeviceEntities } from '../api/entityDiscovery';

interface HPControlsPanelProps {
  deviceId: string;
  /** switch.${name}_no_disturb_mode — silences LED (and buzzer on Niños). */
  noDisturbEntityId?: string | null;
  /** light.${name}_co2_led — the WS2812 CO2 indicator. */
  co2LedEntityId?: string | null;
  /** Whether this device has the RTTTL buzzer (Niños) — enables the melody tester. */
  hasBuzzer?: boolean;
}

interface MelodyButton {
  entityId: string;
  label: string;
}

const fetchOnOffState = async (entityId: string): Promise<boolean | null> => {
  try {
    const res = await fetch(ingressAware(`api/live/ha/states/${entityId}`));
    if (!res.ok) return null;
    const data = (await res.json()) as { state?: string };
    if (typeof data?.state !== 'string') return null;
    return data.state.toLowerCase() === 'on';
  } catch {
    return null;
  }
};

/**
 * Device-specific controls for MYumar.HP_series LD2410 variants:
 *  - No-Disturb toggle (switch)
 *  - CO2 LED toggle (light)
 *  - RTTTL buzzer melody tester (dynamically discovered button entities)
 *
 * Each section renders only when its entity is available, so the panel adapts
 * to the device variant (Saladeestar / Luz / Niños).
 */
export const HPControlsPanel: React.FC<HPControlsPanelProps> = ({
  deviceId,
  noDisturbEntityId,
  co2LedEntityId,
  hasBuzzer,
}) => {
  const [noDisturbOn, setNoDisturbOn] = useState<boolean | null>(null);
  const [ledOn, setLedOn] = useState<boolean | null>(null);
  const [melodies, setMelodies] = useState<MelodyButton[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial states.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (noDisturbEntityId) {
        const s = await fetchOnOffState(noDisturbEntityId);
        if (!cancelled) setNoDisturbOn(s);
      }
      if (co2LedEntityId) {
        const s = await fetchOnOffState(co2LedEntityId);
        if (!cancelled) setLedOn(s);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noDisturbEntityId, co2LedEntityId]);

  // Discover buzzer melody buttons dynamically (their slugs are unpredictable
  // because the firmware names them with emojis/accents).
  useEffect(() => {
    if (!hasBuzzer) return;
    let cancelled = false;
    (async () => {
      try {
        const { entities } = await getDeviceEntities(deviceId);
        const found = entities
          .filter((e) => e.entity_id.startsWith('button.'))
          .filter((e) => /melod|test/i.test(e.entity_id) || /melod|test/i.test(e.name ?? ''))
          .map((e) => ({
            entityId: e.entity_id,
            label: (e.name && e.name.trim()) || e.entity_id.replace(/^button\./, ''),
          }));
        if (!cancelled) setMelodies(found);
      } catch {
        /* non-fatal: just no melody buttons shown */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceId, hasBuzzer]);

  const toggle = useCallback(
    async (entityId: string, current: boolean | null, setter: (v: boolean) => void, key: string) => {
      const next = !current;
      setBusy(key);
      setError(null);
      try {
        await updateDeviceEntity(deviceId, entityId, next);
        setter(next);
      } catch (err) {
        setError(`Failed to toggle ${key}: ${(err as Error).message}`);
      } finally {
        setBusy(null);
      }
    },
    [deviceId]
  );

  const press = useCallback(
    async (entityId: string) => {
      setBusy(entityId);
      setError(null);
      try {
        await updateDeviceEntity(deviceId, entityId, true);
      } catch (err) {
        setError(`Failed to play: ${(err as Error).message}`);
      } finally {
        setBusy(null);
      }
    },
    [deviceId]
  );

  const hasAnything = noDisturbEntityId || co2LedEntityId || (hasBuzzer && melodies.length > 0);
  if (!hasAnything) return null;

  const Toggle: React.FC<{ label: string; on: boolean | null; onClick: () => void; busyKey: string; hint?: string }> = ({
    label,
    on,
    onClick,
    busyKey,
    hint,
  }) => (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
      <button
        type="button"
        disabled={busy === busyKey || on === null}
        onClick={onClick}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
          on ? 'bg-emerald-500' : 'bg-slate-600'
        }`}
        aria-pressed={!!on}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Device Controls</h2>
        <span className="text-xs uppercase tracking-wider text-slate-500">MYumar.HP_series</span>
      </div>

      {error && (
        <div className="mb-3 rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">{error}</div>
      )}

      <div className="space-y-3">
        {noDisturbEntityId && (
          <Toggle
            label="No-Disturb Mode"
            hint="Silences the CO2 LED (and buzzer on Niños)"
            on={noDisturbOn}
            busyKey="noDisturb"
            onClick={() => toggle(noDisturbEntityId, noDisturbOn, setNoDisturbOn, 'noDisturb')}
          />
        )}

        {co2LedEntityId && (
          <Toggle
            label="CO2 LED"
            hint="WS2812 air-quality indicator"
            on={ledOn}
            busyKey="led"
            onClick={() => toggle(co2LedEntityId, ledOn, setLedOn, 'led')}
          />
        )}

        {hasBuzzer && melodies.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-4 py-3">
            <div className="mb-2 text-sm font-medium text-white">Buzzer melody tester</div>
            <div className="flex flex-wrap gap-2">
              {melodies.map((m) => (
                <button
                  key={m.entityId}
                  type="button"
                  disabled={busy === m.entityId}
                  onClick={() => press(m.entityId)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white transition-colors hover:border-aqua-500 hover:bg-slate-800 disabled:opacity-50"
                  title={m.entityId}
                >
                  ▶ {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
