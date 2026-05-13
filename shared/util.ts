export function isStringNumber(string: string) {
    const num = Number(string);
    return !isNaN(num) && isFinite(num);
}