import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { EditableContent } from '../EditableContent';
import { SectionConfirm } from './SectionConfirm';
import type { Section } from '../ResumeBuilder';

interface SimpleEntriesSectionBodyProps {
	section: Section;
	previewMode: boolean;
	onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
	onDeleteEntry: (sectionId: string, entryId: string) => void;
	summaryCharLimit: number;
	onToggleEntryVisibility: (sectionId: string, entryId: string) => void;
	onReorderEntries: (sectionId: string, order: string[], isGrouped: boolean) => void;
}

export const SimpleEntriesSectionBody: React.FC<SimpleEntriesSectionBodyProps> = ({ section, previewMode, onUpdateEntry, onDeleteEntry, summaryCharLimit, onToggleEntryVisibility, onReorderEntries }) => {
	const pointerDrag = React.useRef<string | null>(null);
	// Drag state
		const handleDragStart = (e: React.DragEvent, id: string) => {
		e.dataTransfer.setData('text/plain', id);
		e.dataTransfer.effectAllowed = 'move';
	};
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};
	const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
		e.preventDefault();
		const sourceId = e.dataTransfer.getData('text/plain');
		if (!sourceId || sourceId === targetId) return;
		const ids = section.entries.map(e => e.id);
		const from = ids.indexOf(sourceId);
		const to = ids.indexOf(targetId);
		if (from === -1 || to === -1) return;
		const newOrder = [...ids];
		const [moved] = newOrder.splice(from,1);
		newOrder.splice(to,0,moved);
		onReorderEntries(section.id, newOrder, false);
	};

	return (
		<div className="space-y-3">
			{section.entries.map(entry => {
				const hidden = entry.visible === false;
				if (previewMode && hidden) return null;
				return (
								<div
								key={entry.id}
								className={`relative group rounded ${!previewMode ? 'cursor-grab' : ''} ${hidden && !previewMode ? 'opacity-40' : ''}`}
										draggable={!previewMode}
								onDragStart={e=>handleDragStart(e, entry.id)}
								onDragOver={handleDragOver}
								onDrop={e=>handleDrop(e, entry.id)}
								onPointerDown={()=>{ if(!previewMode) pointerDrag.current = entry.id; }}
								onPointerUp={()=>{ if (!previewMode && pointerDrag.current && pointerDrag.current !== entry.id) { const ids = section.entries.map(e=>e.id); const from = ids.indexOf(pointerDrag.current); const to = ids.indexOf(entry.id); if (from>-1 && to>-1) { const newOrder=[...ids]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,false);} } pointerDrag.current=null; }}
								>
									<div>
						<EditableContent
							content={entry.content}
							onChange={c => onUpdateEntry(section.id, entry.id, c)}
							previewMode={previewMode}
							// Allow limited inline HTML for Professional Summary
							type={section.kind === 'summary' && entry.id === 'summary-text' ? 'html' : entry.type}
							className="min-h-[1.5rem]"
							placeholder={section.kind === 'summary' ? 'Professional Summary' : 'Entry'}
							{...(section.kind === 'summary' && entry.id === 'summary-text' ? { maxLength: summaryCharLimit } : {})}
						/>
						{section.kind === 'summary' && entry.id === 'summary-text' && !previewMode && (() => {
							const plain = entry.content.replace(/<[^>]*>/g,'');
							const plainLen = plain.length;
							return (
								<div className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground select-none">
									{Math.max(0, summaryCharLimit - plainLen)} left
								</div>
							);
						})()}
						{!previewMode && section.id !== 'header' && section.kind !== 'summary' && (
							<div className="absolute top-0 -right-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
								{section.entries.length > 1 && (
									<SectionConfirm
										title="Delete entry?"
										description="This will remove this entry."
										onConfirm={() => onDeleteEntry(section.id, entry.id)}
									>
										<Button variant="ghost" size="sm" className="w-6 h-6 p-0" title="Delete Entry">
											<Trash2 className="w-3 h-3" />
										</Button>
									</SectionConfirm>
								)}
																<Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={()=>onToggleEntryVisibility(section.id, entry.id)} title={hidden ? 'Show' : 'Hide'}>
																	{hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
																</Button>
							</div>
						)}
									</div>
								</div>
				);
			})}
		</div>
	);
};
