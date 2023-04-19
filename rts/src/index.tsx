import ReactDOM from 'react-dom/client'
import GuestList from './state/GuestList'
import { useState } from 'react'
// import UserSearch from './state/UserSearch'
import UserSearch from './refs/UserSearch'
import EventComponent from './events/EventComponent'

const App = () => {
    const [name, setName] = useState('')
    const [guests, setGuests] = useState<string[]>([])
    const onClick = () => {
        setName('')
        setGuests([...guests, name])
    }

    return (
        <>
            <EventComponent />
            <UserSearch/>
            <h1>Hi There!!</h1>
            <ul>
                {guests.map((guest) => (
                    <li key={guest}>{guest}</li>
                ))}
            </ul>
            <h3>
                <GuestList></GuestList>
            </h3>
            <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}/>
            <button onClick={onClick}>Add Guest</button>
        </>
    )
}

const root = ReactDOM.createRoot(document.querySelector('#root') as HTMLElement);
root.render(<App/>)