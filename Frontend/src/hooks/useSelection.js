import { useState, useCallback, useEffect } from "react";

export default function useSelection(items, dirId) {
  const [selectedItems, setSelectedItems] = useState({ dirs: [], files: [] });

  // Reset selection on navigation
  useEffect(() => {
    setSelectedItems({ dirs: [], files: [] });
  }, [dirId]);

  const toggleSelect = useCallback((id, isDirectory) => {
    setSelectedItems((prev) => {
      const key = isDirectory ? "dirs" : "files";
      const isSelected = prev[key].includes(id);
      if (isSelected) {
        return { ...prev, [key]: prev[key].filter((i) => i !== id) };
      } else {
        return { ...prev, [key]: [...prev[key], id] };
      }
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const totalSelected = selectedItems.dirs.length + selectedItems.files.length;
    const totalItems = items.length;

    if (totalSelected === totalItems && totalItems > 0) {
      setSelectedItems({ dirs: [], files: [] });
    } else {
      setSelectedItems({
        dirs: items.filter(i => i.isDirectory).map((d) => d._id),
        files: items.filter(i => !i.isDirectory).map((f) => f._id),
      });
    }
  }, [items, selectedItems.dirs.length, selectedItems.files.length]);

  const clearSelection = useCallback(() => {
    setSelectedItems({ dirs: [], files: [] });
  }, []);

  const selectedCount = selectedItems.dirs.length + selectedItems.files.length;

  return {
    selectedItems,
    selectedCount,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}
