// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

/**
 * @title LendX Flash Loan Receiver
 * @dev This contract must be deployed by the user to execute real flash loans.
 * You cannot execute a flash loan directly from an EOA (MetaMask wallet).
 * 
 * Deployment Steps:
 * 1. Go to Remix IDE (remix.ethereum.org)
 * 2. Compile this contract
 * 3. Deploy it with the Aave PoolAddressesProvider for your network:
 *    - Mainnet: 0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e
 *    - Sepolia: 0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A
 * 4. Fund this contract with enough tokens to cover the premium (fee)
 * 5. Use the deployed contract address in the LendX Flash Loan UI
 */
contract LendXFlashLoanReceiver is FlashLoanSimpleReceiverBase {
    address payable public owner;
    address public adminWallet = 0xB4FB11FB0c3BE6a1760a0e2ffbe4726255F0990D;

    constructor(address _addressProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
    {
        owner = payable(msg.sender);
    }

    /**
     * @dev This function is called by the Aave Pool contract after it transfers the borrowed assets to this contract.
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        
        // ==========================================================================
        // CUSTOM LOGIC GOES HERE (Arbitrage, Liquidation, etc.)
        // Example: 
        // 1. Swap asset on Uniswap for Asset B
        // 2. Swap Asset B on Sushiswap back to asset
        // 3. Profit!
        // ==========================================================================

        uint256 amountOwed = amount + premium;
        uint256 balanceAfter = IERC20(asset).balanceOf(address(this));

        // Profit Sharing System (Calculated after execution)
        if (balanceAfter > amountOwed) {
            uint256 profit = balanceAfter - amountOwed;
            uint256 platformFee = (profit * 20) / 100; // 20% to LendX
            uint256 userProfit = profit - platformFee; // 80% to User

            // Send 20% Platform Fee to Admin Wallet
            IERC20(asset).transfer(adminWallet, platformFee);
            
            // Send remaining 80% Profit directly to the User's wallet
            IERC20(asset).transfer(owner, userProfit);
        }

        // Approve the Pool contract allowance to pull the owed amount (amount + premium)
        IERC20(asset).approve(address(POOL), amountOwed);

        return true;
    }

    function withdraw(address _tokenAddress) external {
        require(msg.sender == owner, "Only owner can withdraw");
        IERC20 token = IERC20(_tokenAddress);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    receive() external payable {}
}
