// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./X402Payment.sol";
import "./ERC8004Token.sol";

/**
 * @title PredictionMarket
 * @dev Core prediction market contract with x402 payment integration
 * 
 * Built for Avalanche - Simplified Admin Settlement
 * 
 * Payment Flow:
 * 1. Users bet in AVAX via placeBet() with msg.value
 * 2. AVAX goes through X402Payment for streaming
 * 3. X402 transfers AVAX to this contract
 * 4. Contract holds AVAX until market settles
 * 5. Winners claim payouts in AVAX via claimPayout()
 * 
 * Note: ERC8004Token is used for advanced features (scheduled transfers)
 *       but NOT for betting/payouts which are purely in AVAX
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    X402Payment public x402Payment;
    ERC8004Token public token;
    
    uint256 public marketCount;
    uint256 public constant PLATFORM_FEE = 250; // 2.5% (basis points)
    uint256 public constant BASIS_POINTS = 10000;
    
    enum MarketStatus { Open, Closed, Settled }
    
    struct Market {
        uint256 id;
        string question;
        string[] options;
        uint256[] optionBets;
        uint256[] optionVolumes;
        uint256 totalVolume;
        uint256 closeTime;
        uint256 settleTime;
        MarketStatus status;
        uint256 winningOption;
        address creator;
        bool exists;
    }
    
    struct Position {
        uint256 marketId;
        uint256 optionId;
        bool isYes;
        uint256 stake;
        uint256 probabilityAtBet; // Scaled by 10000 (e.g., 5000 = 50%)
        address bettor;
        bool settled;
        uint256 payout;
    }
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositions;
    
    uint256 public positionCount;
    
    // Events
    event MarketCreated(uint256 indexed marketId, string question, uint256 closeTime);
    event BetPlaced(uint256 indexed marketId, uint256 indexed positionId, address indexed bettor, uint256 optionId, bool isYes, uint256 stake);
    event MarketSettled(uint256 indexed marketId, uint256 winningOption);
    event PayoutClaimed(uint256 indexed positionId, address indexed bettor, uint256 payout);
    
    constructor(address _x402Payment, address _token) Ownable(msg.sender) {
        x402Payment = X402Payment(_x402Payment);
        token = ERC8004Token(_token);
    }
    
    /**
     * @dev Create a new prediction market
     */
    function createMarket(
        string calldata question,
        string[] calldata options,
        uint256 closeTime
    ) external returns (uint256) {
        require(closeTime > block.timestamp, "Close time must be in future");
        require(options.length >= 2, "Must have at least 2 options");
        require(options.length <= 10, "Maximum 10 options");
        
        marketCount++;
        uint256 marketId = marketCount;
        
        Market storage market = markets[marketId];
        market.id = marketId;
        market.question = question;
        
        // Manually copy calldata array to storage
        for (uint256 i = 0; i < options.length; i++) {
            market.options.push(options[i]);
        }
        market.optionBets = new uint256[](options.length);
        market.optionVolumes = new uint256[](options.length);
        market.totalVolume = 0;
        market.closeTime = closeTime;
        market.status = MarketStatus.Open;
        market.creator = msg.sender;
        market.exists = true;
        
        emit MarketCreated(marketId, question, closeTime);
        
        return marketId;
    }
    
    /**
     * @dev Place a bet using x402 payment
     */
    function placeBet(
        uint256 marketId,
        uint256 optionId,
        bool isYes,
        uint256 amount
    ) external payable nonReentrant returns (uint256) {
        Market storage market = markets[marketId];
        
        require(market.exists, "Market does not exist");
        require(market.status == MarketStatus.Open, "Market not open");
        require(block.timestamp < market.closeTime, "Market closed");
        require(optionId < market.options.length, "Invalid option");
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value >= amount, "Insufficient payment");
        
        // Calculate current probability
        uint256 optionVolume = market.optionVolumes[optionId];
        uint256 probability = market.totalVolume == 0 
            ? 5000 // 50% if no bets yet
            : (optionVolume * BASIS_POINTS) / market.totalVolume;
        
        // Initiate x402 payment
        bytes memory metadata = abi.encode(marketId, optionId, isYes, msg.sender);
        x402Payment.initiatePayment{value: amount}(
            address(this),
            amount,
            metadata
        );
        
        // Create position
        positionCount++;
        uint256 positionId = positionCount;
        
        Position storage position = positions[positionId];
        position.marketId = marketId;
        position.optionId = optionId;
        position.isYes = isYes;
        position.stake = amount;
        position.probabilityAtBet = probability;
        position.bettor = msg.sender;
        position.settled = false;
        
        // Update market volumes
        market.optionVolumes[optionId] += amount;
        market.totalVolume += amount;
        market.optionBets[optionId]++;
        
        // Track user positions
        userPositions[msg.sender].push(positionId);
        
        emit BetPlaced(marketId, positionId, msg.sender, optionId, isYes, amount);
        
        return positionId;
    }
    
    /**
     * @dev Settle market (admin only)
     */
    function settleMarket(
        uint256 marketId,
        uint256 winningOption
    ) external onlyOwner {
        Market storage market = markets[marketId];
        
        require(market.exists, "Market does not exist");
        require(market.status == MarketStatus.Closed || block.timestamp >= market.closeTime, "Market not ready to settle");
        require(winningOption < market.options.length, "Invalid winning option");
        
        market.status = MarketStatus.Settled;
        market.winningOption = winningOption;
        market.settleTime = block.timestamp;
        
        emit MarketSettled(marketId, winningOption);
    }
    
    /**
     * @dev Close market (stop accepting bets)
     */
    function closeMarket(uint256 marketId) external {
        Market storage market = markets[marketId];
        
        require(market.exists, "Market does not exist");
        require(market.status == MarketStatus.Open, "Market already closed");
        require(
            block.timestamp >= market.closeTime || msg.sender == owner(),
            "Not authorized or time not reached"
        );
        
        market.status = MarketStatus.Closed;
    }
    
    /**
     * @dev Claim payout for winning position
     */
    function claimPayout(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        Market storage market = markets[position.marketId];
        
        require(position.bettor == msg.sender, "Not position owner");
        require(!position.settled, "Already settled");
        require(market.status == MarketStatus.Settled, "Market not settled");
        
        // Calculate payout
        uint256 payout = calculatePayout(positionId);
        position.settled = true;
        position.payout = payout;
        
        if (payout > 0) {
            // Pay winner in AVAX (same currency they bet with)
            (bool success, ) = position.bettor.call{value: payout}("");
            require(success, "Payout transfer failed");
            
            emit PayoutClaimed(positionId, position.bettor, payout);
        }
    }
    
    /**
     * @dev Calculate payout for a position
     */
    function calculatePayout(uint256 positionId) public view returns (uint256) {
        Position storage position = positions[positionId];
        Market storage market = markets[position.marketId];
        
        require(market.status == MarketStatus.Settled, "Market not settled");
        
        bool isWinningOption = position.optionId == market.winningOption;
        bool isWinner = (isWinningOption && position.isYes) || (!isWinningOption && !position.isYes);
        
        if (!isWinner) {
            return 0;
        }
        
        // Payout = stake * (1 / probability)
        // probability is in basis points (10000 = 100%)
        uint256 effectiveProbability = position.isYes 
            ? position.probabilityAtBet 
            : (BASIS_POINTS - position.probabilityAtBet);
        
        // Prevent division by zero and extreme payouts
        effectiveProbability = effectiveProbability < 100 ? 100 : effectiveProbability;
        effectiveProbability = effectiveProbability > 9900 ? 9900 : effectiveProbability;
        
        uint256 grossPayout = (position.stake * BASIS_POINTS) / effectiveProbability;
        
        // Deduct platform fee
        uint256 fee = (grossPayout * PLATFORM_FEE) / BASIS_POINTS;
        uint256 netPayout = grossPayout - fee;
        
        return netPayout;
    }
    
    /**
     * @dev Get market details
     */
    function getMarket(uint256 marketId) external view returns (
        uint256 id,
        string memory question,
        string[] memory options,
        uint256[] memory optionVolumes,
        uint256 totalVolume,
        uint256 closeTime,
        MarketStatus status
    ) {
        Market storage market = markets[marketId];
        require(market.exists, "Market does not exist");
        
        return (
            market.id,
            market.question,
            market.options,
            market.optionVolumes,
            market.totalVolume,
            market.closeTime,
            market.status
        );
    }
    
    /**
     * @dev Get user's positions
     */
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }
    
    /**
     * @dev Withdraw platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    receive() external payable {}
}

