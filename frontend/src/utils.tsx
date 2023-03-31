export function shortAddress(address: string) {
  return address?.slice(0,9) + '...' + address?.slice(-3)
}

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

export function deroToUnit(amount: number) {
  return amount * DERO_UNIT
}

export function unitToDero(unit: number) {
  return unit / DERO_UNIT
}