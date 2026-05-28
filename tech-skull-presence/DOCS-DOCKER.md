# Tech Skull Presence — Standalone Docker

Use this method only if your Home Assistant install does **not** support add-ons
(HA Container / Core). On Home Assistant OS or Supervised, install the add-on
instead — see [`DOCS.md`](DOCS.md).

Unlike the upstream project, this fork does **not** publish a prebuilt image to a
registry. You build it from the repository.

---

## 1. Build the image

```bash
git clone https://github.com/mayc182/tech-skull-presence.git
cd tech-skull-presence/tech-skull-presence
docker build --target standalone -t tech-skull-presence:latest .
```

The `standalone` target is a plain Node image (no Home Assistant Supervisor
required).

## 2. Create a Home Assistant long-lived token

In Home Assistant: **Profile → Security → Long-lived access tokens → Create
token**. Copy it somewhere safe — you can't view it again.

## 3. Run

```bash
docker run -d \
  --name tech-skull-presence \
  -p 42069:42069 \
  -p 38080:38080 \
  -e HA_BASE_URL="http://homeassistant.local:8123" \
  -e HA_LONG_LIVED_TOKEN="PASTE_YOUR_TOKEN_HERE" \
  -v "$(pwd)/data:/config/tech-skull-presence" \
  tech-skull-presence:latest
```

Then open `http://<docker-host>:42069`.

### docker-compose

```yaml
services:
  tech-skull-presence:
    build:
      context: ./tech-skull-presence
      target: standalone
    image: tech-skull-presence:latest
    container_name: tech-skull-presence
    restart: unless-stopped
    ports:
      - "42069:42069"
      - "38080:38080"
    environment:
      HA_BASE_URL: "http://homeassistant.local:8123"
      HA_LONG_LIVED_TOKEN: "${HA_LONG_LIVED_TOKEN}"
    volumes:
      - ./data:/config/tech-skull-presence
```

---

## Environment variables

| Variable                  | Required | Default                     | Description                                              |
| :------------------------ | :------: | :-------------------------- | :------------------------------------------------------- |
| `HA_BASE_URL`             |   yes    | —                           | Base URL of your Home Assistant instance.               |
| `HA_LONG_LIVED_TOKEN`     |   yes¹   | —                           | Long-lived access token.                                 |
| `HA_LONG_LIVED_TOKEN_FILE`|   yes¹   | —                           | Path to a file containing the token (alternative).      |
| `PORT`                    |    no    | `42069`                     | Web UI port.                                            |
| `FIRMWARE_LAN_PORT`       |    no    | `38080`                     | LAN firmware server port.                               |
| `DATA_DIR`                |    no    | `/config/tech-skull-presence` | Persistent storage path (rooms, zones, mappings).     |

¹ Provide either `HA_LONG_LIVED_TOKEN` or `HA_LONG_LIVED_TOKEN_FILE`.

## Ports

- **42069** — web interface.
- **38080** — LAN HTTP server for device OTA firmware.

## Persistence

Mount a volume at `/config/tech-skull-presence` (or set `DATA_DIR`) so rooms,
zones and entity mappings survive container restarts.

---

For configuration, profiles and usage, see the main [User Manual](DOCS.md).
