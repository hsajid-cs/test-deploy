import React from 'react';
import { EditableContent } from '../EditableContent';
import { LocationPicker } from '@/components/LocationPicker';
import type { Section, Entry } from '../ResumeBuilder';

interface HeaderSectionProps {
	section: Section;
	previewMode: boolean;
	onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ section, previewMode, onUpdateEntry }) => {
	const nameEntry = section.entries.find(e => e.id === 'name');
	const role = section.entries.find(e => e.id === 'role');
	const contactOrder = ['phone','email','location','linkedin','website'];
	const allContactEntries = contactOrder
		.map(id => section.entries.find(e => e.id === id))
		.filter((e): e is Entry => Boolean(e));
	const contactEntries = previewMode
		? allContactEntries.filter(e => (e.type === 'html' ? e.content.replace(/<[^>]*>/g,'') : e.content).trim().length > 0)
		: allContactEntries;
	const roleHasContent = role && (role.type === 'html' ? role.content.replace(/<[^>]*>/g,'').trim().length > 0 : role.content.trim().length > 0);

	return (
		<section className="resume-section header-no-divider p-4 text-center" data-section-id={section.id}>
			{nameEntry && (
				<EditableContent
					content={nameEntry.content}
					onChange={c => onUpdateEntry(section.id, nameEntry.id, c)}
					previewMode={previewMode}
					type={nameEntry.type}
					className="text-3xl font-bold leading-tight px-0"
					placeholder="Full Name"
				/>
			)}
			{role && (!previewMode || roleHasContent) && (
				<EditableContent
					content={role.content}
					onChange={c => onUpdateEntry(section.id, role.id, c)}
					previewMode={previewMode}
					type={role.type}
					className="font-medium text-base px-0"
					placeholder="Role / Title"
				/>
			)}
			{contactEntries.length > 0 && (
				<div className="flex flex-wrap justify-center gap-x-0 gap-y-1 text-sm text-muted-foreground mt-2">
					{contactEntries.map((entry, idx) => {
						if (entry.id === 'location') {
							return (
								<div key={entry.id} className="flex items-center">
									{previewMode ? (
										<span className="italic px-0">{entry.content}</span>
									) : (
										<LocationPicker
											value={entry.content}
											onChange={(val)=>onUpdateEntry(section.id, entry.id, val)}
											label="Location"
											className="px-0"
										/>
									)}
									{idx < contactEntries.length - 1 && <span className="mx-2 select-none opacity-60">|</span>}
								</div>
							);
						}
						return (
							<div key={entry.id} className="flex items-center">
								<EditableContent
									content={entry.content}
									onChange={c => onUpdateEntry(section.id, entry.id, c)}
									previewMode={previewMode}
									type={entry.type}
									className="px-0"
									placeholder={entry.id.charAt(0).toUpperCase() + entry.id.slice(1)}
								/>
								{idx < contactEntries.length - 1 && <span className="mx-2 select-none opacity-60">|</span>}
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
};
