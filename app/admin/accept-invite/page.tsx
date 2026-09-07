'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Shield, CheckCircle2, XCircle, Mail } from 'lucide-react'
import Link from 'next/link'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [isAccepting, setIsAccepting] = useState(false)
  const [result, setResult] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (status === 'authenticated' && token && !result) {
      acceptInvite()
    }
  }, [status, token, result])

  const acceptInvite = async () => {
    if (!token) return

    setIsAccepting(true)
    try {
      const res = await fetch('/api/admin/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult('error')
        setErrorMessage(data.error || 'Failed to accept invite')
        return
      }

      setResult('success')
    } catch (error) {
      console.error('Error accepting invite:', error)
      setResult('error')
      setErrorMessage('Something went wrong')
    } finally {
      setIsAccepting(false)
    }
  }

  // Not logged in
  if (status === 'unauthenticated') {
    return (
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>Login Required</CardTitle>
          <CardDescription>
            You need to be logged in with the email address that received this invite to accept it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/admin/accept-invite?token=${token}`)}`}>
              Log in to accept invite
            </Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline hover:text-foreground">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (status === 'loading' || isAccepting) {
    return (
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Accepting your invite...</p>
        </CardContent>
      </Card>
    )
  }

  // No token provided
  if (!token) {
    return (
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>
            This invite link is invalid or has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/admin/login">Go to Admin Login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (result === 'error') {
    return (
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Unable to Accept Invite</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              Make sure you&apos;re logged in with the email address that received this invite.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/admin/login">Admin Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (result === 'success') {
    return (
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle>Welcome to the Admin Team!</CardTitle>
          <CardDescription>
            You now have full admin access to the Rapid Strike Gaming Lounge admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 rounded-lg p-4 text-sm">
            <p className="text-green-500 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin access granted
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/admin/dashboard">
              Go to Admin Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

function LoadingFallback() {
  return (
    <Card className="max-w-md w-full">
      <CardContent className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </CardContent>
    </Card>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900/20 via-background to-purple-900/20 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  )
}
