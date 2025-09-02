import React from 'react';

interface TemplatePreviewProps {
  template: 'template-modern' | 'template-classic' | 'template-minimal';
  className?: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, className = '' }) => {
  const getPreviewSVG = () => {
    switch (template) {
      case 'template-modern':
        return (
          <svg width="60" height="80" viewBox="0 0 60 80" className={className}>
            <rect width="60" height="80" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
            {/* Header with blue accent */}
            <rect x="4" y="4" width="52" height="12" fill="#3b82f6" rx="2"/>
            <rect x="6" y="6" width="20" height="2" fill="white" rx="1"/>
            <rect x="6" y="9" width="35" height="1" fill="#93c5fd" rx="0.5"/>
            <rect x="6" y="11" width="30" height="1" fill="#93c5fd" rx="0.5"/>
            
            {/* Section divider */}
            <rect x="4" y="20" width="52" height="1" fill="#3b82f6"/>
            <rect x="4" y="24" width="16" height="2" fill="#1e293b" rx="1"/>
            <rect x="4" y="28" width="48" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="30" width="45" height="1" fill="#64748b" rx="0.5"/>
            
            {/* Another section */}
            <rect x="4" y="36" width="52" height="1" fill="#3b82f6"/>
            <rect x="4" y="40" width="18" height="2" fill="#1e293b" rx="1"/>
            <rect x="4" y="44" width="50" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="46" width="42" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="48" width="46" height="1" fill="#64748b" rx="0.5"/>
            
            {/* Skills section */}
            <rect x="4" y="54" width="52" height="1" fill="#3b82f6"/>
            <rect x="4" y="58" width="12" height="2" fill="#1e293b" rx="1"/>
            <rect x="4" y="62" width="10" height="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.5" rx="1"/>
            <rect x="16" y="62" width="12" height="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.5" rx="1"/>
            <rect x="30" y="62" width="8" height="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.5" rx="1"/>
            <rect x="40" y="62" width="14" height="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.5" rx="1"/>
          </svg>
        );
        
      case 'template-classic':
        return (
          <svg width="60" height="80" viewBox="0 0 60 80" className={className}>
            <rect width="60" height="80" fill="#fefefe" stroke="#d1d5db" strokeWidth="1"/>
            {/* Classic header */}
            <rect x="4" y="4" width="52" height="14" fill="#374151"/>
            <rect x="6" y="6" width="22" height="3" fill="white" rx="1"/>
            <rect x="6" y="10" width="38" height="1" fill="#d1d5db" rx="0.5"/>
            <rect x="6" y="12" width="32" height="1" fill="#d1d5db" rx="0.5"/>
            <rect x="6" y="14" width="35" height="1" fill="#d1d5db" rx="0.5"/>
            
            {/* Underlined section headers */}
            <rect x="4" y="22" width="20" height="2" fill="#374151" rx="1"/>
            <rect x="4" y="26" width="20" height="0.5" fill="#374151"/>
            <rect x="4" y="30" width="48" height="1" fill="#6b7280" rx="0.5"/>
            <rect x="4" y="32" width="45" height="1" fill="#6b7280" rx="0.5"/>
            <rect x="4" y="34" width="50" height="1" fill="#6b7280" rx="0.5"/>
            
            {/* Another section */}
            <rect x="4" y="40" width="18" height="2" fill="#374151" rx="1"/>
            <rect x="4" y="44" width="18" height="0.5" fill="#374151"/>
            <rect x="4" y="48" width="46" height="1" fill="#6b7280" rx="0.5"/>
            <rect x="4" y="50" width="42" height="1" fill="#6b7280" rx="0.5"/>
            <rect x="4" y="52" width="48" height="1" fill="#6b7280" rx="0.5"/>
            
            {/* Traditional skills layout */}
            <rect x="4" y="58" width="14" height="2" fill="#374151" rx="1"/>
            <rect x="4" y="62" width="14" height="0.5" fill="#374151"/>
            <rect x="4" y="66" width="48" height="1" fill="#6b7280" rx="0.5"/>
            <rect x="4" y="68" width="45" height="1" fill="#6b7280" rx="0.5"/>
            <rect x="4" y="70" width="50" height="1" fill="#6b7280" rx="0.5"/>
          </svg>
        );
        
      case 'template-minimal':
        return (
          <svg width="60" height="80" viewBox="0 0 60 80" className={className}>
            <rect width="60" height="80" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1"/>
            {/* Minimal header */}
            <rect x="4" y="4" width="24" height="3" fill="#0f172a" rx="1"/>
            <rect x="4" y="9" width="40" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="11" width="35" height="1" fill="#64748b" rx="0.5"/>
            
            {/* Simple line separators */}
            <line x1="4" y1="18" x2="56" y2="18" stroke="#e2e8f0" strokeWidth="1"/>
            <rect x="4" y="22" width="16" height="1.5" fill="#475569" rx="0.5"/>
            <rect x="4" y="26" width="48" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="28" width="45" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="30" width="50" height="1" fill="#64748b" rx="0.5"/>
            
            {/* Another clean section */}
            <line x1="4" y1="36" x2="56" y2="36" stroke="#e2e8f0" strokeWidth="1"/>
            <rect x="4" y="40" width="18" height="1.5" fill="#475569" rx="0.5"/>
            <rect x="4" y="44" width="46" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="46" width="42" height="1" fill="#64748b" rx="0.5"/>
            <rect x="4" y="48" width="48" height="1" fill="#64748b" rx="0.5"/>
            
            {/* Minimal skills */}
            <line x1="4" y1="54" x2="56" y2="54" stroke="#e2e8f0" strokeWidth="1"/>
            <rect x="4" y="58" width="12" height="1.5" fill="#475569" rx="0.5"/>
            <rect x="4" y="62" width="8" height="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" rx="1"/>
            <rect x="14" y="62" width="10" height="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" rx="1"/>
            <rect x="26" y="62" width="7" height="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" rx="1"/>
            <rect x="35" y="62" width="12" height="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" rx="1"/>
          </svg>
        );
        
      default:
        return null;
    }
  };

  return getPreviewSVG();
};