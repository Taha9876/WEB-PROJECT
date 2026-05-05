export default function StatCard({ icon: Icon, label, value, unit, trend, color = 'var(--primary-color)' }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      flex: '1 1 200px',
      minWidth: '200px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
        {Icon && <Icon size={24} color={color} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        }}>{value}</span>
        {unit && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{unit}</span>}
      </div>
      {trend && (
        <p style={{ color: trend > 0 ? '#10b981' : '#ef4444', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
          {trend > 0 ? '+' : ''}{trend}% from last week
        </p>
      )}
    </div>
  );
}
