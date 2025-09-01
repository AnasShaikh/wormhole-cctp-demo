# Wormhole + CCTP Cross-Chain Transfer: Complete Deployment & Integration Guide

## Overview

This guide explains how Circle's Cross-Chain Transfer Protocol (CCTP) works with Wormhole, the exact contract interactions, and how to deploy your own cross-chain messaging system using these protocols.

**Important**: CCTP contracts are deployed and managed by Circle. You don't deploy CCTP contracts yourself - you integrate with existing ones. This guide shows both integration patterns and how to deploy complementary contracts.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Source Chain  │    │     Circle       │    │ Destination     │
│                 │    │   Attestation    │    │     Chain       │
│  ┌───────────┐  │    │    Service       │    │  ┌───────────┐  │
│  │Your App/  │  │    │                  │    │  │Your App/  │  │
│  │Wormhole   │  │    │  ┌─────────────┐ │    │  │Wormhole   │  │
│  │Relayer    │  │    │  │Circle       │ │    │  │Relayer    │  │
│  └─────┬─────┘  │    │  │Attesters    │ │    │  └─────┬─────┘  │
│        │        │    │  └─────────────┘ │    │        │        │
│  ┌─────▼─────┐  │    │                  │    │  ┌─────▼─────┐  │
│  │TokenMsgr  │  │◄──┐│                  │┌──►│  │TokenMsgr  │  │
│  │(Circle)   │  │   ││                  ││   │  │(Circle)   │  │
│  └─────┬─────┘  │   ││                  ││   │  └─────┬─────┘  │
│        │        │   ││                  ││   │        │        │
│  ┌─────▼─────┐  │   ││  ┌─────────────┐ ││   │  ┌─────▼─────┐  │
│  │MsgTrans   │  │   │└─►│  Attestation │◄┘│   │  │MsgTrans   │  │
│  │(Circle)   │  │   │   │  & Routing   │  │   │  │(Circle)   │  │
│  └─────┬─────┘  │   │   └─────────────┘  │   │  └─────┬─────┘  │
│        │        │   │                    │   │        │        │
│  ┌─────▼─────┐  │   │                    │   │  ┌─────▼─────┐  │
│  │USDC Token │  │   │                    │   │  │USDC Token │  │
│  │(Circle)   │  │   │                    │   │  │(Circle)   │  │
│  └───────────┘  │   │                    │   │  └───────────┘  │
└─────────────────┘   │                    │   └─────────────────┘
                      │                    │
                      └────────────────────┘
