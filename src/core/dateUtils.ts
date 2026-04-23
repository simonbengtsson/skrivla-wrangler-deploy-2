const absoluteDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function formatDateOnly(dateStr: string) {
  const date = new Date(dateStr)
  const isToday = date.toDateString() === new Date().toDateString()
  if (isToday) {
    return "Today"
  }
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  if (isYesterday) {
    return "Yesterday"
  }
  const isThisYear = date.getFullYear() === new Date().getFullYear()
  if (!isThisYear) {
    return date.toLocaleDateString("sv")
  }
  const month = date.toLocaleString("default", { month: "short" })
  return `${month} ${date.getDate()}`
}

export function formatAbsoluteDate(dateStr: string) {
  return absoluteDateFormatter.format(new Date(dateStr))
}
