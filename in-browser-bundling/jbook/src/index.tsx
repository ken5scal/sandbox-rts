import ReactDom from 'react-dom/client';

const App= () => {
    return <h1>hi</h1>
}

ReactDom
    .createRoot(
        document.getElementById('root') as HTMLElement)
    .render(<App />)