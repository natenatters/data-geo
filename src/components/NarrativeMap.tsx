'use client';

import { useEffect, useRef, useState } from 'react';
import { NARRATIVE_PERIODS, LEGEND_ENTRIES } from '@/lib/narrative-periods';
import { TERRITORY_POLYGONS } from '@/lib/narrative-geodata';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cesium: any;
  }
}

interface Props {
  activePeriodId: string;
}

function isDarkMode() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

export default function NarrativeMap({ activePeriodId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entitiesByPeriod = useRef<Record<string, any[]>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const lastPeriodRef = useRef<string>('');
  const builtRef = useRef(false);
  const darkRef = useRef(isDarkMode());

  // Load CesiumJS from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Cesium) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Cesium.js';
      script.onload = () => setLoaded(true);
      script.onerror = () => setError('Failed to load CesiumJS');
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.Cesium) {
      setLoaded(true);
    }
  }, []);

  // Initialize viewer once
  useEffect(() => {
    if (!loaded || !containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;

    try {
      const dark = isDarkMode();
      darkRef.current = dark;
      const tileStyle = dark ? 'dark_all' : 'light_all';

      const viewer = new Cesium.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        animation: false,
        timeline: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayer: new Cesium.ImageryLayer(
          new Cesium.UrlTemplateImageryProvider({
            url: `https://basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}.png`,
            credit: 'CartoDB',
            maximumLevel: 19,
          })
        ),
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      });

      // Start at England-wide view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-1.5, 53.0, 600000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      });

      viewerRef.current = viewer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
    }

    // Watch for dark mode toggle and swap basemap
    const mo = new MutationObserver(() => {
      const nowDark = isDarkMode();
      if (nowDark === darkRef.current || !viewerRef.current) return;
      darkRef.current = nowDark;
      const v = viewerRef.current;
      const layers = v.imageryLayers;
      layers.removeAll();
      const style = nowDark ? 'dark_all' : 'light_all';
      layers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: `https://basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png`,
          credit: 'CartoDB',
          maximumLevel: 19,
        })
      );
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      mo.disconnect();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [loaded]);

  // Pre-build all entities for all periods (once)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded || builtRef.current) return;
    builtRef.current = true;

    const Cesium = window.Cesium;

    for (const period of NARRATIVE_PERIODS) {
      const entities: typeof entitiesByPeriod.current[string] = [];
      const isFirst = period.id === NARRATIVE_PERIODS[0].id;

      // Territory polygons
      for (const territory of period.territories) {
        const coords = TERRITORY_POLYGONS[territory.id];
        if (!coords || coords.length < 3) continue;

        const flat: number[] = [];
        for (const [lon, lat] of coords) {
          flat.push(lon, lat);
        }

        // Centroid for label
        let cLon = 0, cLat = 0;
        for (const [lon, lat] of coords) {
          cLon += lon;
          cLat += lat;
        }
        cLon /= coords.length;
        cLat /= coords.length;

        const color = Cesium.Color.fromCssColorString(territory.color);

        entities.push(viewer.entities.add({
          show: isFirst,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flat),
            material: color.withAlpha(territory.opacity),
            outline: true,
            outlineColor: color.withAlpha(Math.min(territory.opacity + 0.3, 1.0)),
            outlineWidth: 2,
          },
        }));

        entities.push(viewer.entities.add({
          show: isFirst,
          position: Cesium.Cartesian3.fromDegrees(cLon, cLat),
          label: {
            text: territory.label,
            font: '13px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(50000, 1.0, 1000000, 0.4),
          },
        }));
      }

      // Point markers
      for (const marker of period.markers) {
        const mColor = Cesium.Color.fromCssColorString(marker.color);

        entities.push(viewer.entities.add({
          show: isFirst,
          position: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude),
          point: {
            pixelSize: marker.size,
            color: mColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: marker.label,
            font: 'bold 12px sans-serif',
            fillColor: mColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 4,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, marker.size + 4),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(50000, 1.0, 1000000, 0.5),
          },
        }));
      }

      entitiesByPeriod.current[period.id] = entities;
    }

    lastPeriodRef.current = NARRATIVE_PERIODS[0].id;
  }, [loaded]);

  // Toggle visibility on period change (no remove/re-add)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded || !builtRef.current) return;
    if (activePeriodId === lastPeriodRef.current) return;

    // Hide old period entities
    const oldEntities = entitiesByPeriod.current[lastPeriodRef.current];
    if (oldEntities) {
      for (const e of oldEntities) e.show = false;
    }

    // Show new period entities
    const newEntities = entitiesByPeriod.current[activePeriodId];
    if (newEntities) {
      for (const e of newEntities) e.show = true;
    }

    lastPeriodRef.current = activePeriodId;

    // Fly camera
    const Cesium = window.Cesium;
    const period = NARRATIVE_PERIODS.find(p => p.id === activePeriodId);
    if (!period) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        period.camera.longitude,
        period.camera.latitude,
        period.camera.height,
      ),
      orientation: {
        heading: 0,
        pitch: period.camera.pitch ?? Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.5,
    });
  }, [activePeriodId, loaded]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
          Loading map...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend overlay */}
      {loaded && (
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md pointer-events-none">
          <div className="space-y-1">
            {LEGEND_ENTRIES.map(entry => (
              <div key={entry.label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {entry.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
