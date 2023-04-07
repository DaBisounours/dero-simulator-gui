
/**
* Truncates a given address to a shorter representation with a specified length
* at the beginning and end, separated by ellipsis.
*
* @param address - The address string to be truncated.
* @returns A shortened address string with a specified length at the beginning and end, separated by ellipsis.
*/
export function shortAddress(address: string) {
  return address?.slice(0,9) + '...' + address?.slice(-3)
}

/**
 * Formats a given date string into a custom string representation with the format "dd/mm HH:MM:SS".
 *
 * @param dateString - The date string to be formatted.
 * @returns A formatted date string in the format "dd/mm HH:MM:SS".
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  const month = date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
  const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();

  return `${day}/${month} ${hours}:${minutes}:${seconds}`;
}


export const DERO_UNIT = 100000

/**
 * Converts a given amount in DERO to its equivalent in units.
 *
 * @param amount - The amount in DERO to be converted.
 * @returns The equivalent amount in units.
 */
export function deroToUnit(amount: number) {
  return amount * DERO_UNIT
}

/**
 * Converts a given amount in units to its equivalent in DERO.
 *
 * @param unit - The amount in units to be converted.
 * @returns The equivalent amount in DERO.
 */
export function unitToDero(unit: number) {
  return unit / DERO_UNIT
}

/**
 * Converts a given number of seconds into a formatted string representation
 * in the form "DDd HHh MMm SSs" with two digits for each field.
 *
 * @param seconds - The number of seconds to convert.
 * @returns A formatted string representation in the form "DDd HHh MMm SSs".
 */
// secondsToDHMS(seconds: number): string
export function secondsToDHMS(seconds: number): string {
  // Calculate the difference in days, hours, minutes, and seconds
  const days = Math.floor(seconds / (24 * 60 * 60));
  const remainingHours = seconds % (24 * 60 * 60);
  const hours = Math.floor(remainingHours / (60 * 60));
  const remainingMinutes = remainingHours % (60 * 60);
  const minutes = Math.floor(remainingMinutes / 60);
  const remainingSeconds = remainingMinutes % 60;

  // Format the output with two digits for each field
  const formattedDays = String(days).padStart(2, '0');
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedDays}d ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`;
}

/**
 * Formats the keys of a given object by capitalizing the first letter of each key
 * and replacing all underscores with spaces.
 *
 * @param obj - The original object with keys to be formatted.
 * @returns A new object with formatted keys while maintaining the same values.
 */
export function formatKeys(obj: { [key: string]: any }): { [key: string]: any } {
  const formattedObj: { [key: string]: any } = {};

  for (const key in obj) {
    const formattedKey = key
      .replace(/_/g, ' ') // Replace all underscores with spaces
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize the first letter

    formattedObj[formattedKey] = obj[key];
  }

  return formattedObj;
}