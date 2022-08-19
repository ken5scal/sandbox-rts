import React, { useState } from 'react';
import './App.css';

function App() {

  const [txt, setText] = useState<string>('')
  const [memos, setMemo] = useState<string[]>([])

  const onAddMemo = () => {
    const newMemo = [...memos]

    if (!txt) {
      return
    }
    newMemo.push(txt)
    setMemo(newMemo)
    setText('')
  }

  const onRemoveMemo = (idx: number) => {
    const newMemo = [...memos]
    newMemo.splice(idx, 1)
    setMemo(newMemo)
  }

  return (
    <div>
      <h1>簡単メモアプリ</h1>
      <input 
        type="text"
        value={txt}
        onChange={e => setText(e.target.value)}
      />
      <button onClick={onAddMemo}>追加</button>
      
      <pre>メモ一覧</pre>
      <ul>
        {memos.map((memo ,idx) => 
          <li key={idx}> 
            {memo}
            <button 
              onClick={() => onRemoveMemo(idx)}>
                削除
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default App;
