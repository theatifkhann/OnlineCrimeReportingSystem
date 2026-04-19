import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'tween', ease: 'easeOut' } }
};

export default function Dashboard() {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    async function fetchReports() {
        try {
            const token = localStorage.getItem("token");
            if (!token) return; // Prevent fetch if no token

            const res = await fetch(`${API_URL}/reports/myreports`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    }

    // Helper function to format the system date
    const formatTime = (dateString) => {
        if (!dateString) return "Pending...";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Maps status to our custom design system colors
    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'pending':
                return { color: 'var(--color-warning)', bg: 'rgba(255, 170, 0, 0.1)' };
            case 'approved':
            case 'resolved':
                return { color: 'var(--color-safe)', bg: 'rgba(0, 217, 126, 0.1)' };
            case 'rejected':
            case 'urgent':
                return { color: 'var(--color-danger)', bg: 'rgba(255, 64, 64, 0.1)' };
            default:
                return { color: 'var(--color-primary)', bg: 'rgba(0, 207, 255, 0.1)' };
        }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* Header */}
            <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 className="display-font" style={{ fontSize: '32px', margin: '0 0 8px' }}>Your Filed Reports</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Track the status of your civic filings</p>
                </div>
            </motion.div>

            {/* Data Table Card */}
            <motion.div variants={itemVariants} className="institutional-card">
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ padding: '12px 8px', fontWeight: 500 }}>INCIDENT</th>
                            <th style={{ padding: '12px 8px', fontWeight: 500 }}>DATE & TIME</th>
                            <th style={{ padding: '12px 8px', fontWeight: 500 }}>LOCATION</th>
                            <th style={{ padding: '12px 8px', fontWeight: 500 }}>STATUS</th>
                            <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length > 0 ? (
                            reports.map((report) => {
                                const style = getStatusStyle(report.status);
                                return (
                                    <tr
                                        key={report._id}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'pointer' }}
                                        onClick={() => setSelectedReport(report)}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 8px', fontWeight: 500 }}>{report.title}</td>

                                        {/* NEW: Date Column */}
                                        <td className="mono-font" style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {formatTime(report.createdAt)}
                                        </td>

                                        <td className="mono-font" style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{report.location}</td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <span style={{
                                                background: style.bg,
                                                color: style.color,
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                textTransform: 'uppercase',
                                                fontWeight: 600,
                                                letterSpacing: '0.05em'
                                            }}>
                                                {report.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="mono-font" style={{ padding: '16px 8px', textAlign: 'right', color: 'var(--color-primary)', fontSize: '12px' }}>
                                            VIEW DETAILS →
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No reports found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </motion.div>

            {/* MODAL - Updated to dark aesthetic */}
            {selectedReport && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(10, 15, 30, 0.85)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    zIndex: 100 // Ensure it sits above the sidebar
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="institutional-card"
                        style={{ maxWidth: '600px', width: '100%', position: 'relative' }}
                    >
                        <h2 className="display-font" style={{ fontSize: '24px', margin: '0 0 4px', color: 'var(--text-primary)' }}>
                            {selectedReport.title}
                        </h2>

                        {/* Display both Location and Date in the Modal */}
                        <p className="mono-font" style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span>📍 {selectedReport.location}</span>
                            <span style={{ color: 'var(--border-subtle)' }}>|</span>
                            <span>🕒 {formatTime(selectedReport.createdAt)}</span>
                        </p>

                        <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                                {selectedReport.description}
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status:</span>
                                <span style={{
                                    background: getStatusStyle(selectedReport.status).bg,
                                    color: getStatusStyle(selectedReport.status).color,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em'
                                }}>
                                    {selectedReport.status}
                                </span>
                            </div>

                            <button
                                onClick={() => setSelectedReport(null)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                CLOSE
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
