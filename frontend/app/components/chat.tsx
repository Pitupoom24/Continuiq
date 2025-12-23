import { Maximize2, Minimize2 } from "lucide-react";

interface ChatProps {
    title: string
    content: string
    isMaximized: boolean
    setIsMaximized: (v: boolean) => void
}


export default function Chat({ title, content, isMaximized, setIsMaximized }: ChatProps) {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl overflow-hidden">
            <div className="drag-handle p-3 bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700 flex justify-between items-center cursor-grab active:cursor-grabbing">
                <span className="text-sm font-medium">{title}</span>
                <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                >
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-sm text-zinc-500">{content}</p>
            </div>

            <div className="p-3 border-t dark:border-zinc-800">
                <input
                    className="w-full text-sm p-2 bg-zinc-100 dark:bg-zinc-800 rounded outline-none"
                    placeholder="Message..."
                />
            </div>
        </div>
    )
}
