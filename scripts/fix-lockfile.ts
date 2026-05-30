/**
 * Workaround for npm CLI bug:
 *
 *   https://github.com/npm/cli/issues/4828
 *
 * When npm 10 cross-installs platform-specific optionalDependencies (e.g.
 * `@rolldown/binding-*`), it writes them to package-lock.json with
 * `"extraneous": true` instead of `"optional": true`. Cloudflare Pages runs
 * `npm clean-install`, which is strict and fails with EBADPLATFORM on the
 * "extraneous" entries that don't match its Linux/x64 runtime.
 *
 * This script rewrites those entries so:
 *   - "extraneous": true   →   "optional": true
 *
 * Run after every `npm install` (or just commit the cleaned lockfile).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const path = resolve(process.cwd(), 'package-lock.json')
const lockfile = JSON.parse(readFileSync(path, 'utf8'))

let patched = 0
for (const [key, pkg] of Object.entries<any>(lockfile.packages ?? {})) {
  if (pkg && pkg.extraneous === true) {
    delete pkg.extraneous
    pkg.optional = true
    patched++
  }
}

writeFileSync(path, JSON.stringify(lockfile, null, 2) + '\n')
console.log(`Patched ${patched} extraneous lockfile entries to optional.`)
