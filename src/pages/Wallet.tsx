import SellToken from "@/components/client/SellToken";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTonConnect } from "@/hooks/useTonConnect";
import ta from "@/lib/tonapi";
import { useAuthStore } from "@/store/auth";
import {
  AccountAddress,
  Action,
  JettonPreview,
  JettonSwapAction,
  JettonTransferAction,
  NftItemTransferAction,
  TonTransferAction,
} from "@ton-api/client";
import { TonConnectButton } from "@tonconnect/ui-react";
import { Address } from "@ton/core";
import {
  Activity,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Banknote,
  Check,
  CircleAlert,
  Coins,
  Copy,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface AccountInfo {
  balance: string;
  lastActivity: number;
  status: string;
}

interface DisplayTransaction {
  id: string;
  timestamp: number;
  status: string;
  type: string;
  amount?: string;
  comment?: string;
  sender?: AccountAddress;
  recipient?: AccountAddress;
  jetton?: JettonPreview;
  nft?: string;
  dex?: "stonfi" | "dedust" | "megatonfi";
  amountIn?: string;
  amountOut?: string;
  tonIn?: string;
  tonOut?: string;
  jettonMasterIn?: JettonPreview;
  jettonMasterOut?: JettonPreview;
}

const processAction = (
  action: Action,
  eventId: string,
  timestamp: number,
): DisplayTransaction => {
  const base = { id: eventId, timestamp, status: action.status, type: action.type };

  switch (action.type) {
    case "TonTransfer": {
      const transfer = action.TonTransfer as TonTransferAction;
      return {
        ...base,
        sender: transfer.sender,
        recipient: transfer.recipient,
        amount: transfer.amount.toString(),
        comment: transfer.comment,
      };
    }
    case "JettonTransfer": {
      const transfer = action.JettonTransfer as JettonTransferAction;
      return {
        ...base,
        sender: transfer.sender,
        recipient: transfer.recipient,
        amount: transfer.amount.toString(),
        comment: transfer.comment,
        jetton: transfer.jetton,
      };
    }
    case "NftItemTransfer": {
      const transfer = action.NftItemTransfer as NftItemTransferAction;
      return {
        ...base,
        sender: transfer.sender,
        recipient: transfer.recipient,
        nft: transfer.nft,
        comment: transfer.comment,
      };
    }
    case "JettonSwap": {
      const swap = action.JettonSwap as JettonSwapAction;
      return {
        ...base,
        dex: swap.dex,
        amountIn: swap.amountIn.toString(),
        amountOut: swap.amountOut.toString(),
        tonIn: swap.tonIn?.toString(),
        tonOut: swap.tonOut?.toString(),
        jettonMasterIn: swap.jettonMasterIn,
        jettonMasterOut: swap.jettonMasterOut,
      };
    }
    default:
      return base;
  }
};

const formatAddress = (address: string) =>
  address.length > 14 ? `${address.slice(0, 7)}…${address.slice(-6)}` : address;

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));

const getTransactionMeta = (transaction: DisplayTransaction) => {
  switch (transaction.type) {
    case "TonTransfer":
      return { label: "TON transfer", icon: ArrowUpRight, color: "text-violet-600", background: "bg-violet-50" };
    case "JettonTransfer":
      return { label: transaction.jetton?.name || "Token transfer", icon: ArrowDownLeft, color: "text-emerald-600", background: "bg-emerald-50" };
    case "NftItemTransfer":
      return { label: "NFT transfer", icon: ImageIcon, color: "text-amber-600", background: "bg-amber-50" };
    case "JettonSwap":
      return { label: "Token swap", icon: ArrowRightLeft, color: "text-blue-600", background: "bg-blue-50" };
    default:
      return { label: transaction.type.replace(/([A-Z])/g, " $1").trim() || "Wallet activity", icon: Activity, color: "text-slate-600", background: "bg-slate-100" };
  }
};

