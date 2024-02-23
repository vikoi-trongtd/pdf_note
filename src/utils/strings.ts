import {format} from 'date-fns';

// filename format: [name].pdf
// Create unique filename by add  to its suffix
// return filename_yyyymmdd_hhmmssSSS.extension
const uniqueFileName = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  const name = filename.slice(0, lastDotIndex);
  const extension = filename.slice(lastDotIndex);
  const uniqueTime = format(new Date(), "yyyyMMdd_HHmmssSSS");
  // Append the formatted time and the original file extension
  return `${name}[${uniqueTime}]${extension}`;
}

export {uniqueFileName}
