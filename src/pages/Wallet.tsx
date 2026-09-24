import SellToken from "@/components/client/SellToken";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTonConnect } from "@/hooks/useTonConnect";
import ta from "@/lib/tonapi";
import { useAuthStore } from "@/store/auth";
import {
  AccountAddress,
  Action,
  JettonPreview,
  JettonBalance,
  JettonSwapAction,
  JettonTransferAction,
  NftItem,
  NftItemTransferAction,
  TonTransferAction,
} from "@ton-api/client";
import { CHAIN, toUserFriendlyAddress } from "@tonconnect/ui-react";
import { Address, beginCell, toNano } from "@ton/core";
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

const ARAVT_JETTON_ADDRESS = Address.parse("0:d36706f8299d434b89965cdfe07515dd85c88d9dc54c6dca57808ed441e3d822");
const USDT_JETTON_ADDRESS = Address.parse("0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe");
const ARAVT_USDT_RATE = 0.01;
const GRAM_USDT_RATE = 1.2;

type SendAsset = "ARAVT" | "USDT" | "GRAM";
type JettonAsset = Exclude<SendAsset, "GRAM">;

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

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));

const formatTokenBalance = (balance: bigint, decimals: number) => {
  if (decimals <= 0) return balance.toLocaleString();

  const divisor = 10n ** BigInt(decimals);
  const whole = balance / divisor;
  const fraction = (balance % divisor)
    .toString()
    .padStart(decimals, "0")
    .slice(0, 4)
    .replace(/0+$/, "");

  return fraction ? `${whole.toLocaleString()}.${fraction}` : whole.toLocaleString();
};

const parseTokenAmount = (value: string, decimals: number) => {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Enter a valid token amount.");

  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) {
    throw new Error(`This token supports up to ${decimals} decimal places.`);
  }

  return (BigInt(whole) * (10n ** BigInt(decimals)))
    + BigInt(fraction.padEnd(decimals, "0") || "0");
};

const getNftName = (nft: NftItem) =>
  typeof nft.metadata?.name === "string" && nft.metadata.name.trim()
    ? nft.metadata.name
    : `NFT #${nft.index}`;

const getNftPreview = (nft: NftItem) =>
  nft.previews?.[nft.previews.length - 1]?.url;

