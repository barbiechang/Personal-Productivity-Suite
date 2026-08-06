export interface Holiday {
  month: number
  day: number
  name: string
}

export const THAI_HOLIDAYS: Holiday[] = [
  { month: 1, day: 1, name: "New Year's Day" },
  { month: 4, day: 6, name: 'Chakri Memorial Day' },
  { month: 4, day: 13, name: 'Songkran' },
  { month: 4, day: 14, name: 'Songkran' },
  { month: 4, day: 15, name: 'Songkran' },
  { month: 5, day: 1, name: 'Labor Day' },
  { month: 5, day: 4, name: 'Coronation Day' },
  { month: 6, day: 3, name: "Queen's Birthday" },
  { month: 7, day: 28, name: "King's Birthday" },
  { month: 8, day: 12, name: "Mother's Day" },
  { month: 10, day: 13, name: 'King Bhumibol Memorial Day' },
  { month: 10, day: 23, name: 'Chulalongkorn Day' },
  { month: 12, day: 5, name: "Father's Day" },
  { month: 12, day: 10, name: 'Constitution Day' },
  { month: 12, day: 31, name: "New Year's Eve" },
]

export function getHoliday(month: number, day: number): Holiday | undefined {
  return THAI_HOLIDAYS.find((h) => h.month === month && h.day === day)
}
