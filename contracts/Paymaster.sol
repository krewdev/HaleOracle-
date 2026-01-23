// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Paymaster for HALE Oracle
 * @notice Sponsors gas fees for oracle transactions
 * @dev Allows oracle to execute transactions without holding native currency
 */
contract Paymaster {
    // Events
    event Deposit(address indexed sponsor, uint256 amount);
    event Withdrawal(address indexed sponsor, uint256 amount);
    event TransactionSponsored(
        address indexed oracle,
        address indexed target,
        bytes32 indexed txHash,
        uint256 gasUsed
    );
    event OracleAuthorized(address indexed oracle);
    event OracleRevoked(address indexed oracle);

    // State variables
    address public owner;
    
    // Mapping: sponsor => balance
    mapping(address => uint256) public sponsorBalances;
    
    // Mapping: oracle => authorized
    mapping(address => bool) public authorizedOracles;
    
    // Mapping: transaction hash => sponsored (prevent double-spending)
    mapping(bytes32 => bool) public sponsoredTransactions;
    
    // Total balance in paymaster
    uint256 public totalBalance;
    
    // Maximum gas per transaction
    uint256 public maxGasPerTransaction = 500000;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Paymaster: Only owner");
        _;
    }
    
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "Paymaster: Oracle not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Deposit funds to sponsor oracle transactions
     * @dev Anyone can deposit to sponsor oracle operations
     */
    function deposit() external payable {
        require(msg.value > 0, "Paymaster: Deposit must be > 0");
        
        sponsorBalances[msg.sender] += msg.value;
        totalBalance += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw sponsored funds (only by sponsor)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        require(sponsorBalances[msg.sender] >= amount, "Paymaster: Insufficient balance");
        require(totalBalance >= amount, "Paymaster: Insufficient contract balance");
        
        sponsorBalances[msg.sender] -= amount;
        totalBalance -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Paymaster: Withdrawal failed");
        
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Authorize an oracle address
     * @param oracle Oracle address to authorize
     */
    function authorizeOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Paymaster: Invalid oracle address");
        authorizedOracles[oracle] = true;
        emit OracleAuthorized(oracle);
    }

    /**
     * @notice Revoke oracle authorization
     * @param oracle Oracle address to revoke
     */
    function revokeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = false;
        emit OracleRevoked(oracle);
    }

    /**
     * @notice Set maximum gas per transaction
     * @param maxGas New maximum gas limit
     */
    function setMaxGasPerTransaction(uint256 maxGas) external onlyOwner {
        require(maxGas > 0, "Paymaster: Invalid gas limit");
        maxGasPerTransaction = maxGas;
    }

    /**
     * @notice Sponsor a transaction for oracle
     * @dev Oracle calls this, paymaster pays for the actual transaction
     * @param target Target contract address
     * @param data Transaction data
     * @param gasLimit Gas limit for the transaction
     * @return success Whether the transaction succeeded
     * @return returnData Return data from the transaction
     */
    function sponsorTransaction(
        address target,
        bytes calldata data,
        uint256 gasLimit
    ) external onlyAuthorizedOracle returns (bool success, bytes memory returnData) {
        require(target != address(0), "Paymaster: Invalid target");
        require(gasLimit <= maxGasPerTransaction, "Paymaster: Gas limit exceeded");
        require(totalBalance > 0, "Paymaster: Insufficient balance");
        
        // Create transaction hash to prevent replay
        bytes32 txHash = keccak256(abi.encodePacked(
            msg.sender,
            target,
            data,
            gasLimit,
            block.number
        ));
        
        require(!sponsoredTransactions[txHash], "Paymaster: Transaction already sponsored");
        sponsoredTransactions[txHash] = true;
        
        // Estimate gas cost (simplified - in production, use actual gas price)
        uint256 gasCost = gasLimit * tx.gasprice;
        require(totalBalance >= gasCost, "Paymaster: Insufficient balance for gas");
        
        // Execute the transaction
        (success, returnData) = target.call{value: 0, gas: gasLimit}(data);
        
        if (success) {
            // Deduct gas cost from total balance
            // In production, you might want to track per-sponsor costs
            totalBalance -= gasCost;
            
            emit TransactionSponsored(msg.sender, target, txHash, gasLimit);
        }
        
        return (success, returnData);
    }

    /**
     * @notice Get sponsor balance
     * @param sponsor Sponsor address
     * @return balance Sponsor's balance
     */
    function getSponsorBalance(address sponsor) external view returns (uint256) {
        return sponsorBalances[sponsor];
    }

    /**
     * @notice Check if oracle is authorized
     * @param oracle Oracle address
     * @return authorized Whether oracle is authorized
     */
    function isOracleAuthorized(address oracle) external view returns (bool) {
        return authorizedOracles[oracle];
    }

    /**
     * @notice Get paymaster info
     * @return balance Total balance
     * @return maxGas Maximum gas per transaction
     * @return ownerAddress Owner address
     */
    function getPaymasterInfo() external view returns (
        uint256 balance,
        uint256 maxGas,
        address ownerAddress
    ) {
        return (totalBalance, maxGasPerTransaction, owner);
    }
}
