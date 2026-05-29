# Changelog — Tech Skull Presence

All notable changes to this add-on. Versions follow the `version:` field in `config.yaml`.

## 0.5.0 — Pro phase: software polygon zones (EP-Pro class)

Turns one LD2450 into an "EP-Pro": arbitrary **polygon** detection/exclusion zones
computed in firmware from the raw target X/Y — overcoming the LD2450's native
limit of 3 axis-aligned zones + single global mode.

- **New profile** `myumar_hp_pro`: `polygonZones: true`, 4 detection + 2 exclusion
  polygons, per-zone occupancy sensors, filtered occupancy. Wires to the add-on's
  existing polygon editor (polygon text entities + occupancy).
- **New firmware** `firmware/hp-02-pro.yaml` (for the lite-2 board, project v2.0.0):
  - `text` entities `polygon_zone_1..4` + `polygon_exclusion_1..2` (the add-on
    writes `"x1:y1;x2:y2;..."` mm strings here).
  - A 1 Hz engine: parses the polygons, runs **ray-casting point-in-polygon** for
    each of the 3 targets, sets per-zone occupancy and a **filtered presence**
    (inside a detection polygon AND not inside an exclusion polygon).
  - `Polygon Zones` switch to enable/disable the software engine (off = raw presence).
  - Per-zone mode is implicit: a polygon drawn as "exclusion" lands in a different
    text entity, so you CAN mix detect-here / ignore-there — the thing the native
    LD2450 couldn't do.

⚠️ Most advanced firmware yet and **untested from the build host** — flash on the
lite-2 board (it becomes `hp-02-pro`), expect to iterate. Reuses the lite-2 secrets.



## 0.4.4 — Comfort panel rounding + hardware BOM

- **Fix**: "Feels Like" no longer shows a raw float (e.g. 30.2951564788818°C) —
  rounded to 1 decimal.
- **Docs**: added `docs/HARDWARE-BOM.md` — a shopping list to build an EP-class DIY
  sensor (LD2450 + PIR + SCD41 + SHT40 + BH1750 + WS2812 + buzzer on ESP32-S3),
  mapping each part to the add-on features it unlocks.

## 0.4.3 — HP dashboard cleanup (buzzer, mmWave/PIR, fit, EP1 cruft)

Adjusts the live dashboard so it reflects what HP LD2410 devices actually have:
- **Buzzer melody tester** now always probes the device's melody buttons, so it
  appears even when the device was auto-matched to the Saladeestar profile (which
  is indistinguishable from Niños by entities). If your device has the melody
  buttons, the tester shows.
- **mmWave / PIR cards** are hidden when the device has no such entity (HP LD2410
  has neither), instead of showing a misleading "Inactive / No Motion".
