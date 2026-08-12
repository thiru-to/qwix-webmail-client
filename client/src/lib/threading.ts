import type { MessageSummary } from '@api/types'

export type Thread = {
  id: string
  messages: MessageSummary[]
  /** The newest message, which is what the list row shows. */
  latest: MessageSummary
  unseen: number
}

const RE_PREFIX = /^\s*(?:re|fwd?|aw|sv|vs|antw)\s*(?:\[\d+\])?\s*:\s*/i

export function normalizeSubject(subject: string): string {
  let value = subject.trim()
  // Strip every stacked prefix, not just the first: "Re: Fwd: Re: x" is still thread "x".
  for (let previous = ''; previous !== value; ) {
    previous = value
    value = value.replace(RE_PREFIX, '').trim()
  }
  return value.toLowerCase()
}

/**
 * Union-find over Message-ID/In-Reply-To links, with a normalised-subject fallback so replies whose
 * client dropped the headers still group. Only messages already paged in can thread.
 */
export function buildThreads(messages: MessageSummary[]): Thread[] {
  const parent = new Map<string, string>()

  const find = (key: string): string => {
    const seen = parent.get(key)
    if (seen === undefined || seen === key) {
      if (seen === undefined) parent.set(key, key)
      return key
    }
    const root = find(seen)
    parent.set(key, root)
    return root
  }

  const union = (a: string, b: string) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent.set(rootB, rootA)
  }

  const keyOf = (message: MessageSummary) => `uid:${message.uid}`

  // Only subjects something actually replied to are worth grouping on. Without this the root of a
  // thread never joins its own bucket; applied blindly, two unrelated messages that merely share a
  // subject would be merged.
  const repliedSubjects = new Set(
    messages
      .filter((message) => message.inReplyTo || RE_PREFIX.test(message.subject))
      .map((message) => normalizeSubject(message.subject))
      .filter(Boolean),
  )

  for (const message of messages) {
    const key = keyOf(message)
    find(key)
    if (message.messageId) union(key, `mid:${message.messageId}`)
    if (message.inReplyTo) union(key, `mid:${message.inReplyTo}`)

    // An empty subject would otherwise pull every blank-subject message into one thread.
    const subject = normalizeSubject(message.subject)
    if (subject && repliedSubjects.has(subject)) union(key, `subj:${subject}`)
  }

  const groups = new Map<string, MessageSummary[]>()
  for (const message of messages) {
    const root = find(keyOf(message))
    const group = groups.get(root)
    if (group) group.push(message)
    else groups.set(root, [message])
  }

  const threads = [...groups.values()].map((group) => {
    const sorted = [...group].sort((a, b) => b.uid - a.uid)
    const latest = sorted[0]!
    return {
      id: `thread-${latest.uid}`,
      messages: sorted,
      latest,
      unseen: sorted.filter((message) => !message.seen).length,
    }
  })

  return threads.sort((a, b) => b.latest.uid - a.latest.uid)
}
