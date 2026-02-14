import { useEffect, useState } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { MARKET_CONTRACT, FT_CONTRACT, USDT_CONTRACT } from '@/config';

export default function MarketplacePage() {
    const { signedAccountId, viewFunction, callFunction } = useNearWallet() as any;
    const [listings, setListings] = useState<any[]>([]);
    const [rawPrice, setRawPrice] = useState('0'); // El valor del contrato (1000000)
    const [amountToList, setAmountToList] = useState('');

    // Configuración de decimales
    const USDT_DECIMALS = 6;

    // Función para convertir de Contrato -> Humano (1000000 -> 1.00)
    const toHuman = (amount: string | number) => (Number(amount) / Math.pow(10, USDT_DECIMALS)).toFixed(2);

    // Función para convertir de Humano -> Contrato (1 -> 1000000)
    const toContract = (amount: string | number) => (BigInt(amount) * BigInt(Math.pow(10, USDT_DECIMALS))).toString();

    useEffect(() => {
        const loadMarketData = async () => {
            try {
                const [allListings, pricePerShare] = await Promise.all([
                    viewFunction({ contractId: MARKET_CONTRACT, method: 'get_all_listings', args: {} }),
                    viewFunction({ contractId: MARKET_CONTRACT, method: 'get_price_per_share', args: {} })
                ]);
                setListings(allListings);
                setRawPrice(pricePerShare);
            } catch (e) { console.error("Error cargando mercado:", e); }
        };
        loadMarketData();
    }, [viewFunction]);

    const handleListShares = async () => {
        if (!amountToList) return alert("Ingresa una cantidad");
        await callFunction({
            contractId: FT_CONTRACT,
            method: 'ft_transfer_call',
            args: {
                receiver_id: MARKET_CONTRACT,
                amount: amountToList, // Las shares suelen tener 0 o 18 decimales, revisa tu FT
                msg: "list"
            },
            gas: "30000000000000",
            deposit: "1"
        });
    };
    const handleCancelListing = async (amount: string) => {
        try {
            await callFunction({
                contractId: MARKET_CONTRACT,
                method: 'cancel_listing',
                args: {
                    amount: amount // El contrato espera U128 (enviamos el string crudo)
                },
                gas: "100000000000000", // 100 TGas es suficiente para un transfer
            });
            alert("Listing cancelado. Tus shares han vuelto a tu billetera.");
            window.location.reload();
        } catch (err) {
            console.error("Error al cancelar:", err);
        }
    };
    const handleBuyShares = async (seller: string, shares: string) => {
        const totalCost = (BigInt(shares) * BigInt(rawPrice)).toString();

        try {
            await callFunction({
                contractId: USDT_CONTRACT,
                method: 'ft_transfer_call',
                args: {
                    receiver_id: MARKET_CONTRACT,
                    amount: totalCost,
                    msg: JSON.stringify({ seller, shares })
                },
                // Prueba aumentando el gas y asegurándote de que sea un string
                gas: "200000000000000", // 200 TGas
                deposit: "1" // 1 yoctoNEAR
            });
        } catch (err) {
            console.error("Error al llamar a la función:", err);
        }
    };
    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <header style={{ borderBottom: '2px solid #eee', marginBottom: '30px', paddingBottom: '10px' }}>
                <h1>HelioX marketplace</h1>
                <p style={{ fontSize: '1.1rem', color: '#555' }}>
                    Share price: <strong style={{ color: '#0070f3' }}>{toHuman(rawPrice)} USDT</strong>
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>

                {/* LADO IZQUIERDO: Panel de Venta */}
                <div style={{ background: '#f4f7f6', padding: '20px', borderRadius: '15px', height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0 }}>Sell my shares</h3>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>Your shares will be sent to the custody contract (Escrow).</p>
                    <input
                        type="number"
                        placeholder="Quantity (eg. 10)"
                        onChange={(e) => setAmountToList(e.target.value)}
                        style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <button onClick={handleListShares} style={{ width: '100%', background: '#0070f3', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Sell
                    </button>
                </div>

                {/* LADO DERECHO: Tabla de Ofertas */}
                <div>
                    <h3>Available offers</h3>
                    <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#fafafa' }}>
                                <tr>
                                    <th style={tableHeaderStyle}>Seller</th>
                                    <th style={tableHeaderStyle}>Quantity</th>
                                    <th style={tableHeaderStyle}>Total cost</th>
                                    <th style={tableHeaderStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.length > 0 ? listings.map(([seller, amount]) => {
                                    const totalCost = BigInt(amount) * BigInt(rawPrice);
                                    return (
                                        <tr key={seller} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={tableCellStyle}>{seller.substring(0, 15)}...</td>
                                            <td style={tableCellStyle}><strong>{amount}</strong></td>
                                            <td style={tableCellStyle}>{toHuman(totalCost.toString())} USDT</td>
                                            <td style={tableCellStyle}>
                                                <button
                                                    onClick={() => seller === signedAccountId ? handleCancelListing(amount) : handleBuyShares(seller, amount)}
                                                    style={{
                                                        background: seller === signedAccountId ? '#ff4d4f' : '#00ec9c',
                                                        color: seller === signedAccountId ? '#fff' : '#000',
                                                        padding: '8px 12px',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {seller === signedAccountId ? 'Cancel' : 'Buy'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No hay ventas activas</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Estilos rápidos para la tabla
const tableHeaderStyle: React.CSSProperties = { padding: '15px', textAlign: 'left', fontSize: '0.9rem', color: '#888' };
const tableCellStyle: React.CSSProperties = { padding: '15px', fontSize: '0.95rem' };