const getTransactionMeta = (transaction: DisplayTransaction) => {
  switch (transaction.type) {
    case "TonTransfer":
      return { label: "GRAM transfer", icon: ArrowUpRight, color: "text-violet-600", background: "bg-violet-50" };
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
  const { connected, account, sender } = useTonConnect();
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [aravtBalance, setAravtBalance] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const [jettonHoldings, setJettonHoldings] = useState<Partial<Record<JettonAsset, JettonBalance>>>({});
  const [nfts, setNfts] = useState<NftItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendAsset, setSendAsset] = useState<SendAsset>("GRAM");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetchedAddressRef = useRef<string | null>(null);
  const requestAddressRef = useRef<string | null>(null);
  const activeAddressRef = useRef<string | null>(account?.address ?? null);
  activeAddressRef.current = account?.address ?? null;

  const fetchWalletData = useCallback(async () => {
    const address = account?.address;
    if (!address || requestAddressRef.current === address) return;
    requestAddressRef.current = address;
    setIsLoading(true);
    setError(null);

    try {
      const parsedAddress = Address.parse(address);
      const [accountResult, historyResult, jettonsResult, nftsResult] = await Promise.allSettled([
        ta.accounts.getAccount(parsedAddress),
        ta.accounts.getAccountEvents(parsedAddress, { limit: 10 }),
        ta.accounts.getAccountJettonsBalances(parsedAddress),
        ta.accounts.getAccountNftItems(parsedAddress, { limit: 12 }),
      ]);

      if (activeAddressRef.current !== address) return;

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

      if (jettonsResult.status === "fulfilled") {
        const aravtToken = jettonsResult.value.balances.find(
          ({ jetton }) => jetton.address.equals(ARAVT_JETTON_ADDRESS),
        );
        const usdtToken = jettonsResult.value.balances.find(
          ({ jetton }) => jetton.address.equals(USDT_JETTON_ADDRESS),
        );
        setAravtBalance(
          aravtToken
            ? formatTokenBalance(aravtToken.balance, aravtToken.jetton.decimals)
            : "0",
        );
        setUsdtBalance(
          usdtToken
            ? formatTokenBalance(usdtToken.balance, usdtToken.jetton.decimals)
            : "0",
        );
        setJettonHoldings({
          ...(aravtToken ? { ARAVT: aravtToken } : {}),
          ...(usdtToken ? { USDT: usdtToken } : {}),
        });
      }

      if (nftsResult.status === "fulfilled") {
        setNfts(nftsResult.value.nftItems);
      }

      const unavailableData = [
        accountResult.status === "rejected" ? "GRAM balance" : null,
        jettonsResult.status === "rejected" ? "token balances" : null,
        nftsResult.status === "rejected" ? "NFTs" : null,
        historyResult.status === "rejected" ? "recent activity" : null,
      ].filter(Boolean);
      if (unavailableData.length > 0) {
        setError(`Some wallet data is temporarily unavailable: ${unavailableData.join(", ")}.`);
      }
    } catch {
      if (activeAddressRef.current === address) {
        setError("The wallet address could not be read. Reconnect your wallet and try again.");
      }
    } finally {
      if (requestAddressRef.current === address) requestAddressRef.current = null;
      if (activeAddressRef.current === address) setIsLoading(false);
    }
  }, [account?.address]);

  useEffect(() => {
    if (!connected || !account?.address) {
      autoFetchedAddressRef.current = null;
      setTransactions([]);
      setAccountInfo(null);
      setAravtBalance(null);
      setUsdtBalance(null);
      setJettonHoldings({});
      setNfts([]);
      setError(null);
      setIsLoading(false);
      setSendOpen(false);
      setReceiveOpen(false);
      return;
    }

    if (autoFetchedAddressRef.current === account.address) return;
    autoFetchedAddressRef.current = account.address;
    setTransactions([]);
    setAccountInfo(null);
    setAravtBalance(null);
    setUsdtBalance(null);
    setJettonHoldings({});
    setNfts([]);
    void fetchWalletData();
  }, [account?.address, connected, fetchWalletData]);

  const balance = useMemo(
    () => accountInfo
      ? (Number(accountInfo.balance) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })
      : "—",
    [accountInfo],
  );
  const totalAvailableBalance = useMemo(() => {
    if (!accountInfo || aravtBalance === null || usdtBalance === null) return "—";

    const gramAmount = Number(accountInfo.balance) / 1e9;
    const aravtHolding = jettonHoldings.ARAVT;
    const usdtHolding = jettonHoldings.USDT;
    const aravtAmount = aravtHolding
      ? Number(aravtHolding.balance) / (10 ** aravtHolding.jetton.decimals)
      : 0;
    const usdtAmount = usdtHolding
      ? Number(usdtHolding.balance) / (10 ** usdtHolding.jetton.decimals)
      : 0;

    return (usdtAmount + (aravtAmount * ARAVT_USDT_RATE) + (gramAmount * GRAM_USDT_RATE))
      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [accountInfo, aravtBalance, jettonHoldings, usdtBalance]);
  const friendlyAddress = useMemo(
    () => account?.address
      ? toUserFriendlyAddress(account.address, account.chain === CHAIN.TESTNET)
      : "",
    [account?.address, account?.chain],
  );
  const isLinked = Boolean(account?.address && user?.wallet_address === account.address);

  const copyAddress = async () => {
    if (!friendlyAddress) return;
    await navigator.clipboard.writeText(friendlyAddress);
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

  const sendAssetTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendError(null);

    try {
      if (!account?.address) throw new Error("Connect your wallet before sending an asset.");
      const destination = Address.parse(recipient.trim());
      setIsSending(true);

      if (sendAsset === "GRAM") {
        const value = toNano(sendAmount.trim());
        if (value <= 0n) throw new Error("Enter an amount greater than 0 GRAM.");
        await sender.send({ to: destination, value });
      } else {
        const holding = jettonHoldings[sendAsset];
        if (!holding || holding.balance <= 0n) {
          throw new Error(`This wallet has no ${sendAsset} available to send.`);
        }

        const tokenAmount = parseTokenAmount(sendAmount, holding.jetton.decimals);
        if (tokenAmount <= 0n) throw new Error(`Enter an amount greater than 0 ${sendAsset}.`);
        if (tokenAmount > holding.balance) throw new Error(`Insufficient ${sendAsset} balance.`);

        const responseAddress = Address.parse(account.address);
        const transferBody = beginCell()
          .storeUint(0x0f8a7ea5, 32)
          .storeUint(0, 64)
          .storeCoins(tokenAmount)
          .storeAddress(destination)
          .storeAddress(responseAddress)
          .storeBit(false)
          .storeCoins(1n)
          .storeBit(false)
          .endCell();

        await sender.send({
          to: holding.walletAddress.address,
          value: toNano("0.05"),
          body: transferBody,
          bounce: true,
        });
      }

      setRecipient("");
      setSendAmount("");
      setSendOpen(false);
      void fetchWalletData();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "The transaction could not be sent.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-4 sm:px-0 sm:py-6">
      <header>
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">TON wallet</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Wallet</h1>
          <p className="mt-2 text-sm text-slate-500">Your balance, Aravt tokens, and recent activity in one place.</p>
        </div>
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
                  <p className="text-sm text-slate-400">Total available balance</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight sm:text-4xl">{totalAvailableBalance}</span>
                    <span className="text-sm font-semibold text-emerald-300">USDT</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">1 ARAVT = 0.01 USDT · 1 GRAM = 1.2 USDT</p>
                  <p className="mt-5 text-sm text-slate-400">Available balances</p>
                  <div className="mt-3 w-full max-w-md divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5 px-4">
                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-sm font-medium text-slate-300">Aravt</span>
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-xl font-bold tracking-tight">{aravtBalance ?? "—"}</span>
                        <span className="text-xs font-semibold text-violet-300">ARAVT</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-sm font-medium text-slate-300">USDT</span>
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-xl font-bold tracking-tight">{usdtBalance ?? "—"}</span>
                        <span className="text-xs font-semibold text-emerald-300">USDT</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-sm font-medium text-slate-300">Gram</span>
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-xl font-bold tracking-tight">{balance}</span>
                        <span className="text-xs font-semibold text-sky-300">GRAM</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <Dialog open={sendOpen} onOpenChange={(open) => { setSendOpen(open); setSendError(null); }}>
                      <DialogTrigger asChild>
                        <Button className="rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100">
                          <ArrowUpRight className="h-4 w-4" /> Send
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Send {sendAsset}</DialogTitle>
                          <DialogDescription>Select an asset, then enter the destination wallet and amount.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={sendAssetTransaction} className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="send-asset" className="text-sm font-medium text-slate-900">Asset</label>
                            <Select
                              value={sendAsset}
                              onValueChange={(value: SendAsset) => {
                                setSendAsset(value);
                                setSendAmount("");
                                setSendError(null);
                              }}
                              disabled={isSending}
                            >
                              <SelectTrigger id="send-asset">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ARAVT">Aravt (ARAVT)</SelectItem>
                                <SelectItem value="USDT">USDT</SelectItem>
                                <SelectItem value="GRAM">Gram (GRAM)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="send-recipient" className="text-sm font-medium text-slate-900">Recipient address</label>
                            <Input id="send-recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="EQ... or UQ..." autoComplete="off" required disabled={isSending} />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="send-amount" className="text-sm font-medium text-slate-900">Amount ({sendAsset})</label>
                            <Input id="send-amount" type="number" inputMode="decimal" min="0" step="any" value={sendAmount} onChange={(event) => setSendAmount(event.target.value)} placeholder="0.00" required disabled={isSending} />
                          </div>
                          {sendError && <p role="alert" className="text-sm text-red-600">{sendError}</p>}
                          <DialogFooter>
                            <Button type="submit" disabled={isSending}>
                              {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                              {isSending ? "Confirming..." : "Review transaction"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={receiveOpen} onOpenChange={(open) => { setReceiveOpen(open); setCopied(false); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-full border-white/20 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white">
                          <ArrowDownLeft className="h-4 w-4" /> Receive
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Receive GRAM</DialogTitle>
                          <DialogDescription>Share this address with the person sending you GRAM.</DialogDescription>
                        </DialogHeader>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-700 break-all">
                          {friendlyAddress}
                        </div>
                        <Button type="button" onClick={copyAddress} className="w-full">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Address copied" : "Copy address"}
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {/* <button type="button" onClick={copyAddress} className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white">
                  <span className="font-mono">{formatAddress(friendlyAddress)}</span>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button> */}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50"><Coins className="h-5 w-5 text-violet-600" /></div>
                <CardTitle className="text-lg">Buy Aravt tokens</CardTitle>
                <CardDescription>Convert GRAM into $ARAVT directly from your connected wallet.</CardDescription>
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
              <div>
                <CardTitle className="text-lg">My NFTs</CardTitle>
                <CardDescription className="mt-1.5">Digital collectibles held by this wallet.</CardDescription>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ImageIcon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && nfts.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading NFTs...
                </div>
              ) : nfts.length === 0 ? (
                <div className="rounded-2xl border border-dashed py-12 text-center">
                  <ImageIcon className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">No NFTs yet</p>
                  <p className="mt-1 text-xs text-slate-400">Collectibles received by this wallet will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {nfts.map((nft) => {
                    const preview = getNftPreview(nft);
                    return (
                      <article key={nft.address.toRawString()} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="aspect-square bg-slate-100">
                          {preview ? (
                            <img src={preview} alt={getNftName(nft)} loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 p-3">
                          <p className="truncate text-sm font-semibold text-slate-900">{getNftName(nft)}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{nft.collection?.name || "Independent NFT"}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

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
                          {transaction.type === "TonTransfer" && transaction.amount && <p className="text-sm font-semibold text-slate-900">{(Number(transaction.amount) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} GRAM</p>}
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
