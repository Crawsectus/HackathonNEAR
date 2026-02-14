import { VehicleCard } from '@/components/VehicleCard';
import { useNearWallet } from 'near-connect-hooks';

export default function HelloNear() {
  const { signedAccountId } = useNearWallet();

  return (
    <div className="container">
      <h1>HelioX control panel</h1>
      
      {signedAccountId ? (
        <>
          <p>Welcome, <strong>{signedAccountId}</strong></p>
          
          {/* Aquí mandas a llamar tu componente con el ID del vehículo que te interesa */}
          <VehicleCard tokenId="vehicle-1" />
          
        </>
      ) : (
        <p>Please log onto your near account to see your shares.</p>
      )}
    </div>
  );
}