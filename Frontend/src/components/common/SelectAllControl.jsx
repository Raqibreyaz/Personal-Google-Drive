export default function SelectAllControl({ itemsCount, selectedCount, onToggleSelectAll }) {
  if (itemsCount === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 w-fit">
      <input
        type="checkbox"
        checked={itemsCount > 0 && selectedCount === itemsCount}
        onChange={onToggleSelectAll}
        className="w-4 h-4 cursor-pointer accent-blue-600"
      />
      <span className="text-sm text-gray-600 font-medium select-none">Select All</span>
    </div>
  );
}
