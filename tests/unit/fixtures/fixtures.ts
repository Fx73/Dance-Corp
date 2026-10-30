import { join } from "node:path"
import { readFileSync } from "node:fs"

// Paths are relative to the workspace root, where the tests are run from
const FIXTURES_DIR = join(process.cwd(), "tests", "unit", "fixtures")

export function ReadChart(fileName: string): string {
  return readFileSync(join(FIXTURES_DIR, "charts", fileName), "utf8")
}
