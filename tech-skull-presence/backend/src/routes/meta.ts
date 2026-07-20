import { Router } from 'express';
import { AppConfig, redactedHaConfig } from '../config';
import type { TransportStatus } from '../server';

export const createMetaRouter = (config: AppConfig, transportStatus?: TransportStatus): Router => {
  const router = Router();

  // Add-on version, resolved once from the Supervisor (config.yaml's version
  // is not baked into the image). Falls back to ADDON_VERSION env (standalone).
  let cachedVersion: string | null | undefined;
  const resolveVersion = async (): Promise<string | null> => {
    if (cachedVersion !== undefined) return cachedVersion;
    if (config.ha.mode === 'supervisor' && config.ha.supervisorApiUrl) {
      try {
        const res = await fetch(`${config.ha.supervisorApiUrl}/addons/self/info`, {
          headers: { Authorization: `Bearer ${config.ha.token}` },
        });
        if (res.ok) {
          const body = (await res.json()) as { data?: { version?: string } };
          cachedVersion = body?.data?.version ?? null;
          return cachedVersion;
        }
      } catch {
        /* fall through to env */
      }
    }
    cachedVersion = process.env.ADDON_VERSION ?? null;
    return cachedVersion;
  };

  router.get('/version', async (_req, res) => {
    res.json({ version: await resolveVersion() });
  });

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: config.ha.mode,
      readTransport: transportStatus?.readTransport ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/config', (_req, res) => {
    res.json({
      port: config.port,
      mode: config.ha.mode,
      readTransport: transportStatus?.readTransport ?? 'unknown',
      writeTransport: transportStatus?.writeTransport ?? 'rest',
      transportStatus: transportStatus
        ? {
            websocket: transportStatus.wsAvailable ? 'available' : 'unavailable',
            rest: transportStatus.restAvailable ? 'available' : 'unavailable',
          }
        : undefined,
      ha: redactedHaConfig(config.ha),
    });
  });

  return router;
};
