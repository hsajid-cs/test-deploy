import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResumeSection } from './ResumeSection';
import { TemplatePreview } from './TemplatePreview';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Eye } from 'lucide-react';
import { AddSectionModal } from './AddSectionModal';
import { SectionType } from '@/types/resume';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Entry {
  id: string;
  content: string;
  type: 'text' | 'html';
  visible?: boolean; // per-entry visibility (default true)
}

export interface Section {
  id: string;
  title: string;
  entries: Entry[];
  visible: boolean;
  type: 'standard' | 'skills' | 'header';
  /** Optional semantic kind used to avoid adding duplicates (skills, projects, etc.) */
  kind?: SectionType;
}

const initialSections: Section[] = [
  {
    id: 'header',
    title: 'Header',
    type: 'header',
    visible: true,
    entries: [
      { id: 'name', type: 'text', content: '' },
      { id: 'role', type: 'text', content: '' },
      { id: 'phone', type: 'text', content: '' },
      { id: 'email', type: 'text', content: '' },
      { id: 'location', type: 'text', content: '' },
      { id: 'linkedin', type: 'text', content: '' },
      { id: 'website', type: 'text', content: '' }
    ]
  },
  {
    id: 'summary',
    title: 'Professional Summary',
    type: 'standard',
    visible: true,
    kind: 'summary',
  entries: [ { id: 'summary-text', type: 'text', content: '' } ]
  },
  {
    id: 'experience',
    title: 'Experience',
    type: 'standard',
    visible: true,
    kind: 'experience',
    entries: [
  { id: 'exp1-role', type: 'text', content: '' },
  { id: 'exp1-company', type: 'text', content: '' },
  { id: 'exp1-start', type: 'text', content: '' },
  { id: 'exp1-end', type: 'text', content: '' },
  { id: 'exp1-desc', type: 'text', content: '' }
    ]
  },
  {
    id: 'education',
    title: 'Education',
    type: 'standard',
    visible: true,
  kind: 'education',
    entries: [
  { id: 'edu1-degree', type: 'text', content: '' },
  { id: 'edu1-institution', type: 'text', content: '' },
  { id: 'edu1-start', type: 'text', content: '' },
  { id: 'edu1-end', type: 'text', content: '' },
  { id: 'edu1-gpa', type: 'text', content: '' },
  { id: 'edu1-desc', type: 'text', content: '' }
    ]
  },
  {
    id: 'skills',
    title: 'Skills',
    type: 'skills',
    visible: true,
    kind: 'skills',
    entries: [
      { id: 'skill1', type: 'text', content: '' },
      { id: 'skill2', type: 'text', content: '' },
      { id: 'skill3', type: 'text', content: '' }
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    type: 'standard',
    visible: true,
    kind: 'projects',
    entries: [
      { id: 'proj1-name', type: 'text', content: '' },
      { id: 'proj1-stack', type: 'text', content: '' },
      { id: 'proj1-desc', type: 'text', content: '' }
    ]
  }
];

export const ResumeBuilder: React.FC = () => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [template, setTemplate] = useState('template-modern');
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const newSections = [...prev];
      const index = newSections.findIndex(s => s.id === sectionId);
      if (index === -1) return prev;
      const target = newSections[index];
      // Block moving Professional Summary (kind==='summary') entirely
      if (target.kind === 'summary') return prev;
      if (direction === 'up') {
        if (index === 0) return prev; // top already
        // Prevent moving a section to a position above summary
        const above = newSections[index - 1];
        if (above.kind === 'summary') return prev; // cannot swap above summary
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      } else if (direction === 'down') {
        if (index === newSections.length - 1) return prev; // bottom already
        // Also ensure we don't move summary indirectly (handled by guard above)
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      }
      return newSections;
    });
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, visible: !section.visible }
          : section
      )
    );
  };

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    toast({
      title: "Section deleted",
      description: "The section has been removed from your resume.",
    });
  };

  const [addModalOpen, setAddModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const addSection = (sectionType: SectionType = 'custom', providedTitle?: string) => {
    const idBase = `${sectionType}-${Date.now()}`;
    let newSection: Section;
    switch (sectionType) {
      case 'summary':
        newSection = {
          id: idBase,
          title: 'Professional Summary',
          type: 'standard',
          visible: true,
          kind: 'summary',
          entries: [ { id: 'summary-text', type: 'text', content: '' } ]
        };
        break;
      case 'experience':
        newSection = {
          id: idBase,
          title: 'Experience',
          type: 'standard',
          visible: true,
          kind: 'experience',
          entries: [
            { id: 'exp1-role', type: 'text', content: '' },
            { id: 'exp1-company', type: 'text', content: '' },
            { id: 'exp1-start', type: 'text', content: '' },
            { id: 'exp1-end', type: 'text', content: '' },
            { id: 'exp1-desc', type: 'text', content: '' }
          ]
        };
        break;
      case 'education':
        newSection = {
          id: idBase,
          title: 'Education',
          type: 'standard',
          visible: true,
          kind: 'education',
          entries: [
            { id: 'edu1-degree', type: 'text', content: '' },
            { id: 'edu1-institution', type: 'text', content: '' },
            { id: 'edu1-start', type: 'text', content: '' },
            { id: 'edu1-end', type: 'text', content: '' },
            { id: 'edu1-gpa', type: 'text', content: '' },
            { id: 'edu1-desc', type: 'text', content: '' }
          ]
        };
        break;
      case 'skills':
        newSection = {
          id: idBase,
            title: 'Skills',
            type: 'skills',
            visible: true,
            kind: 'skills',
            entries: [1,2,3].map(i => ({ id: `${idBase}-skill${i}`, type: 'text', content: '' }))
        };
        break;
      case 'projects':
        newSection = {
          id: idBase,
          title: 'Projects',
          type: 'standard',
          visible: true,
          kind: 'projects',
          entries: [
            { id: `${idBase}-proj1-name`, type: 'text', content: '' },
            { id: `${idBase}-proj1-stack`, type: 'text', content: '' },
            { id: `${idBase}-proj1-desc`, type: 'text', content: '' }
          ]
        };
        break;
      case 'volunteer':
        newSection = {
          id: idBase,
          title: 'Volunteer Experience',
          type: 'standard',
          visible: true,
          kind: 'volunteer',
          entries: [
            { id: `${idBase}-vol1-role`, type: 'text', content: '' },
            { id: `${idBase}-vol1-organization`, type: 'text', content: '' },
            { id: `${idBase}-vol1-start`, type: 'text', content: '' },
            { id: `${idBase}-vol1-end`, type: 'text', content: '' },
            { id: `${idBase}-vol1-desc`, type: 'text', content: '' }
          ]
        };
        break;
      default:
        newSection = {
          id: idBase,
          title: providedTitle || (sectionType === 'custom' ? 'New Section' : sectionType.charAt(0).toUpperCase() + sectionType.slice(1)),
          type: 'standard',
          visible: true,
          // For custom we intentionally omit kind so multiple customs allowed
          kind: sectionType === 'custom' ? undefined : sectionType,
          entries: [
            { id: `${idBase}-entry1`, type: 'text', content: '' }
          ]
        };
    }
    setSections(prev => {
      // Ensure Professional Summary always sits right after header when added
      if (newSection.kind === 'summary') {
        // Prevent duplicates safety check
        if (prev.some(s => s.kind === 'summary')) return prev;
        const headerIndex = prev.findIndex(s => s.id === 'header');
        const insertIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
        const updated = [...prev];
        updated.splice(insertIndex, 0, newSection);
        return updated;
      }
      return [...prev, newSection];
    });
    toast({ title: 'Section added', description: `${newSection.title} section added.` });
    setAddModalOpen(false);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates }
          : section
      )
    );
  };

  const addEntry = (sectionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const now = Date.now();
      // Grouped Experience
      if (section.kind === 'experience') {
        const existingGroups = section.entries
          .map(e => e.id.match(/^exp(\d+)-/))
          .filter(Boolean)
          .map(m => parseInt(m![1],10));
        const nextIndex = existingGroups.length ? Math.max(...existingGroups) + 1 : 1;
        const prefix = `exp${nextIndex}`;
        const newEntries: Entry[] = [
          { id: `${prefix}-role`, type: 'text', content: '' },
          { id: `${prefix}-company`, type: 'text', content: '' },
          { id: `${prefix}-start`, type: 'text', content: '' },
          { id: `${prefix}-end`, type: 'text', content: '' },
          { id: `${prefix}-desc`, type: 'text', content: '' }
        ];
        toast({ title: 'Experience added', description: 'New experience entry created.' });
        return { ...section, entries: [...section.entries, ...newEntries] };
      }
      // Grouped Education
      if (section.kind === 'education') {
        const existingGroups = section.entries
          .map(e => e.id.match(/^edu(\d+)-/))
          .filter(Boolean)
          .map(m => parseInt(m![1],10));
        const nextIndex = existingGroups.length ? Math.max(...existingGroups) + 1 : 1;
        const prefix = `edu${nextIndex}`;
        const newEntries: Entry[] = [
          { id: `${prefix}-degree`, type: 'text', content: '' },
          { id: `${prefix}-institution`, type: 'text', content: '' },
          { id: `${prefix}-start`, type: 'text', content: '' },
          { id: `${prefix}-end`, type: 'text', content: '' },
          { id: `${prefix}-gpa`, type: 'text', content: '' },
          { id: `${prefix}-desc`, type: 'text', content: '' }
        ];
        toast({ title: 'Education added', description: 'New education entry created.' });
        return { ...section, entries: [...section.entries, ...newEntries] };
      }
      // Grouped Projects
      if (section.kind === 'projects') {
        const existingGroups = section.entries
          .map(e => e.id.match(/^proj(\d+)-/))
          .filter(Boolean)
          .map(m => parseInt(m![1],10));
        const nextIndex = existingGroups.length ? Math.max(...existingGroups) + 1 : 1;
        const prefix = `proj${nextIndex}`;
        const newEntries: Entry[] = [
          { id: `${prefix}-name`, type: 'text', content: '' },
          { id: `${prefix}-stack`, type: 'text', content: '' },
          { id: `${prefix}-desc`, type: 'text', content: '' }
        ];
        toast({ title: 'Project added', description: 'New project entry created.' });
        return { ...section, entries: [...section.entries, ...newEntries] };
      }
      // Grouped Volunteer
      if (section.kind === 'volunteer') {
        const existingGroups = section.entries
          .map(e => e.id.match(/^vol(\d+)-/))
          .filter(Boolean)
          .map(m => parseInt(m![1],10));
        const nextIndex = existingGroups.length ? Math.max(...existingGroups) + 1 : 1;
        const prefix = `vol${nextIndex}`;
        const newEntries: Entry[] = [
          { id: `${prefix}-role`, type: 'text', content: '' },
          { id: `${prefix}-organization`, type: 'text', content: '' },
          { id: `${prefix}-start`, type: 'text', content: '' },
          { id: `${prefix}-end`, type: 'text', content: '' },
          { id: `${prefix}-desc`, type: 'text', content: '' }
        ];
        toast({ title: 'Volunteer added', description: 'New volunteer entry created.' });
        return { ...section, entries: [...section.entries, ...newEntries] };
      }
      // Skills: add single skill entry
      if (section.type === 'skills') {
  const newSkill: Entry = { id: `${section.id}-skill-${now}`, type: 'text', content: '' }; // start empty (removed 'New Skill' placeholder)
        toast({ title: 'Skill added', description: 'New skill entry created.' });
        return { ...section, entries: [...section.entries, newSkill] };
      }
      // Default simple entry
  const newEntry: Entry = { id: `entry-${now}`, type: 'text', content: '' };
      toast({ title: 'Entry added', description: 'New entry created.' });
      return { ...section, entries: [...section.entries, newEntry] };
    }));
  };

  const deleteEntry = (sectionId: string, entryId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              entries: section.entries.filter(entry => entry.id !== entryId) 
            }
          : section
      )
    );

    toast({
      title: "Entry deleted",
      description: "The entry has been removed from the section.",
    });
  };

  const updateEntry = (sectionId: string, entryId: string, content: string) => {
    setSections(prev => 
      prev.map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          entries: section.entries.map(entry => {
            if (entry.id !== entryId) return entry;
            let newContent = content;
            // For Professional Summary: preserve inline formatting (b/strong, i/em, u)
            // but remove <br> / newline characters and unwrap other tags.
            if (section.kind === 'summary' && entryId === 'summary-text') {
              const sanitizeSummary = (html: string) => {
                const src = html || '';
                if (typeof document === 'undefined') {
                  // Fallback for non-DOM environments: basic regex cleanup
                  return src
                    .replace(/<br\s*\/?>/gi, ' ')
                    .replace(/\r?\n|\u2028|\u2029/g, ' ')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                }
                const wrapper = document.createElement('div');
                wrapper.innerHTML = src;
                const allowed = new Set(['B','STRONG','I','EM','U']);
                const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT, null);
                const toRemove: Element[] = [];
                while (walker.nextNode()) {
                  const el = walker.currentNode as Element;
                  if (el.tagName === 'BR') {
                    // replace <br> with a space text node
                    const space = document.createTextNode(' ');
                    el.parentNode?.insertBefore(space, el);
                    toRemove.push(el);
                  } else if (!allowed.has(el.tagName)) {
                    // unwrap element but keep children
                    while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
                    toRemove.push(el);
                  } else {
                    // strip attributes on allowed inline tags
                    [...el.attributes].forEach(a => el.removeAttribute(a.name));
                  }
                }
                toRemove.forEach(n => n.remove());
                // Normalize whitespace and remove newline chars
                let out = wrapper.innerHTML.replace(/\r?\n|\u2028|\u2029/g, ' ');
                out = out.replace(/\s+/g, ' ').trim();
                return out;
              };
              newContent = sanitizeSummary(newContent);
            }
            return { ...entry, content: newContent };
          })
        };
      })
    );
  };

  // Toggle visibility for a single entry or grouped prefix (exp1, edu2, proj3, vol4)
  const toggleEntryVisibility = (sectionId: string, targetId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
  // Do not allow visibility toggling for Professional Summary or skills entries
  if (section.kind === 'summary' || section.type === 'skills') return section;
      const groupMatch = targetId.match(/^(exp\d+|edu\d+|proj\d+|vol\d+)$/);
      if (groupMatch) {
        const prefix = groupMatch[1] + '-';
        const sample = section.entries.find(e => e.id.startsWith(prefix));
        const nextVisible = sample ? !sample.visible : false;
        return { ...section, entries: section.entries.map(e => e.id.startsWith(prefix) ? { ...e, visible: nextVisible } : e) };
      }
      return { ...section, entries: section.entries.map(e => e.id === targetId ? { ...e, visible: !e.visible } : e) };
    }));
  };

  // Reorder entries. For grouped sections reorder by group prefix order.
  const reorderEntries = (sectionId: string, order: string[], isGrouped: boolean) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      if (!isGrouped) {
        const map = new Map(section.entries.map(e => [e.id, e] as const));
        const reordered: Entry[] = [];
        order.forEach(id => { const ent = map.get(id); if (ent) reordered.push(ent); });
        // append leftovers
        section.entries.forEach(e => { if (!reordered.includes(e)) reordered.push(e); });
        return { ...section, entries: reordered };
      }
      // grouped
      const groups: Record<string, Entry[]> = {};
      section.entries.forEach(e => {
        const m = e.id.match(/^(exp\d+|edu\d+|proj\d+|vol\d+)-/);
        if (m) (groups[m[1]] ||= []).push(e);
      });
      const flat: Entry[] = [];
      order.forEach(g => { if (groups[g]) flat.push(...groups[g]); });
      // add non grouped (skills simple etc.)
      section.entries.forEach(e => { if (!flat.includes(e)) flat.push(e); });
      return { ...section, entries: flat };
    }));
  };

  const handlePrint = () => {
    // Force preview so all editable controls render as static text.
    const wasPreview = previewMode;
    if (!wasPreview) {
      flushSync(() => setPreviewMode(true));
    }

    const cleanup = () => {
      if (!wasPreview) setPreviewMode(false);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    // Slight timeout lets layout settle (especially after large edits) before snapshot.
    setTimeout(() => {
      try {
        window.print();
      } finally {
        // Fallback if afterprint doesn't fire.
        setTimeout(() => cleanup(), 1500);
      }
    }, 50);
  };

  // Derive existing semantic kinds (including legacy detection by id prefix if kind missing)
  const optionalKinds: SectionType[] = ['summary','experience','education','skills','projects','certifications','languages','hobbies','publications','awards','references','volunteer'];
  const existingKinds: SectionType[] = Array.from(new Set(
    sections.flatMap(s => (s.kind && optionalKinds.includes(s.kind)) ? [s.kind] : [])
  ));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 md:px-8">
      {/* Toolbar */}
      <div className="toolbar max-w-4xl mx-auto mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="template-modern">Modern</SelectItem>
              <SelectItem value="template-classic">Classic</SelectItem>
              <SelectItem value="template-minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Section
          </Button>
          
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Resume Container */}
  <div className={`resume-container p-4 sm:p-6 md:p-8 ${template} ${previewMode ? 'preview-mode' : ''}`}>
        {sections.map((section, idx) => {
          const prevSection = idx > 0 ? sections[idx - 1] : undefined;
          return (
            <ResumeSection
              key={section.id}
              section={section}
              prevSectionId={prevSection?.id}
              prevSectionKind={prevSection?.kind}
              onMove={moveSection}
              onToggleVisibility={toggleSectionVisibility}
              onDelete={deleteSection}
              onUpdate={updateSection}
              onAddEntry={addEntry}
              onDeleteEntry={deleteEntry}
              onUpdateEntry={updateEntry}
              onToggleEntryVisibility={toggleEntryVisibility}
              onReorderEntries={reorderEntries}
              previewMode={previewMode}
            />
          );
        })}
      </div>
  {!isMobile && (
    <AddSectionModal isOpen={addModalOpen} onClose={()=>setAddModalOpen(false)} onAddSection={(t,title)=>addSection(t,title)} existingKinds={existingKinds} />
  )}
  {isMobile && addModalOpen && (
    <div className="fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">Add Section</div>
        <Button size="sm" variant="ghost" onClick={()=>setAddModalOpen(false)}>Close</Button>
      </div>
      <div className="divide-y border rounded-md overflow-hidden max-h-60 overflow-y-auto">
        {['summary','experience','education','skills','projects','certifications','languages','hobbies','publications','awards','references','volunteer','custom']
          .filter(k => k==='custom' || !existingKinds.includes(k as SectionType))
          .map(k => {
            const label = k === 'custom' ? 'Custom Section' : k.replace(/^[a-z]/, c=>c.toUpperCase());
            return (
              <button
                key={k}
                onClick={()=>addSection(k as SectionType)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm bg-background hover:bg-accent transition-colors"
              >
                <span className="capitalize">{label}</span>
                <span className="font-semibold text-base leading-none">+</span>
              </button>
            );
          })}
        {(['summary','experience','education','skills','projects','certifications','languages','hobbies','publications','awards','references','volunteer']
            .every(k => existingKinds.includes(k as SectionType))) && (
          <div className="px-4 py-3 text-xs text-muted-foreground italic">All optional sections added.</div>
        )}
      </div>
    </div>
  )}
  </div>
  );
};