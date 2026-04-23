import type { LuvabaseMember } from "@/core/types"
import { generateId } from "@/core/utils"
import { PAGE_DOC_FIELD, pageExtensions } from "@/core/pageDocument"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCaret from "@tiptap/extension-collaboration-caret"
import { EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useState } from "react"
import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"
const SESSION_DESTROY_DELAY_MS = 1_000
const COLLABORATION_LABEL_HIDE_DELAY_MS = 2_000

type CollaborationSession = {
  doc: Y.Doc
  provider: WebsocketProvider
}

type CollaborationSessionRecord = CollaborationSession & {
  refCount: number
  destroyTimeoutId: number | null
}

const collaborationSessions = new Map<string, CollaborationSessionRecord>()
const ANONYMOUS_EDITOR_ID_STORAGE_KEY = "skrivla-anonymous-editor-id"

export function useCollaborationSession(pageId: string) {
  const [state, setState] = useState<{
    pageId: string
    session: CollaborationSession | null
    hasSynced: boolean
  }>({
    pageId,
    session: null,
    hasSynced: false,
  })

  const resolvedState =
    state.pageId === pageId
      ? state
      : {
          pageId,
          session: null,
          hasSynced: false,
        }

  useEffect(() => {
    const session = acquireCollaborationSession(pageId)
    const handleSync = (isSynced: boolean) => {
      if (!isSynced) {
        return
      }

      setState((currentState) => {
        if (
          currentState.pageId !== pageId ||
          currentState.session !== session ||
          currentState.hasSynced
        ) {
          return currentState
        }

        return {
          ...currentState,
          hasSynced: true,
        }
      })
    }

    setState({
      pageId,
      session,
      hasSynced: session.provider.synced,
    })
    session.provider.on("sync", handleSync)
    session.provider.connect()

    return () => {
      session.provider.off("sync", handleSync)
      releaseCollaborationSession(pageId)
    }
  }, [pageId])

  return {
    session: resolvedState.session,
    hasSynced: resolvedState.hasSynced,
  }
}

export function SimpleEditor(props: {
  session: CollaborationSession
  user?: LuvabaseMember | null
  autoFocus?: boolean
  focusRequest?: number
  className?: string
}) {
  const [anonymousUser] = useState(() => getAnonymousCollaborationUser())
  const collaborationUser = props.user ?? anonymousUser

  const editor = useEditor({
    extensions: [
      ...pageExtensions,
      Collaboration.configure({
        document: props.session.doc,
        field: PAGE_DOC_FIELD,
      }),
      CollaborationCaret.configure({
        provider: props.session.provider,
        user: {
          name: collaborationUser.name,
          color: getCollaborationColor(collaborationUser.id),
        },
        render: ((user: { name?: string | null; color?: string | null }, clientId?: number) =>
          renderCollaborationCaret(user, clientId)) as (user: {
          name?: string | null
          color?: string | null
        }) => HTMLElement,
        selectionRender: renderCollaborationSelection,
      }),
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        class: "simple-editor-content",
        autocorrect: "on",
        autocomplete: "on",
        autocapitalize: "sentences",
      },
    },
  })

  useEffect(() => {
    if (!editor || !props.autoFocus) {
      return
    }

    editor.commands.focus("start")
  }, [editor, props.autoFocus])

  useEffect(() => {
    if (!editor || props.focusRequest === undefined || props.focusRequest < 1) {
      return
    }

    editor.commands.focus("start")
  }, [editor, props.focusRequest])

  return (
    <div className={`simple-editor-shell ${props.className ?? ""}`.trim()}>
      <EditorContent editor={editor} />
    </div>
  )
}

function acquireCollaborationSession(pageId: string): CollaborationSession {
  const existingSession = collaborationSessions.get(pageId)
  if (existingSession) {
    if (existingSession.destroyTimeoutId !== null) {
      clearTimeout(existingSession.destroyTimeoutId)
      existingSession.destroyTimeoutId = null
    }

    existingSession.refCount += 1
    return existingSession
  }

  const doc = new Y.Doc()
  const provider = new WebsocketProvider(getCollaborationServerUrl(), pageId, doc, {
    connect: false,
    disableBc: true,
  })

  const session = {
    doc,
    provider,
    refCount: 1,
    destroyTimeoutId: null,
  } satisfies CollaborationSessionRecord

  collaborationSessions.set(pageId, session)

  return session
}

