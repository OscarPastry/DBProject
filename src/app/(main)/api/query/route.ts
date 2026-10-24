import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Thrown to roll back the EXPLAIN ANALYZE transaction once the plan is captured
class Rollback extends Error {
  constructor(public plan: string[]) { super('rollback') }
}

export async function POST(req: Request) {
  try {
    const { query, safeMode, explain } = await req.json()

    // In a real app never do this without extreme caution.
    // For this academic project, we allow arbitrary queries to showcase the DB!
    // But we might want to restrict to SELECT only if safeMode is true.
    if (safeMode && !query.trim().toLowerCase().startsWith('select')) {
      return NextResponse.json({ error: "Only SELECT queries are allowed in safe mode." }, { status: 400 })
    }

    if (explain) {
      // EXPLAIN ANALYZE really executes the statement, so run it in a transaction
      // that is always rolled back.
      const statement = String(query).trim().replace(/;\s*$/, '')
      try {
        await prisma.$transaction(async (tx) => {
          const rows = await tx.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(
            `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${statement}`
          )
          throw new Rollback(rows.map(r => r['QUERY PLAN']))
        })
      } catch (e) {
        if (e instanceof Rollback) return NextResponse.json({ plan: e.plan })
        throw e
      }
    }

    // Convert BigInts from Prisma to string before JSON serialization
    const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(query)

    const serializeResult = (rows: Record<string, unknown>[]) => {
      return rows.map(row => {
        const serialized: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(row)) {
          serialized[key] = typeof val === 'bigint' ? val.toString() : val
        }
        return serialized
      })
    }

    return NextResponse.json({ result: serializeResult(result) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}
