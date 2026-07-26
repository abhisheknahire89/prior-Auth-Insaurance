import React from 'react';

interface DocumentSection {
  id: string;
  title: string;
  icon: string;
  startPage: number;
  endPage: number;
}

interface DocumentNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageSelect: (pageNumber: number) => void;
}

const SECTIONS: DocumentSection[] = [
  { id: 'cover', title: 'Cover Page', icon: '📄', startPage: 1, endPage: 1 },
  { id: 'summary', title: 'Case Summary', icon: '📋', startPage: 2, endPage: 2 },
  { id: 'patient', title: 'Patient Info', icon: '👤', startPage: 3, endPage: 3 },
  { id: 'clinical', title: 'Clinical Details', icon: '🏥', startPage: 4, endPage: 5 },
  { id: 'investigation', title: 'Investigations', icon: '🔬', startPage: 6, endPage: 6 },
  { id: 'diagnosis', title: 'Diagnosis & Code', icon: '📊', startPage: 7, endPage: 7 },
  { id: 'cost', title: 'Cost Estimate', icon: '💰', startPage: 8, endPage: 8 },
  { id: 'approval', title: 'Approval Summary', icon: '✓', startPage: 9, endPage: 9 }
];

export const DocumentNavigation: React.FC<DocumentNavigationProps> = ({
  currentPage,
  totalPages,
  onPageSelect
}) => {
  const getCurrentSection = () => {
    return SECTIONS.find(s => currentPage >= s.startPage && currentPage <= s.endPage);
  };

  const currentSection = getCurrentSection();

  return (
    <div className="hidden lg:flex flex-col gap-4 bg-white rounded-lg border border-opd-border shadow-sm p-4 w-64 flex-shrink-0 h-fit sticky top-4">
      {/* Current Page Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-opd-primary uppercase tracking-wider font-lora">
            Document Navigation
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-opd-primary/10 text-opd-primary">
            {currentPage}/{totalPages}
          </span>
        </div>
        {currentSection && (
          <p className="text-xs text-opd-text-secondary">
            <span className="text-lg mr-1">{currentSection.icon}</span>
            <span className="font-semibold text-opd-text-primary">{currentSection.title}</span>
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-opd-border rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-opd-primary to-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>

      {/* Section Index */}
      <div className="space-y-1.5">
        {SECTIONS.map((section, idx) => {
          const isActive = section.startPage === currentPage || (currentPage >= section.startPage && currentPage <= section.endPage);
          const isVisited = currentPage > section.endPage;

          return (
            <button
              key={section.id}
              onClick={() => onPageSelect(section.startPage)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs font-medium flex items-center gap-2 ${
                isActive
                  ? 'bg-opd-primary/10 border-opd-primary text-opd-primary'
                  : isVisited
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-opd-border/50 text-opd-text-secondary hover:border-opd-primary/30'
              }`}
              type="button"
            >
              <span className="text-base shrink-0">{section.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate">{section.title}</p>
                <p className={`text-[9px] ${isActive ? 'text-opd-primary' : 'text-opd-text-secondary'}`}>
                  p.{section.startPage}{section.endPage !== section.startPage ? `–${section.endPage}` : ''}
                </p>
              </div>
              {isActive && <span className="text-lg">→</span>}
              {isVisited && <span className="text-lg">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Page Range Info */}
      <div className="pt-2 border-t border-opd-border/50">
        <div className="text-[9px] text-opd-text-secondary space-y-1">
          <p className="font-semibold text-opd-text-primary">Document Structure</p>
          <p>9-page prior authorization package including patient details, clinical evidence, investigations, diagnosis, cost estimate, and approval recommendation.</p>
        </div>
      </div>
    </div>
  );
};
