import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function JobDetails() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Application form state
  const [applicantName, setApplicantName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [resume, setResume] = useState(null)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applicationLoading, setApplicationLoading] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `http://localhost:5000/api/jobs/${id}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load job details.')
        }

        // Supports either a job object or { job: ... }
        const jobData = data.job || data

        if (!jobData || !jobData._id) {
          throw new Error('Job not found.')
        }

        setJob(jobData)
      } catch (err) {
        setError(
          err.message === 'Failed to fetch'
            ? 'Cannot connect to the backend. Please check the server.'
            : err.message
        )
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  async function handleApplicationSubmit(e) {
    e.preventDefault()
    setApplicationMessage('')

    if (!resume) {
      setApplicationMessage('Please select your resume in PDF format.')
      return
    }

    if (
      resume.type !== 'application/pdf' ||
      !resume.name.toLowerCase().endsWith('.pdf')
    ) {
      setApplicationMessage('Only PDF resumes are allowed.')
      return
    }

    if (resume.size > 5 * 1024 * 1024) {
      setApplicationMessage('Resume must be 5 MB or smaller.')
      return
    }

    const formData = new FormData()
    formData.append('jobId', id)
    formData.append('applicantName', applicantName.trim())
    formData.append('email', email.trim())
    formData.append('phone', phone.trim())
    formData.append('coverLetter', coverLetter.trim())
    formData.append('resume', resume)

    setApplicationLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/applications',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit your application.')
      }

      setApplicationMessage(
        data.message || 'Application submitted successfully!'
      )

      setApplicantName('')
      setEmail('')
      setPhone('')
      setCoverLetter('')
      setResume(null)

      e.target.reset()
    } catch (err) {
      setApplicationMessage(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Please check the server.'
          : err.message
      )
    } finally {
      setApplicationLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 30 }}>Loading job details...</div>
  }

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 20 }}>
        <h2>Unable to load job</h2>
        <p>{error}</p>
        <Link to="/">Back to Opportunities</Link>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '850px',
      margin: '35px auto',
      padding: '24px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <Link to="/" style={{ color: '#2563eb' }}>
        ← Back to Opportunities
      </Link>

      <div style={{
        marginTop: '20px',
        padding: '28px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
      }}>
        <h1>{job.title || 'Untitled Opportunity'}</h1>

        <h3>{job.company || 'Company not specified'}</h3>

        <p>
          <strong>Domain:</strong> {job.domain || job.category || 'Not specified'}
        </p>

        <p>
          <strong>Location:</strong> {job.location || 'Not specified'}
        </p>

        <p>
          <strong>Experience:</strong> {job.experience || 'Not specified'}
        </p>

        <p>
          <strong>Job Type:</strong> {job.jobType || job.type || 'Not specified'}
        </p>

        <hr />

        <h2>Job Description</h2>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {job.description || 'No description available.'}
        </p>

        {job.deadline && (
          <p>
            <strong>Application Deadline:</strong>{' '}
            {new Date(job.deadline).toLocaleDateString()}
          </p>
        )}

        {job.applicationLink && (
          <p>
            <strong>External Application:</strong>{' '}
            <a
              href={job.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply on company website
            </a>
          </p>
        )}

        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginTop: '15px',
            padding: '12px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
          }}
        >
          Back to Apply
        </Link>

        {/* Application form added below existing job details */}
        <hr style={{ margin: '30px 0' }} />

        <h2>Apply for This Job</h2>
        <p>Fill in your details and upload your resume to apply.</p>

        <form onSubmit={handleApplicationSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="applicantName">
              <strong>Full Name</strong>
            </label>
            <input
              id="applicantName"
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="applicantEmail">
              <strong>Email Address</strong>
            </label>
            <input
              id="applicantEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="applicantPhone">
              <strong>Phone Number</strong>
            </label>
            <input
              id="applicantPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              autoComplete="tel"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="coverLetter">
              <strong>Cover Letter (Optional)</strong>
            </label>
            <textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you are suitable for this opportunity"
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="resume">
              <strong>Resume (PDF, maximum 5 MB)</strong>
            </label>
            <input
              id="resume"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setResume(e.target.files?.[0] || null)}
              required
              style={{ ...inputStyle, padding: '10px' }}
            />
            {resume && (
              <p style={{ fontSize: '14px', color: '#4b5563' }}>
                Selected file: {resume.name}
              </p>
            )}
          </div>

          {applicationMessage && (
            <p role="status" style={{
              marginBottom: '16px',
              color: applicationMessage.toLowerCase().includes('successfully')
                ? 'green'
                : '#dc2626',
              overflowWrap: 'anywhere',
            }}>
              {applicationMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={applicationLoading}
            style={{
              padding: '12px 20px',
              backgroundColor: applicationLoading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: applicationLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {applicationLoading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  marginTop: '8px',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '15px',
}

export default JobDetails