export function dateLabel(
  date: Date | number,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
) {
  return new Intl.DateTimeFormat('tr-TR', options).format(date);
}

export const timeLabel = (time: number) => dateLabel(time, { hour: '2-digit', minute: '2-digit' });
