"use client";

import { Plus, LayoutGrid, Settings, GripVertical } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

export default function Sidebar() {
  const [workspaces] = useState([
    { id: 1, name: "Marketing Project" },
    { id: 2, name: "Development Team" },
    { id: 3, name: "Personal Notes" },
    { id: 4, name: "Marketing Project" },
    { id: 5, name: "Development Team" },
    { id: 6, name: "Personal Notes" },
    { id: 7, name: "Marketing Project" },
    { id: 8, name: "Development Team" },
    { id: 9, name: "Personal Notes" },
    { id: 10, name: "Development Team" },
    { id: 11, name: "Personal Notes" },
    { id: 12, name: "Marketing Project" },
    { id: 13, name: "Development Team" },
    { id: 14, name: "Personal Notes" },
  ]);

  // --- Resizing Logic ---
  const minWidth = 200;
  const maxWidth = 480;
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize"; // Prevent text selection cursor
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing.current) {
        let newWidth = mouseMoveEvent.clientX;
        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;
        setSidebarWidth(newWidth);
      }
    },
    [minWidth, maxWidth]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="relative flex h-full shrink-0" style={{ width: sidebarWidth }}>
      <aside className="flex h-full w-full flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
        {/* Top Section */}
        <div className="p-4">
          <button className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-sm">
            <Plus className="h-4 w-4" />
            <span className="truncate">New Workspace</span>
          </button>
        </div>

        {/* Workspace List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 
            [&::-webkit-scrollbar]:w-2.5
            
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-zinc-300
            dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
            
            [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Your Workspaces
          </div>
          <div className="space-y-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <LayoutGrid className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                <span className="truncate">{ws.name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800">
            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="truncate">My Account</span>
            <Settings className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </button>
        </div>
      </aside>

      {/* RESIZE HANDLE */}
      <div
        onMouseDown={startResizing}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-gray-500/50 transition-colors group"
      >
        {/* Optional: Visual indicator that appears on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
             <GripVertical className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
}