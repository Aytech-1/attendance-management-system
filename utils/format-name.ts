export const formatDisplayName = (name?: string | null, title?: string | null): string => {
  if (!name) return 'N/A';
  let cleanName = String(name).replace(/^undefined\s+/i, '').replace(/^null\s+/i, '').trim();
  
  if (!title || String(title).toUpperCase() === 'UNDEFINED' || String(title).toUpperCase() === 'NULL') {
    return cleanName;
  }
  
  const cleanTitle = String(title).trim();
  const nameParts = cleanName.split(' ');
  
  if (nameParts[0].toUpperCase() === cleanTitle.toUpperCase()) {
    return cleanName;
  }
  
  return `${cleanTitle} ${cleanName}`;
};
