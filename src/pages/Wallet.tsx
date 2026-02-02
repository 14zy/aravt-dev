import { useAuthStore } from '@/store/auth';
import { useTonConnect } from '@/hooks/useTonConnect';
import { useEffect, useState } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import ta from '@/lib/tonapi';
import { 
  AccountEvent, 
  Action,
  TonTransferAction,
  JettonTransferAction,
  NftItemTransferAction,
  JettonSwapAction,
  AccountAddress,
  JettonPreview,
  EncryptedComment,
  Refund
} from '@ton-api/client';
import { Address } from '@ton/core';
import SellToken from '@/components/client/SellToken';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AccountInfo {
  balance: string;
  last_activity: number;
  status: string;
}

interface DisplayTransaction {
  status: string;
  amount?: string;
  comment?: string;
  type: 'TonTransfer' | 'JettonTransfer' | 'NftItemTransfer' | 'JettonSwap' | unknown;
  sender?: AccountAddress;
  recipient?: AccountAddress;
  encryptedComment?: EncryptedComment;
  refund?: Refund;
  nft?: string;
  payload?: string;
  sendersWallet?: Address;
  recipientsWallet?: Address;
  jetton?: JettonPreview;
  dex?: 'stonfi' | 'dedust' | 'megatonfi';
  amountIn?: string;
  amountOut?: string;
  tonIn?: string;
  tonOut?: string;
  userWallet?: AccountAddress;
  router?: AccountAddress;
  jettonMasterIn?: JettonPreview;
  jettonMasterOut?: JettonPreview;
}

