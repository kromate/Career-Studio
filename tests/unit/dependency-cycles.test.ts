import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import {
    basename,
    dirname,
    extname,
    join,
    relative,
    resolve,
} from 'node:path'

const workspaceRoot = process.cwd()
const sourceEntries = ['app.vue', 'nuxt.config.ts', 'vitest.config.ts', 'src', 'tests']
const sourceExtensions = ['.ts', '.vue']

function collectSourceFiles(entry: string): string[] {
    const absolutePath = join(workspaceRoot, entry)
    if (!existsSync(absolutePath)) return []

    const stats = statSync(absolutePath)
    if (stats.isFile()) {
        return sourceExtensions.includes(extname(absolutePath)) ? [absolutePath] : []
    }

    return readdirSync(absolutePath, { withFileTypes: true }).flatMap((item) => {
        if (item.name === '.nuxt' || item.name === 'node_modules') return []
        return collectSourceFiles(join(entry, item.name))
    })
}

function pascalCase(value: string): string {
    return value
        .replace(/\.[^.]+$/, '')
        .split(/[-_\s/]+/)
        .filter(Boolean)
        .map((part) => {
            const firstLetter = part.at(0)
            return firstLetter ? `${firstLetter.toUpperCase()}${part.slice(1)}` : ''
        })
        .join('')
}

function kebabCase(value: string): string {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function resolveLocalModule(specifier: string, fromFile: string, sourceFiles: Set<string>): string | null {
    let basePath: string | null = null

    if (specifier.startsWith('@/')) {
        basePath = join(workspaceRoot, 'src', specifier.slice(2))
    } else if (specifier.startsWith('~/src/')) {
        basePath = join(workspaceRoot, specifier.slice(2))
    } else if (specifier.startsWith('~/')) {
        basePath = join(workspaceRoot, specifier.slice(2))
    } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
        basePath = resolve(dirname(fromFile), specifier)
    }

    if (!basePath) return null

    const candidates = extname(basePath) ? [basePath] : []
    for (const extension of sourceExtensions) {
        candidates.push(`${basePath}${extension}`)
        candidates.push(join(basePath, `index${extension}`))
    }

    return candidates.find(candidate => sourceFiles.has(candidate)) || null
}

function unique(values: string[]): string[] {
    return [...new Set(values)]
}

function canonicalCycle(cycle: string[]): string {
    const relativeCycle = cycle.map(file => relative(workspaceRoot, file))
    const rotations = relativeCycle.map((_, index) => (
        relativeCycle.slice(index).concat(relativeCycle.slice(0, index)).join(' -> ')
    ))

    return rotations.sort()[0] || relativeCycle.join(' -> ')
}

function findCycles(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>()
    const active = new Set<string>()
    const stack: string[] = []
    const cycles: string[] = []
    const seenCycles = new Set<string>()

    function visit(file: string) {
        visited.add(file)
        active.add(file)
        stack.push(file)

        for (const target of graph.get(file) || []) {
            if (!visited.has(target)) {
                visit(target)
            } else if (active.has(target)) {
                const startIndex = stack.indexOf(target)
                const cycle = stack.slice(startIndex).concat(target)
                const key = canonicalCycle(cycle)
                if (!seenCycles.has(key)) {
                    seenCycles.add(key)
                    cycles.push(cycle.map(item => relative(workspaceRoot, item)).join(' -> '))
                }
            }
        }

        stack.pop()
        active.delete(file)
    }

    for (const file of graph.keys()) {
        if (!visited.has(file)) visit(file)
    }

    return cycles
}

function buildDependencyGraph(): Map<string, string[]> {
    const sourceFiles = new Set(sourceEntries.flatMap(collectSourceFiles))
    const componentFilesByName = new Map<string, string>()
    const composableFilesByName = new Map<string, string>()

    for (const file of sourceFiles) {
        const relativePath = relative(workspaceRoot, file)

        if (relativePath.startsWith('src/components/') && file.endsWith('.vue')) {
            const componentName = pascalCase(basename(file))
            componentFilesByName.set(componentName, file)
            componentFilesByName.set(kebabCase(componentName), file)
        }

        if (relativePath.startsWith('src/composables/') && file.endsWith('.ts')) {
            composableFilesByName.set(basename(file, '.ts'), file)
        }
    }

    const graph = new Map<string, string[]>()
    const staticImportPattern = /import\s+(type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g
    const dynamicImportPattern = /\bimport\(['"]([^'"]+)['"]\)/g
    const templateTagPattern = /<\/?([A-Z][A-Za-z0-9]*|[a-z][a-z0-9]*(?:-[a-z0-9]+)+)(?:\s|>|\/)/g

    for (const file of sourceFiles) {
        const text = readFileSync(file, 'utf8')
        const edges: string[] = []

        for (const match of text.matchAll(staticImportPattern)) {
            const isTypeOnlyImport = Boolean(match[1])
            const specifier = match[2]
            if (isTypeOnlyImport || !specifier) continue

            const target = resolveLocalModule(specifier, file, sourceFiles)
            if (target) edges.push(target)
        }

        for (const match of text.matchAll(dynamicImportPattern)) {
            const specifier = match[1]
            if (!specifier) continue


            const target = resolveLocalModule(specifier, file, sourceFiles)
            if (target) edges.push(target)
        }

        if (file.endsWith('.vue')) {
            for (const match of text.matchAll(templateTagPattern)) {
                const component = match[1] ? componentFilesByName.get(match[1]) : undefined
                if (component && component !== file) edges.push(component)
            }
        }

        for (const [name, composable] of composableFilesByName) {
            const composablePattern = new RegExp(`\\b${name}\\b`, 'g')
            if (composable !== file && composablePattern.test(text)) edges.push(composable)
        }

        graph.set(file, unique(edges))
    }

    return graph
}

describe('source dependency graph', () => {
    it('has no circular dependencies, including Nuxt auto-imported components and composables', () => {
        const cycles = findCycles(buildDependencyGraph())

        expect(cycles, `Circular dependencies found:\n${cycles.join('\n')}`).toEqual([])
    })
})