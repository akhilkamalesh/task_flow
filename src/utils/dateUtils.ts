
export const formatDateLocal = (dateString: string) => {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString();
};

export const getStartOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

export const parseDateLocal = (dateString: string) => {
  if (!dateString) return new Date();
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

