// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title USDC Paymaster for HALE Oracle
 * @notice Sponsors gas fees using USDC - no native currency needed
 * @dev Accepts USDC deposits and uses USDC to pay for oracle transaction gas
 *      On Arc network, USDC can be used directly for gas payments
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract USDCPaymaster {
    // Events
    event USDCDeposit(address indexed sponsor, uint256 amount);
    event USDCWithdrawal(address indexed sponsor, uint256 amount);
    event TransactionSponsored(
        address indexed oracle,
        address indexed target,
        bytes32 indexed txHash,
        uint256 gasUsed,
        uint256 usdcCost
    );
    event OracleAuthorized(address indexed oracle);
    event OracleRevoked(address indexed oracle);

    // State variables
    address public owner;
    address public usdcToken; // USDC token address
    
    // Mapping: sponsor => USDC balance
    mapping(address => uint256) public sponsorUSDCBalances;
    
    // Mapping: oracle => authorized
    mapping(address => bool) public authorizedOracles;
    
    // Mapping: transaction hash => sponsored (prevent double-spending)
    mapping(bytes32 => bool) public sponsoredTransactions;
    
    // Total USDC balance in paymaster
    uint256 public totalUSDCBalance;
    
    // Maximum gas per transaction
    uint256 public maxGasPerTransaction = 500000;
    
    // Gas price in USDC (6 decimals)
    // This represents the cost per gas unit in USDC
    // e.g., 1 = 0.000001 USDC per gas unit
    // For 100,000 gas at 1 USDC per gas: 100,000 * 1 = 0.1 USDC
    uint256 public gasPriceInUSDC = 1; // 0.000001 USDC per gas unit (adjustable)
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "USDCPaymaster: Only owner");
        _;
    }
    
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "USDCPaymaster: Oracle not authorized");
        _;
    }

    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
    }

    /**
     * @notice Deposit USDC to sponsor oracle transactions
     * @param amount Amount of USDC to deposit (in USDC units, 6 decimals)
     */
    function depositUSDC(uint256 amount) external {
        require(amount > 0, "USDCPaymaster: Deposit must be > 0");
        
        IERC20 usdc = IERC20(usdcToken);
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDCPaymaster: USDC transfer failed");
        
        sponsorUSDCBalances[msg.sender] += amount;
        totalUSDCBalance += amount;
        
        emit USDCDeposit(msg.sender, amount);
    }

    /**
     * @notice Withdraw USDC (only by sponsor)
     * @param amount Amount of USDC to withdraw
     */
    function withdrawUSDC(uint256 amount) external {
        require(sponsorUSDCBalances[msg.sender] >= amount, "USDCPaymaster: Insufficient USDC balance");
        require(totalUSDCBalance >= amount, "USDCPaymaster: Insufficient contract USDC balance");
        
        sponsorUSDCBalances[msg.sender] -= amount;
        totalUSDCBalance -= amount;
        
        IERC20 usdc = IERC20(usdcToken);
        require(usdc.transfer(msg.sender, amount), "USDCPaymaster: USDC withdrawal failed");
        
        emit USDCWithdrawal(msg.sender, amount);
    }

    /**
     * @notice Authorize an oracle address
     * @param oracle Oracle address to authorize
     */
    function authorizeOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "USDCPaymaster: Invalid oracle address");
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
        require(maxGas > 0, "USDCPaymaster: Invalid gas limit");
        maxGasPerTransaction = maxGas;
    }

    /**
     * @notice Set gas price in USDC
     * @param price Gas price in USDC (6 decimals, e.g., 1 = 0.000001 USDC per gas)
     */
    function setGasPriceInUSDC(uint256 price) external onlyOwner {
        require(price > 0, "USDCPaymaster: Invalid gas price");
        gasPriceInUSDC = price;
    }

    /**
     * @notice Sponsor a transaction for oracle using USDC
     * @dev Oracle calls this, paymaster pays for the actual transaction using USDC
     *      On Arc network, this can work with network-level USDC gas payments
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
        require(target != address(0), "USDCPaymaster: Invalid target");
        require(gasLimit <= maxGasPerTransaction, "USDCPaymaster: Gas limit exceeded");
        require(totalUSDCBalance > 0, "USDCPaymaster: Insufficient USDC balance");
        
        // Create transaction hash to prevent replay
        bytes32 txHash = keccak256(abi.encodePacked(
            msg.sender,
            target,
            data,
            gasLimit,
            block.number
        ));
        
        require(!sponsoredTransactions[txHash], "USDCPaymaster: Transaction already sponsored");
        sponsoredTransactions[txHash] = true;
        
        // Calculate USDC cost: gasLimit * gasPriceInUSDC
        // gasPriceInUSDC is in 6 decimals (USDC decimals)
        uint256 usdcCost = gasLimit * gasPriceInUSDC;
        
        require(totalUSDCBalance >= usdcCost, "USDCPaymaster: Insufficient USDC balance for transaction");
        
        // Execute the transaction
        // Note: On Arc network, if USDC can be used for gas, the network handles this
        // Otherwise, we need to convert USDC to native currency or use a relay
        (success, returnData) = target.call{value: 0, gas: gasLimit}(data);
        
        if (success) {
            // Deduct USDC cost from total balance
            // In production, you might want to track per-sponsor costs
            totalUSDCBalance -= usdcCost;
            
            emit TransactionSponsored(msg.sender, target, txHash, gasLimit, usdcCost);
        } else {
            // Revert the transaction hash marking on failure
            sponsoredTransactions[txHash] = false;
        }
        
        return (success, returnData);
    }

    /**
     * @notice Get sponsor USDC balance
     * @param sponsor Sponsor address
     * @return balance Sponsor's USDC balance
     */
    function getSponsorUSDCBalance(address sponsor) external view returns (uint256) {
        return sponsorUSDCBalances[sponsor];
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
     * @return usdcBalance Total USDC balance
     * @return maxGas Maximum gas per transaction
     * @return gasPrice Gas price in USDC
     * @return ownerAddress Owner address
     */
    function getPaymasterInfo() external view returns (
        uint256 usdcBalance,
        uint256 maxGas,
        uint256 gasPrice,
        address ownerAddress
    ) {
        return (totalUSDCBalance, maxGasPerTransaction, gasPriceInUSDC, owner);
    }

    /**
     * @notice Calculate USDC cost for a transaction
     * @param gasLimit Gas limit for the transaction
     * @return cost USDC cost (6 decimals)
     */
    function calculateUSDCost(uint256 gasLimit) external view returns (uint256) {
        return gasLimit * gasPriceInUSDC;
    }
}