```

## Contract Addresses & Chain Configuration

### Testnet Addresses (Current Deployment)

| Component | Ethereum Sepolia | Arbitrum Sepolia | Optimism Sepolia |
|-----------|------------------|------------------|------------------|
| **Wormhole Relayer** | `0x7B1bD7a6b4E61c2a123AC6BC2cbfC614437D0470` | `0x7B1bD7a6b4E61c2a123AC6BC2cbfC614437D0470` | `0x93BAD53DDfB6132b0aC8E37f6029163E63372cEE` |
| **Wormhole Core** | `0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78` | `0x6b9C8671cdDC8dEab9c719bB87cBd3e782bA6a35` | `0x31377888146f3253211EFEf5c676D41ECe7D58Fe` |
| **Circle Message Transmitter** | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` |
| **Circle Token Messenger** | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` |
| **USDC Token** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |

### Chain Identifiers

#### Wormhole Chain IDs
- **Ethereum Sepolia**: `10002`
- **Arbitrum Sepolia**: `10003` 
- **Optimism Sepolia**: `10005`

#### CCTP Domain IDs
- **Ethereum**: `0`
- **Arbitrum**: `3`
- **Optimism**: `2`

## How Our Demo Transfer Worked

Let me trace exactly what happened in our successful transfers:

### Transfer 1: ArbitrumSepolia → Sepolia (2 USDC)

**Transactions:**
- Source: `0xfb248e3f9c95c1d34fbbdfb441a185e4cf88e60857aeeda59a550ab1583ebe7b`
- Destination: `0x5e68655d2cbb4e029f2df22fa93e7df3d028b92bcaf3c2d0719cd2787ec440ae`

**Exact Process:**

1. **Source Chain Call (ArbitrumSepolia)**:
   ```solidity
   // Called via Wormhole SDK
   TokenMessenger(0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA).depositForBurn(
       amount: 2000000,  // 2 USDC (6 decimals)
       destinationDomain: 0,  // Ethereum domain
       mintRecipient: bytes32(uint256(uint160(0xfD08836eeE6242092a9c869237a8d122275b024A))),
       burnToken: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d  // USDC on Arbitrum Sepolia
   )
   ```

2. **Circle Attestation**:
   - Circle attesters observed the `MessageSent` event
   - Generated attestation signature after confirmation
   - Wormhole SDK polled for attestation (timeout: 120s)

3. **Destination Chain Call (Sepolia)**:
   ```solidity
   MessageTransmitter(0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275).receiveMessage(
       message: <circle_message_bytes>,
       attestation: <circle_signature_bytes>
   )
   ```

### Transfer 2: Sepolia → ArbitrumSepolia (2 USDC)

**Transactions:**
- Source: `0x9438bf096ed2765c777e042485276c039df3039ab1c489b350b6c85c734f53fc`
- Destination: `0x6555473d5f8b2ed9d31569d88dec198e59509c8a948eb613e3d22e3b3f111c8c`

**Process**: Same as above but reversed chains and domains.

## Contract Integration Patterns

### 1. Direct CCTP Integration (What We Used)

```typescript
// Via Wormhole SDK - this is what our demo does
const xfer = await wh.circleTransfer(
    amount,           // 2000000n (2 USDC)
    source.address,   // sender address
    destination.address, // recipient address
    true             // automatic mode
);

// Initiate on source chain
const srcTxids = await xfer.initiateTransfer(source.signer);

// SDK automatically handles attestation and completion
```

### 2. Manual Contract Calls

```solidity
// Source chain - burn USDC and emit message
function initiateTransfer(
    uint256 amount,
    uint32 destinationDomain,
    bytes32 mintRecipient,
    address burnToken
) external {
    TokenMessenger tokenMessenger = TokenMessenger(TOKEN_MESSENGER_ADDRESS);
    
    // User must approve USDC first
    IERC20(burnToken).approve(address(tokenMessenger), amount);
    
    // Burn and emit cross-chain message
    tokenMessenger.depositForBurn(
        amount,
        destinationDomain,
        mintRecipient,
        burnToken
    );
}

// Destination chain - receive message and mint USDC
function completeTransfer(
    bytes calldata message,
    bytes calldata attestation
) external {
    MessageTransmitter messageTransmitter = MessageTransmitter(MESSAGE_TRANSMITTER_ADDRESS);
    
    // Verify signature and execute mint
    messageTransmitter.receiveMessage(message, attestation);
}
```

## Building Your Own Cross-Chain dApp

### Option 1: Extend CCTP with Custom Logic

Create your own contracts that wrap CCTP calls:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ITokenMessenger.sol";
import "./interfaces/IMessageTransmitter.sol";

contract CustomCCTPWrapper {
    ITokenMessenger public immutable tokenMessenger;
    IMessageTransmitter public immutable messageTransmitter;
    
    constructor(address _tokenMessenger, address _messageTransmitter) {
        tokenMessenger = ITokenMessenger(_tokenMessenger);
        messageTransmitter = IMessageTransmitter(_messageTransmitter);
    }
    
    // Custom logic + CCTP transfer
    function transferWithLogic(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes calldata customData
    ) external payable {
        // Your custom logic here
        _executeCustomLogic(customData);
        
        // Execute CCTP transfer
        tokenMessenger.depositForBurn(
            amount,
            destinationDomain,
            mintRecipient,
            burnToken
        );
    }
    
    function _executeCustomLogic(bytes calldata data) internal {
        // Your business logic
    }
}
```

