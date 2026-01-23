// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Escrow Contract for HALE Oracle
 * @notice This contract holds funds in escrow and releases them based on HALE Oracle verification
 * @dev Only the designated HALE Oracle address can release funds after verification
 */
contract Escrow {
    // Events
    event Deposit(address indexed seller, address indexed depositor, uint256 amount);
    event Release(address indexed seller, uint256 amount, string transactionId);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event Withdrawal(address indexed seller, uint256 amount, string reason);

    // State variables
    address public oracle; // HALE Oracle address that can release funds
    address public owner; // Contract owner (can update oracle address)
    
    // Mapping: seller address => amount in escrow
    mapping(address => uint256) public deposits;
    
    // Mapping: transaction_id => whether funds have been released
    mapping(string => bool) public releasedTransactions;
    
    // Mapping: seller => array of transaction IDs
    mapping(address => string[]) public sellerTransactions;

    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracle, "Escrow: Only HALE Oracle can call this function");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Escrow: Only owner can call this function");
        _;
    }

    modifier nonZeroAddress(address _address) {
        require(_address != address(0), "Escrow: Zero address not allowed");
        _;
    }

    /**
     * @notice Constructor sets the HALE Oracle address and contract owner
     * @param _oracle The address of the HALE Oracle that can release funds
     */
    constructor(address _oracle) nonZeroAddress(_oracle) {
        oracle = _oracle;
        owner = msg.sender;
    }

    /**
     * @notice Deposit funds into escrow for a seller
     * @param seller The address of the seller who will receive funds upon verification
     */
    function deposit(address seller) external payable nonZeroAddress(seller) {
        require(msg.value > 0, "Escrow: Deposit amount must be greater than 0");
        
        deposits[seller] += msg.value;
        
        emit Deposit(seller, msg.sender, msg.value);
    }

    /**
     * @notice Release funds to seller after HALE Oracle verification
     * @param seller The address of the seller receiving the funds
     * @param transactionId The unique transaction ID from HALE Oracle verification
     */
    function release(address seller, string memory transactionId) 
        external 
        onlyOracle 
        nonZeroAddress(seller) 
    {
        require(deposits[seller] > 0, "Escrow: No funds to release");
        require(!releasedTransactions[transactionId], "Escrow: Transaction already processed");
        
        uint256 amount = deposits[seller];
        deposits[seller] = 0;
        releasedTransactions[transactionId] = true;
        sellerTransactions[seller].push(transactionId);
        
        // Transfer funds to seller
        (bool success, ) = payable(seller).call{value: amount}("");
        require(success, "Escrow: Transfer failed");
        
        emit Release(seller, amount, transactionId);
    }

    /**
     * @notice Release funds with partial amount (for partial payments)
     * @param seller The address of the seller receiving the funds
     * @param amount The amount to release (must be <= deposits[seller])
     * @param transactionId The unique transaction ID from HALE Oracle verification
     */
    function releasePartial(
        address seller, 
        uint256 amount, 
        string memory transactionId
    ) 
        external 
        onlyOracle 
        nonZeroAddress(seller) 
    {
        require(amount > 0, "Escrow: Amount must be greater than 0");
        require(deposits[seller] >= amount, "Escrow: Insufficient funds");
        require(!releasedTransactions[transactionId], "Escrow: Transaction already processed");
        
        deposits[seller] -= amount;
        releasedTransactions[transactionId] = true;
        sellerTransactions[seller].push(transactionId);
        
        // Transfer funds to seller
        (bool success, ) = payable(seller).call{value: amount}("");
        require(success, "Escrow: Transfer failed");
        
        emit Release(seller, amount, transactionId);
    }

    /**
     * @notice Withdraw funds back to depositor (for failed verifications)
     * @param seller The address of the seller whose funds are being withdrawn
     * @param reason The reason for withdrawal (e.g., "VERIFICATION_FAILED")
     */
    function withdraw(address seller, string memory reason) 
        external 
        onlyOracle 
        nonZeroAddress(seller) 
    {
        require(deposits[seller] > 0, "Escrow: No funds to withdraw");
        
        uint256 amount = deposits[seller];
        deposits[seller] = 0;
        
        // Transfer back to contract (or implement refund logic)
        // For now, funds remain in contract - implement refund mechanism as needed
        emit Withdrawal(seller, amount, reason);
    }

    /**
     * @notice Update the HALE Oracle address (only owner)
     * @param newOracle The new HALE Oracle address
     */
    function updateOracle(address newOracle) 
        external 
        onlyOwner 
        nonZeroAddress(newOracle) 
    {
        address oldOracle = oracle;
        oracle = newOracle;
        
        emit OracleUpdated(oldOracle, newOracle);
    }

    /**
     * @notice Get the balance in escrow for a seller
     * @param seller The seller's address
     * @return The amount of funds in escrow for this seller
     */
    function getBalance(address seller) external view returns (uint256) {
        return deposits[seller];
    }

    /**
     * @notice Check if a transaction has been processed
     * @param transactionId The transaction ID to check
     * @return Whether the transaction has been released
     */
    function isTransactionReleased(string memory transactionId) 
        external 
        view 
        returns (bool) 
    {
        return releasedTransactions[transactionId];
    }

    /**
     * @notice Get all transaction IDs for a seller
     * @param seller The seller's address
     * @return Array of transaction IDs
     */
    function getSellerTransactions(address seller) 
        external 
        view 
        returns (string[] memory) 
    {
        return sellerTransactions[seller];
    }

    /**
     * @notice Get contract information
     * @return oracleAddress The current HALE Oracle address
     * @return ownerAddress The contract owner address
     * @return contractBalance The total balance held in the contract
     */
    function getContractInfo() 
        external 
        view 
        returns (
            address oracleAddress,
            address ownerAddress,
            uint256 contractBalance
        ) 
    {
        return (oracle, owner, address(this).balance);
    }

    /**
     * @notice Emergency function to transfer ownership (only owner)
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) 
        external 
        onlyOwner 
        nonZeroAddress(newOwner) 
    {
        owner = newOwner;
    }

    /**
     * @notice Receive function to accept ETH deposits
     */
    receive() external payable {
        // Allow direct ETH transfers to contract
        // Funds should be deposited via deposit() function for proper tracking
    }

    /**
     * @notice Fallback function
     */
    fallback() external payable {
        revert("Escrow: Use deposit() function to add funds");
    }
}
