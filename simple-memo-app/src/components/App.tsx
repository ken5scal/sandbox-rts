import { ChangeEvent, FC, useState } from 'react';
import { useMemoList } from '../hooks/useMemoList';
import './App.css';
import MemoList from './MemoList';

const App: FC = () => {
  const { memos, onAddMemo, onDeleteMemo } = useMemoList()
  const [txt, setText] = useState<string>('')

  const onAdd = () => {
    onAddMemo(txt)
    setText('')
  }

  const OnChangeText = (e: ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
  }

  const onDelete = (idx: number) => {
    onDeleteMemo(idx)
  }

  return (
    <div>
      <h1>簡単メモアプリ</h1>
      <input 
        type="text"
        value={txt}
        onChange={OnChangeText}
      />
      <button 
        onClick={onAdd}>
          追加
      </button>
      <MemoList 
        memoLists={memos}
        onDeleteItem={onDelete}
      />
    </div>
  );
}

export default App;
