// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ManualNFT} from "../src/ManualNFT.sol";

/**
 * @title DeployManualNFT
 * @author Akash
 * @notice Deployment script for the ManualNFT contract. Supports both Anvil
 *         (local) and Sepolia (testnet) deployments via the `--rpc-url` flag.
 *
 * @dev This script uses Foundry's `--interactives` flag for secure,
 *      zero-trace private key entry during sepolia deployments. For local
 *      Anvil testing, use the default anvil private key via `--interactives`
 *      or set `PRIVATE_KEY` in the environment.
 *
 * Usage:
 *   # Local Anvil deployment:
 *   forge script script/DeployManualNFT.s.sol --rpc-url anvil --broadcast --interactives 1
 *
 *   # Sepolia testnet deployment:
 *   forge script script/DeployManualNFT.s.sol --rpc-url sepolia --broadcast --interactives 1
 *
 *   # Dry-run (no broadcast):
 *   forge script script/DeployManualNFT.s.sol --rpc-url sepolia
 */
contract DeployManualNFT is Script {
    /// @notice Deploys the ManualNFT contract and logs the address.
    /// @return nft The deployed ManualNFT instance.
    function run() external returns (ManualNFT nft) {
        // Resolve the deployer private key.
        // Priority:
        //   1. PRIVATE_KEY environment variable (automated, CI)
        //   2. Interactive prompt (--interactives 1, secure)
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));

        if (deployerPrivateKey == 0) {
            // No env var — prompt securely via --interactives
            string memory pkHex = vm.promptSecret(
                "Enter deployer private key (hex with 0x prefix)"
            );
            deployerPrivateKey = vm.parseUint(pkHex);
        }

        address deployer = vm.addr(deployerPrivateKey);

        console2.log("================================================");
        console2.log("      ManualNFT Deployment Script               ");
        console2.log("================================================");
        console2.log("Deployer address:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

        nft = new ManualNFT("ManualNFT", "MNFT");

        vm.stopBroadcast();

        console2.log("================================================");
        console2.log("Contract deployed successfully!");
        console2.log("Address:", address(nft));
        console2.log("Name: ManualNFT");
        console2.log("Symbol: MNFT");
        console2.log("================================================");
    }
}
