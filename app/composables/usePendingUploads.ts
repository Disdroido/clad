// Shared state for uploads that survive navigation (fire-and-forget)
export const usePendingUploads = () => {
  const count = useState('pendingUploads:count', () => 0)
  const items = useState<any[]>('pendingUploads:items', () => [])

  function add(count: number = 1) {
    for (let i = 0; i < count; i++) {
      items.value.push({ id: `pending-${Date.now()}-${i}`, pending: true })
    }
  }

  function remove(id: string) {
    items.value = items.value.filter(i => i && i.id !== id)
  }

  function clear() {
    items.value = []
  }

  return { count, items, add, remove, clear }
}
