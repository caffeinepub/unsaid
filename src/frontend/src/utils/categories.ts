// Category color assignments based on common category names
// Colors use CSS variable references for consistent theming

export type CategoryColor = {
  bg: string;
  text: string;
  border: string;
};

const CATEGORY_COLORS: Record<string, CategoryColor> = {
  career: {
    bg: "bg-[oklch(0.72_0.16_225/0.15)]",
    text: "text-[oklch(0.72_0.16_225)]",
    border: "border-[oklch(0.72_0.16_225/0.3)]",
  },
  workplace: {
    bg: "bg-[oklch(0.68_0.18_160/0.15)]",
    text: "text-[oklch(0.68_0.18_160)]",
    border: "border-[oklch(0.68_0.18_160/0.3)]",
  },
  startup: {
    bg: "bg-[oklch(0.65_0.22_285/0.15)]",
    text: "text-[oklch(0.65_0.22_285)]",
    border: "border-[oklch(0.65_0.22_285/0.3)]",
  },
  manufacturing: {
    bg: "bg-[oklch(0.70_0.14_55/0.15)]",
    text: "text-[oklch(0.70_0.14_55)]",
    border: "border-[oklch(0.70_0.14_55/0.3)]",
  },
  confessions: {
    bg: "bg-[oklch(0.62_0.22_22/0.15)]",
    text: "text-[oklch(0.62_0.22_22)]",
    border: "border-[oklch(0.62_0.22_22/0.3)]",
  },
  advice: {
    bg: "bg-[oklch(0.68_0.2_320/0.15)]",
    text: "text-[oklch(0.68_0.2_320)]",
    border: "border-[oklch(0.68_0.2_320/0.3)]",
  },
};

// Fallback colors for unknown categories (cycling through a palette)
const FALLBACK_COLORS: CategoryColor[] = [
  {
    bg: "bg-[oklch(0.65_0.22_285/0.15)]",
    text: "text-[oklch(0.65_0.22_285)]",
    border: "border-[oklch(0.65_0.22_285/0.3)]",
  },
  {
    bg: "bg-[oklch(0.72_0.16_160/0.15)]",
    text: "text-[oklch(0.72_0.16_160)]",
    border: "border-[oklch(0.72_0.16_160/0.3)]",
  },
  {
    bg: "bg-[oklch(0.68_0.2_320/0.15)]",
    text: "text-[oklch(0.68_0.2_320)]",
    border: "border-[oklch(0.68_0.2_320/0.3)]",
  },
  {
    bg: "bg-[oklch(0.70_0.14_55/0.15)]",
    text: "text-[oklch(0.70_0.14_55)]",
    border: "border-[oklch(0.70_0.14_55/0.3)]",
  },
];

export function getCategoryColor(name: string, index = 0): CategoryColor {
  const key = name.toLowerCase().trim();
  return (
    CATEGORY_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}
