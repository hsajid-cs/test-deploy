import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { EditableContent } from '../EditableContent';
import { SectionConfirm } from './SectionConfirm';
import type { Section } from '../ResumeBuilder';

interface SkillsSectionBodyProps {
	section: Section;
	previewMode: boolean;
	onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
	onDeleteEntry: (sectionId: string, entryId: string) => void;
	onReorderEntries: (sectionId: string, order: string[], isGrouped: boolean) => void;
}

export const SkillsSectionBody: React.FC<SkillsSectionBodyProps> = ({ section, previewMode, onUpdateEntry, onDeleteEntry, onReorderEntries }) => {
	const pointerDrag = React.useRef<string | null>(null);
	const handleDragStart = (e: React.DragEvent, id: string) => {
		e.dataTransfer.setData('text/plain', id);
	};
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
	const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
		e.preventDefault();
		const sourceId = e.dataTransfer.getData('text/plain');
		if (!sourceId || sourceId === targetId) return;
		const ids = section.entries.map(e => e.id);
		const from = ids.indexOf(sourceId); const to = ids.indexOf(targetId);
		if (from === -1 || to === -1) return;
		const newOrder = [...ids];
		const [moved] = newOrder.splice(from,1); newOrder.splice(to,0,moved);
		onReorderEntries(section.id, newOrder, false);
	};
	return (
		<div className="skills-grid">
			{section.entries.map(entry => {
				return (
								<div
								key={entry.id}
							className={`relative group ${!previewMode ? 'cursor-grab' : ''}`}
									draggable={!previewMode}
								onDragStart={e=>handleDragStart(e, entry.id)}
								onDragOver={handleDragOver}
								onDrop={e=>handleDrop(e, entry.id)}
								onPointerDown={()=>{ if(!previewMode) pointerDrag.current = entry.id; }}
								onPointerUp={()=>{ if (!previewMode && pointerDrag.current && pointerDrag.current !== entry.id) { const ids = section.entries.map(e=>e.id); const from = ids.indexOf(pointerDrag.current); const to = ids.indexOf(entry.id); if (from>-1&&to>-1) { const newOrder=[...ids]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,false);} } pointerDrag.current=null; }}
								>
									<div>
						<EditableContent
							content={entry.content}
							onChange={c => onUpdateEntry(section.id, entry.id, c)}
							previewMode={previewMode}
							className="p-1 rounded"
							placeholder="Skill"
							type={entry.type}
						/>
						{!previewMode && (
							<div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100">
								<SectionConfirm
									title="Delete skill?"
									description="This will remove this skill."
									onConfirm={() => onDeleteEntry(section.id, entry.id)}
								>
									<Button variant="ghost" size="sm" className="w-5 h-5 p-0" title="Delete Skill">
										<Trash2 className="w-3 h-3" />
									</Button>
								</SectionConfirm>
							</div>
						)}
									</div>
								</div>
				);
			})}
		</div>
	);
};
