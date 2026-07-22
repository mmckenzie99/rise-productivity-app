import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { STATUSES, statusTone } from '@/lib/speaking';
import KanbanCard from './KanbanCard';

const COLUMN_TONE = {
  Planning: 'border-t-[#A9793B]',
  Confirmed: 'border-t-[#3F6E63]',
  Completed: 'border-t-[#5B5548]'
};

export default function KanbanBoard({ items, onSave, onSelect, isAdmin }) {
  const [dragId, setDragId] = useState(null);

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = items.filter(i => i.status === s);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    setDragId(null);
    if (!result.destination) return;
    const destStatus = result.destination.droppableId;
    const item = items.find(i => i.id === result.draggableId);
    if (!item || item.status === destStatus) return;
    onSave({ ...item, status: destStatus });
  };

  return (
    <DragDropContext onDragStart={(s) => setDragId(s.draggableId)} onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map(status => (
          <Droppable key={status} droppableId={status} isDropDisabled={!isAdmin}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex flex-col rounded-lg border border-[#C9BE9C] border-t-4 ${COLUMN_TONE[status]} bg-[#EFE9D5] p-3 transition ${snapshot.isDraggingOver ? 'bg-[#E7DFC6]' : ''}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">{status}</h3>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${statusTone[status]}`}>
                    {grouped[status].length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 min-h-[60px]">
                  {grouped[status].map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!isAdmin}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`transition ${dragSnapshot.isDragging ? 'opacity-80 shadow-lg' : ''} ${dragId === item.id ? 'ring-2 ring-[#3F6E63] ring-offset-1' : ''}`}
                        >
                          <KanbanCard item={item} onClick={() => onSelect(item)} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {grouped[status].length === 0 && (
                    <p className="py-6 text-center text-xs text-[#A9793B]">
                      {isAdmin ? 'Drop a card here' : 'Nothing here'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}