import { MarkdownManager } from "@tiptap/markdown"
import { getSchema } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { yXmlFragmentToProseMirrorRootNode } from "y-prosemirror"
import type * as Y from "yjs"

export const PAGE_DOC_FIELD = "default"

export const pageExtensions = [
  StarterKit.configure({
    undoRedo: false,
  }),
]

export const pageSchema = getSchema(pageExtensions)
const pageMarkdownManager = new MarkdownManager({
  extensions: pageExtensions,
})

export function serializePageMarkdown(doc: Y.Doc, pageTitle: string) {
  const rootNode = yXmlFragmentToProseMirrorRootNode(doc.getXmlFragment(PAGE_DOC_FIELD), pageSchema)
  const content = rootNode.toJSON().content ?? []
  const nextDocument = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: {
          level: 1,
        },
        content: [
          {
            type: "text",
            text: pageTitle,
          },
        ],
      },
      ...content,
    ],
  }

  return pageMarkdownManager.serialize(nextDocument)
}
