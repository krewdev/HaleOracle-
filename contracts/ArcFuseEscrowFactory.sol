// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ArcFuseEscrow.sol";

contract ArcFuseEscrowFactory {
    // The official HALE Oracle address that will be used for all created escrows
    address public oracleAddress;
    
    // Registry of all created escrows
    address[] public allEscrows;
    
    // Mapping from user to their created escrows
    mapping(address => address[]) public userEscrows;
    
    event EscrowCreated(address indexed escrowAddress, address indexed owner, uint256 timestamp);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    constructor(address _oracleAddress) {
        require(_oracleAddress != address(0), "Invalid oracle address");
        oracleAddress = _oracleAddress;
    }

    /**
     * @notice Create a new Escrow contract for the caller
     * @return The address of the newly created ArcFuseEscrow contract
     */
    function createEscrow() external returns (address) {
        // Deploy new escrow, passing the fixed Oracle address and the caller as the owner
        ArcFuseEscrow newEscrow = new ArcFuseEscrow(oracleAddress, msg.sender);
        
        address escrowAddr = address(newEscrow);
        
        allEscrows.push(escrowAddr);
        userEscrows[msg.sender].push(escrowAddr);
        
        emit EscrowCreated(escrowAddr, msg.sender, block.timestamp);
        
        return escrowAddr;
    }

    /**
     * @notice Get all escrows created by a specific user
     */
    function getUserEscrows(address user) external view returns (address[] memory) {
        return userEscrows[user];
    }
    
    /**
     * @notice Update the oracle address for future escrows (only if needed)
     * @dev Does not affect already deployed escrows
     */
    function updateOracle(address _newOracle) external {
        // Simple access control: strictly for the original oracle deployment logic or upgrading
        // For simplicity in this hackathon version, we allow updating owner if needed, 
        // but typically this would be restricted to an admin.
        // For now, we'll make it immutable or require the current oracle to update it?
        // Let's keep it simple: No update logic for now to avoid complexity, 
        // or add an 'owner' to the factory itself.
    }
}
