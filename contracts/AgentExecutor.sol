// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract AgentExecutor is Ownable {
    ISwapRouter public immutable swapRouter;
    address public immutable WETH9;

    constructor(address _swapRouter, address _weth9) Ownable(msg.sender) {
        swapRouter = ISwapRouter(_swapRouter);
        WETH9 = _weth9;
    }

    /**
     * @notice Swaps ETH for a token and transfers it to a recipient
     * @param tokenOut The address of the token to receive (e.g., WBTC)
     * @param poolFee The fee tier of the pool (e.g., 3000 for 0.3%)
     * @param recipient The address to receive the tokens
     * @param amountOutMinimum The minimum amount of tokens to receive
     */
    function executeSwapAndTransfer(
        address tokenOut,
        uint24 poolFee,
        address recipient,
        uint256 amountOutMinimum
    ) external payable {
        require(msg.value > 0, "Must send ETH");

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: recipient,
                deadline: block.timestamp,
                amountIn: msg.value,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

        swapRouter.exactInputSingle{value: msg.value}(params);
    }

    /**
     * @notice Rescue ETH if stuck
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
