import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useState } from 'react'

const ResendEmail = () => {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setMessage(null)
        try {
            const res = await api.resend_confirmation_email({ email: email.trim() })
            setMessage(res.message || 'Confirmation email has been resent if the email exists.')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to resend confirmation email')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="flex justify-center bg-gray-50">
                <div className="max-w-sm w-full space-y-6 p-6 bg-white rounded-lg shadow mt-4 mb-4 mx-4">
                    <h2 className="text-center text-xl font-semibold">Resend confirmation email</h2>
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {message && (
                        <Alert>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                onBlur={() => setEmail((prev) => prev.trim())}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending…' : 'Resend email'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ResendEmail


