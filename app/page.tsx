'use client';

import { FormEvent, useState } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

type WalletInfo = {
  address: string;
  balanceEth: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function HomePage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [error, setError] = useState<string>('');

  async function handleConnectWallet() {
    try {
      setError('');
      setConnecting(true);

      if (typeof window === 'undefined' || !(window as any).ethereum) {
        setError('MetaMask not found. Please install it first.');
        return;
      }

      const ethereum = (window as any).ethereum;

      // Ask MetaMask for permission to access accounts
      await ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const balanceWei = await provider.getBalance(address);
      const balanceEth = formatEther(balanceWei);

      setWallet({ address, balanceEth });

      // Clear previous chat when switching wallets
      setMessages([]);
      setUserInput('');
    } catch (err) {
      console.error(err);
      setError('Failed to connect wallet. Try again.');
    } finally {
      setConnecting(false);
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!wallet) {
      setError('Connect your wallet first.');
      return;
    }
    if (!userInput.trim()) return;

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userInput.trim(),
    };

    // Add user's message to local chat
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setLoadingReply(true);
    setError('');

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          // keep only last few turns so tokens stay cheap
          messages: updatedMessages.slice(-6),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `API error (${res.status})`);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to get AI reply. Try again.');
    } finally {
      setLoadingReply(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-slate-950 text-slate-100">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-center">
          🧠 Wallet Explainer AI 🧠
        </h1>
        <p className="text-center text-sm text-slate-300">
          Connect your MetaMask once, then chat with an AI about your wallet:
          ask what your balance means, how to move funds safely, and basic best
          practices. Readonly only, we never touch your keys. This is completely safe.
        </p>

        {/* Connect button – only shown when NOT connected */}
        {!wallet && (
          <div className="flex justify-center">
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              className="px-4 py-2 rounded-md bg-indigo-500 disabled:opacity-60"
            >
              {connecting ? 'Connecting…' : 'Connect MetaMask'}
            </button>
          </div>
        )}

        {/* Wallet summary – only shown when connected */}
        {wallet && (
          <div className="w-full rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm">
            <p className="mb-2">
              <span className="font-semibold">Connected address:</span>{' '}
              <span className="break-all">{wallet.address}</span>
            </p>
            <p>
              <span className="font-semibold">ETH balance:</span>{' '}
              {Number(wallet.balanceEth).toFixed(5)} ETH
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Right now we only read your ETH balance on the current Ethereum
              network. Tokens and other chains can be added later.
            </p>
          </div>
        )}

        {/* Chat area */}
        {wallet && (
          <div className="w-full rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="h-64 overflow-y-auto space-y-3 text-sm">
              {messages.length === 0 && (
                <p className="text-slate-400">
                  Start by asking something like:{' '}
                  <span className="italic">
                    “Explain my wallet in simple words” or “What is the safe way
                    to send money from this wallet?”
                  </span>
                </p>
              )}

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${m.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-100'
                      } text-sm whitespace-pre-wrap`}
                  >
                    <span className="block text-[10px] opacity-70 mb-1">
                      {m.role === 'user' ? 'You' : 'AI'}
                    </span>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 pt-2"
            >
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Ask the AI something about your wallet…"
                className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loadingReply || !userInput.trim()}
                className="px-3 py-2 rounded-md bg-emerald-500 text-sm disabled:opacity-60"
              >
                {loadingReply ? 'Thinking…' : 'Ask AI'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="w-full rounded-md bg-red-900/40 border border-red-500/70 p-3 text-sm">
            {error}
          </div>
        )}

        <p className="text-[11px] text-center text-slate-500">
          Educational only. Not financial advice. We never ask for your seed
          phrase or private keys. Always double-check addresses before sending
          funds. Made by Nirbhik Lamar CS
        </p>
      </div>
    </main>
  );
}
