import { useEffect, useState } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { FT_CONTRACT, NFT_CONTRACT } from '@/config';
import styles from '@/styles/app.module.css'; // Asegúrate de tener este import

interface VehicleCardProps {
  tokenId: string;
}

export function VehicleCard({ tokenId }: VehicleCardProps) {
  const { signedAccountId, viewFunction, callFunction } = useNearWallet() as any;

  const [mileage, setMileage] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [data, setData] = useState({
    balance: '0',
    totalSupply: '0',
    metadata: null as any,
    inMaintenance: false,
    loading: true
  });

  useEffect(() => {
    async function loadVehicleInfo() {
      if (!signedAccountId) return;

      try {
        const [rawBalance, totalSupply, nftInfo, maintenance] = await Promise.all([
          viewFunction({ contractId: FT_CONTRACT, method: 'ft_balance_of', args: { account_id: signedAccountId } }),
          viewFunction({ contractId: NFT_CONTRACT, method: 'get_ft_total_supply', args: {} }),
          viewFunction({ contractId: NFT_CONTRACT, method: 'nft_token', args: { token_id: tokenId } }),
          viewFunction({ contractId: NFT_CONTRACT, method: 'is_in_maintenance', args: {} })
        ]);

        setData({
          balance: rawBalance,
          totalSupply: totalSupply,
          metadata: nftInfo?.metadata,
          inMaintenance: maintenance,
          loading: false
        });
      } catch (err) {
        console.error("Error cargando info:", err);
      }
    }
    loadVehicleInfo();
  }, [signedAccountId, tokenId, viewFunction]);

  const handleUpdateData = async () => {
    if (!callFunction) return alert("Error: Wallet not connected");

    setSending(true);
    try {
      await callFunction({
        contractId: NFT_CONTRACT,
        method: 'submit_vehicle_data',
        args: {
          mileage: Number(mileage),
          temperature: Number(temperature)
        }
      });
      alert("Success! Blockchain updated.");
      window.location.reload();
    } catch (err) {
      console.error("Error:", err);
      alert("Error: Ensure you are the contract owner.");
    } finally {
      setSending(false);
    }
  };

  if (data.loading) return <div className={styles.card}>Loading vehicle info...</div>;

  const percent = (Number(data.balance) / Number(data.totalSupply)) * 100;

  return (
    <div className={styles.card}>
      
      {/* TÍTULO Y ESTADO */}
      <div className={styles.center} style={{ padding: 0, justifyContent: 'space-between' }}>
        <h3 className={styles.agentInsight} style={{ margin: 0 }}>
          {data.metadata?.title || "Asset Details"}
        </h3>
        
        <div className={data.inMaintenance ? styles.statusBadgeError : styles.statusBadgeSuccess}>
          {data.inMaintenance ? '⚠️ MAINTENANCE' : '✅ OPERATIONAL'}
        </div>
      </div>

      {data.inMaintenance && (
        <p style={{ color: '#ff4d4f', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '10px' }}>
          Maintenance Protocol Active: Asset partially restricted.
        </p>
      )}

      {/* PARTICIPACIÓN */}
      <div className={styles.tableContainer} style={{ marginTop: '20px', padding: '15px' }}>
        <h4 style={{ marginTop: 0 }}>Ownership Share</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.balance}</span>
          <span className={styles.agentInsight}>{percent.toFixed(2)}% of total</span>
        </div>

        {/* Barra de progreso */}
        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, background: 'var(--near-green)', height: '100%', transition: 'width 1s ease' }}></div>
        </div>
      </div>

      {/* SIMULADOR DE ORÁCULO */}
      <div className={styles.card} style={{ marginTop: '20px', borderStyle: 'dashed', background: 'rgba(0,0,0,0.1)' }}>
        <h5 style={{ marginTop: 0 }}>Simulate Hardware Oracle</h5>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="number"
            className={styles.input}
            placeholder="Mileage"
            onChange={(e) => setMileage(Number(e.target.value))}
          />
          <input
            type="number"
            className={styles.input}
            placeholder="Temp °C"
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
        </div>
        <button
          onClick={handleUpdateData}
          disabled={sending}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {sending ? 'Pushing to NEAR...' : 'Update Vehicle Status'}
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.75rem', opacity: 0.6, display: 'flex', justifyContent: 'space-between' }}>
        <span>ID: {tokenId}</span>
        <a 
          href={`https://ipfs.io/ipfs/${data.metadata?.extra}`} 
          target="_blank" 
          rel="noreferrer" 
          style={{ color: 'var(--near-green)', textDecoration: 'underline' }}
        >
          View Legal Documents
        </a>
      </div>
    </div>
  );
}