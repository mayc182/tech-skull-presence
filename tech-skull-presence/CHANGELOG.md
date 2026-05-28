# Changelog — Tech Skull Presence

All notable changes to this add-on. Versions follow the `version:` field in `config.yaml`.

## 0.2.0 — Device control panels (Phase 5)

- **New: Device Controls panel** on the dashboard for HP LD2410 variants, adapting to each device's hardware:
  - **No-Disturb toggle** — flips `switch.${name}_no_disturb_mode` (silences the CO2 LED, and the buzzer on Niños).
  - **CO2 LED toggle** — turns the WS2812 indicator (`light.${name}_co2_led`) on/off.
  - **Buzzer melody tester** (Niños) — discovers the device's melody/test `button.*` entities dynamically (their slugs are unpredictable due to emoji/accents in firmware names) and renders a play button for each.
- **Backend**: the entity write endpoint now supports the `light` (turn_on/off) and `button` (press) domains, in addition to number/select/switch/input_boolean. Added `setLightEntity` and `pressButton` to the write client.
- Panel visibility is capability-gated: it only appears when the relevant entities are mapped, and the buzzer section only for the `myumar_hp_ninos` profile.

> Still planned: multi-device "virtual rooms" (aggregate several HP devices into one logical space).

## 0.1.3 — Documentation

- Rewrote the in-add-on **Documentation** tab (`DOCS.md`) as a complete user manual for Tech Skull Presence: install, setup wizard, profiles, 2D + 1D zone editors, dashboards, updating and troubleshooting. (Previously still showed Everything Presence / Zone Configurator content.)
- Trimmed `CHANGELOG.md` to this fork's history with a credit note to upstream.
- Rebranded `DOCS-DOCKER.md` for standalone Docker (build-from-source, no external registry image).
- Added reference docs: `docs/PROFILES.md` (per-profile entity reference + auto-detection scoring) and `docs/TROUBLESHOOTING.md`.

## 0.1.2 — Profile auto-detection

- **New**: the wizard now auto-detects the correct device profile from the device's actual entities, instead of matching by `model` (which always returned the first profile because every HP device reports `model = HP_series`). This is what caused `hp_01_saladeestar` to be assigned the `myumar_hp_lite` profile.
- Backend: `GET /api/devices/:deviceId/suggest-profile` scores every profile against the device's entities (required entities dominate; the most complete optional match wins; tightest fit breaks ties) and returns a ranked suggestion.
- Frontend: selecting a device in the wizard calls the suggestion endpoint and pre-selects the best-fit profile; falls back to model match / manual selection if the call fails.
- Note: `myumar_hp_saladeestar` and `myumar_hp_ninos` expose identical entities (the RTTTL buzzer has no unique entity), so they're interchangeable from auto-detection's point of view — pick `ninos` manually if you want the buzzer panel later.

## 0.1.1 — Matching robustness

- **Fix**: entity auto-match now resolves suffix collisions via a shortest-id tie-breaker. Previously a template suffix like `_presence` matched `presence`, `moving_presence` and `still_presence` simultaneously and produced a "conflict" that left the required `presence` entity unmapped. The bare (shortest) entity is now picked automatically; genuine equal-length ties still require user review.
- This makes the `myumar_hp_mini` profile (which exposes `presence` + `moving_presence` + `still_presence`) map cleanly without manual intervention.

## 0.1.0 — MYumar.HP_series fork

First release of **Tech Skull Presence**, a fork of [everything-presence-mmwave-configurator](https://github.com/EverythingSmartHome/everything-presence-addons) tailored to the MYumar.HP_series family of DIY ESP32-C3 presence sensors.

### What changed from upstream

- **Branding**: renamed add-on to `tech-skull-presence`, new logo, panel icon `mdi:skull-scan-outline`. Persistent data dir moved to `/config/tech-skull-presence`.
- **Device discovery**: filter switched from manufacturer "Everything Smart Technology" to **"MYumar"** (derived from `esphome.project.name = "MYumar.HP_series"`). Entity prefix regex extended with ~50 LD2410/LD2450/SCD40/BH1750/WS2812/RTTTL-specific suffixes.
- **Device profiles**: official EP1/Lite/Pro profiles removed; 5 new profiles for the HP-series prototypes:
  - `myumar_hp_mini` — bare LD2410
  - `myumar_hp_saladeestar` — LD2410 + SCD40 + WS2812 LED
  - `myumar_hp_luz` — adds BH1750 illuminance
  - `myumar_hp_ninos` — adds RTTTL buzzer for CO2 melodies
  - `myumar_hp_lite` — LD2450 with 2D rectangular zones (`x1/y1/x2/y2` → `beginX/beginY/endX/endY` mapping)
- **New UI**: `HPDistanceBandsPanel` — 1D distance-band editor for LD2410 variants (SVG axis, live target marker, occupied-band highlight, in-place numeric editing of `zone1/2/3 EndDistance`).

### Known limitations

- Firmware update flow still references upstream EP firmware indexes; HP devices show "no firmware available" until an HP firmware index is hosted.
- Buzzer melody tester and No-Disturb global toggle not yet exposed in UI (planned for v0.2).
- Multi-device "virtual rooms" (aggregate several HP devices) not yet implemented (planned for v0.2).

---

Forked from [EverythingSmartHome/everything-presence-addons](https://github.com/EverythingSmartHome/everything-presence-addons). Upstream changelog history lives in that project. Credit to the Everything Smart Home team for the original Zone Configurator.
