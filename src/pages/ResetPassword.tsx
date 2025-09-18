import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const [newPassword, setNewPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) {
            setError('Invalid or missing token')
            return
        }
        if (newPassword !== repeatPassword) {
            setError('Passwords do not match')
            return
        }
        setIsLoading(true)
        setError(null)
        setMessage(null)
        try {
            const res = await api.reset_password_complete(token, { new_password: newPassword, repeat_password: repeatPassword })
            setMessage(res.message || 'Password has been reset successfully.')
            setTimeout(() => navigate('/login'), 1500)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="flex justify-center bg-gray-50">
                <div className="sm:w-[24rem] space-y-6 p-6 bg-white rounded-lg shadow mt-4 mb-4 mx-4">
                    <h2 className="text-center text-xl font-semibold">Set new password</h2>
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
                            <Label htmlFor="new_password">New password</Label>
                            <Input id="new_password" type="password" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="repeat_password">Repeat password</Label>
                            <Input id="repeat_password" type="password" value={repeatPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepeatPassword(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Saving…' : 'Set password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword


