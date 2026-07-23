import { Draggable } from '@hello-pangea/dnd';
import LocationGroup from './LocationGroup';

export default function DraggableLocationGroup({ index, id, place, items, onClick, onDuplicate, isAdmin, tripPlaces, onLocate }) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`${items.length > 1 ? 'sm:col-span-2 lg:col-span-3' : ''} ${snapshot.isDragging ? 'z-50 opacity-90' : ''}`}
        >
          <LocationGroup
            place={place}
            items={items}
            onClick={onClick}
            onDuplicate={onDuplicate}
            isAdmin={isAdmin}
            tripPlaces={tripPlaces}
            onLocate={onLocate}
            dragHandleProps={provided.dragHandleProps}
          />
        </div>
      )}
    </Draggable>
  );
}