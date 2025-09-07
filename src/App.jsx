import React, { useState } from 'react'

export default function App() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [chain, setChain] = useState(null)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setChain(null)
    if (!from || !to) return setError('fill both usernames')
    setLoading(true)
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: from.trim(), to: to.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'error')
      } else {
        setChain(data)
      }
    } catch (err) {
      setError('network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>roblox degrees of separation</h1>
      <form onSubmit={submit}>
        <div>
          <label>from username</label>
          <input value={from} onChange={e => setFrom(e.target.value)} placeholder="your username"/>
        </div>
        <div>
          <label>to username</label>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="target username"/>
        </div>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'searching...' : 'find path'}</button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {chain && (
        <div>
          <div style={{marginTop:'1rem', fontSize:'0.9rem', color:'#64748b'}}>degree count {chain.degreeCount}</div>
          <div className="chain-container">
            {chain.chain.map((u, idx) => (
              <React.Fragment key={u.id}>
                <div className="chain-node">{u.name}</div>
                {idx < chain.chain.length - 1 && <div className="chain-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