function releaseCollaborationSession(pageId: string) {
  const session = collaborationSessions.get(pageId)
  if (!session) {
    return
  }

  session.refCount -= 1
  if (session.refCount > 0) {
    return
  }

  // Delay final teardown so React dev/StrictMode remount checks can reuse the
  // same Yjs session instead of destroying the doc/provider between immediate
  // unmount + remount cycles.
  session.destroyTimeoutId = window.setTimeout(() => {
    const currentSession = collaborationSessions.get(pageId)
    if (!currentSession || currentSession.refCount > 0) {
      return
    }

    currentSession.provider.destroy()
    currentSession.doc.destroy()
    collaborationSessions.delete(pageId)
  }, SESSION_DESTROY_DELAY_MS)
}

function renderCollaborationCaret(
  user: { name?: string | null; color?: string | null },
  clientId?: number,
) {
  const caret = document.createElement("span")
  caret.classList.add("collaboration-cursor__caret")
  caret.style.setProperty("--collaboration-color", user.color ?? "#0f766e")
  if (clientId !== undefined) {
    caret.dataset.clientId = String(clientId)
  }

  const label = document.createElement("div")
  label.classList.add("collaboration-cursor__label")
  label.textContent = user.name?.trim() || "Someone"

  caret.addEventListener("pointerenter", () => {
    showCaretLabel(caret)
  })
  caret.addEventListener("pointerleave", () => {
    scheduleCaretLabelHide(caret)
  })
  setCaretLabelVisible(caret, false)

  caret.appendChild(label)
  return caret
}

const collaborationCaretHideTimeouts = new WeakMap<HTMLElement, number>()

function clearCaretLabelHideTimeout(caret: HTMLElement) {
  const timeoutId = collaborationCaretHideTimeouts.get(caret)
  if (timeoutId === undefined) {
    return
  }

  window.clearTimeout(timeoutId)
  collaborationCaretHideTimeouts.delete(caret)
}

function setCaretLabelVisible(caret: HTMLElement, visible: boolean) {
  caret.dataset.labelVisible = visible ? "true" : "false"
}

function scheduleCaretLabelHide(caret: HTMLElement) {
  clearCaretLabelHideTimeout(caret)

  const timeoutId = window.setTimeout(() => {
    setCaretLabelVisible(caret, false)
    collaborationCaretHideTimeouts.delete(caret)
  }, COLLABORATION_LABEL_HIDE_DELAY_MS)

  collaborationCaretHideTimeouts.set(caret, timeoutId)
}

function showCaretLabel(caret: HTMLElement, hideAfterDelay = false) {
  clearCaretLabelHideTimeout(caret)
  setCaretLabelVisible(caret, true)

  if (hideAfterDelay) {
    scheduleCaretLabelHide(caret)
  }
}

function renderCollaborationSelection(user: { name?: string | null; color?: string | null }) {
  return {
    nodeName: "span",
    class: "collaboration-cursor__selection",
    style: `--collaboration-color: ${user.color ?? "#0f766e"}`,
    "data-user": user.name?.trim() || "Someone",
  }
}

function getCollaborationColor(userId: string) {
  const colors = ["#0f766e", "#0369a1", "#7c3aed", "#b45309", "#be123c", "#4d7c0f"]
  let hash = 0

  for (const char of userId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return colors[hash % colors.length]!
}

function getCollaborationServerUrl() {
  const protocol = location.protocol === "https:" ? "wss" : "ws"
  return `${protocol}://${location.host}/api/collaboration`
}

function getAnonymousCollaborationUser(): LuvabaseMember {
  const existingId = window.localStorage.getItem(ANONYMOUS_EDITOR_ID_STORAGE_KEY)
  const id = existingId || `anonymous-${generateId()}`

  if (!existingId) {
    window.localStorage.setItem(ANONYMOUS_EDITOR_ID_STORAGE_KEY, id)
  }

  return {
    id,
    name: `Guest ${id.slice(-4)}`,
    imageUrl: null,
  }
}
