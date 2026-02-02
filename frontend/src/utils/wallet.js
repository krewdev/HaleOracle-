import { ethers } from 'ethers';

// Network Configurations
export const NETWORKS = {
    ARC_TESTNET: {
        chainId: "0x4cef52", // Actual RPC Chain ID: 5041986
        name: "Arc Testnet V2",
        usdcAddress: "0x3600000000000000000000000000000000000000",
        factoryAddress: "0x33e9915F122135B88fDEba6e8312f0cD8E678098",
        rpc: "https://rpc.testnet.arc.network?v=2",
        symbol: "USDC",
        explorer: "https://testnet.arcscan.app",
        isUsdcGas: true
    },
    SEPOLIA: {
        chainId: "0xaa36a7", // 11155111
        name: "Sepolia Testnet",
        usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        factoryAddress: "0x33e9915F122135B88fDEba6e8312f0cD8E678098",
        rpc: "https://sepolia.drpc.org",
        symbol: "ETH",
        explorer: "https://sepolia.etherscan.io",
        isUsdcGas: false
    }
};

/**
 * Detects the best available Ethereum provider
 * Prioritizes MetaMask over Phantom if both are installed
 */
export const getProviderr = () => {
    if (!window.ethereum) return null;

    // If multiple providers are injected (e.g. MetaMask + Phantom)
    if (window.ethereum.providers?.length) {
        // Try to find MetaMask specifically
        const metamask = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom);
        if (metamask) return metamask;

        // Otherwise return the first one
        return window.ethereum.providers[0];
    }

    // If simple injection
    return window.ethereum;
};

/**
 * Connects to the wallet and returns signer/provider
 */
export const connectWallet = async () => {
    const ethereum = getProviderr();

    if (!ethereum) {
        throw new Error("No Web3 wallet detected. Please install MetaMask.");
    }

    try {
        const provider = new ethers.BrowserProvider(ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        return { provider, signer, address, ethereum };
    } catch (err) {
        console.error("Wallet connection failed:", err);
        throw err;
    }
};

/**
 * Switches the network to the target chain ID
 */
export const switchNetwork = async (ethereum, networkKey) => {
    const targetNetwork = NETWORKS[networkKey];
    if (!targetNetwork) throw new Error("Invalid network key");

    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetNetwork.chainId }],
        });
    } catch (error) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (error.code === 4902) {
            await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: targetNetwork.chainId,
                        chainName: targetNetwork.name,
                        rpcUrls: [targetNetwork.rpc],
                        nativeCurrency: {
                            name: targetNetwork.symbol,
                            symbol: targetNetwork.symbol,
                            decimals: 18,
                        },
                        blockExplorerUrls: [targetNetwork.explorer],
                    },
                ],
            });
        } else {
            throw error;
        }
    }
};
