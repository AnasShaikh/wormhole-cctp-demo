import { wormhole, Wormhole } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import { getSigner } from './src/helpers/helpers';

(async function () {
    const wh = await wormhole('Testnet', [evm]);
    const sepoliaChain = wh.getChain('Sepolia');
    const signer = await getSigner(sepoliaChain);
    
    console.log('Checking USDC balance on Sepolia...');
    console.log('Wallet address:', signer.address.toString());
    
    // Get USDC token address on Sepolia
    const usdcToken = Wormhole.tokenId(sepoliaChain.chain, '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'); // USDC on Sepolia
    
    try {
        const balance = await sepoliaChain.getBalance(signer.address.toString(), usdcToken);
        console.log('USDC Balance:', balance);
        console.log('USDC Balance (formatted):', Number(balance) / 1000000, 'USDC'); // Assuming 6 decimals
    } catch (error) {
        console.error('Error fetching USDC balance:', error);
    }
    
    // Also check ETH balance
    try {
        const ethBalance = await sepoliaChain.getBalance(signer.address.toString());
        console.log('ETH Balance:', ethBalance);
        console.log('ETH Balance (formatted):', Number(ethBalance) / 1e18, 'ETH');
    } catch (error) {
        console.error('Error fetching ETH balance:', error);
    }
})();