# Hardware shopping list — "EP-class" DIY presence sensor

A learning-exercise bill of materials to build a sensor that matches (and exceeds)
the Everything Presence Pro/Lite feature set, using ESPHome + this add-on.

Your current HP devices already cover the basics (LD2410/LD2450 + SCD40 + BH1750 +
WS2812 + buzzer). This list is the "do it properly / add the missing EP features"
version.

---

## 1. Microcontroller (the brain)

| Part | Why | Notes |
| :--- | :-- | :--- |
| **ESP32-S3** dev board (e.g. ESP32-S3-DevKitC-1, 8 MB flash / 8 MB PSRAM) | More RAM/flash than the C3 → faster ESPHome compiles, room for BLE proxy + many sensors, native USB | Upgrade from your ESP32-C3. The C3 works but the S3 is the comfortable choice for a "full" build |

> Keep the C3 for minimal nodes; use the S3 for the "everything" sensor.

## 2. mmWave radar (the core)

| Part | Enables | Notes |
| :--- | :------ | :--- |
| **HLK-LD2450** | 2D tracking (X/Y), zones, exclusion (filter), entry/exit (via firmware) | This is what EP-Lite/Pro use. **The key part.** UART, 256000 baud default |
| *(optional)* **HLK-LD2410C** | 1D distance + 9 gates, very cheap | Good for simple "is someone here" nodes; you already use these |

> The LD2450 is what unlocks the visual zone editor + entry/exit in this add-on.

## 3. Motion (instant trigger, complements mmWave)

| Part | Why |
| :--- | :-- |
| **AM312** mini PIR (3.3 V) | Instant motion detection — mmWave is great for *presence* but a PIR gives a faster "someone just moved" signal. EP devices combine both to cut false negatives |

> Adding a PIR is the single biggest "EP feature" you're currently missing.

## 4. Air quality / environment

| Part | Measures | Notes |
| :--- | :------- | :--- |
| **Sensirion SCD41** | CO2 (photoacoustic, true NDIR-class), temp, humidity | Newer/smaller than SCD40, same ESPHome `scd4x` platform. You already use SCD40 — fine to keep |
| **Sensirion SHT40** *(or BME280)* | Accurate temp + humidity, away from MCU heat | The SCD4x temp reads high due to board heat (you already offset ~8-9 °C). A dedicated SHT40 placed away from the ESP gives clean readings |
| **BH1750** | Illuminance (lux) | You already have this on HP-Luz |
| *(optional)* **Sensirion SGP40** | VOC air-quality index | "Air quality" beyond CO2 |
| *(optional)* **BMP280** | Barometric pressure | Nice-to-have |

> All of these share one **I2C bus** (SDA/SCL) — easy to chain.

## 5. Feedback (UI on the device)

| Part | Why |
| :--- | :-- |
| **WS2812 / SK6812** RGB LED (1–8 px) | Air-quality/presence color indicator (you have this) |
| **Passive piezo buzzer** | RTTTL melodies / alerts (you have this on Niños). Use a **passive** buzzer (PWM-driven), not active |
| *(optional)* small **OLED 0.96" SSD1306 (I2C)** | On-device readout of CO2/temp without opening HA |

## 6. Power & misc

| Part | Why |
| :--- | :-- |
| **USB-C breakout / good 5V supply (≥1 A)** | mmWave + CO2 + WiFi draw real current; brown-outs cause the "No networks found" issues you hit |
| **AMS1117-3.3 or better LDO** (if not on the dev board) | Stable 3.3 V for the SCD4x (sensitive to supply noise) |
| Dupont wires / perfboard / JST connectors | Prototyping |
| **3D-printed enclosure** | Mount the LD2450 **vertically on a wall** (antenna columns horizontal) with a clear front; keep the SCD4x vented and away from the MCU |

---

## What each part unlocks in this add-on

| Feature in the add-on | Requires |
| :-------------------- | :------- |
| Visual 2D zones + live target dots | **LD2450** |
| Exclusion (Filter) zones | **LD2450** (global zone mode) |
| Entry/Exit + assumed presence | **LD2450** + firmware logic (already done) |
| 1D distance bands | LD2410 |
| CO2 panel + LED + buzzer melodies | SCD4x + WS2812 + passive buzzer |
| Illuminance | BH1750 |
| Faster/instant motion | **PIR (AM312)** ← currently missing |
| Bluetooth proxy | any ESP32 (S3/C3) |

## Suggested "full" build (one capable sensor)

ESP32-S3 + LD2450 + AM312 PIR + SCD41 + SHT40 + BH1750 + WS2812 + passive buzzer,
in a wall-mount enclosure with a clean 5 V supply.

That covers everything EP-Pro does (2D tracking, zones, entry/exit, environment)
plus a real PIR — and it's all configurable from this add-on.
