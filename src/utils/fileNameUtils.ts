
export const sanitizeFileName = (fileName: string): string => {
  // Replace Hebrew characters and special characters with safe alternatives
  const sanitized = fileName
    // Replace Hebrew characters with Latin equivalents or remove them
    .replace(/[א-ת]/g, (char) => {
      const hebrewToLatin: { [key: string]: string } = {
        'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
        'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
        'ם': 'm', 'ן': 'n', 'נ': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'p',
        'צ': 'ts', 'ץ': 'ts', 'ק': 'q', 'ר': 'r', 'ש': 'sh', 'ת': 't'
      };
      return hebrewToLatin[char] || '';
    })
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Replace parentheses with underscores
    .replace(/[()]/g, '_')
    // Remove any remaining non-ASCII characters except dots, hyphens, and underscores
    .replace(/[^\w.\-_]/g, '')
    // Remove multiple consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  return sanitized || 'file';
};

export const sanitizeFilePath = (filePath: string): string => {
  const pathParts = filePath.split('/');
  return pathParts.map(part => {
    if (part.includes('.')) {
      // This is likely a filename
      const lastDotIndex = part.lastIndexOf('.');
      const name = part.substring(0, lastDotIndex);
      const extension = part.substring(lastDotIndex);
      return sanitizeFileName(name) + extension;
    } else {
      // This is a folder name
      return sanitizeFileName(part);
    }
  }).join('/');
};
