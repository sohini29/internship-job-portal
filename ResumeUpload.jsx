
import { useState } from 'react'

function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpload(e) {
    e.preventDefault()
    setMessage('')

    if (!file) {
      setMessage('Please select your resume PDF.')
      return
    }

    if (
      file.type !== 'application/pdf' ||
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setMessage('Please select a PDF file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be 5 MB or less.')
      return
    }

    const formData = new FormData()
    formData.append('resume', file)

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/applications/upload-resume',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed')
      }

      setMessage('Resume uploaded successfully!')
      setFile(null)
      e.target.reset()
    } catch (error) {
      setMessage(error.message || 'Could not upload resume.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="resume-upload">
      <h2>Upload Your Resume</h2>
      <p>Select your resume in PDF format (maximum 5 MB).</p>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          required
        />

        {file && <p>Selected: {file.name}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </div>
  )
}

export default ResumeUpload
