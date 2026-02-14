import { useEffect, useState } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { FT_CONTRACT, NFT_CONTRACT } from '@/config';

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
    inMaintenance: false, // <-- NUEVO ESTADO
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
          viewFunction({ contractId: NFT_CONTRACT, method: 'is_in_maintenance', args: {} }) // <-- CONSULTA DE MANTENIMIENTO
        ]);

        setData({
          balance: rawBalance,
          totalSupply: totalSupply,
          metadata: nftInfo?.metadata,
          inMaintenance: maintenance, // <-- GUARDAMOS EL ESTADO
          loading: false
        });
      } catch (err) {
        console.error("Error cargando info:", err);
      }
    }
    loadVehicleInfo();
  }, [signedAccountId, tokenId, viewFunction]);

  // 2. LA FUNCIÓN DE ENVÍO
  const handleUpdateData = async () => {
    if (!callFunction) return alert("Error: Wallet no conectada correctamente");

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
      alert("¡Datos enviados con éxito! La blockchain está validando...");
      window.location.reload();
    } catch (err) {
      console.error("Error al enviar datos:", err);
      alert("Error: Probablemente no eres el owner del contrato.");
    } finally {
      setSending(false);
    }
  };

  if (data.loading) return <div>Loading vehilce info...</div>;

  const percent = (Number(data.balance) / Number(data.totalSupply)) * 100;

  if (data.loading) return <div>Loading...</div>;

  return (
<div style={{ border: '1px solid #ccc', borderRadius: '12px', padding: '20px', margin: '10px 0', backgroundColor: '#fff' }}>
      
      {/* TÍTULO CON INDICADOR DE MANTENIMIENTO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>{data.metadata?.title || "Vehículo"}</h3>
        
        {data.inMaintenance ? (
          <span style={{
            backgroundColor: '#ff4d4f',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%', display: 'inline-block' }}></span>
            MAINTENANCE
          </span>
        ) : (
          <span style={{
            backgroundColor: '#52c41a',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            ✅ NORMAL
          </span>
        )}
      </div>
      {data.inMaintenance && (
        <div style={{ marginTop: '10px', color: '#cf1322', fontSize: '0.8rem', fontWeight: '500' }}>
          ⚠️ Maintenance required.
        </div>
      )}

      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        <h4>Your participation</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
          <span><strong>{data.balance}</strong> Shares</span>
          <span style={{ color: '#0070f3' }}>{percent.toFixed(2)}% total</span>
        </div>

        <div style={{ width: '100%', height: '10px', backgroundColor: '#ddd', borderRadius: '5px', marginTop: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, background: '#00ec9c', height: '100%' }}></div>
        </div>
      </div>

      {/* 3. BLOQUE DEL SIMULADOR DE DATOS */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #00ec9c', borderRadius: '8px' }}>
        <h5 style={{ marginTop: 0 }}>Test oracle: Send sensor data</h5>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Mileage"
            style={{ flex: 1, padding: '8px' }}
            onChange={(e) => setMileage(Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Temp °C"
            style={{ flex: 1, padding: '8px' }}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
        </div>
        <button
          onClick={handleUpdateData}
          disabled={sending}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '6px',
            cursor: sending ? 'not-allowed' : 'pointer'
          }}
        >
          {sending ? 'Enviando a Blockchain...' : 'Update status'}
        </button>
      </div>

      <p style={{ fontSize: '0.8rem', marginTop: '15px' }}>
        ID: {tokenId} |
        <a href={`https://ipfs.io/ipfs/${data.metadata?.extra}`} target="_blank" rel="noreferrer" style={{ marginLeft: '5px' }}>
          View legal document on IPFS
        </a>
      </p>
    </div>
  );
}