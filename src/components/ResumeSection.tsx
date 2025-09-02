import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { EditableContent } from './EditableContent';
import type { Section } from './ResumeBuilder';
import { SectionConfirm } from './sections/SectionConfirm';
import { HeaderSection } from './sections/header';
import { ExperienceSectionBody } from './sections/experience';
import { EducationSectionBody } from './sections/education';
import { ProjectsSectionBody } from './sections/projects';
import { SkillsSectionBody } from './sections/skills';
import { SimpleEntriesSectionBody } from './sections/simple';
import { VolunteerSectionBody } from './sections/volunteer';

interface ResumeSectionProps {
  section: Section;
  prevSectionId?: string; // not used now but kept for future logic
  prevSectionKind?: string;
  onMove: (sectionId: string, direction: 'up' | 'down') => void;
  onToggleVisibility: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onUpdate: (sectionId: string, updates: Partial<Section>) => void;
  onAddEntry: (sectionId: string) => void;
  onDeleteEntry: (sectionId: string, entryId: string) => void;
  onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
  onToggleEntryVisibility: (sectionId: string, entryIdOrGroup: string) => void;
  onReorderEntries: (sectionId: string, order: string[], isGrouped: boolean) => void;
  previewMode: boolean;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  section,
  prevSectionKind,
  onMove,
  onToggleVisibility,
  onDelete,
  onUpdate,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
  onToggleEntryVisibility,
  onReorderEntries,
  previewMode
}) => {
  const SUMMARY_CHAR_LIMIT = 300;

  // Determine if a section has any meaningful (non-empty) content
  const sectionHasContent = (section: Section): boolean => {
    // Treat '__HIDDEN__' as empty sentinel
    const normalize = (c: string) => (c === '__HIDDEN__' ? '' : c);
    // Helper to get plain text (strip simple tags)
    const plain = (c: string) => normalize(c).replace(/<[^>]*>/g, '').trim();
    // For grouped sections we still just look at all entries
  return section.entries.some(e => e.visible !== false && plain(e.content).length > 0);
  };

  // Hidden section handling + auto-hide if empty in preview
  if (previewMode) {
    if (!section.visible) return null;
    if (!sectionHasContent(section)) return null;
  }
  if (!previewMode && !section.visible) {
    return (
      <div className="resume-section p-2 border border-dashed rounded bg-muted/30 opacity-60 hover:opacity-80 transition flex items-center justify-between text-xs" data-section-id={section.id}>
        <div className="flex items-center gap-2">
          <EyeOff className="w-3 h-3" />
          <span className="font-medium">
            {section.type === 'header' ? 'Header' : section.title || 'Untitled Section'} (Hidden)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(section.id)}
            className="h-6 px-2"
            title="Show Section"
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  const handleTitleChange = (content: string) => onUpdate(section.id, { title: content });

  // Helper to delete grouped entries (experience/education/projects)
  const deleteGroup = (prefix: string) => {
    section.entries
      .filter(e => e.id.startsWith(prefix + '-'))
      .forEach(e => onDeleteEntry(section.id, e.id));
  };

  const renderSectionBody = () => {
    if (section.id === 'header') return (
      <HeaderSection section={section} previewMode={previewMode} onUpdateEntry={onUpdateEntry} />
    );
    if (section.type === 'skills') return (
      <SkillsSectionBody section={section} previewMode={previewMode} onUpdateEntry={onUpdateEntry} onDeleteEntry={onDeleteEntry} onToggleEntryVisibility={onToggleEntryVisibility} onReorderEntries={onReorderEntries} />
    );
    if (section.kind === 'experience') return (
      <ExperienceSectionBody section={section} previewMode={previewMode} onUpdateEntry={onUpdateEntry} onDeleteEntry={onDeleteEntry} deleteGroup={deleteGroup} onToggleEntryVisibility={onToggleEntryVisibility} onReorderEntries={onReorderEntries} />
    );
    if (section.kind === 'education') return (
      <EducationSectionBody section={section} previewMode={previewMode} onUpdateEntry={onUpdateEntry} deleteGroup={deleteGroup} onToggleEntryVisibility={onToggleEntryVisibility} onReorderEntries={onReorderEntries} />
    );
    if (section.kind === 'projects') return (
      <ProjectsSectionBody section={section} previewMode={previewMode} onUpdateEntry={onUpdateEntry} deleteGroup={deleteGroup} onToggleEntryVisibility={onToggleEntryVisibility} onReorderEntries={onReorderEntries} />
    );
    if (section.kind === 'volunteer') return (
      <VolunteerSectionBody section={section} previewMode={previewMode} onUpdateEntry={onUpdateEntry} onDeleteEntry={onDeleteEntry} deleteGroup={deleteGroup} onToggleEntryVisibility={onToggleEntryVisibility} onReorderEntries={onReorderEntries} />
    );
    return (
      <SimpleEntriesSectionBody section={section} previewMode={previewMode} onUpdateEntry={onUpdateEntry} onDeleteEntry={onDeleteEntry} summaryCharLimit={SUMMARY_CHAR_LIMIT} onToggleEntryVisibility={onToggleEntryVisibility} onReorderEntries={onReorderEntries} />
    );
  };

  return (
    <section className="resume-section p-4" data-section-id={section.id}>
      {/* Controls */}
      {!previewMode && section.id !== 'header' && (
        <div className="section-controls">
          {section.kind !== 'summary' && prevSectionKind !== 'summary' && (
            <Button variant="ghost" size="sm" onClick={() => onMove(section.id, 'up')} className="control-button" title="Move Up">
              <ChevronUp className="w-3 h-3" />
            </Button>
          )}
            {section.kind !== 'summary' && (
            <Button variant="ghost" size="sm" onClick={() => onMove(section.id, 'down')} className="control-button" title="Move Down">
              <ChevronDown className="w-3 h-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onToggleVisibility(section.id)} className="control-button" title={section.visible ? 'Hide Section' : 'Show Section'}>
            {section.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          <SectionConfirm
            title="Delete section?"
            description="This will remove this section and all its entries."
            onConfirm={() => onDelete(section.id)}
          >
            <Button variant="ghost" size="sm" className="control-button hover:bg-destructive hover:text-destructive-foreground" title="Delete Section">
              <Trash2 className="w-3 h-3" />
            </Button>
          </SectionConfirm>
        </div>
      )}

      {/* Title (non-header). Kinded sections have fixed title */}
      {section.type !== 'header' && (
        section.kind ? (
          <div className="section-title mb-4 select-none cursor-default">{section.title}</div>
        ) : (
          <EditableContent
            content={section.title}
            onChange={handleTitleChange}
            previewMode={previewMode}
            className="section-title mb-4"
            placeholder="Section Title"
          />
        )
      )}

      <div className="section-content">
  {renderSectionBody()}
      </div>

      {!previewMode && section.id !== 'header' && section.kind !== 'summary' && (
        <Button variant="outline" size="sm" onClick={() => onAddEntry(section.id)} className="mt-3 gap-2 text-xs">
          <Plus className="w-3 h-3" />
          {section.kind === 'experience' && 'Add Experience'}
          {section.kind === 'education' && 'Add Education'}
          {section.kind === 'volunteer' && 'Add Volunteer Experience'}
          {section.kind === 'projects' && 'Add Project'}
          {section.type === 'skills' && !section.kind && 'Add Skill'}
          {!section.kind && section.type !== 'skills' && 'Add Entry'}
        </Button>
      )}
    </section>
  );
};