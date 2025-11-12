'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {error.message}
      </pre>
      {error.digest && (
        <p className="mt-4 text-sm text-gray-600">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  )
}
