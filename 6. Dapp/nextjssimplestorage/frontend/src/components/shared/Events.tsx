import { SimpleStorageEvent } from '@/types'
import React from 'react'

const Events = ({ events }: { events: SimpleStorageEvent[] }) => {
  return (
    <div>
        <h2>Events</h2>
        {events.length > 0 ? (
            events.map((event) => 
                (
                    <div key={crypto.randomUUID()}>{event.by} - {event.number}</div>
                ))
        ) : (
            <div>No Events</div>
        )}
    </div>
  )
}

export default Events