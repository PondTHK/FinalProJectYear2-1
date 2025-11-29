export const getViewsCount = (id: string): number => {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.floor((hash % 5000) + 100);
};

export const extractTags = (description?: string | null): string[] => {
  if (!description) return [];
  const hashtags = description.match(/#[\w]+/g) || [];
  return hashtags.slice(0, 3);
};

export const cleanDescription = (description?: string | null): string => {
  if (!description) return "";
  return description.replace(/#[\w]+/g, "").trim() || description;
};

