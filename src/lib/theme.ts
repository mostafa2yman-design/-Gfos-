export type ThemeColor = "indigo" | "orange" | "blue" | "emerald" | "slate";
export type ThemeRadius = "none" | "sm" | "md" | "lg" | "full";

export const getPrimaryBg = (color: ThemeColor) => {
  switch (color) {
    case "orange": return "bg-orange-500";
    case "indigo": return "bg-indigo-600";
    case "blue": return "bg-blue-600";
    case "emerald": return "bg-emerald-600";
    case "slate": return "bg-slate-800";
    default: return "bg-orange-500";
  }
};

export const getPrimaryText = (color: ThemeColor) => {
  switch (color) {
    case "orange": return "text-orange-500";
    case "indigo": return "text-indigo-600";
    case "blue": return "text-blue-600";
    case "emerald": return "text-emerald-600";
    case "slate": return "text-slate-800";
    default: return "text-orange-500";
  }
};

export const getRadiusClass = (radius: ThemeRadius) => {
  switch (radius) {
    case "none": return "rounded-none";
    case "sm": return "rounded-sm";
    case "md": return "rounded-md";
    case "lg": return "rounded-lg";
    case "full": return "rounded-full";
    default: return "rounded-lg";
  }
};
