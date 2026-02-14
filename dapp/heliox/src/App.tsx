import { BrowserRouter, Routes, Route } from "react-router";
import { Navigation } from "@/components/navigation";
import HelloNear from "@/pages/hello_near";
import MarketplacePage from "@/pages/marketplace";
import { NearProvider } from 'near-connect-hooks';

const CONTRACT_ID = "tu-cuenta.testnet";

function App() {
  return (
<NearProvider 
  config={{ 
    network: "testnet", 
  }}
>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<HelloNear />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </BrowserRouter>
    </NearProvider>
  );
}

export default App;