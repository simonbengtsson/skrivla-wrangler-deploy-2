import type { Page } from "./types"

export function sortPagesByCreatedAtDescending(pages: Page[]) {
  return [...pages].sort((leftPage, rightPage) =>
    rightPage.createdAt.localeCompare(leftPage.createdAt),
  )
}

export function upsertPageByCreatedAtDescending(
  pages: Page[] | undefined,
  nextPage: Page,
) {
  if (!pages) {
    return [nextPage]
  }

  return sortPagesByCreatedAtDescending(
    pages.filter((currentPage) => currentPage.id !== nextPage.id).concat(nextPage),
  )
}
