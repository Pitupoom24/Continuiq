"use client";

import { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import Chat from "./chat";

const DEFAULT_WIDTH = 700;
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
                            <Chat title="Main Chat" conversation={["What's React.JS", "React is a free and open-source front-end JavaScript library for building user interfaces (UIs) based on a component architecture. It is maintained by Meta (formerly Facebook) and a large community of developers.", "Why is it popular", "React.js is popular due to a combination of its technical advantages, robust ecosystem, ease of learning, and strong backing by Meta and other industry giants. These factors contribute to a faster, more efficient development process and superior application performance.", "What's Virtual DOM?", "Virtual DOM (Document Object Model) To optimize performance, React uses a virtual representation of the actual DOM. When data changes, React calculates the most efficient way to update the real DOM and applies only the necessary changes, rather than re-rendering the entire page. This results in lightning-fast, smooth, and responsive user experiences, especially in dynamic applications."]} isMaximized={isMaximized} setIsMaximized={setIsMaximized} />
                        </Rnd>
                    </div>
                </div>
            )}

            {/* --- MAXIMIZED VIEW --- */}
            {isMaximized && (
                <div className="fixed inset-4 z-[100] animate-in zoom-in-95 duration-200">
                    <Chat title="Main Chat" conversation={["What's React.JS", "React is a free and open-source front-end JavaScript library for building user interfaces (UIs) based on a component architecture. It is maintained by Meta (formerly Facebook) and a large community of developers.", "Why is it popular", "React.js is popular due to a combination of its technical advantages, robust ecosystem, ease of learning, and strong backing by Meta and other industry giants. These factors contribute to a faster, more efficient development process and superior application performance.", "What's Virtual DOM?", "Virtual DOM (Document Object Model) To optimize performance, React uses a virtual representation of the actual DOM. When data changes, React calculates the most efficient way to update the real DOM and applies only the necessary changes, rather than re-rendering the entire page. This results in lightning-fast, smooth, and responsive user experiences, especially in dynamic applications."]} isMaximized={isMaximized} setIsMaximized={setIsMaximized} />
                </div>
            )}


            {/* Zoom / Pan Status Indicator (Optional UI) */}
            <div className="fixed bottom-4 right-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono border dark:border-zinc-800">
                Zoom: {Math.round(scale * 100)}% | Pan: {offset.x}, {offset.y}
            </div>

        </div>
    );
}