# Installing Tech Skull Presence on Home Assistant

This guide covers installing the **MYumar HP Series** add-on repository in Home Assistant OS.

## Prerequisites

- Home Assistant OS or Supervised (add-ons supported). On HA Container/Core, see the [standalone Docker docs][docker-docs] instead.
- The 5 HP-series ESPHome devices already running firmware **with `esphome.project.name: "MYumar.HP_series"`** and connected to your Home Assistant instance via the ESPHome integration.
- Network access from HA to the devices.

## Option A — Install from a local folder (recommended for first run)

This is the fastest path while the repo is not yet on GitHub.

### 1. Copy the repo to your HA host

Transfer the entire `MYumar-HP-addons/` folder (or its zipped form) to the Home Assistant `/addons/` directory. You can use:

- **Samba share** — enable the *Samba share* add-on and drop the folder into `\\homeassistant\addons\`
- **SSH/SFTP** — `scp -r MYumar-HP-addons root@homeassistant.local:/addons/`
- **Studio Code Server / File editor** add-on — drag-and-drop in the UI

Resulting layout on the host:

```
/addons/MYumar-HP-addons/
├── repository.yaml
├── README.md
└── tech-skull-presence/
    ├── config.yaml
    ├── Dockerfile
    └── …
```

### 2. Reload the local add-on store

In Home Assistant:

1. **Settings → Add-ons → Add-on Store**
2. Top-right ⋮ menu → **Check for updates**
3. Scroll down — you should see a new section **"Local add-ons"** (or "MYumar HP Series Add-ons" depending on HA version) containing **Tech Skull Presence**.

### 3. Install the add-on

1. Click **Tech Skull Presence → Install**.
2. The first build takes 3–8 minutes (HA compiles backend + frontend inside Docker).
3. Once installed, enable:
   - **Start on boot**: ON
   - **Watchdog**: ON
   - **Show in sidebar**: ON
4. Click **Start**.

### 4. Open the panel

Click **Open Web UI** (or the sidebar entry **HP Presence**).

## Option B — Install as a GitHub repository

Once you push `MYumar-HP-addons/` to a GitHub repo:

**One-click:** use the *My Home Assistant* button in the [README](README.md#quick-install).

Or manually:

1. **Settings → Add-ons → Add-on Store → ⋮ → Repositories**
2. Paste the GitHub URL: `https://github.com/mayc182/tech-skull-presence`
3. **Add → Close**
4. The new section appears in the add-on store — install **Tech Skull Presence** from there.

## First-time configuration

1. Open the addon UI.
2. The **Wizard** detects all 5 devices automatically (filtered by `manufacturer = MYumar`).
3. For each device, assign the matching profile:

   | Device           | Profile                |
   | :--------------- | :--------------------- |
   | hp-mini-1        | `myumar_hp_mini`       |
   | hp-01-saladeestar| `myumar_hp_saladeestar`|
   | hp-01-luz        | `myumar_hp_luz`        |
   | hp-01-ninos      | `myumar_hp_ninos`      |
   | hp-02-lite       | `myumar_hp_lite`       |

4. Create one **Room** per device (or per group of devices once virtual rooms ship in v0.2).
5. For **hp-02-lite**: open the Zone Editor — you'll see the 2D canvas with the 3 rectangular zones.
6. For LD2410 devices: open the room dashboard — you'll see the new **Distance Bands** panel below the radar arc.

## Troubleshooting

| Symptom                                              | Likely cause / fix                                                                                                |
| :--------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| Add-on doesn't appear in the store                   | The folder must be directly under `/addons/`. Path must contain `repository.yaml` + a subfolder with `config.yaml`. |
| Add-on starts but no devices appear                  | Make sure the ESPHome firmwares were flashed with the `esphome.project.name: "MYumar.HP_series"` block.            |
| Wrong entities matched for a device                  | Run **Re-sync entities** in the device settings modal; if needed, map manually.                                    |
| Distance Bands panel doesn't appear on LD2410 device | The 3 entities `zone_1/2/3_end_distance` must be mapped. Re-sync entities or check the wizard.                     |
| Build fails on architecture                          | Add-on supports `aarch64`, `amd64`, `armv7`. Other archs (`armhf`, `i386`) are not built.                          |

## Updating

When you push a newer fork version:

1. Bump `version:` in `tech-skull-presence/config.yaml`.
2. Add a CHANGELOG entry.
3. In HA: **Settings → Add-ons → Tech Skull Presence → Update**.

[docker-docs]: tech-skull-presence/DOCS-DOCKER.md