### Option 2: Pure Wormhole Integration

For non-USDC cross-chain messaging:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IWormholeRelayer.sol";

contract CustomWormholeMessenger {
    IWormholeRelayer public immutable wormholeRelayer;
    
    constructor(address _wormholeRelayer) {
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
    }
    
    function sendMessage(
        uint16 targetChain,
        address targetAddress,
        bytes calldata payload,
        uint256 receiverValue,
        uint256 gasLimit
    ) external payable {
        uint256 cost = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            receiverValue,
            gasLimit
        );
        
        require(msg.value >= cost, "Insufficient payment");
        
        wormholeRelayer.sendPayloadToEvm{value: cost}(
            targetChain,
            targetAddress,
            abi.encode(payload, msg.sender),
            receiverValue,
            gasLimit
        );
    }
    
    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory,
        bytes32 sourceAddress,
        uint16 sourceChain,
        bytes32 deliveryHash
    ) external payable {
        require(msg.sender == address(wormholeRelayer), "Invalid caller");
        
        // Decode and process message
        (bytes memory data, address sender) = abi.decode(payload, (bytes, address));
        _processMessage(data, sender, sourceChain);
    }
    
    function _processMessage(bytes memory data, address sender, uint16 sourceChain) internal {
        // Your message processing logic
    }
}
```

## Foundry Deployment Scripts

### 1. Deploy Custom CCTP Wrapper

```solidity
// script/DeployCCTPWrapper.s.sol
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/CustomCCTPWrapper.sol";

contract DeployCCTPWrapper is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Testnet addresses
        address tokenMessenger = 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA;
        address messageTransmitter = 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275;
        
        vm.startBroadcast(deployerPrivateKey);
        
        CustomCCTPWrapper wrapper = new CustomCCTPWrapper(
            tokenMessenger,
            messageTransmitter
        );
        
        vm.stopBroadcast();
        
        console.log("CustomCCTPWrapper deployed to:", address(wrapper));
    }
}
```

### 2. Deploy Wormhole Messenger

```solidity
// script/DeployWormholeMessenger.s.sol
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/CustomWormholeMessenger.sol";

contract DeployWormholeMessenger is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get chain-specific Wormhole Relayer address
        address wormholeRelayer = _getWormholeRelayer();
        
        vm.startBroadcast(deployerPrivateKey);
        
        CustomWormholeMessenger messenger = new CustomWormholeMessenger(
            wormholeRelayer
        );
        
        vm.stopBroadcast();
        
        console.log("CustomWormholeMessenger deployed to:", address(messenger));
    }
    
    function _getWormholeRelayer() internal view returns (address) {
        uint256 chainId = block.chainid;
        
        if (chainId == 11155111) { // Ethereum Sepolia
            return 0x7B1bD7a6b4E61c2a123AC6BC2cbfC614437D0470;
        } else if (chainId == 421614) { // Arbitrum Sepolia
            return 0x7B1bD7a6b4E61c2a123AC6BC2cbfC614437D0470;
        } else if (chainId == 11155420) { // Optimism Sepolia
            return 0x93BAD53DDfB6132b0aC8E37f6029163E63372cEE;
        } else {
            revert("Unsupported chain");
        }
    }
}
```

### 3. Foundry Configuration

```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = [
    "forge-std/=lib/forge-std/src/",
    "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/",
    "@wormhole/=lib/wormhole/",
    "@circle/=lib/cctp-contracts/"
]

