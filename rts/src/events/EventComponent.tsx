import React from "react"

const EventComponent: React.FC = () => {
    const onChange = (eve: React.ChangeEvent<HTMLInputElement>) => {
        console.log(eve)
    }

    const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        console.log(event)
    }

    return (
        <div>
            <input onChange={onChange}/>
            <div draggable onDragStart={onDragStart}>Drag Me</div>
        </div>
    )
}
export default EventComponent;