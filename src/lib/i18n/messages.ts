export const enMessages = {
    app: {
        overview: 'Overview',
        resumes: 'Resumes',
        jobs: 'Saved jobs',
        applications: 'Applications',
        settings: 'Settings',
    },
    actions: {
        export: 'Export',
        import: 'Import',
        delete: 'Delete',
        share: 'Share',
        copy: 'Copy',
    },
    coverLetters: {
        studio: 'Cover Letter Studio',
        groundedDraft: 'Generate grounded draft',
        evidenceMap: 'Evidence map',
    },
    privacy: {
        dataSettings: 'Data and privacy',
        localStorage: 'Local preview storage',
    },
} as const

export interface MessageTree {
    [key: string]: string | MessageTree
}

function keysFor(tree: MessageTree, prefix = ''): string[] {
    return Object.entries(tree).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key
        return typeof value === 'string' ? [path] : keysFor(value, path)
    })
}

export function messageKeys(messages: MessageTree): string[] {
    return keysFor(messages).sort()
}

export function missingMessageKeys(base: MessageTree, candidate: MessageTree): string[] {
    const candidateKeys = new Set(messageKeys(candidate))
    return messageKeys(base).filter(key => !candidateKeys.has(key))
}