- **EP1-only panels hidden** for HP: "Settings Recommendations / Current Mode"
  (mmWave tuning that doesn't exist here) and "Sensor Comparison".
- **Detection Visualization** now fits the room outline (was a fixed 25 m view
  that cut the walls off) and uses the real 6 m radar range.

> "Light --" on Niños is correct — only HP-Luz has the BH1750. CO2/temp/humidity
> read fine. To get the buzzer tester, the device's melody test buttons must be
> enabled in Home Assistant.

## 0.4.2 — Full radar settings for LD2410 profiles

- The 4 LD2410 profiles now expose the complete radar settings so they appear in
  the **Device Settings** modal (gear in the Live view): **Engineering Mode**,
  **Distance Resolution** (0.2 m / 0.75 m), **Radar Baud Rate**, **Bluetooth**,
  **Light Threshold**, **Max Move/Still Distance Gate** — plus the existing
  timeout / distance bands / (CO2 offsets, LED, No-Disturb where applicable).
- Profile schema bumped to 1.1 → **re-sync entities** on each LD2410 device to pick
  up the new settings.

> Where to find it: open the **Live** view, select the room, open **Device Settings**
> (gear icon). All sensor settings live there.

> Note on the FoV cone: it extends to the profile's max range (6 m) but is **clipped
> to your drawn walls** when "Clip radar to walls" is on — if the cone looks short,
> either the room outline is small or turn that toggle off.

## 0.4.1 — Mount the environmental/controls dashboard (fix)

- **Fix**: the CO2 / temperature / humidity / illuminance panel, the device
  controls (No-Disturb, CO2 LED, **buzzer melody tester**) and the 1D distance-band
  editor were built into `EP1Dashboard`, but that component was never rendered in
  this fork — so none of them appeared. The Live view now renders `EP1Dashboard`
  for **distance-only (LD2410) devices** (saladeestar / luz / niños), so all those
  panels finally show. 2D devices (lite/LD2450) keep the tracking canvas.
- Rebranded the dashboard header to "MYumar.HP_series".

> To see them: open the **Live** view and select a room whose device is an LD2410
> variant. The lite (LD2450) has no CO2/lux/buzzer, so it shows the tracking canvas.

## 0.4.0 — Floor-plan tracing template

Upload a floor-plan image and trace your room over it (in **Room Builder**).

- **Upload**: pick an image; it's stored with the room (base64) and rendered as a
  backdrop under the grid/walls/zones.
- **Opacity** slider.
- **Scale calibration**: click "Calibrate scale", click two points a known
  distance apart on the plan, enter the real metres — the image rescales so it
  matches the room's real-world coordinates. Repeat to refine.
- **Replace / Remove** controls.

Backend: `RoomConfig.floorPlan` persisted; `express.json` limit raised to 25 MB
to carry the image; room normaliser preserves the new field.

⚠️ v1 — needs real-world testing. Large images make the room config bigger; the
image lives at the top-left offset and scales from there (reposition by editing,
drag-to-move planned for a later version).

## 0.3.1 — Readable zone labels + in-zone target highlight

- **Fix**: zone labels are now always drawn **upright and centred**, regardless of
  device rotation or Mirror X. Previously they inherited the zone rotation and
  appeared upside-down/flipped.
- **New (calibration)**: a live target is **recoloured rose and enlarged when it
  falls inside any drawn zone**, so you can verify a zone covers the right area
  without the target vanishing. Note: in **Filter** mode the radar hides targets
  inside the zone — keep Zone Mode on **Detection/Disabled** while calibrating,
  then switch to Filter for production.

## 0.3.0 — Entry/Exit zones (assumed presence) for LD2450

DIY entry/exit detection implemented in the LD2450 firmware (no native support).

**Firmware (hp-02-lite + hp-02-lite-2, project v1.2.0):**
- One **Entry Zone** rectangle (`entry_zone_1_x1/y1/x2/y2`) you draw over a doorway.
- A 1 Hz state machine computes **assumed presence**: the room stays occupied when
  a still person is lost mid-room, and is released when the last target is seen
  leaving through the entry zone. New entities: `assumed_present`,
  `assumed_present_remaining`, `assume_present_timeout`, `entry_exit_enabled`.
- Added `id`s to `has_target` and target X/Y so the logic can read positions.

**Add-on (`myumar_hp_lite` profile, schema 1.1):**
- `entryZones: true`, `maxEntryZones: 1`. Entry zone + assumed-present entities
  mapped so the existing Entry Zone UI and Assumed Present panel light up.

⚠️ Needs on-device tuning (entry zone size, `assume_present_timeout`). Flash and
validate on **one** lite first.

## 0.2.7 — Coverage toggle + Zone Mode in the wizard

- Added a **"Device coverage (FoV)"** checkbox to the wizard's zone/placement step
  so the green coverage cone can be turned on directly there. (The default is on,
  but a previously-saved display setting could keep it off — now you can flip it.)
- Added the **Zone Mode** control (Detection / Filter / Disabled) to the wizard
  zone step for LD2450 devices, so you can set whether zones detect or are ignored
  without leaving the wizard. Previously it lived only in the standalone Zone Editor,
  so the "Behaviour set by Zone Mode" hint pointed to a control you couldn't reach mid-wizard.

## 0.2.6 — Clearer zone types

- The per-zone **type dropdown** (regular/exclusion/entry) is now hidden when the
  device profile only supports one zone type (e.g. LD2450). It offered options the
  hardware can't honour and reverted to "regular", which was confusing. Replaced
  with a small "Behaviour set by Zone Mode" hint, pointing to the single global
  Detection/Filter control.
- The wizard passes the device's actually-supported zone types to the editor.

## 0.2.5 — Fix invisible/undraggable device marker

- Removed the broken `iconUrl: "./icon.png"` from all HP profiles. That relative
  path isn't a served asset (404), so the device's `<image>` rendered blank —
  making the radar marker invisible and impossible to drag during placement.
  With no `iconUrl`, the canvas now draws its built-in fallback device marker,
  which is visible and draggable. Combined with 0.2.4 (coverage cone on), the
  sensor and its FoV now appear in the placement step.

## 0.2.4 — Show coverage cone by default

- The **Device coverage** overlay (the green field-of-view cone) now defaults to
  **on**, so during placement you can see where the sensor is aimed and rotate it
  with a real FoV reference. It was previously off by default, which is why no FoV
  guide appeared. (You can still toggle it in the canvas display settings.)

## 0.2.3 — Hide firmware service mapping for DIY profiles

- The wizard's **Firmware Service Mapping** section (Build Flags / Update Manifest)
  is now hidden for profiles that don't define those services. HP firmwares don't
  expose `get_build_flags` / `set_update_manifest`, so the "could not auto-discover"
  notices were noise — that step is purely about the upstream OTA-update flow, which
  doesn't apply to DIY devices flashed via ESPHome.
- The section still appears for any profile that defines firmware services.

## 0.2.2 — Mirror X (flipped-mount support)

- **New: "Mirror X" toggle** in the Zone Editor for tracking radars (LD2450)
  mounted upside-down, where left/right come out inverted. No firmware re-flash:
  - The flag is stored per-device in the mapping (`mirrorX`).
  - Backend negates target **X and angle** on the live feed, and negates zone **X**
    on both read and write — so zones drawn in the editor land in the correct
    real-world position and Home Assistant presence/occupancy stays accurate.
  - Endpoints: `GET`/`PUT /api/device-mappings/:deviceId/mirror-x`.
  - The entity write endpoint already supports the needed domains.
- How to use: in the Zone Editor, walk to your right and check target T1 moves
  right on the plan; if it's mirrored, enable **Mirror X**.

## 0.2.1 — Zone exclusion (LD2450 Filter mode)

- **New**: a **Zone Mode** selector in the Zone Editor toolbar for HP-Lite (LD2450),
  bound to the `radar_modo_zonas` (`zone_type`) select.
- Set **Filter** + draw a zone to make Home Assistant **ignore presence inside that
  area** while still detecting the rest of the room — the requested exclusion-zone
  use case. Options come live from the device (Detection / Filter / Disabled).
- Reads current state + available options from HA; writes via the select domain.
- The editor already renders detected targets (T1/T2/T3) live on the room plan, so
  you can size zones around real positions while configuring.

> The LD2450 applies one global mode to all zones (can't mix detect + exclude in the
> same config). Use Filter to carve out ignore-areas.

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
