import { useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const indiaCenter = [22.9734, 78.6569];
const indiaBounds = [
    [6.5, 67.0],
    [37.6, 98.5],
];

const fallbackCoordinates = {
    theft: [
        [28.6139, 77.2090],
        [19.0760, 72.8777],
        [22.5726, 88.3639],
    ],
    cybercrime: [
        [12.9716, 77.5946],
        [17.3850, 78.4867],
        [18.5204, 73.8567],
    ],
    fraud: [
        [19.0760, 72.8777],
        [23.0225, 72.5714],
        [26.9124, 75.7873],
    ],
    harassment: [
        [28.6139, 77.2090],
        [13.0827, 80.2707],
        [21.1702, 72.8311],
    ],
    assault: [
        [25.5941, 85.1376],
        [26.8467, 80.9462],
        [22.5726, 88.3639],
    ],
    missing_person: [
        [18.5204, 73.8567],
        [15.2993, 74.1240],
        [30.7333, 76.7794],
    ],
    other: [
        [20.5937, 78.9629],
        [23.2599, 77.4126],
        [11.0168, 76.9558],
    ],
};

const severityWeight = {
    low: 0.35,
    medium: 0.55,
    high: 0.8,
    critical: 1,
};

const severityColor = {
    low: '#9b5cff',
    medium: '#ff3fb4',
    high: '#ff7a00',
    critical: '#ffe600',
};

function getReportPoint(report, index) {
    const lat = report.coordinates?.lat;
    const lng = report.coordinates?.lng;

    if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng, isFallback: false };
    }

    const categoryCoordinates = fallbackCoordinates[report.category] || fallbackCoordinates.other;
    const base = categoryCoordinates[index % categoryCoordinates.length];
    const spread = 0.45;
    const angle = index * 1.7;

    return {
        lat: Number((base[0] + Math.sin(angle) * spread).toFixed(6)),
        lng: Number((base[1] + Math.cos(angle) * spread).toFixed(6)),
        isFallback: true,
    };
}

function expandHeatPoints(points) {
    const haloCount = 28;

    return points.flatMap((point, pointIndex) => {
        const expanded = [[point.lat, point.lng, point.weight]];

        for (let i = 0; i < haloCount; i += 1) {
            const angle = (i / haloCount) * Math.PI * 2;
            const ring = 0.09 + ((i % 7) * 0.035);
            const wobble = 0.45 + ((pointIndex % 5) * 0.12);

            expanded.push([
                Number((point.lat + Math.sin(angle + pointIndex) * ring * wobble).toFixed(6)),
                Number((point.lng + Math.cos(angle - pointIndex) * ring * wobble).toFixed(6)),
                point.weight * (0.28 + (i % 4) * 0.08),
            ]);
        }

        return expanded;
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export default function CrimeHeatmap({ reports }) {
    const mapElementRef = useRef(null);
    const mapRef = useRef(null);
    const layerGroupRef = useRef(null);

    const points = useMemo(() => reports.map((report, index) => {
        const point = getReportPoint(report, index);
        return {
            ...point,
            id: report._id || `${report.title}-${index}`,
            title: report.title,
            category: report.category || 'other',
            severity: report.severity || 'medium',
            status: report.status || 'pending',
            weight: severityWeight[report.severity] || severityWeight.medium,
        };
    }), [reports]);

    useEffect(() => {
        let cancelled = false;

        async function mountMap() {
            const leafletModule = await import('leaflet');
            const L = leafletModule.default || leafletModule;

            if (cancelled || !mapElementRef.current || mapRef.current) return;

            const map = L.map(mapElementRef.current, {
                center: indiaCenter,
                zoom: 5,
                minZoom: 4,
                maxBounds: indiaBounds,
                maxBoundsViscosity: 0.7,
                scrollWheelZoom: true,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            }).addTo(map);

            map.fitBounds(indiaBounds, { padding: [18, 18] });
            mapRef.current = map;
        }

        mountMap();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                layerGroupRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function drawReports() {
            const map = mapRef.current;
            if (!map) return;

            const leafletModule = await import('leaflet');
            await import('leaflet.heat');
            const L = leafletModule.default || leafletModule;

            if (cancelled) return;

            if (layerGroupRef.current) {
                layerGroupRef.current.remove();
            }

            const layerGroup = L.layerGroup().addTo(map);

            if (points.length) {
                L.heatLayer(expandHeatPoints(points), {
                    radius: 24,
                    blur: 16,
                    maxZoom: 9,
                    minOpacity: 0.28,
                    gradient: {
                        0.18: '#6d35ff',
                        0.42: '#d43cff',
                        0.62: '#ff315d',
                        0.82: '#ff9f00',
                        1: '#fff200',
                    },
                }).addTo(layerGroup);
            }

            points.forEach((point) => {
                const color = severityColor[point.severity] || severityColor.medium;
                const popup = [
                    `<strong>${escapeHtml(point.title)}</strong>`,
                    `${escapeHtml(point.category.replace(/_/g, ' '))} / ${escapeHtml(point.severity)}`,
                    `Status: ${escapeHtml(point.status)}`,
                    point.isFallback ? 'Approximate demo location' : '',
                ].filter(Boolean).join('<br />');

                L.circleMarker([point.lat, point.lng], {
                    radius: 6,
                    color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: 1,
                }).bindPopup(popup).addTo(layerGroup);
            });

            map.fitBounds(indiaBounds, { padding: [18, 18] });
            layerGroupRef.current = layerGroup;
        }

        drawReports();

        return () => {
            cancelled = true;
        };
    }, [points]);

    return (
        <div
            ref={mapElementRef}
            style={{
                height: '520px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#101820',
            }}
        />
    );
}
