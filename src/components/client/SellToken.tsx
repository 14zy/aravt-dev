import React, { useState } from 'react';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useSell } from '../../hooks/useSell';
import { toNano } from '@ton/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDown, Loader2 } from 'lucide-react';

const SellToken: React.FC = () => {
    const { sender, connected } = useTonConnect();
    const { sell, error: sellError } = useSell();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [tokenAmount, setTokenAmount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and decimal point
        const value = e.target.value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        if (value.split('.').length > 2) return;
        setAmount(value);
        setTokenAmount((Number(value) * 110 * 0.9).toFixed(2));
    };

    const handleChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and decimal point
        const value = e.target.value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        if (value.split('.').length > 2) return;
        setTokenAmount(value);
        setAmount((Number(value) / 110 / 0.9).toFixed(2));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connected || !sender) {
            setError('Please connect your wallet first.');
            return;
        }

        if (!sell) {
            setError('Token sell is not initialized.');
            return;
        }

        try {
            setIsSubmitting(true);
            if (Number(amount) < 0.2) {
                setError('Minimum amount is 0.2 TON');
                return;
            }
            await sell.send(
                sender,
                {
                    value: toNano(amount),
                },
                null
            );
            setSuccess('Token purchased successfully!');
            setError(null);
            setAmount('');
            setTokenAmount('');
        } catch (err) {
            setError('Failed to purchase token: ' + (err as Error).message);
            setSuccess(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {(sellError || error) && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{sellError || error}</p>}
            {success && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <span className="flex items-center justify-between text-xs text-slate-500"><span>You pay</span><span>TON</span></span>
                    <Input type="text" inputMode="decimal" name="amount" placeholder="0.00" value={amount} onChange={handleChange} required className="mt-1 h-10 border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0" />
                </label>
                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400"><ArrowDown className="h-3.5 w-3.5" /></div>
                <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <span className="flex items-center justify-between text-xs text-slate-500"><span>You receive</span><span>$ARAVT</span></span>
                    <Input type="text" inputMode="decimal" name="tokenAmount" placeholder="0.00" value={tokenAmount} onChange={handleChange2} required className="mt-1 h-10 border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0" />
                </label>
                <p className="text-center text-[11px] text-slate-400">Minimum 0.2 TON · Rate includes fees</p>
                <Button type="submit" disabled={!connected || isSubmitting} className="w-full rounded-xl">
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    {isSubmitting ? 'Confirming...' : 'Buy $ARAVT'}
                </Button>
            </form>
        </div>
    );
};

export default SellToken;
