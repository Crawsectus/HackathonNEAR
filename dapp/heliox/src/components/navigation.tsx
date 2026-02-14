import { Link, useLocation } from 'react-router-dom'; // Asegúrate de usar react-router-dom
import NearLogo from '@/assets/near-logo.svg';
import styles from '@/styles/app.module.css';
import { useNearWallet } from 'near-connect-hooks';

export const Navigation = () => {
  const { signedAccountId, loading, signIn, signOut } = useNearWallet();
  const location = useLocation();

  const handleAction = () => {
    if (signedAccountId) {
      signOut();
    } else {
      signIn();
    }
  };

  const label = loading
    ? "Cargando..."
    : signedAccountId
    ? `Logout ${signedAccountId.substring(0, 10)}...`
    : "Login con NEAR";

  // Estilo simple para los links activos
  const linkStyle = (path: string) => ({
    textDecoration: 'none',
    color: location.pathname === path ? '#0070f3' : '#555',
    fontWeight: location.pathname === path ? 'bold' : 'normal',
    marginRight: '20px',
    fontSize: '1rem'
  });

  return (
    <nav className="navbar navbar-expand-lg" style={{ padding: '15px 40px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/">
          <img
            src={NearLogo}
            alt="NEAR"
            width={30}
            height={24}
            className={styles.logo}
            style={{ marginRight: '30px' }}
          />
        </Link>
        
        {/* ENLACES DE RUTA */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={linkStyle('/')}>Home</Link>
          <Link to="/marketplace" style={linkStyle('/marketplace')}>Marketplace</Link>
        </div>
      </div>

      <div className="navbar-nav">
        <button 
          className="btn btn-secondary" 
          onClick={handleAction}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            backgroundColor: signedAccountId ? '#f4f4f4' : '#000',
            color: signedAccountId ? '#333' : '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {label}
        </button>
      </div>
    </nav>
  );
};