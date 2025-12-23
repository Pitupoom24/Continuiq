"use client";
import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import Chat from "./chat";

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 500;

export default function Workspace() {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [isCtrlPressd, setIsCtrlPressd] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

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


    // const chatContent = (
    //     <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl overflow-hidden">
    //         <div className="drag-handle p-3 bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700 flex justify-between items-center cursor-grab active:cursor-grabbing">
    //             <span className="text-sm font-medium">Main Chat</span>
    //             <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors">
    //                 {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    //             </button>
    //         </div>
    //         <div className="flex-1 p-4 overflow-y-auto">
    //             <p className="text-sm text-zinc-500">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nihil fugit distinctio eligendi, voluptatibus rem molestiae laudantium. Beatae dolorem dolor pariatur at asperiores vitae perferendis earum, quae reprehenderit natus quo totam!</p>
    //         </div>
    //         <div className="p-3 border-t dark:border-zinc-800">
    //             <input className="w-full text-sm p-2 bg-zinc-100 dark:bg-zinc-800 rounded outline-none" placeholder="Message..." />
    //         </div>
    //     </div>
    // );

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950"
            onMouseDown={(e) => { if (e.ctrlKey) { setIsPanning(true); e.preventDefault(); } }}
            style={{
                cursor: isPanning ? 'grabbing' : isCtrlPressd ? 'grab' : 'auto',
                userSelect: isPanning ? 'none' : 'auto',
            }}
        >
            {/* --- IN-WORKSPACE VIEW --- */}
            {!isMaximized && (
                <div
                    className="absolute inset-0 transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: "center"
                    }}
                >

                    <div className="absolute top-1/2 left-1/2 w-0 h-0">
                        <Rnd
                            dragHandleClassName="drag-handle"
                            default={{ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, x: -DEFAULT_WIDTH / 2, y: -DEFAULT_HEIGHT / 2 }}
                            minWidth={300}
                            minHeight={300}
                            scale={scale}
                        >
                            <Chat title="Main Chat" content="main content" isMaximized={isMaximized} setIsMaximized={setIsMaximized}/>
                        </Rnd>
                    </div>
                </div>
            )}

            {/* --- MAXIMIZED VIEW --- */}
            {isMaximized && (
                <div className="fixed inset-4 z-[100] animate-in zoom-in-95 duration-200">
                    <Chat title="Main Chat" content="main content" isMaximized={isMaximized} setIsMaximized={setIsMaximized}/>
                </div>
            )}


            {/* Zoom / Pan Status Indicator (Optional UI) */}
            <div className="fixed bottom-4 right-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono border dark:border-zinc-800">
                Zoom: {Math.round(scale * 100)}% | Pan: {offset.x}, {offset.y}
            </div>

        </div>
    );
}