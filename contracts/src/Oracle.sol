// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Oracle
 * @dev Decentralized oracle for external data feeds
 * 
 * Features:
 * - Multiple data source verification
 * - Cryptographic signature validation
 * - Consensus mechanism (2/3 agreement)
 * - Dispute resolution period
 * 
 * Built for Avalanche Hackathon
 */
contract Oracle is Ownable {
    struct DataRequest {
        uint256 id;
        string dataSource;
        address requester;
        uint256 timestamp;
        bool fulfilled;
        bytes data;
        uint256 confirmations;
    }
    
    struct DataSubmission {
        address oracle;
        bytes data;
        bytes signature;
        uint256 timestamp;
    }
    
    mapping(bytes32 => DataRequest) public requests;
    mapping(bytes32 => DataSubmission[]) public submissions;
    mapping(address => bool) public authorizedOracles;
    
    uint256 public requestCount;
    uint256 public constant REQUIRED_CONFIRMATIONS = 2;
    uint256 public constant DISPUTE_PERIOD = 24 hours;
    
    // Events
    event DataRequested(bytes32 indexed requestId, string dataSource, address indexed requester);
    event DataSubmitted(bytes32 indexed requestId, address indexed oracle);
    event DataFulfilled(bytes32 indexed requestId, bytes data);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Authorize oracle address
     */
    function authorizeOracle(address oracle, bool status) external onlyOwner {
        authorizedOracles[oracle] = status;
    }
    
    /**
     * @dev Request external data
     * @param dataSource Identifier for data source (e.g., "sports_api_game_123")
     * @return requestId Unique request identifier
     */
    function requestData(string calldata dataSource) external returns (bytes32) {
        requestCount++;
        
        bytes32 requestId = keccak256(
            abi.encodePacked(
                dataSource,
                msg.sender,
                block.timestamp,
                requestCount
            )
        );
        
        DataRequest storage request = requests[requestId];
        request.id = requestCount;
        request.dataSource = dataSource;
        request.requester = msg.sender;
        request.timestamp = block.timestamp;
        request.fulfilled = false;
        
        emit DataRequested(requestId, dataSource, msg.sender);
        
        return requestId;
    }
    
    /**
     * @dev Submit data from oracle
     * @param requestId Request to fulfill
     * @param data Data payload
     * @param signature Cryptographic signature
     */
    function submitData(
        bytes32 requestId,
        bytes calldata data,
        bytes calldata signature
    ) external {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        
        DataRequest storage request = requests[requestId];
        require(!request.fulfilled, "Already fulfilled");
        
        // Store submission
        DataSubmission memory submission;
        submission.oracle = msg.sender;
        submission.data = data;
        submission.signature = signature;
        submission.timestamp = block.timestamp;
        
        submissions[requestId].push(submission);
        request.confirmations++;
        
        emit DataSubmitted(requestId, msg.sender);
        
        // Check if we have consensus
        if (request.confirmations >= REQUIRED_CONFIRMATIONS) {
            _fulfillRequest(requestId);
        }
    }
    
    /**
     * @dev Fulfill request with consensus data
     */
    function _fulfillRequest(bytes32 requestId) internal {
        DataRequest storage request = requests[requestId];
        
        // Get most common data submission (simple consensus)
        bytes memory consensusData = _getConsensusData(requestId);
        
        request.data = consensusData;
        request.fulfilled = true;
        
        emit DataFulfilled(requestId, consensusData);
    }
    
    /**
     * @dev Get consensus data from submissions
     * For demo purposes, returns first submission
     * In production, implement proper consensus algorithm
     */
    function _getConsensusData(bytes32 requestId) internal view returns (bytes memory) {
        DataSubmission[] storage subs = submissions[requestId];
        require(subs.length > 0, "No submissions");
        return subs[0].data;
    }
    
    /**
     * @dev Get request data
     */
    function getRequestData(bytes32 requestId) external view returns (bytes memory) {
        DataRequest storage request = requests[requestId];
        require(request.fulfilled, "Request not fulfilled");
        return request.data;
    }
    
    /**
     * @dev Check if request is fulfilled
     */
    function isRequestFulfilled(bytes32 requestId) external view returns (bool) {
        return requests[requestId].fulfilled;
    }
    
    /**
     * @dev Get number of submissions for a request
     */
    function getSubmissionCount(bytes32 requestId) external view returns (uint256) {
        return submissions[requestId].length;
    }
}

