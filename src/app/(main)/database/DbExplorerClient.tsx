'use client'

import { useState, useEffect } from 'react'
import { Database, Code, LayoutDashboard, Table as TableIcon, Play, AlertCircle, Search, Gauge } from 'lucide-react'
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from 'reactflow'
import 'reactflow/dist/style.css'

type Column = { name: string; type: string; isNullable: boolean; isPk: boolean; fkTarget: Record<string, string> | null }
type TableSchema = { tableName: string; columns: Column[] }

export default function DbExplorerClient({ schema, rowCounts }: { schema: TableSchema[]; rowCounts: { tableName: string; count: number }[] }) {
  const [activeTab, setActiveTab] = useState('schema')
  const [selectedTable, setSelectedTable] = useState(schema[0]?.tableName)

  return (
    <div className="flex h-full text-black">
      {/* Sidebar */}
      <aside className="w-60 bg-black border-r-[3px] border-black flex flex-col h-full shrink-0">
        <div className="px-5 py-4 border-b-[3px] border-[#ffe500] flex items-center gap-2">
          <Database className="w-5 h-5 text-[#ffe500]" />
          <span className="font-headline font-black text-[#ffe500] uppercase tracking-tighter text-lg">Tables</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {schema.map(t => (
            <button
              key={t.tableName}
              onClick={() => setSelectedTable(t.tableName)}
              className={`w-full text-left px-5 py-3 font-mono text-xs uppercase font-bold border-b border-white/5 transition-none flex justify-between items-center
                ${selectedTable === t.tableName
                  ? 'bg-[#ffe500] text-black'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
            >
              {t.tableName}
              <span className={`text-[10px] px-1.5 py-0.5 border font-black ml-1
                ${selectedTable === t.tableName ? 'border-black text-black bg-black/10' : 'border-white/20 text-white/40'}`}>
                {rowCounts.find(r => r.tableName === t.tableName)?.count ?? 0}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#fdf9ee]">
        {/* Tab Bar */}
        <div className="flex border-b-[3px] border-black bg-[#ece8dd] shrink-0">
          {[
            { id: 'schema', icon: LayoutDashboard, label: 'Schema Viewer' },
            { id: 'query',  icon: Code,           label: 'Live Query' },
            { id: 'erd',    icon: Search,          label: 'Entity Relationship' },
            { id: 'browser',icon: TableIcon,       label: 'Table Browser' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase font-bold border-r-[3px] border-black transition-none
                ${activeTab === id ? 'bg-[#ffe500] text-black' : 'text-black/50 hover:bg-white/50 hover:text-black'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'schema'  && <SchemaTab selectedTable={selectedTable} schema={schema} />}
          {activeTab === 'query'   && <LiveQueryTab />}
          {activeTab === 'erd'     && <ERDTab schema={schema} />}
          {activeTab === 'browser' && <BrowserTab selectedTable={selectedTable} />}
        </div>
      </div>
    </div>
  )
}

function SchemaTab({ selectedTable, schema }: { selectedTable: string; schema: TableSchema[] }) {
  const table = schema.find(t => t.tableName === selectedTable)
  if (!table) return null

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-end justify-between border-b-[4px] border-black pb-4 mb-8">
        <h2 className="font-headline font-black text-5xl uppercase tracking-tighter">{table.tableName}</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          {table.columns.filter(c => c.isPk).length > 1 && (
            <span className="font-mono text-[10px] font-black uppercase bg-[#ffe500] border-2 border-black px-2 py-1">
              ★ COMPOSITE PK
            </span>
          )}
        </div>
      </div>

      <div className="brutalist-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-[#ffe500]">
              <th className="p-4 font-mono font-black text-xs uppercase border-r-[2px] border-white/20">Column Name</th>
              <th className="p-4 font-mono font-black text-xs uppercase border-r-[2px] border-white/20">Data Type</th>
              <th className="p-4 font-mono font-black text-xs uppercase border-r-[2px] border-white/20 text-center">Nullable</th>
              <th className="p-4 font-mono font-black text-xs uppercase">Relationships</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((col, i) => (
              <tr key={col.name}
                className={`border-b-[2px] border-black ${i % 2 === 0 ? 'bg-[#fdf9ee]' : 'bg-[#ece8dd]'}`}>
                <td className="p-4 border-r-[2px] border-black">
                  <span className={`font-mono font-bold text-sm ${col.isPk ? 'underline decoration-[#ffe500] decoration-2' : ''}`}>
                    {col.name}
                  </span>
                </td>
                <td className="p-4 border-r-[2px] border-black">
                  <code className="font-mono text-xs bg-[#ece8dd] border border-black px-2 py-0.5">{col.type}</code>
                </td>
                <td className="p-4 border-r-[2px] border-black text-center">
                  <span className={`font-mono text-[10px] font-black border-2 border-black px-2 py-0.5 ${col.isNullable ? 'bg-white text-black/40' : 'bg-black text-[#ffe500]'}`}>
                    {col.isNullable ? 'NULL' : 'NOT NULL'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    {col.isPk && <span className="pk-badge">PK</span>}
                    {col.fkTarget && (
                      <span className="fk-badge">FK → {col.fkTarget.foreign_table_name}.{col.fkTarget.foreign_column_name}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LiveQueryTab() {
  const [query, setQuery] = useState('SELECT * FROM "Recipe" LIMIT 10;')
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<string[] | null>(null)

  const PRESETS = [
    { label: 'Index: recipes using garlic', sql: `SELECT r.title FROM "USES" u JOIN "Recipe" r ON r.recipe_id = u.recipe_id WHERE u.ingredient_id = (SELECT ingredient_id FROM "Ingredient" WHERE ingredient_name ILIKE 'garlic' LIMIT 1);` },
    { label: 'GIN: full-text search', sql: `SELECT title, ts_rank(search_vector, websearch_to_tsquery('english', 'chicken curry')) AS rank FROM "Recipe" WHERE search_vector @@ websearch_to_tsquery('english', 'chicken curry') ORDER BY rank DESC;` },
    { label: 'View: top-rated recipes', sql: `SELECT r.title, s.review_count, ROUND(s.avg_rating::numeric, 2) AS avg FROM "Recipe_Rating_Stats" s JOIN "Recipe" r USING (recipe_id) WHERE s.review_count >= 3 ORDER BY s.avg_rating DESC LIMIT 10;` },
    { label: 'Window: top 3 per cuisine', sql: `SELECT * FROM (SELECT c.cuisine_name, p.title, p.popularity, RANK() OVER (PARTITION BY p.cuisine_id ORDER BY p.popularity DESC) AS rnk FROM "Recipe_Popularity" p JOIN "Cuisine" c USING (cuisine_id)) t WHERE rnk <= 3;` },
    { label: 'Recipes + creator', sql: `SELECT r.title, u.username FROM "Recipe" r JOIN "User" u ON r.user_id = u.user_id;` },
    { label: 'Ingredient substitutes', sql: `SELECT i.ingredient_name, s.reason, s.confidence_score FROM "SUBSTITUTES" s JOIN "Ingredient" i ON s.original_ingredient_id = i.ingredient_id;` },
    { label: 'Users + Dietary', sql: `SELECT u.username, d.restriction_name FROM "User" u JOIN "FOLLOWS" f ON u.user_id = f.user_id JOIN "Dietary_Restriction" d ON f.restriction_id = d.restriction_id;` },
    { label: 'Most-viewed recipes', sql: `SELECT r.title, COUNT(v.*) as views FROM "Recipe" r LEFT JOIN "Recipe_View_Log" v ON r.recipe_id = v.recipe_id GROUP BY r.title ORDER BY views DESC;` },
    { label: 'Board contents', sql: `SELECT b.board_name, r.title, s.saved_at FROM "SAVES" s JOIN "Board" b ON s.board_id = b.board_id JOIN "Recipe" r ON s.recipe_id = r.recipe_id;` },
    { label: 'Taste signals', sql: `SELECT u.username, t.signal_type, t.weight FROM "User_Taste_Signal" t JOIN "User" u ON t.user_id = u.user_id;` },
    { label: 'Cuisine preferences', sql: `SELECT uo.onboarding_version, c.cuisine_name, s.preference_rank FROM "SELECTS" s JOIN "User_Onboarding" uo ON s.onboarding_id = uo.onboarding_id JOIN "Cuisine" c ON s.cuisine_id = c.cuisine_id ORDER BY preference_rank;` },
    { label: 'Recipes by mood', sql: `SELECT r.title, m.mood_name FROM "FITS" f JOIN "Recipe" r ON f.recipe_id = r.recipe_id JOIN "Mood" m ON f.mood_id = m.mood_id;` },
  ]

  const execute = async (explain = false) => {
    setLoading(true); setError(null); setResults([]); setPlan(null)
    try {
      const res = await fetch('/api/query', { method: 'POST', body: JSON.stringify({ query, safeMode: true, explain }) })
      const data = await res.json()
      if (data.error) setError(data.error)
      else if (explain) setPlan(data.plan)
      else setResults(data.result)
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error") }
    setLoading(false)
  }

  // Summary of the plan: which access paths Postgres chose and how long it took
  const planSummary = plan && {
    indexScans: plan.filter(l => /Index (Only )?Scan|Bitmap Index Scan/.test(l)).length,
    seqScans: plan.filter(l => /Seq Scan/.test(l)).length,
    execTime: plan.find(l => l.startsWith('Execution Time'))?.replace('Execution Time: ', ''),
  }

  return (
    <div className="flex flex-col h-full">
      {/* Presets */}
      <div className="flex gap-2 overflow-x-auto p-4 border-b-[3px] border-black bg-[#ece8dd] shrink-0 pb-3">
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => setQuery(p.sql)}
            className="shrink-0 brutalist-btn bg-white text-black px-3 py-1.5 text-[10px]">
            {p.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="relative p-4 border-b-[3px] border-black shrink-0 bg-black">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-transparent text-[#ffe500] font-mono text-sm p-2 resize-none border-0 focus:ring-0 focus:outline-none h-28"
          spellCheck={false}
        />
        <div className="absolute bottom-6 right-6 flex gap-2">
          <button onClick={() => execute(true)} disabled={loading}
            className="brutalist-btn bg-white text-black px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-50">
            <Gauge className="w-3 h-3" />
            Explain
          </button>
          <button onClick={() => execute(false)} disabled={loading}
            className="brutalist-btn bg-[#ffe500] text-black px-5 py-2 text-xs flex items-center gap-2 disabled:opacity-50">
            <Play className="w-3 h-3" fill="currentColor" />
            {loading ? 'Running...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="m-4 border-[3px] border-black p-4 bg-[#ffe5e5] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
            <code className="font-mono text-xs text-red-800">{error}</code>
          </div>
        ) : plan && planSummary ? (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase font-black">
              <span className="border-[2px] border-black px-2 py-1 bg-[#d9f99d]">{planSummary.indexScans} index scan{planSummary.indexScans === 1 ? '' : 's'}</span>
              <span className={`border-[2px] border-black px-2 py-1 ${planSummary.seqScans ? 'bg-[#fecaca]' : 'bg-white'}`}>{planSummary.seqScans} sequential scan{planSummary.seqScans === 1 ? '' : 's'}</span>
              {planSummary.execTime && <span className="border-[2px] border-black px-2 py-1 bg-white">Executed in {planSummary.execTime}</span>}
              <span className="px-2 py-1 text-black/40">EXPLAIN (ANALYZE, BUFFERS) · rolled back</span>
            </div>
            <pre className="border-[3px] border-black bg-black text-white/80 p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              {plan.map((line, i) => (
                <div key={i} className={
                  /Index (Only )?Scan|Bitmap Index Scan/.test(line) ? 'text-[#a3e635] font-bold'
                  : /Seq Scan/.test(line) ? 'text-[#f87171] font-bold'
                  : /^(Planning|Execution) Time/.test(line) ? 'text-[#ffe500]' : ''
                }>{line}</div>
              ))}
            </pre>
          </div>
        ) : results.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-[#ffe500] sticky top-0">
                {Object.keys(results[0]).map(k => (
                  <th key={k} className="p-3 font-mono font-black uppercase border-r border-white/10">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={`border-b-[2px] border-black ${i % 2 ? 'bg-[#ece8dd]' : 'bg-[#fdf9ee]'}`}>
                  {Object.values(r).map((v: unknown, j) => (
                    <td key={j} className="p-3 font-mono border-r border-black/10">{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : !loading && (
          <div className="h-full flex items-center justify-center font-mono text-xs uppercase text-black/30">
            Select a preset or write a query, then press Run — or Explain to see the query plan.
          </div>
        )}
      </div>
    </div>
  )
}

function ERDTab({ schema }: { schema: TableSchema[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const COLS = 4
    const newNodes: import('reactflow').Node[] = []
    const newEdges: import('reactflow').Edge[] = []

    schema.forEach((table, index) => {
      newNodes.push({
        id: table.tableName,
        position: { x: (index % COLS) * 380 + 40, y: Math.floor(index / COLS) * 360 + 40 },
        data: {
          label: (
            <div className="border-[3px] border-black min-w-[220px] bg-[#fdf9ee]" style={{ boxShadow: '4px 4px 0 0 #000' }}>
              <div className="bg-black text-[#ffe500] px-3 py-2 font-mono font-black text-xs uppercase tracking-widest">
                {table.tableName}
              </div>
              <div className="p-2 space-y-1 bg-[#fdf9ee]">
                {table.columns.map(c => (
                  <div key={c.name} className="flex justify-between text-[9px] font-mono border-b border-black/5 pb-0.5">
                    <span className={c.isPk ? 'text-amber-700 font-black' : c.fkTarget ? 'text-blue-700' : 'text-black/70'}>
                      {c.isPk && '⬛ '}{c.fkTarget && '🔗 '}{c.name}
                    </span>
                    <span className="text-black/30 ml-3">{c.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        },
        style: { border: 'none', background: 'transparent', padding: 0 }
      })

      table.columns.forEach(c => {
        if (c.fkTarget) {
          newEdges.push({
            id: `e-${table.tableName}-${c.name}`,
            source: table.tableName,
            target: c.fkTarget.foreign_table_name,
            animated: true,
            style: { stroke: '#363cff', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#363cff' }
          })
        }
      })
    })

    setNodes(newNodes); setEdges(newEdges)
  }, [schema, setNodes, setEdges])

  return (
    <div className="h-full" style={{ background: '#ece8dd' }}>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
        <Background color="#cec7aa" gap={16} />
        <Controls />
        <MiniMap nodeStrokeColor="#000" nodeColor="#ffe500" maskColor="rgba(236,232,221,0.8)" />
      </ReactFlow>
    </div>
  )
}

function BrowserTab({ selectedTable }: { selectedTable: string }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/query', {
          method: 'POST',
          body: JSON.stringify({ query: `SELECT * FROM "${selectedTable}" LIMIT 50;`, safeMode: true })
        })
        const res = await response.json()
        if (isMounted) { setData(res.result || []); setLoading(false) }
      } catch {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [selectedTable])

  return (
    <div className="h-full overflow-auto">
      <div className="border-b-[3px] border-black p-5 bg-[#ece8dd] flex items-center gap-3">
        <h2 className="font-headline font-black text-2xl uppercase tracking-tighter">
          Browsing <span className="bg-[#ffe500] px-2 border-2 border-black">&quot;{selectedTable}&quot;</span>
        </h2>
      </div>
      {loading ? (
        <div className="p-8 font-mono text-xs uppercase text-black/40 animate-pulse">Loading rows...</div>
      ) : (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-black text-[#ffe500] sticky top-0">
              {data.length > 0 && Object.keys(data[0]).map(k => (
                <th key={k} className="p-3 font-mono font-black uppercase border-r border-white/10">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className={`border-b-[2px] border-black ${i % 2 ? 'bg-[#ece8dd]' : 'bg-[#fdf9ee]'}`}>
                {Object.values(row).map((v: unknown, j) => (
                  <td key={j} className="p-3 font-mono border-r border-black/10 max-w-[200px] truncate">
                    {v !== null ? String(v) : <span className="italic text-black/30">NULL</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