[rpc_endpoints]
sepolia = "${ETHEREUM_SEPOLIA_RPC_URL}"
arbitrum_sepolia = "${ARBITRUM_SEPOLIA_RPC_URL}"
optimism_sepolia = "${OPTIMISM_SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
arbitrum_sepolia = { key = "${ARBISCAN_API_KEY}" }
optimism_sepolia = { key = "${OPTIMISM_ETHERSCAN_API_KEY}" }
```

## Deployment Commands

### Install Dependencies
```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install wormhole-foundation/wormhole
```

### Deploy to Sepolia
```bash
forge script script/DeployCCTPWrapper.s.sol:DeployCCTPWrapper \
    --rpc-url sepolia \
    --broadcast \
    --verify \
    -vvvv
```

### Deploy to Arbitrum Sepolia
```bash
forge script script/DeployCCTPWrapper.s.sol:DeployCCTPWrapper \
    --rpc-url arbitrum_sepolia \
    --broadcast \
    --verify \
    -vvvv
```

## Verification & Testing

### 1. Verify Transfer Status

```bash
# Check transaction on source chain
cast tx <source_tx_hash> --rpc-url <source_rpc>

# Check transaction on destination chain  
cast tx <destination_tx_hash> --rpc-url <destination_rpc>

# Check USDC balance
cast call <usdc_address> "balanceOf(address)" <wallet_address> --rpc-url <rpc_url>
```

### 2. Monitor Circle Attestation

```typescript
// Monitor Circle's attestation service
const checkAttestation = async (messageHash: string) => {
    const response = await fetch(
        `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
    );
    return response.json();
};
```

### 3. Integration Tests

```solidity
// test/Integration.t.sol
contract IntegrationTest is Test {
    CustomCCTPWrapper wrapper;
    IERC20 usdc;
    
    function setUp() public {
        wrapper = new CustomCCTPWrapper(
            0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA,
            0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275
        );
        usdc = IERC20(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);
    }
    
    function testTransferWithLogic() public {
        // Setup test scenario
        deal(address(usdc), address(this), 1000000); // 1 USDC
        usdc.approve(address(wrapper), 1000000);
        
        // Execute transfer
        wrapper.transferWithLogic(
            1000000,
            3, // Arbitrum domain
            bytes32(uint256(uint160(address(this)))),
            address(usdc),
            abi.encode("test_data")
        );
        
        // Verify burn occurred
        assertEq(usdc.balanceOf(address(this)), 0);
    }
}
```

## Gas Optimization Tips

1. **Batch Operations**: Group multiple transfers when possible
2. **Use Multicall**: Combine approval and transfer calls
3. **Optimize Payload Size**: Minimize cross-chain message data
4. **Pre-compute Recipients**: Use create2 for predictable addresses

## Security Considerations

1. **Validate Recipients**: Always verify destination addresses
2. **Check Domains**: Ensure correct domain IDs
3. **Handle Failed Transfers**: Implement retry mechanisms
4. **Rate Limiting**: Implement transfer limits for contracts
5. **Signature Verification**: Validate Circle attestations

## Common Issues & Solutions

### Issue 1: Insufficient Funds for Gas
```bash
Error: insufficient funds for intrinsic transaction cost
```
**Solution**: Ensure wallet has native tokens (ETH) for gas fees on both chains.

### Issue 2: Amount Too Small
```bash
Error: Amount must be > 1315672 (relayerFee + nativeGas)
```
**Solution**: Increase transfer amount to cover relayer fees (~1.3+ USDC).

### Issue 3: Attestation Timeout
```bash
Error: Timeout waiting for Circle attestation
```
**Solution**: Increase timeout or check Circle's attestation service status.

## Conclusion

This guide provides a complete understanding of:
- How CCTP and Wormhole work together
- Exact contract interactions and function calls
- Deployment strategies for custom contracts
- Both SDK and direct contract integration approaches
- Foundry-based deployment and testing workflows

The key insight is that while you don't deploy CCTP contracts yourself, you can build powerful cross-chain applications by integrating with Circle's infrastructure and extending it with your own business logic.