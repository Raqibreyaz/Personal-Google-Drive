import { useState, useEffect } from "react";

export default function useContextMenu() {
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeContextMenu === id) {
      setActiveContextMenu(null);
    } else {
      setActiveContextMenu(id);
      setContextMenuPos({ x: e.clientX - 110, y: e.clientY });
    }
  };

  const closeContextMenu = () => setActiveContextMenu(null);

  useEffect(() => {
    const handleDocumentClick = () => setActiveContextMenu(null);
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  return {
    activeContextMenu,
    contextMenuPos,
    handleContextMenu,
    closeContextMenu,
  };
}
