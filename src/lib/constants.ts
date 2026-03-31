export const ADMIN_WALLET = '0xB4FB11FB0c3BE6a1760a0e2ffbe4726255F0990D';

export const NETWORKS: Record<number, { name: string; hex: string; moralis: string }> = {
  1: { name: 'Ethereum Mainnet', hex: '0x1', moralis: '0x1' },
  11155111: { name: 'Sepolia Testnet', hex: '0xaa36a7', moralis: '0xaa36a7' },
  137: { name: 'Polygon', hex: '0x89', moralis: '0x89' },
  42161: { name: 'Arbitrum', hex: '0xa4b1', moralis: '0xa4b1' },
  8453: { name: 'Base', hex: '0x2105', moralis: '0x2105' },
  56: { name: 'BSC', hex: '0x38', moralis: '0x38' }
};

export const AAVE_ADDRESSES: Record<number, { POOL: string; WETH_GATEWAY: string; USDC: string; WETH: string }> = {
  1: { // Mainnet
    POOL: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    WETH_GATEWAY: '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  11155111: { // Sepolia
    POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    WETH_GATEWAY: '0x387d311e47e80b498169e6fb51d3193167d89F7D',
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    WETH: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c'
  }
};

export const ABIS = {
  POOL: [
    "function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
    "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)",
    "function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) returns (uint256)",
    "function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes calldata params, uint16 referralCode)"
  ],
  WETH_GATEWAY: [
    "function depositETH(address pool, address onBehalfOf, uint16 referralCode) payable"
  ],
  ERC20: [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
  ],
  ERC721: [
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function setApprovalForAll(address operator, bool approved)"
  ]
};
