import type { IHaReadTransport } from '../ha/readTransport';
import { logger } from '../logger';

export interface DiscoveredDevice {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  entityNamePrefix?: string; // e.g., "bedroom_ep_lite" from "binary_sensor.bedroom_ep_lite_occupancy"
  firmwareVersion?: string; // Software/firmware version from device registry (e.g., "1.3.2")
  areaName?: string; // Home Assistant area name (e.g., "Living Room")
}

const normalizeManufacturer = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(item => String(item ?? '')).join(', ').trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
};

export class DeviceDiscoveryService {
  private readonly readTransport: IHaReadTransport;
  // MYumar.HP_series fork: Home Assistant derives `manufacturer` from the part
  // of `esphome.project.name` before the first '.' — so devices declaring
  // `project.name: "MYumar.HP_series"` show up with manufacturer "MYumar".
  private readonly manufacturerFilters = [
    'MYumar',
  ];

  constructor(readTransport: IHaReadTransport) {
    this.readTransport = readTransport;
  }

  private async getEntityNamePrefixForDevice(deviceId: string): Promise<string | undefined> {
    try {
      // Get entity registry to find entities for this device
      const entityRegistry = await this.readTransport.listEntityRegistry();

      // Filter entities belonging to this device
      const deviceEntities = entityRegistry.filter((e) => e.device_id === deviceId);

      // Prefer finding occupancy or presence sensor first, as it's most reliable
      let deviceEntity = deviceEntities.find((e) =>
        e.entity_id?.includes('_occupancy') || e.entity_id?.includes('_presence')
      );

      // Fallback to any binary_sensor or sensor
      if (!deviceEntity) {
        deviceEntity = deviceEntities.find((e) =>
          e.entity_id?.startsWith('binary_sensor.') || e.entity_id?.startsWith('sensor.')
        );
      }

      // Last resort: use first entity
      if (!deviceEntity) {
        deviceEntity = deviceEntities[0];
      }

      if (deviceEntity?.entity_id) {
        // Extract prefix from entity_id like "binary_sensor.everything_presence_lite_f1c114_occupancy"
        // Result should be: "everything_presence_lite_f1c114"
        const entityId = deviceEntity.entity_id as string;

        // Remove domain prefix (everything before the first dot)
        const withoutDomain = entityId.replace(/^[^.]+\./, '');

        // Remove common suffixes to get the base device name
        // This handles ESPHome entity naming patterns
        // Note: Order matters - more specific patterns should come first
        const prefix = withoutDomain.replace(
          new RegExp([
            // ============================================================
            // MYumar.HP_series suffixes (must come BEFORE generic patterns)
            // ============================================================
            // Zone occupancy / target count (LD2410 + LD2450)
            '_zone_\\d+_all_target_count$',
            '_zone_\\d+_still_target_count$',
            '_zone_\\d+_moving_target_count$',
            '_zone_\\d+_end_distance$',
            // LD2450 rectangular zone coordinates (x1/y1/x2/y2 naming)
            '_zone_\\d+_x[12]$',
            '_zone_\\d+_y[12]$',
            // LD2450 target detail
            '_target_\\d+_direction$',
            // LD2410 detection / motion / energy
            '_last_detection_distance$',
            '_detection_distance$',
            '_moving_distance$',
            '_still_distance$',
            '_(move|moving)_energy$',
            '_still_energy$',
            '_g\\d+_(move|moving)_energy$',
            '_g\\d+_still_energy$',
            '_g\\d+_(move|moving)_threshold$',
            '_g\\d+_still_threshold$',
            '_max_(move|still)_distance_gate$',
            '_light_threshold$',
            '_distance_resolution$',
            '_baud_rate$',
            '_engineering_mode$',
            '_control_bluetooth$',
            '_query_params$',
            '_ld_?2410_.*$',
            '_out_pin_presence_status$',
            '_moving_presence$',
            '_still_presence$',
            '_room_occupancy$',
            // LD2450 radar controls (Spanish-friendly names)
            '_radar_.*$',
            '_ld2450_.*$',
            '_presence_target_count$',
            '_still_target_count$',
            '_moving_target_count$',
            '_multi_target_tracking$',
            // SCD40 environmental
            '_scd40_co2$',
            '_scd40_temperature_offset$',
            '_scd40_humidity_offset$',
            '_calibrate_scd40.*$',
            '_co2_temperature$',
            '_co2_humidity$',
            '_co2_trend$',
            '_co2_led$',
            // WS2812 LED + No-Disturb
            '_no_disturb_mode$',
            // Misc HP-specific
            '_ldr_threshold$',
            '_esp_reboot$',
            '_esp32_internal_temperature$',
            '_internal_temperature$',
            '_restart_esp_with_factory_default_settings$',
            // ============================================================
            // EPP-specific suffixes (must come first - more specific patterns)
            // ============================================================
            '_exclusion_zone_\\d+_start_[xy]$',
            '_exclusion_zone_\\d+_end_[xy]$',
            '_exclusion_zone_\\d+_target_count$',
            '_zone_\\d+_start_[xy]$',
            '_zone_\\d+_timeout$',
            '_zone_\\d+_presence$',
            '_tracking_detection_range$',
            '_tracking_presence_timeout$',
            '_tracking_sensor_angle$',
            '_tracking_update_rate$',
            '_target_tracking_detail$',
            '_target_update_rate$',
            '_auto_clear_stuck_targets$',
            '_stuck_target_timeout$',
            '_tracking_presence$',
            '_mmwave_presence$',
            '_tracking_sensor_firmware$',
            '_tracking_configuration_mode$',
            '_ld2450_bluetooth$',
            // EPP environmental/control suffixes
            '_relay_output$',
            '_relay_trigger_mode$',
            '_led_mode$',
            '_led_brightness$',
            '_occupancy_timeout$',
            '_motion_timeout$',
            '_temperature_calibration$',
            '_humidity_calibration$',
            '_illuminance_calibration$',
            // Zone-related suffixes (more specific first)
            '_zone_\\d+_occupancy_off_delay$',
            '_zone_\\d+_target_count$',
            '_zone_\\d+_occupancy$',
            '_zone_\\d+_begin_[xy]$',
            '_zone_\\d+_end_[xy]$',
            '_zone_\\d+_off_delay$',
            '_entry_zone_\\d+_begin_[xy]$',
            '_entry_zone_\\d+_end_[xy]$',
            '_occupancy_mask_\\d+_begin_[xy]$',
            '_occupancy_mask_\\d+_end_[xy]$',
            '_polygon_zone_\\d+$',
            '_polygon_exclusion_\\d+$',
            '_polygon_entry_\\d+$',
            // Target tracking suffixes
            '_target_\\d+_[a-z]+$',
            '_target_\\d+.*$',
            '_target_count$',
            // Settings entity suffixes (EPL)
            '_max_distance$',
            '_occupancy_off_delay$',
            '_installation_angle$',
            '_upside_down_mounting$',
            '_update_speed$',
            '_tracking_behaviour$',
            '_entry_exit_enabled$',
            '_exit_threshold_pct$',
            '_assume_present_timeout$',
            '_stale_target_reset_timeout$',
            '_stale_target_reset$',
            '_polygon_zones$',
            // Settings entity suffixes (EP1)
            '_mmwave_mode$',
            '_mmwave_minimum_distance$',
            '_mmwave_max_distance$',
            '_mmwave_trigger_distance$',
            '_mmwave_sustain_sensitivity$',
            '_mmwave_trigger_sensitivity$',
            '_mmwave_threshold_factor$',
            '_mmwave_on_latency$',
            '_mmwave_off_latency$',
            '_occupancy_off_latency$',
            '_pir_off_latency$',
            '_pir_on_latency$',
            '_temperature_offset$',
            '_humidity_offset$',
            '_illuminance_offset$',
            '_micro_motion_detection$',
            '_mmwave_led$',
            '_distance_speed_update_rate$',
            // General sensor/entity suffixes
            '_occupancy$',
            '_presence$',
            '_mmwave.*$',
            '_pir.*$',
            '_light.*$',
            '_illuminance.*$',
            '_temperature.*$',
            '_humidity.*$',
            '_co2$',
            '_firmware.*$',
            '_esp32_status_led$',
            '_esp32_led$',
            '_status_led$',
            '_led$',
            '_wifi_signal$',
            '_uptime$',
            '_restart$',
            '_safe_mode$',
            '_ip_address$',
            '_connected_ssid$',
            '_mac_address$',
            '_dns_address$',
            '_bluetooth_proxy.*$',
          ].join('|')),
          ''
        );

        return prefix;
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message, deviceId }, 'Failed to get entity prefix for device');
    }
    return undefined;
  }

  async discover(): Promise<DiscoveredDevice[]> {
    // Fetch devices and areas in parallel
    const [devices, areas] = await Promise.all([
      this.readTransport.listDevices(),
      this.readTransport.listAreaRegistry().catch((err) => {
        logger.warn({ err }, 'Failed to fetch area registry, continuing without area info');
        return [];
      }),
    ]);

    if (!Array.isArray(devices)) {
      logger.warn('Unexpected devices payload from HA');
      return [];
    }

    // Build area_id -> name map for quick lookup
    const areaMap = new Map<string, string>();
    for (const area of areas) {
      if (area.area_id && area.name) {
        areaMap.set(area.area_id, area.name);
      }
    }

    const filteredDevices = devices
      .map((d: any) => ({
        id: d.id as string,
        name: (d.name_by_user as string) || (d.name as string) || 'Unnamed device',
        manufacturer: normalizeManufacturer(d.manufacturer) || undefined,
        model: d.model as string | undefined,
        firmwareVersion: d.sw_version as string | undefined,
        areaId: d.area_id as string | undefined,
      }))
      .filter((d) => {
        const manufacturer = normalizeManufacturer(d.manufacturer).toLowerCase();
        return this.manufacturerFilters.some(filter => manufacturer === filter.toLowerCase());
      });

    // Enrich with entity name prefix and area name
    const enrichedDevices = await Promise.all(
      filteredDevices.map(async (device) => {
        const { areaId, ...rest } = device;
        return {
          ...rest,
          entityNamePrefix: await this.getEntityNamePrefixForDevice(device.id),
          areaName: areaId ? areaMap.get(areaId) : undefined,
        };
      })
    );

    return enrichedDevices;
  }
}
