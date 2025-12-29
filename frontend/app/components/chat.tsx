import { Maximize2, Minimize2 } from "lucide-react";

interface ChatProps {

    id: string
    title: string
    conversation: Array<string>
    isMaximized: boolean
    setIsMaximized: (v: boolean) => void
}


export default function Chat({ id, title, conversation, isMaximized, setIsMaximized }: ChatProps) {
    return (
        <div id={id} className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl overflow-hidden">
            <div className="drag-handle p-3 bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700 flex justify-between items-center cursor-grab active:cursor-grabbing">
                <span className="text-sm font-medium truncate">{title}</span>
                <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                >
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2 
                [&::-webkit-scrollbar]:w-2.5 mr-1 my-1
                
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-zinc-300
                dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
                
                [&::-webkit-scrollbar-track]:bg-transparent">
                {conversation.map((c, i) => {
                    const isUser = i % 2 === 0

                    return (
                        <div
                            key={i}
                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[100%] px-3 py-2 text-sm rounded-lg
                                    ${isUser
                                        ? "bg-blue-500 text-white rounded-br-none"
                                        : "bg-transparent text-zinc-700 dark:text-zinc-300 mb-3"
                                    }`}
                            >
                                {c}
                            </div>
                        </div>
                    )
                })}
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
