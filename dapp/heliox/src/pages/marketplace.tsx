import { useEffect, useState } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { MARKET_CONTRACT, FT_CONTRACT, USDT_CONTRACT } from '@/config';
import styles from '@/styles/app.module.css';

export default function MarketplacePage() {
    const { signedAccountId, viewFunction, callFunction } = useNearWallet() as any;
    const [listings, setListings] = useState<any[]>([]);
    const [rawPrice, setRawPrice] = useState('0');
    const [amountToList, setAmountToList] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [agentStatus, setAgentStatus] = useState('Ready to assist. Try: "buy 5" or "list 10"');
    const [isProcessing, setIsProcessing] = useState(false);

    const USDT_DECIMALS = 6;

    // FIX: Función toHuman que acepta bigint, string o number de forma segura
    const toHuman = (amount: string | number | bigint) => {
        const amountNumber = typeof amount === 'bigint' ? Number(amount) : Number(amount);
        return (amountNumber / Math.pow(10, USDT_DECIMALS)).toFixed(2);
    };

    useEffect(() => {
        const loadMarketData = async () => {
            try {
                const [allListings, pricePerShare] = await Promise.all([
                    viewFunction({ contractId: MARKET_CONTRACT, method: 'get_all_listings', args: {} }),
                    viewFunction({ contractId: MARKET_CONTRACT, method: 'get_price_per_share', args: {} })
                ]);
                setListings(allListings);
                setRawPrice(pricePerShare);
            } catch (e) { console.error("Error loading market:", e); }
        };
        loadMarketData();
    }, [viewFunction]);

    const handleListShares = async (amount?: string) => {
        const finalAmount = amount || amountToList;
        if (!finalAmount) return alert("Please specify an amount");

        await callFunction({
            contractId: FT_CONTRACT,
            method: 'ft_transfer_call',
            args: { receiver_id: MARKET_CONTRACT, amount: finalAmount, msg: "list" },
            gas: "30000000000000",
            deposit: "1"
        });
    };

    const handleCancelListing = async (amount: string) => {
        await callFunction({
            contractId: MARKET_CONTRACT,
            method: 'cancel_listing',
            args: { amount: amount },
            gas: "100000000000000",
        });
    };

    const handleBuyShares = async (seller: string, shares: string) => {
        // FIX: Cálculo de BigInt convertido a String para el contrato
        const totalCost = (BigInt(shares) * BigInt(rawPrice)).toString();
        await callFunction({
            contractId: USDT_CONTRACT,
            method: 'ft_transfer_call',
            args: {
                receiver_id: MARKET_CONTRACT,
                amount: totalCost,
                msg: JSON.stringify({ seller, shares })
            },
            gas: "200000000000000",
            deposit: "1"
        });
    };

    const handleAiAgent = async () => {
        const input = aiInput.toLowerCase().trim();
        if (!input) return;

        setIsProcessing(true);
        setAgentStatus("🧠 Analyzing intent and blockchain state...");

        setTimeout(async () => {
            try {
                if (input.includes('sell') || input.includes('vender') || input.includes('list')) {
                    const amount = input.match(/\d+/)?.[0];
                    if (!amount) throw new Error("Amount not detected.");
                    setAgentStatus(`🤖 Intent: List ${amount} shares...`);
                    await handleListShares(amount);
                }
                else if (input.includes('buy') || input.includes('comprar')) {
                    const amount = input.match(/\d+/)?.[0] || "1";
                    // 1. Filtrar listings: Que tengan stock Y que NO sean del usuario actual
                    console.log(signedAccountId);
                    const validOffers = listings.filter(([seller, vol]) =>
                        seller !== signedAccountId && BigInt(vol) >= BigInt(amount)
                    );

                    // 2. Si no hay listings en general
                    if (listings.length === 0) {
                        throw new Error("The market is currently empty. No listings available.");
                    }

                    // 3. Si hay listings pero todos son del usuario
                    if (validOffers.length === 0) {
                        const isSelfListing = listings.some(([seller]) => seller === signedAccountId);
                        if (isSelfListing) {
                            throw new Error("You already own the available shares. You cannot buy from yourself!");
                        } else {
                            throw new Error(`No seller has ${amount} shares available right now.`);
                        }
                    }

                    // 4. Seleccionar la mejor (la primera que cumpla, o podrías sortear por precio si variara)
                    const bestOffer = validOffers[0];

                    setAgentStatus(`🤖 Optimal match found! Buying ${amount} from ${bestOffer[0].substring(0, 6)}...`);
                    await handleBuyShares(bestOffer[0], amount);
                }
                else if (input.includes('cancel') || input.includes('cancelar')) {
                    const myListing = listings.find(([seller]) => seller === signedAccountId);
                    if (!myListing) throw new Error("No active listings found.");
                    setAgentStatus(`🤖 Terminating listing...`);
                    await handleCancelListing(myListing[1]);
                }
                else {
                    setAgentStatus("❓ Intent unclear. Try 'Buy 10' or 'Sell 5'.");
                }
            } catch (err: any) {
                setAgentStatus(`❌ Agent Error: ${err.message}`);
            } finally {
                setIsProcessing(false);
            }
        }, 800);
    };

    return (
        <div className={styles.main}>
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className={styles.agentInsight}>HelioX Agentic Market</h1>
                <p style={{ opacity: 0.8 }}>Asset Price: <strong>{toHuman(rawPrice)} USDT / Share</strong></p>
            </header>

            {/* --- AGENT COMMAND CENTER --- */}
            <div className={styles.card} style={{ marginBottom: '30px', border: '1px solid #00ec9c', width: '100%', maxWidth: '1100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '2rem' }}>🤖</div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#00ec9c' }}>AGENT ONLINE</p>
                        <input
                            className={styles.input}
                            style={{ margin: 0, border: 'none', background: 'transparent', fontSize: '1.2rem', padding: '5px 0', outline: 'none' }}
                            placeholder="Tell the agent what to do..."
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiAgent()}
                        />
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>{agentStatus}</p>
                    </div>
                    <button onClick={handleAiAgent} className="btn btn-success" disabled={isProcessing}>Execute</button>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Panel Tradicional */}
                <div className={styles.card}>
                    <h3>Manual Listing</h3>
                    <input
                        type="number"
                        className={styles.input}
                        placeholder="Quantity"
                        value={amountToList}
                        onChange={(e) => setAmountToList(e.target.value)}
                    />
                    <button onClick={() => handleListShares()} className="btn btn-outline-primary" style={{ width: '100%' }}>List Shares</button>
                </div>

                {/* Tabla de Ofertas */}
                <div className={styles.card}>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Seller</th>
                                    <th>Qty</th>
                                    <th>Cost</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map(([seller, amount]) => {
                                    // FIX: Cálculo seguro de total cost para pasar a toHuman
                                    const totalCostBI = BigInt(amount) * BigInt(rawPrice);
                                    return (
                                        <tr key={seller}>
                                            <td>{seller.substring(0, 10)}...</td>
                                            <td><strong>{amount}</strong></td>
                                            <td>{toHuman(totalCostBI)} USDT</td>
                                            <td>
                                                <button
                                                    onClick={() => seller === signedAccountId ? handleCancelListing(amount) : handleBuyShares(seller, amount)}
                                                    className={`btn ${seller === signedAccountId ? 'btn-danger' : 'btn-success'}`}
                                                >
                                                    {seller === signedAccountId ? 'Cancel' : 'Buy'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}