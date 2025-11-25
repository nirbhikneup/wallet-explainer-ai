import { NextRequest, NextResponse } from 'next/server';

type WalletInfo = {
    address: string;
    balanceEth: string;
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const wallet: WalletInfo | undefined = body.wallet;
        const messages: ChatMessage[] = body.messages || [];

        if (!wallet || !wallet.address || !wallet.balanceEth) {
            return NextResponse.json(
                { error: 'Missing wallet data (address or balance).' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Server missing OPENAI_API_KEY env variable.' },
                { status: 500 }
            );
        }

        const { address, balanceEth } = wallet;

        // Build chat history for the model
        const openAIMessages = [
            {
                role: 'system' as const,
                content:
                    "You are WalletGPT, a friendly assistant who explains a user's Ethereum wallet in extremely simple, everyday language. Keep responses short, clear, and conversational. Never use markdown, bullet points, headings, emojis, asterisks, or lists of steps. Never give instructions about buying crypto or recommending exchanges. You only explain: what the user's balance means, how to safely send or receive funds, how to avoid scams, and basic wallet safety. Do not give financial advice. Keep it under 3–5 sentences.",
            },
            {
                role: 'system' as const,
                content:
                    `Wallet info: Address ${address}, ETH balance ${balanceEth} ETH. You can reference this in simple ways. Do not explain prices, investing, taxes, or exchanges.`,
            },
            ...messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
        ];


        const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // cheap + solid
                messages: openAIMessages,
                temperature: 0.4,
            }),
        });

        if (!llmRes.ok) {
            const text = await llmRes.text();
            console.error('LLM error:', llmRes.status, text);
            return NextResponse.json(
                { error: `LLM error ${llmRes.status}: ${text}` },
                { status: 500 }
            );
        }

        const data = await llmRes.json();
        const reply: string =
            data.choices?.[0]?.message?.content ??
            'Sorry, I could not generate a reply.';

        return NextResponse.json({ reply });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Bad request in /api/explain.' },
            { status: 400 }
        );
    }
}
