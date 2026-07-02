export const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const parseDateLocal = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day);
};

export const parseMoneyToNumber = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(',', '.')) || 0;
};