const Wallet = () => {
  const connectWallet = useAuthStore(state => state.connectWallet);
  const { connected, sender, account } = useTonConnect();
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initWallet = async () => {
      if (connected && sender && account?.address) {
        try {
          //await linkWallet();
          await fetchWalletData();
        } catch (err) {
          console.error('Wallet initialization error:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
        }
      }
    };

    initWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]); // Empty dependency array to run only once

  const processAction = (action: Action): DisplayTransaction | null => {
    const baseFields = {
      status: action.status,
      type: action.type,
    };

    switch (action.type) {
      case 'TonTransfer': {
        const transfer = action.TonTransfer as TonTransferAction;
        return {
          ...baseFields,
          sender: transfer.sender,
          recipient: transfer.recipient,
          amount: transfer.amount.toString(),
          comment: transfer.comment,
          encryptedComment: transfer.encryptedComment,
          refund: transfer.refund
        };
      }

      case 'JettonTransfer': {
        const transfer = action.JettonTransfer as JettonTransferAction;
        return {
          ...baseFields,
          sender: transfer.sender,
          recipient: transfer.recipient,
          amount: transfer.amount.toString(),
          comment: transfer.comment,
          jetton: transfer.jetton,
          sendersWallet: transfer.sendersWallet,
          recipientsWallet: transfer.recipientsWallet,
          encryptedComment: transfer.encryptedComment,
          refund: transfer.refund
        };
      }

      case 'NftItemTransfer': {
        const transfer = action.NftItemTransfer  as NftItemTransferAction;
        return {
          ...baseFields,
          sender: transfer.sender,
          recipient: transfer.recipient,
          nft: transfer.nft,
          comment: transfer.comment,
          payload: transfer.payload,
          refund: transfer.refund
        };
      }

      case 'JettonSwap': {
        const swap = action.JettonSwap as JettonSwapAction;
        return {
          ...baseFields,
          dex: swap.dex,
          amountIn: swap.amountIn.toString(),
          amountOut: swap.amountOut.toString(),
          tonIn: swap.tonIn?.toString(),
          tonOut: swap.tonOut?.toString(),
          userWallet: swap.userWallet,
          router: swap.router,
          jettonMasterIn: swap.jettonMasterIn,
          jettonMasterOut: swap.jettonMasterOut
        };
      }

      default:
        return {...baseFields};
    }
  };

  const fetchWalletData = async () => {
    if (!account?.address) return;
    await sleep(1000);

    setIsLoading(true);
    setError(null);

    try {
      // Get account info
      const accountInfo = await ta.accounts.getAccount(Address.parse(account.address));
      setAccountInfo({
        balance: accountInfo.balance.toString(),
        last_activity: accountInfo.lastActivity ?? 0,
        status: accountInfo.status
      });
      await sleep(1000);

      // Get transaction history
      const history = await ta.accounts.getAccountEvents(Address.parse(account.address), {
        limit: 10
      });

      // Transform API transactions into display transactions
      const displayTransactions = history.events
        .map(event => {
          if (event.actions.length === 0) return null;
          return processAction(event.actions[0]);
        })
        .filter((tx): tx is DisplayTransaction => tx !== null);

      setTransactions(displayTransactions);
    } catch (err) {
      console.error('Wallet data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const linkWallet = async () => {
    if (!connected || !account?.address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      await connectWallet(account.address);
    } catch (err) {
      console.error('Wallet linking error:', err);
      throw err;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    
    <div className="container mx-auto space-y-6">

      <div className="w-full flex justify-center gap-4">
        <TonConnectButton />
        {connected && sender && account && (
          <Button 
            onClick={fetchWalletData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        )}
      </div>
      
          <Card>
        <CardContent>
          <SellToken />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Rewards</CardTitle>
          <div className="space-y-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Project</th>
                  
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">2026/01/15</td>
                  <td className="py-2">1,250 USD</td>
                  <td className="py-2">Project EnTez upfront</td>
                  <td className="py-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Received</span></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">2026/01/10</td>
                  <td className="py-2">500 ARAVT</td>
                  <td className="py-2">App testing</td>
                  <td className="py-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Waiting</span></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">2026/01/05</td>
                  <td className="py-2">2,000 ARAVT</td>
                  <td className="py-2">Smart Contract Audit</td>
                  <td className="py-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Waiting</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-2">2026/01/01</td>
                  <td className="py-2">750 ARAVT</td>
                  <td className="py-2">NFT Development</td>
                  <td className="py-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Received</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-2">2026/01/01</td>
                  <td className="py-2">300 USD</td>
                  <td className="py-2">Project EnTez Payment</td>
                  <td className="py-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Received</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>My Transactions</CardTitle>
          
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center">
              {error}
            </div>
          )}

          {accountInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Account Info</h3>
              <div className="space-y-2">
                <p>Balance: {(Number(accountInfo.balance) / 1e9).toFixed(2)} TON</p>
                <p>Last Activity: {formatDate(accountInfo.last_activity)}</p>
                <p>Status: {accountInfo.status}</p>
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Recent Transactions</h3>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={`${tx.type}-${tx.sender?.address}-${tx.recipient?.address}`} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Status: {tx.status}</p>
                        {tx.comment && (
                          <p className="text-sm">Comment: {tx.comment}</p>
                        )}
                        
                        {tx.type === 'JettonTransfer' && tx.jetton && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">
                              Token: {tx.jetton.symbol} ({tx.jetton.name})
                            </p>
                            <p className="text-xs text-gray-500">
                              Amount: {tx.amount} {tx.jetton.symbol}
                            </p>
                          </div>
                        )}

                        {tx.type === 'NftItemTransfer' && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">NFT Transfer</p>
                            <p className="text-xs text-gray-500">NFT Address: {formatAddress(tx.nft || '')}</p>
                          </div>
                        )}

                        {tx.type === 'JettonSwap' && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">DEX: {tx.dex?.toUpperCase()}</p>
                            <p className="text-xs text-gray-500">
                              Swap: {tx.amountIn} {tx.jettonMasterIn?.symbol} → {tx.amountOut} {tx.jettonMasterOut?.symbol}
                            </p>
                            {(tx.tonIn || tx.tonOut) && (
                              <p className="text-xs text-gray-500">
                                TON: {tx.tonIn && `${Number(tx.tonIn) / 1e9} IN`} {tx.tonOut && `${Number(tx.tonOut) / 1e9} OUT`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        {tx.type === 'TonTransfer' && tx.amount && (
                          <p className={`font-medium ${Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(Number(tx.amount) / 1e9).toFixed(2)} TON
                          </p>
                        )}
                        {tx.type === 'JettonTransfer' && tx.amount && tx.jetton && (
                          <p className="font-medium">
                            {Number(tx.amount).toLocaleString()} {tx.jetton.symbol}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
      </Card>
      {/* <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open('https://db.aravt.io', '_blank')}
          >
            Register TON Wallet
          </Button> */}
    </div>
  );
};

export default Wallet;
