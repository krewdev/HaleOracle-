// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcFuseEscrow
 * @dev Optimized Escrow for Web3 development services with Oracle (Gemini) arbitration.
 */
contract ArcFuseEscrow {
    // Events
    event Deposit(address indexed seller, address indexed depositor, uint256 amount);
    event Release(address indexed seller, uint256 amount, bytes32 indexed transactionId);
    event Withdrawal(address indexed depositor, uint256 amount, string reason);
    event ContractRequirementsSet(address indexed seller, string requirements, string sellerContact);
    event DeliverySubmitted(address indexed seller, string deliveryHash, uint256 timestamp);

    address public oracle;
    address public owner;

    uint256 public constant MAX_DEPOSITORS = 3;
    bool private _locked; // Simple reentrancy guard

    struct DepositorInfo {
        address depositor;
        uint256 amount;
    }

    struct ContractDetails {
        string requirements;
        string sellerContact;
        string deliveryHash;
        uint256 deliveryTime;
        bool delivered;
    }

    // Mapping: seller => current total escrow balance
    mapping(address => uint256) public deposits;

    // Mapping: seller => array of depositors
    mapping(address => DepositorInfo[]) public depositorList;

    // Mapping: seller => count of unique depositors
    mapping(address => uint256) public depositorCount;

    // seller => (depositor => exists)
    mapping(address => mapping(address => bool)) public isExistingDepositor;

    // Mapping: seller => contract details
    mapping(address => ContractDetails) public contractDetails;

    // Unique Release ID => Processed Status
    mapping(bytes32 => bool) public releasedTransactions;

    modifier onlyOracle() {
        require(msg.sender == oracle, "Auth: Only Oracle");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Security: Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address _oracle, address _owner) {
        oracle = _oracle;
        owner = _owner;
    }

    /**
     * @dev Buyers deposit funds.
     */
    function deposit(address seller) external payable nonReentrant {
        require(msg.value > 0, "Amount: Must be > 0");
        require(seller != address(0), "Address: Invalid seller");
        require(seller != msg.sender, "Auth: Seller cannot self-deposit");

        deposits[seller] += msg.value;

        if (isExistingDepositor[seller][msg.sender]) {
            for (uint256 i = 0; i < depositorList[seller].length; i++) {
                if (depositorList[seller][i].depositor == msg.sender) {
                    depositorList[seller][i].amount += msg.value;
                    break;
                }
            }
        } else {
            require(depositorCount[seller] < MAX_DEPOSITORS, "Limit: Max 3 depositors reached");

            depositorList[seller].push(DepositorInfo({
                depositor: msg.sender,
                amount: msg.value
            }));

            isExistingDepositor[seller][msg.sender] = true;
            depositorCount[seller]++;
        }

        emit Deposit(seller, msg.sender, msg.value);
    }

    /**
     * @dev Set contract requirements and seller contact (called by buyer during/after deposit)
     */
    function setContractRequirements(
        address seller,
        string calldata requirements,
        string calldata sellerContact
    ) external nonReentrant {
        require(bytes(requirements).length > 0, "Requirements: Cannot be empty");
        require(deposits[seller] > 0, "State: No deposit exists");

        require(isExistingDepositor[seller][msg.sender], "Auth: Only depositors");

        contractDetails[seller].requirements = requirements;
        contractDetails[seller].sellerContact = sellerContact;

        emit ContractRequirementsSet(seller, requirements, sellerContact);
    }

    /**
     * @dev Seller submits delivery (code hash or IPFS hash)
     */
    function submitDelivery(string calldata deliveryHash) external nonReentrant {
        require(bytes(deliveryHash).length > 0, "Delivery: Hash cannot be empty");
        require(deposits[msg.sender] > 0, "State: No escrow exists");
        require(!contractDetails[msg.sender].delivered, "State: Already delivered");
        require(bytes(contractDetails[msg.sender].requirements).length > 0, "State: Requirements not set");

        contractDetails[msg.sender].deliveryHash = deliveryHash;
        contractDetails[msg.sender].deliveryTime = block.timestamp;
        contractDetails[msg.sender].delivered = true;

        emit DeliverySubmitted(msg.sender, deliveryHash, block.timestamp);
    }

    /**
     * @dev Release funds to seller.
     */
    function release(address seller, bytes32 transactionId) external onlyOracle nonReentrant {
        uint256 amount = deposits[seller];
        require(amount > 0, "State: No funds to release");
        require(!releasedTransactions[transactionId], "State: Transaction ID already used");

        deposits[seller] = 0;
        releasedTransactions[transactionId] = true;

        _clearSellerData(seller);

        (bool success, ) = payable(seller).call{value: amount}("");
        require(success, "Transfer: Failed to send funds");

        emit Release(seller, amount, transactionId);
    }

    /**
     * @dev Refund buyers proportionally if Oracle rejects delivery.
     */
    function refund(address seller, string calldata reason) external onlyOracle nonReentrant {
        uint256 totalToRefund = deposits[seller];
        require(totalToRefund > 0, "State: No funds to refund");

        DepositorInfo[] memory depositors = depositorList[seller];

        deposits[seller] = 0;
        _clearSellerData(seller);

        for (uint256 i = 0; i < depositors.length; i++) {
            uint256 amount = depositors[i].amount;
            if (amount > 0) {
                (bool success, ) = payable(depositors[i].depositor).call{value: amount}("");
                if (success) {
                    emit Withdrawal(depositors[i].depositor, amount, reason);
                }
            }
        }
    }

    function _clearSellerData(address seller) internal {
        for (uint256 i = 0; i < depositorList[seller].length; i++) {
            isExistingDepositor[seller][depositorList[seller][i].depositor] = false;
        }
        delete depositorList[seller];
        depositorCount[seller] = 0;
        delete contractDetails[seller];
    }

    function getDepositors(address seller) external view returns (DepositorInfo[] memory) {
        return depositorList[seller];
    }

    function getDepositorCount(address seller) external view returns (uint256) {
        return depositorCount[seller];
    }
}
