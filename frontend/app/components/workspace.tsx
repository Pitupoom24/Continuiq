"use client";

import { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import Chat from "./chat";
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';

const DEFAULT_WIDTH = 700;
const DEFAULT_HEIGHT = 500;


export default function Workspace() {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [isCtrlPressd, setIsCtrlPressd] = useState(false);

    const [maximizedId, setMaximizedId] = useState<string | null>(null);
    const [chats, setChats] = useState([
        {
            id: "chat_1",
            title: "Main Chat",
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            x: -DEFAULT_WIDTH / 2,
            y: -DEFAULT_HEIGHT / 2,
            conversation: ["What's React.JS", "React is a free and open-source front-end JavaScript library for building user interfaces (UIs) based on a component architecture. It is maintained by Meta (formerly Facebook) and a large community of developers.", "Why is it popular", "React.js is popular due to a combination of its technical advantages, robust ecosystem, ease of learning, and strong backing by Meta and other industry giants. These factors contribute to a faster, more efficient development process and superior application performance.", "What's Virtual DOM?", "Virtual DOM (Document Object Model) To optimize performance, React uses a virtual representation of the actual DOM. When data changes, React calculates the most efficient way to update the real DOM and applies only the necessary changes, rather than re-rendering the entire page. This results in lightning-fast, smooth, and responsive user experiences, especially in dynamic applications."]

        },
        {
            id: "chat_2",
            title: "Secondary Chat",
            width: 300,
            height: 400,
            x: -DEFAULT_WIDTH / 2 - 400,
            y: -DEFAULT_HEIGHT / 2,
            conversation: [
                "What is Meta?",
                "Meta Platforms, Inc. is a multinational technology company formerly known as Facebook. It focuses on building social platforms and technologies that help people connect, including Facebook, Instagram, WhatsApp, and Messenger, as well as virtual and augmented reality products.",
                "Why did Facebook rebrand to Meta?",
                "Facebook rebranded to Meta to reflect its long-term vision of building the metaverse — a shared digital space that blends physical and virtual reality. The new name represents a shift beyond social media toward immersive technologies like VR and AR.",
                "What is the Metaverse?",
                "The metaverse is a network of interconnected virtual environments where people can socialize, work, play, and create using digital avatars. Meta is developing the metaverse through technologies such as virtual reality (Meta Quest), augmented reality, AI, and real-time 3D experiences."
            ]
        },
        {
            id: "chat_3",
            title: "Secondary Chat",
            width: 300,
            height: 400,
            x: DEFAULT_WIDTH / 2 + 100,
            y: -DEFAULT_HEIGHT / 2,
            conversation: [
                "What is the DOM?",
                "The DOM (Document Object Model) is a programming interface that represents a web page as a tree of objects. It allows JavaScript to read, modify, and update HTML and CSS dynamically, enabling interactive and responsive user interfaces.",
                "Why is the DOM important?",
                "The DOM is essential because it acts as the bridge between web content and code. Without the DOM, JavaScript wouldn’t be able to update pages in real time, making modern web applications like Facebook and Instagram impossible.",
                "How does Meta handle DOM performance?",
                "At Meta’s scale, directly manipulating the DOM would be too slow. To solve this, Meta introduced the Virtual DOM concept through React, which efficiently calculates changes and updates only the necessary parts of the real DOM, resulting in fast, smooth user experiences."
            ]
        }
    ]);

    // Find the data for the chat that is currently maximized
    const maximizedChat = chats.find(c => c.id === maximizedId);

    // Panning
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isPanning) {
                setOffset((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
            }
        };
        const handleMouseUp = () => setIsPanning(false);
        if (isPanning) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isPanning]);

    // Zooming
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const zoomSpeed = 0.05;
                const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
                setScale((prev) => Math.min(Math.max(prev + delta, 0.2), 3));
            }
        };
        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    // Ctrl
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Control") setIsCtrlPressd(true); }
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === "Control") setIsCtrlPressd(false); }
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        }
    }, []);


    const updateXarrow = useXarrow();

    // useEffect(() => {
    //     updateXarrow();
    // }, [scale]);

    useEffect(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(updateXarrow);
                    });

                });
            });
        });
    }, [scale, offset]);


    return (

        <div
            className="relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950"
            onMouseDown={(e) => { if (e.ctrlKey) { setIsPanning(true); e.preventDefault(); } }}
            style={{ cursor: isPanning ? 'grabbing' : isCtrlPressd ? 'grab' : 'auto', userSelect: isPanning ? 'none' : 'auto' }}
        >

            <Xwrapper>
                <Xarrow start="chat_1" end="chat_2" />
                <Xarrow start="chat_1" end="chat_3" />
            </Xwrapper>

            {/* --- IN-WORKSPACE VIEW --- */}
            <div
                className="absolute inset-0 transition-transform duration-75 ease-out"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: "center"
                }}
            >


                {chats.map((chat) => (
                    <div key={chat.id} className="absolute top-1/2 left-1/2 w-0 h-0">
                        <Rnd
                            dragHandleClassName="drag-handle"
                            default={{
                                width: chat.width,
                                height: chat.height,
                                x: chat.x,
                                y: chat.y
                            }}
                            minWidth={200}
                            minHeight={50}
                            scale={scale}
                            onDrag={updateXarrow}
                            onResize={updateXarrow}
                        >
                            <div id={chat.id}>
                                <Chat
                                    title={chat.title}
                                    conversation={chat.conversation}
                                    isMaximized={maximizedId === chat.id}
                                    setIsMaximized={(val) => setMaximizedId(val ? chat.id : null)}
                                />
                            </div>
                        </Rnd>
                    </div>
                ))}


            </div>

            {/* --- REFACTORED MAXIMIZED VIEW --- */}
            {maximizedId && maximizedChat && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-10">
                    <div className="w-full max-w-5xl h-[85vh] animate-in zoom-in-95 duration-200">
                        <Chat
                            title={maximizedChat.title}
                            conversation={maximizedChat.conversation}
                            isMaximized={true}
                            setIsMaximized={() => setMaximizedId(null)}
                        />
                    </div>
                </div>
            )}

            {/* Status Indicator */}
            <div className="fixed bottom-4 right-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono border dark:border-zinc-800">
                Zoom: {Math.round(scale * 100)}% | Chats: {chats.length}
            </div>
        </div>

    );

}