import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd(), 'src')
const ignoredDirs = new Set(['node_modules', 'dist', 'build'])
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html'])
const emojiRegex = /\p{Extended_Pictographic}/u
const emDashRegex = /—/
const decorativeGlyphRegex = /[★‹›✦✕✓↺▾▸→←↗⬆×]/

function extensionOf(file) {
  const match = file.match(/\.[^.]+$/)
  return match ? match[0] : ''
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, files)
    else if (sourceExtensions.has(extensionOf(path))) files.push(path)
  }
  return files
}

const failures = []

for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  lines.forEach((line, index) => {
    if (emojiRegex.test(line)) {
      failures.push(`${file}:${index + 1}: emoji glyph found`)
    }
    if (emDashRegex.test(line)) {
      failures.push(`${file}:${index + 1}: em dash found`)
    }
    if (decorativeGlyphRegex.test(line)) {
      failures.push(`${file}:${index + 1}: decorative glyph found, use lucide-react or plain text`)
    }
  })
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('UI copy audit passed: no emoji, em dash, or decorative icon glyphs found in src/.')
