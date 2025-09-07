import fetch from 'node-fetch'

const friendsCache = new Map()
const nameCache = new Map()
const idLookupCache = new Map()
const MAX_DEPTH = 6

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  try {
    const { from, to } = req.body
    if (!from || !to) return res.status(400).json({ error: 'missing from/to' })

    const srcId = await usernameToId(from)
    const targetId = await usernameToId(to)
    if (!srcId) return res.status(404).json({ error: 'from user not found' })
    if (!targetId) return res.status(404).json({ error: 'to user not found' })

    const path = await bfsFindPath(srcId, targetId)
    if (!path) return res.status(404).json({ error: 'no connection found' })

    const chain = path.map(id => ({ id, name: nameCache.get(id) || id }))
    return res.json({ chain, degreeCount: path.length - 1 })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

async function usernameToId(username) {
  const key = username.toLowerCase()
  if (idLookupCache.has(key)) return idLookupCache.get(key)
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
  })
  const data = await res.json()
  const user = data.data && data.data[0]
  if (!user) return null
  idLookupCache.set(key, user.id)
  nameCache.set(user.id, user.name)
  return user.id
}

async function fetchFriends(userId) {
  if (friendsCache.has(userId)) return friendsCache.get(userId)
  const res = await fetch(`https://friends.roblox.com/v1/users/${userId}/friends?limit=100`)
  const data = await res.json()
  const friends = data.data || []
  friendsCache.set(userId, friends)
  friends.forEach(f => nameCache.set(f.id, f.name))
  return friends
}

async function bfsFindPath(srcId, targetId) {
  if (srcId === targetId) return [srcId]
  const queue = [[srcId]]
  const visited = new Set([srcId])
  let depth = 0
  while (queue.length && depth <= MAX_DEPTH) {
    const size = queue.length
    for (let i = 0; i < size; i++) {
      const path = queue.shift()
      const node = path[path.length - 1]
      const friends = await fetchFriends(node)
      for (const f of friends) {
        if (visited.has(f.id)) continue
        const newPath = [...path, f.id]
        if (f.id === targetId) return newPath
        visited.add(f.id)
        queue.push(newPath)
      }
    }
    depth++
  }
  return null
}
