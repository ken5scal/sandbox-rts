interface MemoListProps {
    memoLists: string[],
    onDeleteItem: (idx: number) => void,
}

const MemoList: React.FC<MemoListProps> = 
    ({memoLists, onDeleteItem}: MemoListProps) => {
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