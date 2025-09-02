import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { EditableContent } from '../EditableContent';
import { SectionConfirm } from './SectionConfirm';
import type { Section, Entry } from '../ResumeBuilder';

interface ProjectsSectionBodyProps {
	section: Section;
	previewMode: boolean;
	onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
	deleteGroup: (prefix: string) => void;
	onToggleEntryVisibility: (sectionId: string, groupId: string) => void;
	onReorderEntries: (sectionId: string, order: string[], isGrouped: boolean) => void;
}

export const ProjectsSectionBody: React.FC<ProjectsSectionBodyProps> = ({ section, previewMode, onUpdateEntry, deleteGroup, onToggleEntryVisibility, onReorderEntries }) => {
	const groups: Record<string, Partial<Record<string, Entry>>> = {};
	const DESC_CHAR_LIMIT = 350; // character limit for description fields
	section.entries.forEach(e => {
		const m = e.id.match(/^(proj\d+)-(name|stack|desc)$/);
		if (m) {
			const key = m[1]; const field = m[2];
			(groups[key] ||= {})[field] = e;
		}
	});
	const handleDragStart = (e: React.DragEvent, groupId: string) => { if (previewMode) return; e.dataTransfer.setData('text/plain', groupId); };
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { if (!previewMode) e.preventDefault(); };
	const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => { if (previewMode) return; e.preventDefault(); const sourceId = e.dataTransfer.getData('text/plain'); if (!sourceId||sourceId===targetId) return; const order = Object.keys(groups).sort(); const from = order.indexOf(sourceId); const to = order.indexOf(targetId); if (from===-1||to===-1) return; const newOrder=[...order]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,true); };
	return (
		<div className="space-y-5">
			{Object.keys(groups).sort().map(groupId => {
				const g = groups[groupId]; if (!g) return null; const first = g.name || g.stack || g.desc; const hidden = first?.visible === false; if (previewMode && hidden) return null;
				return (
					<div
						key={groupId}
						className={`project-item relative group ${hidden && !previewMode ? 'opacity-40' : ''} ${!previewMode ? 'cursor-grab' : ''}`}
						draggable={!previewMode}
						onDragStart={e=>handleDragStart(e, groupId)}
						onDragOver={handleDragOver}
						onDrop={e=>handleDrop(e, groupId)}
							onPointerDown={()=>{ if (!previewMode) (window as any)._projDrag=groupId; }}
							onPointerUp={()=>{ if (!previewMode && (window as any)._projDrag && (window as any)._projDrag!==groupId) { const order=Object.keys(groups).sort(); const from=order.indexOf((window as any)._projDrag); const to=order.indexOf(groupId); if (from>-1&&to>-1) { const newOrder=[...order]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,true);} } (window as any)._projDrag=null; }}
					>
						{!previewMode && (
							<div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100">
								<SectionConfirm
									title="Delete project entry?"
									description="This will remove this project group."
									onConfirm={() => deleteGroup(groupId)}
								>
									<Button variant="ghost" size="sm" className="w-6 h-6 p-0" title="Delete Project Entry">
										<Trash2 className="w-3 h-3" />
									</Button>
								</SectionConfirm>
								<Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={()=>onToggleEntryVisibility(section.id, groupId)} title={hidden ? 'Show' : 'Hide'}>
									{hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
								</Button>
							</div>
						)}
						{/* Drag handle removed; entire project item is draggable */}
						<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							{g.name && <EditableContent content={g.name.content} onChange={c=>onUpdateEntry(section.id,g.name!.id,c)} previewMode={previewMode} type={g.name.type} className="font-semibold" placeholder="Project Name" />}
							{g.stack && <EditableContent content={g.stack.content} onChange={c=>onUpdateEntry(section.id,g.stack!.id,c)} previewMode={previewMode} type={g.stack.type} className="text-xs tracking-wide uppercase text-muted-foreground" placeholder="Tech Stack" />}
						</div>
						{g.desc && (
							<div className="mt-1 text-sm relative">
								<EditableContent
									content={g.desc.content}
									onChange={c=>onUpdateEntry(section.id,g.desc!.id,c)}
									previewMode={previewMode}
									type="html"
									className="text-sm"
									placeholder="Description"
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
