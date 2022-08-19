import { useState } from "react"

export const useMemoList = () => {
    const [memos, setMemos] = useState<string[]>([])

    const onAddMemo = (text: string) => {
        const newMemos = [...memos]
        newMemos.push(text)
        setMemos(newMemos)
    }

    const onDeleteMemo = (idx: number) => {
        const newMemos = [...memos]
        newMemos.splice(idx, 1)
        setMemos(newMemos)
    }
    
    return { memos, onAddMemo, onDeleteMemo }
}