'use client'

import { useState, useEffect, useCallback } from 'react'

interface CaseNote {
  id: number
  content: string
  createdAt: string
}

interface CaseNotesProps {
  clientCaseId: number
  clientName: string
  onClose: () => void
  onNoteAdded?: () => void // Callback to refresh the main list
}

export default function CaseNotes({ clientCaseId, clientName, onClose, onNoteAdded }: CaseNotesProps) {
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/case-notes?clientCaseId=${clientCaseId}`)
      const result = await response.json()

      if (result.success) {
        // Sort notes chronologically (newest first)
        const sortedNotes = result.data.sort((a: CaseNote, b: CaseNote) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setNotes(sortedNotes)
        setError('')
      } else {
        setError(result.error || 'Failed to fetch notes')
      }
    } catch (_) {
      setError('Failed to fetch notes')
    } finally {
      setIsLoading(false)
    }
  }, [clientCaseId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/case-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientCaseId,
          content: newNote.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Add the new note and sort all notes chronologically (oldest first)
        const updatedNotes = [...notes, result.data].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        setNotes(updatedNotes)
        setNewNote('')
        // Notify parent component to refresh the main list
        onNoteAdded?.()
      } else {
        setError(result.error || 'Failed to add note')
      }
    } catch (_) {
      setError('Failed to add note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Case Notes - {clientName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Add New Note Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Note</h3>
          <form onSubmit={handleAddNote}>
            <div className="mb-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Enter your note here (e.g., waiting on documents, sent package to USCIS, etc.)"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newNote.trim()}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Note'}
            </button>
          </form>
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Notes History */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Case Progress History ({notes.length} notes)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Notes are displayed in chronological order (newest first)
          </p>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No notes added yet.</p>
              <p className="text-sm">Add your first note above to start tracking case progress.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-blue-800">
                      {formatDate(note.createdAt)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
