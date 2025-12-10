// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC8004Token
 * @dev Advanced token with conditional and time-locked transfers
 * 
 * ERC8004 Extensions:
 * - Conditional transfers (execute only if condition met)
 * - Time-locked transfers (scheduled payouts)
 * - Batch operations (gas-efficient multi-transfers)
 * 
 * Built for Avalanche Hackathon
 */
contract ERC8004Token is ERC20, Ownable {
    struct ScheduledTransfer {
        address to;
        uint256 amount;
        uint256 unlockTime;
        bool executed;
        bytes condition;
    }
    
    mapping(uint256 => ScheduledTransfer) public scheduledTransfers;
    mapping(address => uint256[]) public userScheduledTransfers;
    uint256 public transferCount;
    
    // Authorized contracts that can do conditional transfers
    mapping(address => bool) public authorizedContracts;
    
    event ConditionalTransfer(address indexed from, address indexed to, uint256 amount, bytes condition);
    event TransferScheduled(uint256 indexed transferId, address indexed to, uint256 amount, uint256 unlockTime);
    event ScheduledTransferExecuted(uint256 indexed transferId, address indexed to, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Authorize contract to perform conditional transfers
     */
    function authorizeContract(address contractAddr, bool status) external onlyOwner {
        authorizedContracts[contractAddr] = status;
    }
    
    /**
     * @dev Conditional transfer - only executes if condition is met
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param condition Encoded condition data
     */
    function conditionalTransfer(
        address to,
        uint256 amount,
        bytes memory condition
    ) external returns (bool) {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner(),
            "Not authorized for conditional transfers"
        );
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        
        // For demo purposes, we validate condition and execute immediately
        // In production, this would check against an oracle or state
        bool conditionMet = _validateCondition(condition);
        
        if (conditionMet) {
            _transfer(owner(), to, amount);
            emit ConditionalTransfer(owner(), to, amount, condition);
            return true;
        }
        
        return false;
    }
    
    /**
     * @dev Schedule a future transfer (time-locked)
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param unlockTime When transfer can be executed
     */
    function scheduleTransfer(
        address to,
        uint256 amount,
        uint256 unlockTime
    ) external returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Lock tokens by transferring to this contract
        _transfer(msg.sender, address(this), amount);
        
        transferCount++;
        uint256 transferId = transferCount;
        
        ScheduledTransfer storage transfer = scheduledTransfers[transferId];
        transfer.to = to;
        transfer.amount = amount;
        transfer.unlockTime = unlockTime;
        transfer.executed = false;
        
        userScheduledTransfers[msg.sender].push(transferId);
        
        emit TransferScheduled(transferId, to, amount, unlockTime);
        
        return transferId;
    }
    
    /**
     * @dev Execute a scheduled transfer after unlock time
     * @param transferId ID of scheduled transfer
     */
    function executeScheduledTransfer(uint256 transferId) external {
        ScheduledTransfer storage transfer = scheduledTransfers[transferId];
        
        require(!transfer.executed, "Already executed");
        require(block.timestamp >= transfer.unlockTime, "Still locked");
        require(transfer.amount > 0, "Invalid transfer");
        
        transfer.executed = true;
        
        _transfer(address(this), transfer.to, transfer.amount);
        
        emit ScheduledTransferExecuted(transferId, transfer.to, transfer.amount);
    }
    
    /**
     * @dev Batch transfer (gas-efficient)
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bool) {
        require(recipients.length == amounts.length, "Array length mismatch");
        require(recipients.length <= 100, "Too many recipients");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
        
        return true;
    }
    
    /**
     * @dev Validate condition for conditional transfer
     * Internal function - in production would check against oracle/state
     */
    function _validateCondition(bytes memory condition) internal pure returns (bool) {
        // Decode condition
        (string memory conditionType, , ) = abi.decode(condition, (string, uint256, uint256));
        
        // For demo, accept "market_settled" conditions
        // In production, verify against oracle data
        if (keccak256(bytes(conditionType)) == keccak256(bytes("market_settled"))) {
            return true;
        }
        
        return false;
    }
    
    /**
     * @dev Get scheduled transfer details
     */
    function getScheduledTransfer(uint256 transferId) external view returns (
        address to,
        uint256 amount,
        uint256 unlockTime,
        bool executed
    ) {
        ScheduledTransfer storage transfer = scheduledTransfers[transferId];
        return (transfer.to, transfer.amount, transfer.unlockTime, transfer.executed);
    }
    
    /**
     * @dev Mint tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}









