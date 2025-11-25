// app/layout.tsx

import './globals.css';

export const metadata = {
  title: 'Wallet Explainer AI',
  description:
    'Connect MetaMask and chat with an AI that explains your Ethereum wallet and wallet safety in simple language.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
