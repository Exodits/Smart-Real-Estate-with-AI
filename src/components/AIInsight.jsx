import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, Cpu } from 'lucide-react';

export default function AIInsight({ report, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <Sparkles size={32} className="spinner" style={{ color: 'var(--color-gold)', margin: '0 auto 12px' }} />
        <h4 style={{ color: 'var(--color-navy)', fontSize: '16px' }}>
          Synthesizing Evidence-Based Investment Analysis...
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '4px' }}>
          Evaluating real-time amenities, live AQI, official safety records, and market benchmarks.
        </p>
      </div>
    );
  }

  if (!report) return null;

  function getOutlookBadge(outlook) {
    switch (outlook) {
      case 'Positive':
        return { cls: 'badge-emerald', icon: CheckCircle2, color: 'var(--color-emerald)' };
      case 'Neutral':
        return { cls: 'badge-gold', icon: HelpCircle, color: 'var(--color-gold)' };
      case 'Cautious':
        return { cls: 'badge-rose', icon: AlertTriangle, color: 'var(--color-rose)' };
      default:
        return { cls: 'badge-navy', icon: HelpCircle, color: 'var(--color-slate)' };
    }
  }

  const badgeInfo = getOutlookBadge(report.outlook);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div className="card" style={{ padding: '28px', borderLeft: `6px solid ${badgeInfo.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-slate)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Sparkles size={16} color="var(--color-gold)" />
            <span>AI Investment Outlook</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
            {report.outlook}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span className={`badge ${badgeInfo.cls}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
            <BadgeIcon size={14} /> {report.outlook}
          </span>
          <span className="badge badge-navy" style={{ fontSize: '13px', padding: '6px 14px' }}>
            Confidence: {report.confidence || 'Medium'}
          </span>
        </div>
      </div>

      <p style={{ marginTop: '16px', fontSize: '14px', lineHeight: '1.6', color: 'var(--color-charcoal)' }}>
        {report.summary}
      </p>

      {/* Factors & Risks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {report.keyFactors && report.keyFactors.length > 0 && (
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color="var(--color-emerald)" /> Key Supporting Factors
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-charcoal)' }}>
              {report.keyFactors.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--color-emerald)', fontWeight: 'bold' }}>•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.risks && report.risks.length > 0 && (
          <div style={{ background: '#fff9f9', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid #fee2e2' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} color="var(--color-rose)" /> Identified Location Risks
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#7f1d1d' }}>
              {report.risks.map((r, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--color-rose)', fontWeight: 'bold' }}>•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--color-slate)' }}>
        <div>
          <strong>Important:</strong> {report.disclaimer || 'This is an analytical estimate, not financial advice.'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-slate-light)' }}>
          <Cpu size={14} /> Engine: {report.engine || 'TerraFind Deterministic Analyzer'}
        </div>
      </div>
    </div>
  );
}
