// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// This is the Uniswap interface definition you'll be using, no implementation needed.
interface IUniswapRouter {
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AgentExecutor {
    // 1. Define events: For The Graph to index data
    event AgentActionExecuted(
        address indexed user,
        string actionType,    // "SWAP", "TRANSFER", etc.
        string description,   // The AI-generated sentence "If ETH > 3000..."
        uint256 timestamp
    );

    // 2. Core function: The frontend calls this, not Uniswap directly
    function executeSwapAndTransfer(
        address routerAddress,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        string calldata aiDescription, // Pass in the AI's intention text for recording
        address priceFeedAddress, // Chainlink price feed address
        uint256 priceCondition, // e.g., 1000 for > $1000
        address finalRecipient // The address to send the swapped tokens to
    ) external payable {
        // A. Check the price condition
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (, int price, , , ) = priceFeed.latestRoundData();

        // The price from Chainlink has 8 decimals, so we need to adjust our condition
        require(price > int(priceCondition * 1e8), "Price condition not met");

        // B. Call Uniswap (act as a middleman)
        IUniswapRouter(routerAddress).swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            address(this), // The contract will receive the tokens first
            deadline
        );

        // C. Transfer the swapped tokens to the final recipient
        address tokenAddress = path[path.length - 1]; // The last token in the path is the one we want to transfer
        uint256 swappedAmount = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).transfer(finalRecipient, swappedAmount);

        // D. Emit an event (for The Graph)
        emit AgentActionExecuted(msg.sender, "SWAP_AND_TRANSFER", aiDescription, block.timestamp);
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
