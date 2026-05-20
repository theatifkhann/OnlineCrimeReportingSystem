import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [28.6139, 77.2090];

export default function LocationPicker({ value, onChange }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const mapElementRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        let cancelled = false;

        async function mountMap() {
            const leafletModule = await import('leaflet');
            const L = leafletModule.default || leafletModule;

            if (cancelled || !mapElementRef.current || mapRef.current) return;

            const center = value?.lat && value?.lng ? [value.lat, value.lng] : defaultCenter;
            const map = L.map(mapElementRef.current, {
                center,
                zoom: 12,
                scrollWheelZoom: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);

            map.on('click', (event) => {
                onChangeRef.current({
                    lat: Number(event.latlng.lat.toFixed(6)),
                    lng: Number(event.latlng.lng.toFixed(6)),
                });
            });

            mapRef.current = map;
        }

        mountMap();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function syncMarker() {
            const map = mapRef.current;
            if (!map || !value?.lat || !value?.lng) return;

            const leafletModule = await import('leaflet');
            const L = leafletModule.default || leafletModule;

            if (cancelled) return;

            const latLng = [value.lat, value.lng];
            map.setView(latLng, Math.max(map.getZoom(), 14), { animate: true });

            if (!markerRef.current) {
                markerRef.current = L.circleMarker(latLng, {
                    radius: 8,
                    color: '#00cfff',
                    fillColor: '#00cfff',
                    fillOpacity: 0.9,
                    weight: 2,
                }).addTo(map);
                return;
            }

            markerRef.current.setLatLng(latLng);
        }

        syncMarker();

        return () => {
            cancelled = true;
        };
    }, [value]);

    useEffect(() => {
        const trimmedQuery = query.trim();

        if (trimmedQuery.length < 3) {
            setResults([]);
            setError('');
            return undefined;
        }

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            setLoading(true);
            setError('');

            try {
                const params = new URLSearchParams({
                    q: trimmedQuery,
                    format: 'jsonv2',
                    addressdetails: '1',
                    limit: '5',
                });

                const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error('Location search failed');
                }

                const data = await res.json();
                setResults(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError('Could not load location suggestions.');
                }
            } finally {
                setLoading(false);
            }
        }, 800);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [query]);

    const selectResult = (result) => {
        const coords = {
            lat: Number(Number(result.lat).toFixed(6)),
            lng: Number(Number(result.lon).toFixed(6)),
        };

        onChange(coords, result.display_name);
        setQuery(result.display_name);
        setResults([]);
    };

    return (
        <div>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search place or address, e.g. Andheri Railway Station"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    style={{ width: '100%' }}
                />
                {(results.length > 0 || loading || error) && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        zIndex: 500,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.22)'
                    }}>
                        {loading && <div style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>Searching locations...</div>}
                        {error && <div style={{ padding: '10px 12px', color: 'var(--color-danger)', fontSize: '13px' }}>{error}</div>}
                        {!loading && !error && results.map((result) => (
                            <button
                                key={result.place_id}
                                type="button"
                                onClick={() => selectResult(result)}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    padding: '10px 12px',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    lineHeight: 1.4,
                                    cursor: 'pointer'
                                }}
                            >
                                {result.display_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div
                ref={mapElementRef}
                style={{ height: '240px', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}
            />
        </div>
    );
}
