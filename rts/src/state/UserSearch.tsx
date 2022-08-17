import {useState} from 'react'

const users = [
    {name: 'Sarah', age: 20},
    {name: 'Alex', age: 20},
    {name: 'Michael', age: 20},
]

const UserSearch: React.FC = () => {
    const [name, SetName] = useState('')
    const [user, setUser] = useState<{name: string, age: number} | undefined>()

    const onClick = () => {
        const foundUser = users.find((user) => {
            return user.name === name
        })

        setUser(foundUser)
    }
    return <div>
        User Seach
        <input value={name} onChange={(e) => SetName(e.target.value)}/>
        <button onClick={onClick}>Find User</button>
        <div>
            {user && user.name} 
            {user?.name} 
            {user?.age} 
        </div>
    </div>
}

export default UserSearch