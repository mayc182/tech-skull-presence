# Tech Skull Presence — User Manual

Visual configurator and live dashboard for the **MYumar.HP_series** family of DIY
ESP32-C3 + mmWave presence sensors, running as a Home Assistant add-on.

> Forked from [everything-presence-addons](https://github.com/EverythingSmartHome/everything-presence-addons).
> Adapted for the HP-series hardware. Credit to the Everything Smart Home team for the original Zone Configurator.

---

## 1. What this add-on does

- **Auto-discovers** your HP-series sensors in Home Assistant (filtered by manufacturer `MYumar`).
- **Auto-detects the right profile** for each device based on the entities it exposes.
- Gives you a **visual zone editor**:
  - **2D rectangular zones** for the LD2450 device (HP-Lite) — drag boxes on a top-down room view.
  - **1D distance bands** for the LD2410 devices — drag/enter the distance limits that define Zone 1/2/3.
- Provides a **live dashboard** per device: presence, distance, CO2, temperature, humidity, illuminance (depending on hardware).
- Lets you draw your **room layout** and place the device for an accurate coverage view.

---

## 2. Requirements

- **Home Assistant OS** or **Supervised** (add-ons supported). For HA Container/Core, see [`DOCS-DOCKER.md`](DOCS-DOCKER.md).
- Your HP devices flashed with firmware containing:
  ```yaml
  esphome:
    project:
      name: "MYumar.HP_series"
      version: "1.0.0"
  ```
  This `project.name` is what makes Home Assistant report the manufacturer as `MYumar`, which is how the add-on finds your devices.
- The devices added to Home Assistant via the **ESPHome integration**.

---

## 3. Installation

### One-click

[![Add repository to your Home Assistant](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fmayc182%2Ftech-skull-presence)

1. Click the button above → **Add** the repository.
2. **Settings → Add-ons → Add-on Store**, open **Tech Skull Presence → Install**.
3. First build takes 3–8 min (HA compiles backend + frontend in Docker).
4. Enable **Start on boot**, **Watchdog**, **Show in sidebar**, then **Start**.
5. Open the panel from the sidebar (**HP Presence**) or **Open Web UI**.

### Manual

**Settings → Add-ons → Add-on Store → ⋮ → Repositories**, paste:
`https://github.com/mayc182/tech-skull-presence`

---

## 4. Configuration (add-on options)

| Option              | Default | Description                                                                 |
| :------------------ | :------ | :-------------------------------------------------------------------------- |
| `port`              | 42069   | Web UI port. Ingress uses 42069 — changing it may break ingress access.     |
| `firmware_lan_port` | 38080   | LAN server port for device OTA firmware updates.                            |

Most users never need to change these.

---

## 5. First run — the Setup Wizard

1. Open the add-on UI → the **Wizard** starts.
2. **Device selection**: your HP devices appear (discovered by manufacturer `MYumar`).
   Click one — the add-on **auto-detects the matching profile** and pre-selects it.
3. **Entity sync**: the wizard maps the device's entities to the profile. A healthy
   result shows **all required entities matched**.
4. **Room**: give the device a room name, draw the room outline (optional), and place
   the sensor so coverage is shown correctly.
5. **Zones**: configure detection zones (see §7).
6. Repeat for each device.

> **Profile auto-detection** (v0.1.2+) picks the right profile from the device's
> entities. The only ambiguous pair is **Saladeestar vs Niños** — they expose
> identical entities (the buzzer has no unique entity). If you want the buzzer
> features, choose `myumar_hp_ninos` manually.

---

## 6. Device profiles

All HP devices share `manufacturer = MYumar` and `model = HP_series`; the profile
distinguishes the variant.

| Profile                   | Hardware                          | Zones        | Notable entities                              |
| :------------------------ | :-------------------------------- | :----------- | :-------------------------------------------- |
| `myumar_hp_mini`          | LD2410                            | 1D bands     | presence, detection distance                  |
| `myumar_hp_saladeestar`   | LD2410 + SCD40 + WS2812           | 1D bands     | + CO2, temperature, humidity, CO2 LED         |
| `myumar_hp_luz`           | LD2410 + SCD40 + BH1750 + WS2812  | 1D bands     | + illuminance                                 |
| `myumar_hp_ninos`         | LD2410 + SCD40 + WS2812 + buzzer  | 1D bands     | + RTTTL buzzer (CO2 melodies)                 |
| `myumar_hp_lite`          | LD2450                            | 2D rectangles| target X/Y, 3 zones, multi-target tracking    |

A full entity-by-entity reference is in
[`docs/PROFILES.md`](https://github.com/mayc182/tech-skull-presence/blob/main/docs/PROFILES.md).

---

## 7. Configuring zones

### 7a. LD2450 (HP-Lite) — 2D rectangular zones

The LD2450 reports each target's X/Y position, so you get a true top-down editor.

1. Open the **Zone Editor** for the HP-Lite room.
2. Add up to **3 zones**. Drag the corners/edges to shape each rectangle.
3. Targets appear live as dots so you can size zones around real positions.
4. **Save** — the add-on writes the corners to the device's
   `zone_N_x1/y1/x2/y2` number entities.

> The editor uses standard begin/end coordinates internally and maps them to the
> firmware's `x1/y1/x2/y2` naming automatically.

### 7b. LD2410 (HP-mini / Saladeestar / Luz / Niños) — 1D distance bands

The LD2410 reports **distance only** (not X/Y), so "zones" are distance ranges
along the sensor's line of sight. The add-on shows a **Distance Bands** panel on
the device dashboard:

- A horizontal axis from 0 to ~600 cm with three colored bands:
  - **Z1** (green): 0 → *Zone 1 end*
  - **Z2** (amber): *Zone 1 end* → *Zone 2 end*
  - **Z3** (red): *Zone 2 end* → *Zone 3 end*
- A **live marker** shows the currently detected target distance.
- The **occupied band** is highlighted in real time.
- Edit each band's end value in the inputs below the axis. Values are validated to
  stay ordered (Z1 < Z2 < Z3) and saved to `zone_1/2/3_end_distance`.

The matching binary sensors `Zone 1/2/3 Occupancy` are computed on-device from
these limits and surface in Home Assistant for automations.

---

## 8. The live dashboard

Each device room has a dashboard showing whatever its hardware supports:

- **Presence / occupancy** indicators (mmWave, moving, still).
- **Distance** (LD2410) or **target positions** (LD2450).
- **Environmental** panel: CO2, temperature, humidity, illuminance — only the ones
  the device has.
- **Distance Bands** editor (LD2410 variants).
- Mini charts and an activity log.

---

## 9. Updating the add-on

This add-on is delivered from its GitHub repository. When a new version is
published:

1. **Settings → Add-ons → Tech Skull Presence**.
2. If an update is available, an **Update** button appears (HA checks periodically;
   force with **⋮ → Check for updates**).
3. Click **Update** — HA rebuilds with the new code.

> HA only offers an update when the `version:` in `config.yaml` changes. Each
> functional change ships with a version bump and a [CHANGELOG](CHANGELOG.md) entry.

Your rooms, zones and mappings persist across updates (stored in
`/config/tech-skull-presence`).

---

## 10. Troubleshooting

| Symptom                                          | Cause / fix                                                                                                   |
| :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| No devices in the wizard                         | Firmware must include `esphome.project.name: "MYumar.HP_series"`. Re-flash, then reload the ESPHome device.   |
| Device matched the wrong profile                 | v0.1.2+ auto-detects. Update the add-on, then re-run the wizard or **Re-sync entities** on the device.        |
| Required entity unmatched / "conflict"           | Use **Re-sync entities**; if still unmatched, map it manually in the device settings.                         |
| Distance Bands panel missing on an LD2410 device | The three `zone_1/2/3_end_distance` entities must be mapped. Re-sync entities.                                |
| 2D zone editor empty on HP-Lite                  | Confirm the device has `zone_1_x1`…`zone_3_y2` number entities enabled in HA, then re-sync.                   |
| "No firmware available" in the update panel      | Expected — HP devices don't yet have a hosted firmware index. Flash via ESPHome as usual.                     |
| Build fails on install                           | Supported arches: `aarch64`, `amd64`, `armv7`. Check the add-on log for the failing step.                     |

More detail: [`docs/TROUBLESHOOTING.md`](https://github.com/mayc182/tech-skull-presence/blob/main/docs/TROUBLESHOOTING.md).

---

## 11. Links & references

- **Repository**: https://github.com/mayc182/tech-skull-presence
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Profile / entity reference**: [docs/PROFILES.md](https://github.com/mayc182/tech-skull-presence/blob/main/docs/PROFILES.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](https://github.com/mayc182/tech-skull-presence/blob/main/docs/TROUBLESHOOTING.md)
- **Standalone Docker**: [DOCS-DOCKER.md](DOCS-DOCKER.md)
- **Upstream project**: https://github.com/EverythingSmartHome/everything-presence-addons
