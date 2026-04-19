import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Check, X, ShieldCheck, Sun, Moon } from 'lucide-react'; // <-- NEW: Imported Sun and Moon
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // --- NEW: Theme State & Effect ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    // Apply the theme to the HTML document body
    document.documentElement.setAttribute('data-theme', theme);
    // Save to local storage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  // ---------------------------------

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/reports`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data);
      } else {
        toast.error("Failed to load reports");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/reports/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      let responseData;
      try {
        responseData = await res.json();
      } catch (e) {
        responseData = { message: "Server returned non-JSON format" };
      }

      if (res.ok) {
        toast.success(`Report marked as ${newStatus}`);
        setReports(reports.map(report =>
          report._id === id ? { ...report, status: newStatus, updatedAt: new Date().toISOString() } : report
        ));
      } else {
        toast.error(responseData.message || `Failed to update`);
      }
    } catch (error) {
      toast.error("Network error. Check console.");
    }
  };

  const filteredReports = reports.filter(report => {
    if (report.status === 'solved') {
      const lastUpdated = new Date(report.updatedAt || report.createdAt || Date.now());
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (lastUpdated < thirtyDaysAgo) return false;
    }
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesTitle = report.title?.toLowerCase().includes(lowerSearch);
      const matchesId = report._id?.toLowerCase().includes(lowerSearch);
      if (!matchesTitle && !matchesId) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 className="display-font" style={{ fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Police Command Center
          </h1>
          <p className="mono-font" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Active Incident Database
          </p>
        </div>

        {/* Toolbar: Search, Filters, & Theme Toggle */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>

          {/* NEW: Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search ID or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '10px 12px 10px 36px',
                borderRadius: '6px',
                fontSize: '13px',
                width: '240px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Filter size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '10px 32px',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="solved">Solved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="mono-font" style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em' }}>CASE ID</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>FILED ON</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>TITLE / DETAILS</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>CATEGORY</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>STATUS</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading intelligence data...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No active reports match your criteria.</td></tr>
              ) : (
                filteredReports.map((report, index) => (
                  <motion.tr
                    key={report._id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="mono-font" style={{ padding: '16px', color: 'var(--text-primary)' }}>
                      {(report._id || report.id || 'XXXXXX').substring(0, 8)}
                    </td>

                    <td className="mono-font" style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', {
                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      }) : 'N/A'}
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{report.title || 'Untitled Report'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {report.description || 'No description provided.'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {report.category || 'General'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={report.status} />
                    </td>
                    <td style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {report.status !== 'approved' && report.status !== 'solved' && (
                        <ActionButton
                          icon={<Check size={14} />}
                          label="Approve"
                          color="var(--color-success)"
                          onClick={() => handleStatusChange(report._id || report.id, 'approved')}
                        />
                      )}
                      {report.status === 'approved' && (
                        <ActionButton
                          icon={<ShieldCheck size={14} />}
                          label="Solve"
                          color="var(--color-primary)"
                          onClick={() => handleStatusChange(report._id || report.id, 'solved')}
                        />
                      )}
                      {report.status !== 'rejected' && report.status !== 'solved' && (
                        <ActionButton
                          icon={<X size={14} />}
                          label="Reject"
                          color="var(--color-danger)"
                          onClick={() => handleStatusChange(report._id || report.id, 'rejected')}
                        />
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// --- Helper Components ---

function StatusBadge({ status }) {
  let config = { bg: 'rgba(255, 170, 0, 0.1)', color: 'var(--color-warning)', text: 'PENDING' };

  if (status === 'approved') config = { bg: 'rgba(0, 217, 126, 0.1)', color: 'var(--color-success)', text: 'APPROVED' };
  if (status === 'rejected') config = { bg: 'rgba(255, 64, 64, 0.1)', color: 'var(--color-danger)', text: 'REJECTED' };
  if (status === 'solved') config = { bg: 'rgba(0, 207, 255, 0.1)', color: 'var(--color-primary)', text: 'SOLVED' };

  return (
    <span className="mono-font" style={{
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.color}`,
      opacity: 0.9,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em'
    }}>
      {config.text}
    </span>
  );
}

function ActionButton({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: 'transparent',
        border: `1px solid var(--border-subtle)`,
        color: color,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        // Fallback for hover state
        e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
    </button>
  );
}
