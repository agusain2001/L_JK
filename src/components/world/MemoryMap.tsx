"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useWorld } from "./WorldContext";
import { MemoryDialog } from "@/components/MemoryDialog";
export default function MemoryMap() {
  const { data } = useWorld();
  const surface = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null);
  const [selected, setSelected] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [tileError, setTileError] = useState(false),
    [memoryId, setMemoryId] = useState<string | null>(null);
  const locations = data.locations;
  useEffect(() => {
    let cancelled = false;
    const mounted = surface.current;
    void import("leaflet")
      .then((L) => {
        if (cancelled || !mounted) return;
        const instance = L.map(mounted, {
          scrollWheelZoom: false,
          attributionControl: true,
        }).setView([20, 73], 4);
        map.current = instance;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
          .on("tileerror", () => setTileError(true))
          .addTo(instance);
        const points: [number, number][] = [];
        for (const location of locations) {
          if (location.latitude === null || location.longitude === null)
            continue;
          const point: [number, number] = [
            location.latitude,
            location.longitude,
          ];
          points.push(point);
          L.circleMarker(point, {
            radius: 10,
            color: "#a75d63",
            weight: 2,
            fillColor: "#e8b1a1",
            fillOpacity: 0.9,
          })
            .addTo(instance)
            .on("click", () => setSelected(location.id));
        }
        if (points.length > 1)
          instance.fitBounds(points, { padding: [40, 40], maxZoom: 8 });
        else if (points.length) instance.setView(points[0], 8);
        setTimeout(() => instance.invalidateSize(), 0);
      })
      .catch(() => setTileError(true));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [locations]);
  const place = locations.find((location) => location.id === selected);
  const memories = data.memories.filter((memory) =>
    place?.memoryIds.includes(memory.id),
  );
  const current = data.memories.find((memory) => memory.id === memoryId);
  function pick(id: string) {
    setSelected(id);
    const place = locations.find((location) => location.id === id);
    if (
      place?.latitude !== null &&
      place?.latitude !== undefined &&
      place.longitude !== null
    )
      map.current?.setView(
        [place.latitude, place.longitude],
        place.precision === "exact" ? 12 : 8,
        { animate: !matchMedia("(prefers-reduced-motion: reduce)").matches },
      );
  }
  return (
    <div className="map-journal">
      <div className="map-paper">
        <div
          ref={surface}
          className="memory-map"
          role="region"
          aria-label="Interactive memory map"
        />
        <p>
          Drag to explore. Use the map&apos;s plus and minus buttons to zoom.
        </p>
        <button
          className="text-button"
          onClick={() => {
            map.current?.setView([20, 73], 4);
            setSelected(null);
          }}
        >
          Reset map
        </button>
        {tileError && (
          <p role="status">
            The map tiles are unavailable. Every place is still accessible in
            the list.
          </p>
        )}
      </div>
      <div className="map-locations">
        <label>
          Find one of our places
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="location-list">
          {locations
            .filter((location) =>
              `${location.title} ${location.description}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((location) => (
              <button
                key={location.id}
                className="text-button"
                aria-pressed={selected === location.id}
                onClick={() => pick(location.id)}
              >
                {location.title}
                <small>
                  {location.precision === "hidden"
                    ? "Coordinates kept private"
                    : `${location.precision} location`}
                </small>
              </button>
            ))}
        </div>
        {place && (
          <article className="unfolded-paper">
            <h3>{place.title}</h3>
            <p>{place.description}</p>
            {place.date && <p>{place.date}</p>}
            {place.demo && (
              <p className="world-demo">
                Illustrative sample location, not a claimed visit
              </p>
            )}
            <div className="world-photo-row">
              {memories.map((memory) => (
                <button
                  className="world-polaroid"
                  key={memory.id}
                  onClick={() => setMemoryId(memory.id)}
                >
                  <img
                    src={memory.thumbnailUrl || memory.mediaUrl}
                    alt={memory.title}
                  />
                  <span>{memory.caption || memory.title}</span>
                </button>
              ))}
            </div>
          </article>
        )}
        {!locations.length && (
          <p>
            Confirmed places can be added in the studio. Coordinates are always
            optional.
          </p>
        )}
      </div>
      {current && (
        <MemoryDialog memory={current} onClose={() => setMemoryId(null)} />
      )}
    </div>
  );
}
