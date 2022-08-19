import { useEffect, useRef, useState } from 'react';
import ReactDom from 'react-dom/client';
import * as esbuild from 'esbuild-wasm'

const App= () => {
    const [input, setInput] = useState('')
    const [code, setCode] = useState()
    const ref = useRef<any>()

    const startService = async()=> {
        ref.current = await esbuild.startService({
            worker: true,
            wasmURL: '/esbuild.wasm'
        })
    }

    useEffect(() => {
        startService()
    },[])

    const onClick = async () => {
        if (!ref.current) return
        
        const result = await ref.current.transform(input, {
            loader: 'jsx',
            target: 'es2015', // transpile option
        })
        
        setCode(result.code)
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