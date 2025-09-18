import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useState } from 'react'

const ForgotPassword = () => {
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
            const res = await api.reset_password({ email: email.trim() })
            setMessage(res.message || 'Password reset email has been sent if the email exists.')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send password reset email')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="flex justify-center bg-gray-50">
                <div className="sm:w-[24rem] space-y-6 p-6 bg-white rounded-lg shadow mt-4 mb-4 mx-4">
                    <h2 className="text-center text-xl font-semibold">Reset password</h2>
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
                            {isLoading ? 'Sending…' : 'Send reset email'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
