import { useEffect, useRef, useState } from 'react';
import ReactDom from 'react-dom/client';
import * as esbuild from 'esbuild-wasm'
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';

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

        const result = await ref.current.build({
            entryPoints: ['index.js'],
            bundle: true,
            write: false,
            plugins: [unpkgPathPlugin()],
            define: {
                global: 'window',
                'process.env.NODE_ENV': '"production"',
            }
        })
        console.log(result)
        setCode(result.outputFiles[0].text)
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