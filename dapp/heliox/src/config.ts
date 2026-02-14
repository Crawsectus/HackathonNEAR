const contractPerNetwork = {
  testnet: {
    ft: 'heliox-ft.testnet',
    nft: 'heliox-core.testnet', // Reemplaza con el ID real de este contrato
  },
};

export const NetworkId = 'testnet';
export const FT_CONTRACT = contractPerNetwork[NetworkId].ft;
export const NFT_CONTRACT = contractPerNetwork[NetworkId].nft;
export const MARKET_CONTRACT = 'heliox-marketplace.testnet';
export const USDT_CONTRACT = 'usdt.fakes.testnet';