const Wallet = () => {
  const user = useAuthStore((state) => state.user);
  const connectWallet = useAuthStore((state) => state.connectWallet);
  const { connected, account } = useTonConnect();
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetchedAddressRef = useRef<string | null>(null);
  const requestInFlightRef = useRef(false);

  const fetchWalletData = useCallback(async () => {
    if (!account?.address || requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const parsedAddress = Address.parse(account.address);
      const [accountResult, historyResult] = await Promise.allSettled([
        ta.accounts.getAccount(parsedAddress),
        ta.accounts.getAccountEvents(parsedAddress, { limit: 10 }),
      ]);

      if (accountResult.status === "fulfilled") {
        setAccountInfo({
          balance: accountResult.value.balance.toString(),
          lastActivity: accountResult.value.lastActivity ?? 0,
          status: accountResult.value.status,
        });
      }

      if (historyResult.status === "fulfilled") {
        setTransactions(
          historyResult.value.events
          .filter((event) => event.actions.length > 0)
          .map((event) => processAction(event.actions[0], event.eventId, event.timestamp)),
        );
      }

      if (accountResult.status === "rejected" || historyResult.status === "rejected") {
        const message = accountResult.status === "fulfilled"
          ? "Balance loaded, but recent activity is temporarily unavailable."
          : historyResult.status === "fulfilled"
            ? "Activity loaded, but the current balance is temporarily unavailable."
            : "TON wallet data is temporarily unavailable. Check your connection or TON API configuration and try again.";
        setError(message);
      }
    } catch {
      setError("The wallet address could not be read. Reconnect your wallet and try again.");
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [account?.address]);

  useEffect(() => {
    if (!connected || !account?.address) {
      autoFetchedAddressRef.current = null;
      return;
    }

    if (autoFetchedAddressRef.current === account.address) return;
    autoFetchedAddressRef.current = account.address;
    void fetchWalletData();
  }, [account?.address, connected, fetchWalletData]);

  const balance = useMemo(
    () => accountInfo
      ? (Number(accountInfo.balance) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })
      : "—",
    [accountInfo],
  );
  const isLinked = Boolean(account?.address && user?.wallet_address === account.address);

  const copyAddress = async () => {
    if (!account?.address) return;
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const linkConnectedWallet = async () => {
    if (!account?.address) return;
    setIsLinking(true);
    setError(null);
    try {
      await connectWallet(account.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link wallet to profile");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-4 sm:px-0 sm:py-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">TON wallet</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Wallet</h1>
          <p className="mt-2 text-sm text-slate-500">Your balance, Aravt tokens, and recent activity in one place.</p>
        </div>
        <div className="self-start sm:self-auto"><TonConnectButton /></div>
      </header>

      {!connected || !account ? (
        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="relative flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_55%)]" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-200">
              <WalletCards className="h-7 w-7" />
            </div>
            <h2 className="relative mt-6 text-xl font-bold text-slate-950">Connect your wallet</h2>
            <p className="relative mt-2 max-w-sm text-sm leading-6 text-slate-500">Connect a TON wallet to view your balance, buy Aravt tokens, and see your latest transactions.</p>
            <div className="relative mt-6"><TonConnectButton /></div>
            <div className="relative mt-5 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" /> Your keys always stay in your wallet.</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
            <Card className="relative overflow-hidden rounded-3xl border-0 bg-slate-950 text-white shadow-xl shadow-slate-200">
              <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="absolute -bottom-24 left-1/4 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
              <CardContent className="relative flex min-h-[270px] flex-col justify-between p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Connected</div>
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white" onClick={fetchWalletData} disabled={isLoading} aria-label="Refresh wallet">
                    <RefreshCw className={isLoading ? "animate-spin" : ""} />
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Available balance</p>
                  <div className="mt-2 flex items-baseline gap-2"><span className="text-4xl font-bold tracking-tight sm:text-5xl">{balance}</span><span className="text-lg font-semibold text-slate-400">TON</span></div>
                </div>
                <button type="button" onClick={copyAddress} className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white">
                  <span className="font-mono">{formatAddress(account.address)}</span>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50"><Coins className="h-5 w-5 text-violet-600" /></div>
                <CardTitle className="text-lg">Buy Aravt tokens</CardTitle>
                <CardDescription>Convert TON into $ARAVT directly from your connected wallet.</CardDescription>
              </CardHeader>
              <CardContent className="[&>div]:p-0 [&_h1]:hidden"><SellToken /></CardContent>
            </Card>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isLinked ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                {isLinked ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{isLinked ? "Linked to your Aravt profile" : "Link this wallet to your profile"}</p>
                <p className="text-xs text-slate-500">{accountInfo?.status || "Wallet status unavailable"}{accountInfo?.lastActivity ? ` · Active ${formatDate(accountInfo.lastActivity)}` : ""}</p>
              </div>
            </div>
            {!isLinked && <Button variant="outline" size="sm" className="rounded-xl" onClick={linkConnectedWallet} disabled={isLinking}>{isLinking && <Loader2 className="animate-spin" />} Link wallet</Button>}
          </div>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div><CardTitle className="text-lg">Recent activity</CardTitle><CardDescription className="mt-1.5">The latest events from this wallet.</CardDescription></div>
              <Activity className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              {isLoading && transactions.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading activity...</div>
              ) : transactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed py-16 text-center"><Activity className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">No activity yet</p><p className="mt-1 text-xs text-slate-400">New wallet activity will appear here.</p></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((transaction) => {
                    const meta = getTransactionMeta(transaction);
                    const Icon = meta.icon;
                    return (
                      <div key={transaction.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.background} ${meta.color}`}><Icon className="h-4 w-4" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-slate-900">{meta.label}</p>{transaction.status !== "ok" && <Badge variant="secondary" className="rounded-full text-[10px]">{transaction.status}</Badge>}</div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{transaction.comment || formatDate(transaction.timestamp)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {transaction.type === "TonTransfer" && transaction.amount && <p className="text-sm font-semibold text-slate-900">{(Number(transaction.amount) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} TON</p>}
                          {transaction.type === "JettonTransfer" && transaction.amount && <p className="text-sm font-semibold text-slate-900">{Number(transaction.amount).toLocaleString()} {transaction.jetton?.symbol}</p>}
                          {transaction.type === "JettonSwap" && <p className="text-sm font-semibold text-slate-900">{transaction.amountIn} → {transaction.amountOut}</p>}
                          <p className="mt-0.5 text-xs text-slate-400">{formatDate(transaction.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">My Earnings</CardTitle>
                <CardDescription className="mt-1.5">Rewards earned from completed project work.</CardDescription>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">Project</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center">
                          <Banknote className="mx-auto h-6 w-6 text-slate-300" />
                          <p className="mt-3 font-medium text-slate-700">No earnings yet</p>
                          <p className="mt-1 text-xs text-slate-400">Project rewards will appear here after they are paid.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Wallet;
