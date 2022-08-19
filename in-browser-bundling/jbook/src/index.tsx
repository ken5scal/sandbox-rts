import { useState } from 'react';
import ReactDom from 'react-dom/client';

const App= () => {
    const [input, setInput] = useState('')
    const [code, setCode] = useState()

    const onClick = () => {
        console.log(input)
    }

    return (
        <div>
            <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}>
            </textarea>
            <button onClick={onClick}>Submit</button>
            <pre>{code}</pre>
        </div>
    )
}

ReactDom
    .createRoot(
        document.getElementById('root') as HTMLElement)
    .render(<App />)