"use client";

import { Category } from "../../../../lib/hooks/useCatalog";

interface CategoryTreeProps {
  categories: Category[];
  selected: string;
  onSelect: (name: string) => void;
}

function CategoryNode({
  category,
  selected,
  onSelect,
  depth,
}: {
  category: Category;
  selected: string;
  onSelect: (name: string) => void;
  depth: number;
}) {
  const isSelected = selected === category.name;
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(category.name)}
        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
          isSelected
            ? "bg-blue-100 text-blue-800 font-medium"
            : "text-foreground hover:bg-muted"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {category.name}
      </button>
      {category.children && category.children.length > 0 && (
        <div>
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selected={selected}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({ categories, selected, onSelect }: CategoryTreeProps) {
  return (
    <div className="bg-card p-3 rounded-lg shadow h-fit">
      <h3 className="text-sm font-semibold text-foreground px-2 py-1.5 mb-1">
        Categorías
      </h3>
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
            selected === ""
              ? "bg-blue-100 text-blue-800 font-medium"
              : "text-foreground hover:bg-muted"
          }`}
        >
          Todas las categorías
        </button>
        {categories.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            No hay categorías registradas
          </p>
        )}
        {categories.map((cat) => (
          <CategoryNode
            key={cat.id}
            category={cat}
            selected={selected}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
