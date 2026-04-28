import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#D9A05B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B'];

const AnalyticsTab = ({ analytics }) => {
  if (!analytics) return <div style={{ color: '#94A3B8' }}>Loading Advanced Analytics...</div>;
  
  const { overview, charts } = analytics;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Top Value Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
        <div style={{ background: '#121A2F', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Users 👥</p>
          <h2 style={{ fontSize: '2.5rem', color: 'white', margin: '0.5rem 0' }}>{overview.totalUsers}</h2>
          <p style={{ color: '#10B981', fontSize: '0.8rem', margin: 0 }}>Active Accounts</p>
        </div>
        <div style={{ background: '#121A2F', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Cases 📂</p>
          <h2 style={{ fontSize: '2.5rem', color: '#3B82F6', margin: '0.5rem 0' }}>{overview.totalCases}</h2>
          <p style={{ color: '#3B82F6', fontSize: '0.8rem', margin: 0 }}>Registered Disputes</p>
        </div>
        <div style={{ background: '#121A2F', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Lawyers ⚖️</p>
          <h2 style={{ fontSize: '2.5rem', color: '#D9A05B', margin: '0.5rem 0' }}>{overview.activeLawyers}</h2>
          <p style={{ color: '#D9A05B', fontSize: '0.8rem', margin: 0 }}>Currently Verified</p>
        </div>
        <div style={{ background: '#121A2F', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenue Earned 💰</p>
          <h2 style={{ fontSize: '2.5rem', color: '#10B981', margin: '0.5rem 0' }}>₹{overview.revenueEarned}</h2>
          <p style={{ color: '#10B981', fontSize: '0.8rem', margin: 0 }}>Cleared Transactions</p>
        </div>
        <div style={{ background: '#121A2F', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Payments ⏳</p>
          <h2 style={{ fontSize: '2.5rem', color: '#EF4444', margin: '0.5rem 0' }}>{overview.pendingPayments}</h2>
          <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: 0 }}>Awaiting Clearance</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
        {/* Cases Per Day (Line) */}
        <div style={{ background: '#121A2F', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '2rem' }}>📈 Case Velocity (14 Days)</h3>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.casesPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickMargin={10} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0A0F1D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                <Line type="monotone" dataKey="cases" stroke="#3B82F6" strokeWidth={4} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Growth (Bar) */}
        <div style={{ background: '#121A2F', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '2rem' }}>💸 Revenue Growth</h3>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0A0F1D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        {/* Case Types Distribution (Pie) */}
        <div style={{ background: '#121A2F', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '1rem' }}>⚖️ Case Types Distribution</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {charts.caseTypes.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontStyle: 'italic' }}>
                No cases registered yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={charts.caseTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5}>
                    {charts.caseTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0A0F1D', border: 'none', borderRadius: '12px', color: 'white' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ padding: '20px 0 0 0' }} />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Success vs Failed Payments */}
        <div style={{ background: '#121A2F', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', fontWeight: '800', marginBottom: '1rem' }}>💳 Success vs Failed Payments</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {charts.paymentStats.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontStyle: 'italic' }}>
                No payment data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={charts.paymentStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={0} outerRadius={110} paddingAngle={2}>
                    {charts.paymentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'success' ? '#10B981' : entry.name === 'pending' ? '#F59E0B' : '#EF4444'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0A0F1D', border: 'none', borderRadius: '12px', color: 'white' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ padding: '20px 0 0 0', textTransform: 'uppercase', fontSize: '0.8rem' }} />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
