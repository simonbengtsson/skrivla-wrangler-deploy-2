export type LuvabaseMember = {
  id: string
  name: string
  imageUrl: string | null
}

export type Page = {
  id: string
  name: string
  creatorId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type PageContent = {
  id: string
  updatedAt: string
  tiptapJson: string | null
  text: string | null
}
