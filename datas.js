export function isSunday(date) {
    return date.getDay() === 0;
}

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}