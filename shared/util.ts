export function isStringNumber(string: string) {
    const num = Number(string);
    return !Number.isNaN(num) && Number.isFinite(num);
}