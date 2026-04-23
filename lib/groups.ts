export const GROUP_NAMES: Record<number, string> = {
  1: "Dec A1 Group – Evening Batch",
  2: "Jan A1 Group – Evening Batch",
  3: "March Group – Morning Batch",
  4: "March Group – Evening Batch",
  5: "April Group – Morning Batch",
  6: "April Group – Evening Batch",
  7: "Free Practice Group",
};

export const GROUP_IDS = [1, 2, 3, 4, 5, 6, 7] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export const GROUP_COLORS: Record<number, string> = {
  1: "bg-amber-500",
  2: "bg-sky-500",
  3: "bg-emerald-500",
  4: "bg-violet-500",
  5: "bg-rose-500",
  6: "bg-orange-500",
  7: "bg-teal-500",
};

export const GROUP_LIGHT: Record<number, string> = {
  1: "bg-amber-50 border-amber-300 text-amber-800",
  2: "bg-sky-50 border-sky-300 text-sky-800",
  3: "bg-emerald-50 border-emerald-300 text-emerald-800",
  4: "bg-violet-50 border-violet-300 text-violet-800",
  5: "bg-rose-50 border-rose-300 text-rose-800",
  6: "bg-orange-50 border-orange-300 text-orange-800",
  7: "bg-teal-50 border-teal-300 text-teal-800",
};
