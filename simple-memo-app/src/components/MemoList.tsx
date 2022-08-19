import { memo, useState } from "react"

interface MemoListProps {
    memoLists: string[],
    onDeleteItem: (idx: number) => void,
}

const MemoList: React.FC<MemoListProps> = 
    ({memoLists, onDeleteItem}: MemoListProps) => {

    // console.log(memoLists)

    // const [memos, setMemos] = useState<string[]>(memoLists)
    // const onRemoveMemo = (idx: number) => {
    //     console.log(memoLists, memos)
    //     memoLists = [...memos]
    //     memoLists.splice(idx, 1)
    //     console.log(memoLists, memos)
    //     setMemos(memoLists)
    // }

    return (
      <>
        <pre>メモ一覧</pre><ul>
            {memoLists.map((memo, idx) => (
                <li key={idx}>
                    {memo}
                <button 
                    onClick={() => onDeleteItem(idx)}>
                    削除
                </button>
            </li>
            ))}
        </ul>
      </>
    )
}

export default MemoList