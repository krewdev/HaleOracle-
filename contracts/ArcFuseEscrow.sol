// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArcFuseEscrow {
    // Events
    event Deposit(address indexed seller, address indexed depositor, uint256 amount);
    event Release(address indexed seller, uint256 amount, string transactionId);
    event Withdrawal(address indexed depositor, uint256 amount, string reason);

    address public oracle; 
    address public owner; 
    
    // Maximum number of depositors per seller
    uint256 public constant MAX_DEPOSITORS = 3;
    
    // Struct to track depositor information
    struct DepositorInfo {
        address depositor;
        uint256 amount;
    }
    
    // Mapping: seller => amount in escrow
    mapping(address => uint256) public deposits;
    
    // Mapping: seller => array of depositors (max 3)
    mapping(address => DepositorInfo[]) public depositorList;
    
    // Mapping: seller => number of depositors
    mapping(address => uint256) public depositorCount;
    
    mapping(string => bool) public releasedTransactions;

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only Oracle can call");
        _;
    }

    constructor(address _oracle) {
        oracle = _oracle;
        owner = msg.sender;
    }

    // 1. Buyer deposits funds for a specific seller (up to 3 buyers per seller)
    function deposit(address seller) external payable {
        require(msg.value > 0, "Deposit must be > 0");
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Seller cannot deposit for themselves");
        require(depositorCount[seller] < MAX_DEPOSITORS, "Maximum depositors reached");
        
        deposits[seller] += msg.value;
        
        // Check if this depositor already exists for this seller
        bool depositorExists = false;
        for (uint256 i = 0; i < depositorList[seller].length; i++) {
            if (depositorList[seller][i].depositor == msg.sender) {
                depositorList[seller][i].amount += msg.value;
                depositorExists = true;
                break;
            }
        }
        
        // If new depositor, add to list
        if (!depositorExists) {
            depositorList[seller].push(DepositorInfo({
                depositor: msg.sender,
                amount: msg.value
            }));
            depositorCount[seller]++;
        }
        
        emit Deposit(seller, msg.sender, msg.value);
    }

    // 2. Oracle (Gemini) approves -> Funds go to Seller
    function release(address seller, string memory transactionId) external onlyOracle {
        require(deposits[seller] > 0, "No funds");
        require(!releasedTransactions[transactionId], "Tx already processed");
        
        uint256 amount = deposits[seller];
        deposits[seller] = 0;
        
        // Clear depositor list
        delete depositorList[seller];
        depositorCount[seller] = 0;
        
        releasedTransactions[transactionId] = true;
        
        (bool success, ) = payable(seller).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Release(seller, amount, transactionId);
    }

    // 3. Oracle (Gemini) rejects -> Funds go back to Depositors (Buyers) proportionally
    function refund(address seller, string memory reason) external onlyOracle {
        require(deposits[seller] > 0, "No funds");
        require(depositorList[seller].length > 0, "No depositors found");

        deposits[seller] = 0;
        
        // Refund each depositor their proportional amount
        DepositorInfo[] memory depositors = depositorList[seller];
        for (uint256 i = 0; i < depositors.length; i++) {
            uint256 refundAmount = depositors[i].amount;
            if (refundAmount > 0) {
                (bool success, ) = payable(depositors[i].depositor).call{value: refundAmount}("");
                require(success, "Refund failed");
                
                emit Withdrawal(depositors[i].depositor, refundAmount, reason);
            }
        }
        
        // Clear depositor list
        delete depositorList[seller];
        depositorCount[seller] = 0;
    }
    
    // View function to get depositor information for a seller
    function getDepositors(address seller) external view returns (DepositorInfo[] memory) {
        return depositorList[seller];
    }
    
    // View function to get depositor count for a seller
    function getDepositorCount(address seller) external view returns (uint256) {
        return depositorCount[seller];
    }
}