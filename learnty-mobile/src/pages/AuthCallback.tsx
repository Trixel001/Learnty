import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const code = hashParams.get('access_token')

        if (!code) {
          setStatus('error')
          setErrorMessage('No verification code found in URL')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        // Exchange code for session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setErrorMessage(error.message)
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        if (data.session) {
          setStatus('success')
          setTimeout(() => navigate('/home'), 2000)
        } else {
          setStatus('error')
          setErrorMessage('No session found')
          setTimeout(() => navigate('/auth'), 3000)
        }
      } catch (err: any) {
        console.error('Callback handling error:', err)
        setStatus('error')
        setErrorMessage(err.message || 'Something went wrong')
        setTimeout(() => navigate('/auth'), 3000)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verifying your email...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your account
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Email verified!
            </h1>
            <p className="text-muted-foreground">
              Redirecting you to the app...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verification failed
            </h1>
            <p className="text-muted-foreground mb-4">
              {errorMessage}
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
