# Wallet Explainer AI 🧠

A tiny web app that connects to your MetaMask wallet and lets you **chat with an AI about your Ethereum wallet in simple language**.

It reads your **public wallet address + ETH balance** and helps you understand:
- What your balance means in normal words
- How to safely send or receive ETH
- Basic wallet safety and scam awareness

No seed phrases, no private keys, no investment advice.

---

## 🔧 Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [ethers.js](https://docs.ethers.org/) for MetaMask + Ethereum connection
- [OpenAI API](https://platform.openai.com/) (`gpt-4o-mini`) as the explainer
- Deployed on [Vercel](https://vercel.com/)

---

## 🚀 Features

- Connect MetaMask (browser extension)
- Read-only access to:
  - Wallet address
  - ETH balance on the current network
- Chat-style interface:
  - You ask questions about your wallet
  - AI answers in short, clear, non-technical language
- Focus on **safety** and **understanding**, not trading or price speculation

---

## 🏗 Local Development

```bash
git clone https://github.com/<your-username>/wallet-explainer-ai.git
cd wallet-explainer-ai
npm install
