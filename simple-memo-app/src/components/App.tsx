import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import styled from 'styled-components';

function App() {

  const [txt, setText] = useState<string>('')
  const [memos, setMemo] = useState<string[]>([])

  const onAddToMemo = () => {
    const newMemo = [...memos]

    if (!txt) {
      return
    }
    newMemo.push(txt)
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
      <button onClick={onAddToMemo}>追加</button>
      
      <pre>メモ一覧</pre>
      <ul>
        {memos.map((memo ,idx) => 
          <li key={idx}>
            {memo}
            <button>削除</button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default App;
