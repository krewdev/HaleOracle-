// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Relay Paymaster for HALE Oracle
 * @notice Alternative paymaster that uses a relay pattern
 * @dev Relayer executes transactions on behalf of oracle and gets reimbursed
 */
contract RelayPaymaster {
    // Events
    event Deposit(address indexed sponsor, uint256 amount);
    event Withdrawal(address indexed sponsor, uint256 amount);
    event TransactionRelayed(
        address indexed relayer,
        address indexed oracle,
        address indexed target,
        bytes32 txHash,
        uint256 gasUsed,
        uint256 reimbursement
    );
    event OracleAuthorized(address indexed oracle);
    event RelayerAuthorized(address indexed relayer);

    // State variables
    address public owner;
    
    // Mapping: sponsor => balance
    mapping(address => uint256) public sponsorBalances;
    
    // Mapping: oracle => authorized
    mapping(address => bool) public authorizedOracles;
    
    // Mapping: relayer => authorized
    mapping(address => bool) public authorizedRelayers;
    
    // Mapping: transaction hash => relayed (prevent double-spending)
    mapping(bytes32 => bool) public relayedTransactions;
    
    // Total balance
    uint256 public totalBalance;
    
    // Relayer fee (in basis points, e.g., 100 = 1%)
    uint256 public relayerFeeBps = 100; // 1% fee
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "RelayPaymaster: Only owner");
        _;
    }
    
    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender], "RelayPaymaster: Relayer not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Deposit funds to sponsor oracle transactions
     */
    function deposit() external payable {
        require(msg.value > 0, "RelayPaymaster: Deposit must be > 0");
        
        sponsorBalances[msg.sender] += msg.value;
        totalBalance += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw sponsored funds
     */
    function withdraw(uint256 amount) external {
        require(sponsorBalances[msg.sender] >= amount, "RelayPaymaster: Insufficient balance");
        require(totalBalance >= amount, "RelayPaymaster: Insufficient contract balance");
        
        sponsorBalances[msg.sender] -= amount;
        totalBalance -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "RelayPaymaster: Withdrawal failed");
        
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Authorize an oracle address
     */
    function authorizeOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "RelayPaymaster: Invalid oracle address");
        authorizedOracles[oracle] = true;
        emit OracleAuthorized(oracle);
    }

    /**
     * @notice Authorize a relayer address
     */
    function authorizeRelayer(address relayer) external onlyOwner {
        require(relayer != address(0), "RelayPaymaster: Invalid relayer address");
        authorizedRelayers[relayer] = true;
        emit RelayerAuthorized(relayer);
    }

    /**
     * @notice Relay a transaction on behalf of oracle
     * @dev Relayer executes transaction and gets reimbursed + fee
     * @param oracle Oracle address (must be authorized)
     * @param target Target contract address
     * @param data Transaction data
     * @param gasLimit Gas limit for the transaction
     * @return success Whether the transaction succeeded
     * @return returnData Return data from the transaction
     */
    function relayTransaction(
        address oracle,
        address target,
        bytes calldata data,
        uint256 gasLimit
    ) external onlyAuthorizedRelayer returns (bool success, bytes memory returnData) {
        require(authorizedOracles[oracle], "RelayPaymaster: Oracle not authorized");
        require(target != address(0), "RelayPaymaster: Invalid target");
        require(totalBalance > 0, "RelayPaymaster: Insufficient balance");
        
        // Create transaction hash
        bytes32 txHash = keccak256(abi.encodePacked(
            oracle,
            target,
            data,
            gasLimit,
            block.number,
            msg.sender
        ));
        
        require(!relayedTransactions[txHash], "RelayPaymaster: Transaction already relayed");
        relayedTransactions[txHash] = true;
        
        // Record gas before transaction
        uint256 gasBefore = gasleft();
        
        // Execute the transaction
        (success, returnData) = target.call{value: 0, gas: gasLimit}(data);
        
        // Calculate gas used
        uint256 gasUsed = gasBefore - gasleft();
        uint256 gasCost = gasUsed * tx.gasprice;
        
        // Calculate relayer fee
        uint256 relayerFee = (gasCost * relayerFeeBps) / 10000;
        uint256 totalReimbursement = gasCost + relayerFee;
        
        require(totalBalance >= totalReimbursement, "RelayPaymaster: Insufficient balance for reimbursement");
        
        // Reimburse relayer
        totalBalance -= totalReimbursement;
        (bool reimburseSuccess, ) = payable(msg.sender).call{value: totalReimbursement}("");
        require(reimburseSuccess, "RelayPaymaster: Reimbursement failed");
        
        emit TransactionRelayed(msg.sender, oracle, target, txHash, gasUsed, totalReimbursement);
        
        return (success, returnData);
    }

    /**
     * @notice Set relayer fee
     * @param feeBps Fee in basis points (10000 = 100%)
     */
    function setRelayerFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 10000, "RelayPaymaster: Fee too high");
        relayerFeeBps = feeBps;
    }

    /**
     * @notice Get paymaster info
     */
    function getPaymasterInfo() external view returns (
        uint256 balance,
        uint256 feeBps,
        address ownerAddress
    ) {
        return (totalBalance, relayerFeeBps, owner);
    }
}
