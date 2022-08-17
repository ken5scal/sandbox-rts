import ReactDOM from 'react-dom'
import GuestList from './state/GuestList'
import { useState } from 'react'
import UserSearch from './state/UserSearch'

const App = () => {
    const [name, setName] = useState('')
    const [guests, setGuests] = useState<string[]>([])
    const onClick = () => {
        setName('')
        setGuests([...guests, name])
    }

    return (
        <>
            <UserSearch></UserSearch>
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

ReactDOM.render(<App/>, document.querySelector('#root'))