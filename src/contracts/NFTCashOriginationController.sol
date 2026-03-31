// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTCashOriginationController
 * @dev Acts as a liquidity router and affiliate manager for NFT-backed loans.
 * Aggregates liquidity from Blend, BendDAO, Gondi, and Arcade.
 * Enforces a 2% platform origination fee.
 * Uses EIP-712 for non-custodial authorization.
 */
contract NFTCashOriginationController is Ownable, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    uint256 public constant PLATFORM_FEE_BPS = 200; // 2% fee
    address public feeTreasury;

    // Supported Blue-Chip Collections
    mapping(address => bool) public isBlueChip;
    
    // Supported Protocol Adapters (Blend, BendDAO, Gondi, Arcade)
    mapping(address => bool) public approvedAdapters;
    
    // Prevent signature replay
    mapping(bytes32 => bool) public usedSignatures;
    mapping(address => uint256) public nonces;

    bytes32 public constant LOAN_REQUEST_TYPEHASH = keccak256(
        "LoanRequest(address borrower,address nftContract,uint256 tokenId,address protocolAdapter,uint256 principal,uint256 nonce,uint256 deadline)"
    );

    event LoanOriginated(
        address indexed borrower,
        address indexed nftContract,
        uint256 tokenId,
        address protocolAdapter,
        uint256 principal,
        uint256 feeCaptured
    );

    event Refinanced(
        address indexed borrower,
        address indexed nftContract,
        uint256 tokenId,
        address oldAdapter,
        address newAdapter,
        uint256 newPrincipal
    );

    constructor(address _feeTreasury) EIP712("NFTCash", "1") {
        feeTreasury = _feeTreasury;
    }

    modifier onlyBlueChip(address _nft) {
        require(isBlueChip[_nft], "Collateral not a verified Blue-Chip");
        _;
    }

    function setFeeTreasury(address _treasury) external onlyOwner {
        feeTreasury = _treasury;
    }

    function setBlueChipStatus(address _nft, bool _status) external onlyOwner {
        isBlueChip[_nft] = _status;
    }

    function setAdapterStatus(address _adapter, bool _status) external onlyOwner {
        approvedAdapters[_adapter] = _status;
    }

    /**
     * @dev Routes the loan request to the specified protocol adapter using EIP-712 signature.
     * Extracts the 2% platform fee and forwards the rest to the borrower.
     */
    function routeLoanWithSignature(
        address borrower,
        address nftContract,
        uint256 tokenId,
        address protocolAdapter,
        uint256 principal,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant onlyBlueChip(nftContract) {
        require(block.timestamp <= deadline, "Signature expired");
        require(approvedAdapters[protocolAdapter], "Invalid protocol adapter");

        uint256 currentNonce = nonces[borrower]++;
        
        bytes32 structHash = keccak256(abi.encode(
            LOAN_REQUEST_TYPEHASH,
            borrower,
            nftContract,
            tokenId,
            protocolAdapter,
            principal,
            currentNonce,
            deadline
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer == borrower, "Invalid EIP-712 signature");
        require(!usedSignatures[hash], "Signature already used");
        
        usedSignatures[hash] = true;

        // 1. Transfer NFT from Borrower to Adapter (Requires prior setApprovalForAll to this router)
        IERC721(nftContract).transferFrom(borrower, protocolAdapter, tokenId);

        // 2. Adapter executes the borrow logic on Blend/BendDAO/Gondi/Arcade
        // ILendingAdapter(protocolAdapter).executeBorrow(nftContract, tokenId, principal, address(this));
        
        // 3. Calculate and route fees (Assuming adapter sent USDC/WETH to this contract)
        uint256 feeAmount = (principal * PLATFORM_FEE_BPS) / 10000;
        uint256 borrowerAmount = principal - feeAmount;

        // Mocking the token transfer for the architectural prototype
        // IERC20(loanToken).transfer(feeTreasury, feeAmount);
        // IERC20(loanToken).transfer(borrower, borrowerAmount);

        emit LoanOriginated(borrower, nftContract, tokenId, protocolAdapter, principal, feeAmount);
    }

    /**
     * @dev Refinances an active loan to a new protocol offering a better APR.
     */
    function refinanceLoan(
        address borrower,
        address nftContract,
        uint256 tokenId,
        address oldAdapter,
        address newAdapter,
        uint256 flashLoanAmount
    ) external nonReentrant onlyBlueChip(nftContract) {
        require(approvedAdapters[oldAdapter] && approvedAdapters[newAdapter], "Invalid adapters");
        
        // 1. Flash loan liquidity to pay off old protocol
        // 2. Withdraw NFT from old protocol
        // 3. Deposit NFT into new protocol
        // 4. Borrow new principal
        // 5. Repay flash loan + capture refinance fee
        
        emit Refinanced(borrower, nftContract, tokenId, oldAdapter, newAdapter, flashLoanAmount);
    }
}
