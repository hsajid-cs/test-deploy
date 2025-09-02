import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { EditableContent } from '../EditableContent';
import { SectionConfirm } from './SectionConfirm';
import { DateField } from '../DateField';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Section, Entry } from '../ResumeBuilder';

interface VolunteerSectionBodyProps {
  section: Section;
  previewMode: boolean;
  onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
  onDeleteEntry: (sectionId: string, entryId: string) => void;
  deleteGroup: (prefix: string) => void;
  onToggleEntryVisibility: (sectionId: string, groupId: string) => void;
  onReorderEntries: (sectionId: string, order: string[], isGrouped: boolean) => void;
}

export const VolunteerSectionBody: React.FC<VolunteerSectionBodyProps> = ({ section, previewMode, onUpdateEntry, deleteGroup, onToggleEntryVisibility, onReorderEntries }) => {
  const isMobile = useIsMobile();
  const DESC_CHAR_LIMIT = 350; // character limit for description fields
  const groups: Record<string, Partial<Record<string, Entry>>> = {};
  section.entries.forEach(e => {
    const m = e.id.match(/^(vol\d+)-(role|organization|start|end|desc)$/);
    if (m) {
      const key = m[1]; const field = m[2];
      (groups[key] ||= {})[field] = e;
    }
  });

  const handleDragStart = (e: React.DragEvent, groupId: string) => { if (previewMode) return; e.dataTransfer.setData('text/plain', groupId); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { if (!previewMode) e.preventDefault(); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: string) => { if (previewMode) return; e.preventDefault(); const source = e.dataTransfer.getData('text/plain'); if (!source || source===target) return; const order = Object.keys(groups).sort(); const from = order.indexOf(source); const to = order.indexOf(target); if (from===-1||to===-1) return; const newOrder=[...order]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,true); };

  return (
    <div className="space-y-5">
      {Object.keys(groups).sort().map(groupId => {
        const g = groups[groupId]; if (!g) return null; const hasDesc = g.desc && g.desc.content.trim().length > 0; const first = g.role || g.organization || g.start || g.end || g.desc; const hidden = first?.visible === false; if (previewMode && hidden) return null;
        return (
          <div
            key={groupId}
            className={`volunteer-item relative group ${hidden && !previewMode ? 'opacity-40' : ''} ${!previewMode ? 'cursor-grab' : ''}`}
            draggable={!previewMode}
            onDragStart={e=>handleDragStart(e, groupId)}
            onDragOver={handleDragOver}
            onDrop={e=>handleDrop(e, groupId)}
            onPointerDown={()=>{ if(!previewMode) (window as any)._volDrag=groupId; }}
            onPointerUp={()=>{ if (!previewMode && (window as any)._volDrag && (window as any)._volDrag!==groupId) { const order=Object.keys(groups).sort(); const from=order.indexOf((window as any)._volDrag); const to=order.indexOf(groupId); if (from>-1&&to>-1) { const newOrder=[...order]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,true);} } (window as any)._volDrag=null; }}
          >
            {!previewMode && (
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                <SectionConfirm
                  title="Delete volunteer entry?"
                  description="This will remove this volunteer group."
                  onConfirm={() => deleteGroup(groupId)}
                >
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0" title="Delete Volunteer Entry">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </SectionConfirm>
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={()=>onToggleEntryVisibility(section.id, groupId)} title={hidden ? 'Show' : 'Hide'}>
                  {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
            )}
            {/* Drag handle removed; entire volunteer item is draggable */}

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {g.role && <EditableContent content={g.role.content} onChange={c=>onUpdateEntry(section.id,g.role!.id,c)} previewMode={previewMode} type={g.role.type} className="font-semibold" placeholder="Role" />}
              {g.organization && <EditableContent content={g.organization.content} onChange={c=>onUpdateEntry(section.id,g.organization!.id,c)} previewMode={previewMode} type={g.organization.type} className="text-muted-foreground" placeholder="Organization" />}
              {(g.start || g.end) && (
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  {g.start && (
                    <DateField
                      entry={g.start}
                      label="Start"
                      onCommit={(val)=>onUpdateEntry(section.id,g.start!.id,val)}
                      previewMode={previewMode}
                      isMobile={isMobile}
                    />
                  )}
                  <span>-</span>
                  {g.end && (
                    <DateField
                      entry={g.end}
                      label="End"
                      onCommit={(val)=>onUpdateEntry(section.id,g.end!.id,val)}
                      previewMode={previewMode}
                      isMobile={isMobile}
                      allowPresent
                    />
                  )}
                </div>
              )}
            </div>
            {g.desc && (!previewMode || hasDesc) && (
              <div className="mt-1 text-sm relative">
                <EditableContent
                  content={g.desc.content}
                  onChange={c=>onUpdateEntry(section.id,g.desc!.id,c)}
                  previewMode={previewMode}
                  type="html"
                  className="text-sm"
                  placeholder="Description (optional)"
                  maxLength={DESC_CHAR_LIMIT}
                />
                {!previewMode && (
                  <div className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground select-none">
                    {Math.max(0, DESC_CHAR_LIMIT - (g.desc.content ? g.desc.content.replace(/<[^>]*>/g,'').length : 0))} left
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VolunteerSectionBody;
