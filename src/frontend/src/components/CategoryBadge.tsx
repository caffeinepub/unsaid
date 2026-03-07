import type { Category } from "../backend.d";
import { getCategoryColor } from "../utils/categories";

interface CategoryBadgeProps {
  category: Category;
  index?: number;
  className?: string;
}

export function CategoryBadge({
  category,
  index = 0,
  className = "",
}: CategoryBadgeProps) {
  const colors = getCategoryColor(category.name, index);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {category.name}
    </span>
  );
}
