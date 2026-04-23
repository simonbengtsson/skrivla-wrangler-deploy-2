import type { LuvabaseMember, Page, PageContent } from "./types"

export const queryKeys = {
  currentUser: ["current-user"] as const,
  members: ["members"] as const,
  pages: ["pages"] as const,
  trashPages: ["pages", "trash"] as const,
  page: (pageId: string) => ["pages", pageId] as const,
  pageContent: (pageId: string) => ["page-contents", pageId] as const,
}

export async function getSession() {
  const response = await jsonFetch<{
    user: LuvabaseMember | null
    environment: "cloudflare" | "luvabase" | "dev"
  }>("/api/session")
  return response
}

export async function getMembers() {
  return jsonFetch<LuvabaseMember[]>("/api/dev-members")
}

export async function listPages() {
  return jsonFetch<Page[]>("/api/pages")
}

export async function listTrashPages() {
  return jsonFetch<Page[]>("/api/pages/trash")
}

export async function getPage(pageId: string) {
  return jsonFetchOrNull<Page>(`/api/pages/${pageId}`)
}

export async function createPage(input: { name?: string } = {}) {
  return jsonFetch<Page>("/api/pages", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updatePage(pageId: string, input: { name: string }) {
  return jsonFetch<Page>(`/api/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deletePage(pageId: string) {
  return jsonFetch<Page>(`/api/pages/${pageId}`, {
    method: "DELETE",
  })
}

export async function restorePage(pageId: string) {
  return jsonFetch<Page>(`/api/pages/${pageId}/restore`, {
    method: "POST",
  })
}

export async function getPageContent(pageId: string) {
  return jsonFetch<PageContent | null>(`/api/pages/${pageId}/content`)
}

export async function updatePageContent(
  pageId: string,
  input: { tiptapJson: string | null; text: string | null },
) {
  return jsonFetch<PageContent>(`/api/pages/${pageId}/content`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

async function jsonFetchOrNull<T>(url: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
