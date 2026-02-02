import React, { useState, useEffect, useRef } from 'react'
import { Zap, Copy, Check, AlertCircle, Rocket, Globe, ShieldCheck, Wallet, ChevronRight, RefreshCw, CheckCircle, Link, TrendingUp, AlertTriangle, FileText, User, ArrowRight } from 'lucide-react'
import { ethers } from 'ethers'
import factoryAbi from '../factory_abi.json'
import erc20Abi from '../erc20_abi.json'
import escrowAbi from '../escrow_abi.json'
import { NETWORKS, connectWallet, switchNetwork } from '../utils/wallet';
import '../App.css'; // Ensure styles are loaded

const PROTOCOL_MARGIN_USDC = 0.05;

/**
 * Arc uses USDC as native gas (no EIP-1559). Get gasPrice via eth_gasPrice only
 * (Arc RPC doesn't support eth_maxPriorityFeePerGas).
 */
async function getArcGasPrice(provider, fallbackWei) {
  const fallback = fallbackWei ?? ethers.parseUnits("0.00001", 18);
  try {
    const gasPrice = await provider.send("eth_gasPrice", []);
    if (gasPrice && BigInt(gasPrice) > 0n) return BigInt(gasPrice);
  } catch (_) { }
  return fallback;
}

const WALLET_TYPES = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: Wallet,
    description: 'Connect with MetaMask browser extension',
    color: '#F6851B'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: Link,
    description: 'Scan QR code with your mobile wallet',
    color: '#3B99FC'
  }
];

function Deployment() {
  const [selectedWalletType, setSelectedWalletType] = useState(null)
  const [deployedAddress, setDeployedAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculatingFee, setCalculatingFee] = useState(false)
  const [error, setError] = useState(null)
  const [txHash, setTxHash] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeStep, setActiveStep] = useState('select') // select, deploying, configure, processing, retry_requirements, success
  const depositConfirmedRef = useRef(false) // true after deposit tx confirmed, so we show retry instead of form on error
  const [depositorHint, setDepositorHint] = useState('') // wallet that must call setContractRequirements (shown on retry)
  const [currentNetwork, setCurrentNetwork] = useState(null)
  const [feeDetails, setFeeDetails] = useState({
    gasCost: '0.00',
    margin: PROTOCOL_MARGIN_USDC.toFixed(2),
    total: '0.55' // Default fallback
  })

  // Success state generated data
  const [generatedLink, setGeneratedLink] = useState('')

  // Configuration State (seller address required by deployed escrow contract)
  const [sellerAddress, setSellerAddress] = useState('')
  const [depositAmount, setDepositAmount] = useState('0.1') // Default amount
  const [requirements, setRequirements] = useState('')
  const [sellerContact, setSellerContact] = useState('')

  useEffect(() => {
    detectNetwork();
    if (window.ethereum) {
      window.ethereum.on('chainChanged', detectNetwork);
    }
  }, []);

  // On retry step, fetch who deposited so we can show "Use this wallet: 0x..."
  useEffect(() => {
    if (activeStep !== 'retry_requirements' || !deployedAddress || !sellerAddress || !window.ethereum) return;
    let cancelled = false;
    (async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const escrow = new ethers.Contract(deployedAddress, escrowAbi, provider);
        const depositors = await escrow.getDepositors(sellerAddress);
        if (!cancelled && depositors?.length > 0) {
          setDepositorHint(depositors[0].depositor);
        }
      } catch (_) { }
    })();
    return () => { cancelled = true; };
  }, [activeStep, deployedAddress, sellerAddress]);

  const detectNetwork = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainIdHex = "0x" + Number(network.chainId).toString(16);

      const matchedNetwork = Object.values(NETWORKS).find(n =>
        n.chainId.toLowerCase() === chainIdHex.toLowerCase()
      );

      setCurrentNetwork(matchedNetwork || { name: "Unsupported", chainId: chainIdHex });
      if (matchedNetwork) calculateDynamicFee(matchedNetwork);
    } catch (e) {
      console.error("Error detecting network:", e);
    }
  }

  const handleNetworkSwitch = async (networkKey) => {
    if (!window.ethereum) return;
    try {
      await switchNetwork(window.ethereum, networkKey);
      window.location.reload();
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes("same RPC endpoint")) {
        setError("Network conflict detected. Please check MetaMask settings.");
      } else {
        setError(err.message || "Failed to switch network.");
      }
    }
  };

  const calculateDynamicFee = async (network) => {
    if (!window.ethereum) return;
    setCalculatingFee(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Arc RPC doesn't support eth_maxPriorityFeePerGas; get gasPrice only
      let gasPrice;
      try {
        const feeData = await provider.getFeeData();
        gasPrice = feeData?.gasPrice ?? null;
      } catch (_) { gasPrice = null; }
      if (!gasPrice || gasPrice === 0n) {
        gasPrice = network.isUsdcGas
          ? ethers.parseUnits("0.00001", 18) // ~0.00001 USDC per gas (18 decimals on Arc)
          : ethers.parseUnits("1", "gwei");
      }
      const estimatedGas = 280000n;
      const gasCostInWei = gasPrice * estimatedGas;

      let gasCostInUSDC;
      if (network.isUsdcGas) {
        // Arc native gas is USDC with 18 decimals; use 18 so we don't inflate the fee
        gasCostInUSDC = parseFloat(ethers.formatUnits(gasCostInWei, 18));
      } else {
        const ethPrice = 2500; // Manual fallback
        const ethCost = parseFloat(ethers.formatEther(gasCostInWei));
        gasCostInUSDC = ethCost * ethPrice;
      }

      let total = gasCostInUSDC + PROTOCOL_MARGIN_USDC;
      total = Math.max(0.5, Math.min(100, total)); // sanity cap: 0.5–100 USDC
      setFeeDetails({
        gasCost: gasCostInUSDC.toFixed(4),
        margin: PROTOCOL_MARGIN_USDC.toFixed(2),
        total: total.toFixed(2)
      });
    } catch (e) {
      console.error("Fee calculation failed", e);
      setFeeDetails(prev => ({ ...prev, total: "0.55" })); // safe fallback on any error
    } finally {
      setCalculatingFee(false);
    }
  }

  const connectAndDeploy = async () => {
    setLoading(true)
    setError(null)
    setTxHash('')
    setActiveStep('deploying')

    try {
      const { provider, signer, ethereum } = await connectWallet();

      const network = await provider.getNetwork();
      const chainIdHex = "0x" + Number(network.chainId).toString(16);

      let targetNetwork = Object.values(NETWORKS).find(n =>
        n.chainId.toLowerCase() === chainIdHex.toLowerCase()
      );

      if (!targetNetwork || targetNetwork.chainId.toLowerCase() !== NETWORKS.ARC_TESTNET.chainId.toLowerCase()) {
        await switchNetwork(ethereum, 'ARC_TESTNET');
        throw new Error("Switched to Arc Testnet. Please try again.");
      }

      const userAddress = await signer.getAddress();
      const usdc = new ethers.Contract(targetNetwork.usdcAddress, erc20Abi, signer);
      const feeTotal = Math.min(100, Math.max(0.5, parseFloat(feeDetails.total) || 0.55));
      const totalFeeAmount = ethers.parseUnits(feeTotal.toFixed(2), 6);

      // Arc: same USDC is native (18 dec) and ERC-20 (6 dec). If balanceOf returns 0, use native balance.
      let balance = await usdc.balanceOf(userAddress).catch(() => 0n);
      if (targetNetwork.isUsdcGas && balance === 0n) {
        const nativeBalance = await provider.getBalance(userAddress).catch(() => 0n);
        balance = nativeBalance / (10n ** 12n); // 18 dec → 6 dec (1 USDC native = 1e6 ERC-20)
      }
      if (balance < totalFeeAmount) {
        const need = ethers.formatUnits(totalFeeAmount, 6);
        const have = ethers.formatUnits(balance, 6);
        throw new Error(`Insufficient USDC for deployment fee. Need at least ${need} USDC (you have ${have}). Get Arc testnet USDC from the faucet.`);
      }

      // Arc: get gasPrice via eth_gasPrice only (no eth_maxPriorityFeePerGas). Use legacy tx (type 0) so gas is paid in USDC.
      const gasPrice = targetNetwork.isUsdcGas
        ? await getArcGasPrice(provider)
        : (await provider.getFeeData()).gasPrice ?? ethers.parseUnits("1", "gwei");
      const overrides = { type: 0, gasPrice };

      // 1. Approve USDC (Arc precompile at 0x3600... can fail estimateGas but tx may succeed — use explicit gasLimit)
      const allowance = await usdc.allowance(userAddress, targetNetwork.factoryAddress);
      if (allowance < totalFeeAmount) {
        console.log("Approving USDC...");
        const approveOverrides = { ...overrides, gasLimit: 100000n };
        try {
          const approveTx = await usdc.approve(targetNetwork.factoryAddress, totalFeeAmount, approveOverrides);
          setTxHash(approveTx.hash);
          await approveTx.wait();
          setTxHash('');
        } catch (approveErr) {
          const msg = approveErr?.reason ?? approveErr?.shortMessage ?? approveErr?.message ?? "";
          if (msg.includes("missing revert data") || (approveErr?.code === "CALL_EXCEPTION" && !approveErr?.reason)) {
            throw new Error("USDC approval failed. Ensure you're on Arc Testnet, have enough USDC for the fee (~" + feeDetails.total + " USDC), and that the token is the chain's USDC (0x3600...).");
          }
          throw approveErr;
        }
      }

      // 2. Deploy Escrow
      console.log("Creating Escrow...");
      const factory = new ethers.Contract(targetNetwork.factoryAddress, factoryAbi, signer);
      const tx = await factory.createEscrow(overrides);
      setTxHash(tx.hash);

      // Custom wait loop to handle rate limits (HTTP 429)
      let receipt = null;
      let retries = 0;
      while (!receipt && retries < 20) {
        try {
          receipt = await provider.getTransactionReceipt(tx.hash);
          if (receipt) {
            if (receipt.status === 0) throw new Error("Transaction reverted on-chain");
            break;
          }
          // If null, it's pending; wait and retry
          await new Promise(r => setTimeout(r, 2000));
        } catch (waitErr) {
          console.warn("Wait error (likely rate limit), retrying...", waitErr);
          // Exponential backoff for rate limits
          await new Promise(r => setTimeout(r, 2000 * (retries + 1)));
        }
        retries++;
      }
      if (!receipt) throw new Error("Transaction confirmation timed out. Check block explorer.");

      let newEscrowAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = factory.interface.parseLog(log);
          if (parsedLog.name === 'EscrowCreated') {
            newEscrowAddress = parsedLog.args[0];
            break;
          }
        } catch (e) { continue; }
      }

      if (newEscrowAddress) {
        setDeployedAddress(newEscrowAddress);
        setActiveStep('configure');
      } else {
        throw new Error("Escrow address not found in logs.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Deployment failed.");
      // If we have a tx hash but failed to confirm, keep the hash visible
      if (!txHash && err.transactionHash) setTxHash(err.transactionHash);
      setActiveStep('select');
    } finally {
      setLoading(false)
    }
  }

  const handleConfigure = async () => {
    if (!ethers.isAddress(sellerAddress)) { setError("Invalid Seller Wallet Address"); return; }
    if (!depositAmount || parseFloat(depositAmount) <= 0) { setError("Invalid Amount"); return; }
    if (!requirements) { setError("Requirements cannot be empty"); return; }

    depositConfirmedRef.current = false;
    setLoading(true);
    setError(null);
    setActiveStep('processing');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();
      if (ethers.getAddress(sellerAddress) === ethers.getAddress(buyerAddress)) {
        setLoading(false);
        setActiveStep('configure');
        setError("Seller address cannot be your own. Enter the seller's wallet address.");
        return;
      }

      const escrow = new ethers.Contract(deployedAddress, escrowAbi, signer);

      // 1. Deposit (Native Token) – contract expects deposit(seller)
      const depositValue = ethers.parseEther(depositAmount);
      console.log("Depositing...");
      // Arc RPC's estimateGas can fail; use manual gas limit as fallback
      let depositTx;
      try {
        depositTx = await escrow.deposit(sellerAddress, { value: depositValue });
      } catch (depositErr) {
        const reason = String(depositErr?.reason ?? depositErr?.shortMessage ?? depositErr?.message ?? "");
        if (reason.includes("missing revert data") || reason.includes("Internal JSON-RPC")) {
          console.log("Deposit estimateGas failed, retrying with manual gas limit...");
          depositTx = await escrow.deposit(sellerAddress, { value: depositValue, gasLimit: 200000n });
        } else {
          throw depositErr;
        }
      }
      setTxHash(depositTx.hash);
      await depositTx.wait();
      depositConfirmedRef.current = true;

      // Ensure chain state is visible (some RPCs lag by a block) – retry once after short delay
      let depositBalance = await escrow.deposits(sellerAddress);
      if (depositBalance === 0n) {
        await new Promise(r => setTimeout(r, 1500));
        depositBalance = await escrow.deposits(sellerAddress);
      }
      if (depositBalance === 0n) {
        throw new Error("Deposit did not register on chain. Please try again.");
      }

      // 2. Set Requirements – only the depositor can call this
      const depositors = await escrow.getDepositors(sellerAddress);
      const isDepositor = depositors.some(d => d.depositor.toLowerCase() === buyerAddress.toLowerCase());
      if (!isDepositor) {
        throw new Error("This wallet is not listed as depositor for this seller. Use the same wallet that sent the deposit.");
      }
      const reqs = (requirements || "").trim();
      if (!reqs) throw new Error("Requirements cannot be empty.");
      const sellerChecksum = ethers.getAddress(sellerAddress);
      const contact = (sellerContact || "No Telegram").trim();
      console.log("Setting Requirements...");
      // Arc RPC's estimateGas often fails with "missing revert data"; force a manual gasLimit.
      const reqOverrides = { gasLimit: 300000n };
      try {
        await escrow.setContractRequirements.staticCall(sellerChecksum, reqs, contact, reqOverrides);
      } catch (simErr) {
        const reason = String(simErr?.reason ?? simErr?.shortMessage ?? simErr?.message ?? "");
        if (reason.includes("maxPriorityFeePerGas") || reason.includes("does not exist") || reason.includes("missing revert data") || reason.includes("Internal JSON-RPC")) {
          // Arc/RPC quirk; skip simulation and try the real tx
        } else if (reason.includes("Auth: Only depositors") || reason.includes("State: No deposit") || reason.includes("Requirements:") || reason.includes("Security: Reentrant")) {
          throw new Error(`Contract would revert: ${reason}`);
        } else if (reason) {
          // Skip throwing for unknown simulation errors on Arc; try the tx anyway
          console.warn("Simulation failed, proceeding with tx anyway:", reason);
        }
      }
      const reqTx = await escrow.setContractRequirements(sellerChecksum, reqs, contact, reqOverrides);
      setTxHash(reqTx.hash);
      await reqTx.wait();
      const requirementsTxHash = reqTx.hash;

      // 3. Generate OTP via Backend API (this creates the OTP and optionally sends Telegram)
      console.log("Generating OTP via backend...");
      let link = null;
      try {
        const generateRes = await fetch(`http://localhost:5001/api/generate-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seller_address: sellerChecksum,
            escrow_address: deployedAddress,
            requirements: reqs,
            seller_telegram: contact
          })
        });

        if (generateRes.ok) {
          const data = await generateRes.json();
          link = data.submission_link;
          console.log("OTP generated:", data.otp);
        } else {
          const errorData = await generateRes.json();
          console.error("OTP generation failed:", errorData);
        }
      } catch (e) {
        console.error("OTP generation error:", e);
      }

      if (link) {
        setGeneratedLink(link);
        setActiveStep('success');
      } else {
        // Fallback: build link manually with a placeholder
        const fallbackLink = `http://localhost:3002/submit?escrow=${deployedAddress}&seller=${sellerChecksum}`;
        setGeneratedLink(fallbackLink);
        setActiveStep('success');
        console.warn("Using fallback link (OTP not included)");
      }


    } catch (err) {
      console.error(err);
      let msg = err?.reason ?? err?.shortMessage ?? err?.message ?? "Configuration failed.";
      if (msg.includes("missing revert data") || (err?.code === "CALL_EXCEPTION" && !err?.reason)) {
        msg = "Contract reverted (setContractRequirements). Use the same wallet that just deposited; wait for the deposit tx to confirm, then try again.";
      } else {
        const hint = (msg.includes("Auth: Only depositors") || msg.includes("State: No deposit"))
          ? " Use the same wallet that deposited and the same seller address."
          : "";
        msg = msg + hint;
      }
      setError(msg);
      setActiveStep(depositConfirmedRef.current ? 'retry_requirements' : 'configure');
    } finally {
      setLoading(false);
      setTxHash('');
    }
  }

  const handleRetryRequirements = async () => {
    setLoading(true);
    setError(null);
    setActiveStep('processing');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentWallet = await signer.getAddress();
      const escrow = new ethers.Contract(deployedAddress, escrowAbi, signer);
      const balance = await escrow.deposits(sellerAddress);
      const depositors = await escrow.getDepositors(sellerAddress);
      const isDepositor = depositors.some(d => d.depositor.toLowerCase() === currentWallet.toLowerCase());
      if (balance === 0n) {
        setError("No deposit found for this seller at this vault. Wrong vault or seller address? Check the deposit tx on the block explorer.");
        setActiveStep('retry_requirements');
        setLoading(false);
        return;
      }
      if (!isDepositor) {
        setDepositorHint(depositors[0]?.depositor ?? '');
        setError(`This wallet (${currentWallet.slice(0, 6)}...${currentWallet.slice(-4)}) is not the depositor. Only the wallet that sent the deposit can set requirements. Switch to that wallet in MetaMask and retry.`);
        setActiveStep('retry_requirements');
        setLoading(false);
        return;
      }
      setDepositorHint(currentWallet);
      const reqs = (requirements || "").trim();
      if (!reqs) {
        setError("Requirements cannot be empty. Add contract stipulations and retry.");
        setActiveStep('retry_requirements');
        setLoading(false);
        return;
      }
      const sellerChecksum = ethers.getAddress(sellerAddress);
      const contact = (sellerContact || "No Telegram").trim();
      const chainIdHex = "0x" + (await provider.getNetwork().then(n => Number(n.chainId))).toString(16);
      const isArc = chainIdHex.toLowerCase() === NETWORKS.ARC_TESTNET.chainId.toLowerCase();
      // Arc RPC's estimateGas often fails; force a manual gasLimit.
      const reqOverrides = { gasLimit: 300000n };
      try {
        await escrow.setContractRequirements.staticCall(sellerChecksum, reqs, contact, reqOverrides);
      } catch (simErr) {
        const reason = String(simErr?.reason ?? simErr?.shortMessage ?? simErr?.message ?? "");
        if (reason.includes("maxPriorityFeePerGas") || reason.includes("does not exist") || reason.includes("missing revert data") || reason.includes("Internal JSON-RPC")) {
          // Arc RPC quirk; skip simulation and try the tx
        } else if (reason.includes("Auth: Only depositors") || reason.includes("State: No deposit") || reason.includes("Requirements:") || reason.includes("Security: Reentrant")) {
          setError(`Contract would revert: ${reason}`);
          setActiveStep('retry_requirements');
          setLoading(false);
          return;
        } else if (reason) {
          setError(`Simulation failed: ${reason}`);
          setActiveStep('retry_requirements');
          setLoading(false);
          return;
        } else {
          setError("Contract would revert (no reason returned). Possible causes: wrong vault, reentrancy lock, or different contract version.");
          setActiveStep('retry_requirements');
          setLoading(false);
          return;
        }
      }
      const reqTx = await escrow.setContractRequirements(sellerChecksum, reqs, contact, reqOverrides);
      setTxHash(reqTx.hash);
      await reqTx.wait();
      setTxHash('');
      const requirementsTxHash = reqTx.hash;
      let link = null;
      try {
        const generateRes = await fetch(`http://localhost:5001/api/generate-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seller_address: sellerChecksum,
            escrow_address: deployedAddress,
            requirements: reqs,
            seller_telegram: contact
          })
        });

        if (generateRes.ok) {
          const data = await generateRes.json();
          link = data.submission_link;
          console.log("OTP generated:", data.otp);
        }
      } catch (e) {
        console.error("OTP generation error:", e);
      }

      if (link) {
        setGeneratedLink(link);
        setActiveStep('success');
      } else {
        const fallbackLink = `http://localhost:3002/submit?escrow=${deployedAddress}&seller=${sellerChecksum}`;
        setGeneratedLink(fallbackLink);
        setActiveStep('success');
      }
    } catch (err) {
      console.error(err);
      let msg = err?.reason ?? err?.shortMessage ?? err?.message ?? "Retry failed.";
      if (msg.includes("missing revert data") || (err?.code === "CALL_EXCEPTION" && !err?.reason)) {
        msg = "setContractRequirements reverted. Switch to the wallet shown above (the depositor), wait a few seconds for the deposit to confirm, then retry.";
      }
      setError(msg);
      setActiveStep('retry_requirements');
    } finally {
      setLoading(false);
      setTxHash('');
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="page-icon"><Zap size={32} /></div>
        <div>
          <h1 className="text-gradient">Provision Escrow</h1>
          <p className="page-subtitle">HALE instances are dynamically priced on-chain for the agentic economy.</p>
        </div>
      </div>

      {activeStep === 'select' && (
        <div className="glass-panel p-8 max-w-[800px] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Identity Provider</h2>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${currentNetwork?.usdcAddress ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {currentNetwork?.name || "DISCONNECTED"}
            </div>
          </div>

          {currentNetwork?.name === "Unsupported" && (
            <div className="alert-warning p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertTriangle className="text-amber-500" size={24} />
                <div className="text-xs text-secondary">The HALE Factory lives on Arc Testnet.</div>
              </div>
              <button onClick={() => switchNetwork('ARC_TESTNET')} className="btn btn-primary px-4 py-2 text-xs font-black">SWITCH TO ARC</button>
            </div>
          )}

          <div className="wallet-grid">
            {WALLET_TYPES.map((wallet) => (
              <button
                key={wallet.id}
                className="wallet-btn"
                disabled={loading}
                onClick={() => {
                  if (wallet.id === 'metamask') connectAndDeploy();
                  else setError("WalletConnect is temporarily restricted. Please use MetaMask.");
                }}
              >
                <div className="wallet-content">
                  <div className="wallet-icon-box" style={{ borderColor: wallet.color }}>
                    <wallet.icon size={24} style={{ color: wallet.color }} />
                  </div>
                  <div className="wallet-info">
                    <h3>{wallet.name}</h3>
                    <p>{wallet.description}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="wallet-arrow" />
              </button>
            ))}
          </div>
          {error && <div className="mt-4 text-red-400 text-xs font-mono">{error}</div>}
        </div>
      )}

      {(activeStep === 'deploying' || activeStep === 'processing') && (
        <div className="glass-panel p-12 max-w-[600px] mx-auto text-center">
          <RefreshCw size={48} className="animate-spin text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">{activeStep === 'deploying' ? 'Deploying Vault...' : 'Configuring Vault...'}</h2>
          <p className="text-secondary mb-4">Please confirm the transactions in your wallet.</p>
          {txHash && (
            <div className="bg-black/30 p-4 rounded-xl font-mono text-xs text-emerald-400 break-all">
              TX: {txHash}
            </div>
          )}
        </div>
      )}

      {activeStep === 'retry_requirements' && (
        <div className="glass-panel p-8 max-w-[600px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={24} className="text-emerald-500" />
            <span className="text-emerald-400 font-medium">Deposit confirmed</span>
          </div>
          <p className="text-secondary text-sm mb-2">Vault: <span className="font-mono text-white">{deployedAddress.slice(0, 10)}...{deployedAddress.slice(-8)}</span></p>
          {depositorHint && (
            <p className="text-amber-400/90 text-xs mb-2 font-mono">You must use this wallet: {depositorHint.slice(0, 10)}...{depositorHint.slice(-8)}</p>
          )}
          <p className="text-amber-400/90 text-xs mb-4">Switch to that account in MetaMask if needed, then click Retry.</p>
          <p className="text-red-400 text-sm font-mono mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={handleRetryRequirements}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry set requirements'}
            </button>
            <button
              type="button"
              className="btn border border-white/20 hover:bg-white/10 flex-1"
              onClick={() => { setError(null); setActiveStep('configure'); }}
              disabled={loading}
            >
              Back to form
            </button>
          </div>
        </div>
      )}

      {activeStep === 'configure' && (
        <div className="glass-panel p-8 max-w-[800px] mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Configure & Fund Escrow</h2>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-500" />
            <span className="text-sm text-emerald-400">Vault Deployed at <span className="font-mono font-bold">{deployedAddress.slice(0, 6)}...{deployedAddress.slice(-4)}</span></span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-secondary text-sm mb-2">Seller Wallet Address (Required)</label>
              <p className="text-[10px] text-gray-500 mb-1 ml-1">Seller&apos;s wallet only (not yours). They must have started the HALE Oracle Bot on Telegram first.</p>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="text"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500/50 outline-none transition-all font-mono"
                  placeholder="0x..."
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-secondary text-sm mb-2">Deposit Amount (ARC)</label>
              <div className="relative">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="number"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500/50 outline-none transition-all font-mono"
                  placeholder="0.1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-secondary text-sm mb-2">Contract Stipulations / Requirements</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-muted" size={18} />
                <textarea
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500/50 outline-none transition-all min-h-[120px]"
                  placeholder="Describe the deliverables and conditions for release..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-secondary text-sm mb-2">Seller Telegram (Optional)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="text"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="@username"
                  value={sellerContact}
                  onChange={(e) => setSellerContact(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1 ml-1">Optional — for the bot to send them the submission link.</p>
            </div>

            {error && <div className="text-red-400 text-sm font-mono">{error}</div>}

            <button
              className="btn btn-primary w-full py-4 font-bold flex items-center justify-center gap-2"
              onClick={handleConfigure}
              disabled={loading}
            >
              {loading ? <RefreshCw className="animate-spin" /> : <Rocket size={20} />}
              FUND & INITIALIZE
            </button>
          </div>
        </div>
      )}

      {activeStep === 'success' && (
        <div className="glass-panel p-16 max-w-[700px] mx-auto text-center border-emerald-500/30 border-2 shadow-2xl">
          <CheckCircle size={56} className="text-emerald-500 mx-auto mb-6" />
          <h2 className="text-4xl font-black mb-4 text-white italic tracking-tighter">VAULT_ACTIVE</h2>

          <div className="p-6 bg-black/50 rounded-3xl border border-emerald-500/20 mb-8 text-left">
            <p className="text-xs text-secondary mb-2 uppercase tracking-widest">Share with Seller</p>

            {/* Shareable Link */}
            <div className="mb-4">
              <label className="text-[10px] text-gray-500 block mb-1">Submission Link</label>
              <div className="flex items-center gap-2 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                <code className="text-emerald-400 text-sm font-mono truncate flex-1">{generatedLink}</code>
                <button onClick={() => copyToClipboard(generatedLink)} className="p-2 hover:bg-emerald-500/20 rounded transition-colors">
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-emerald-500" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Manual OTP */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">OTP Code</label>
                <div className="flex items-center gap-2 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                  <code className="text-white text-lg font-mono font-bold tracking-widest flex-1 text-center">
                    {new URL(generatedLink).searchParams.get('otp')}
                  </code>
                </div>
              </div>

              {/* Escrow Address */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Escrow Address</label>
                <div className="flex items-center gap-2 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                  <code className="text-emerald-400 text-xs font-mono truncate flex-1">{deployedAddress.slice(0, 6)}...{deployedAddress.slice(-4)}</code>
                  <button onClick={() => copyToClipboard(deployedAddress)} className="p-1 hover:bg-emerald-500/20 rounded transition-colors">
                    <Copy size={12} className="text-emerald-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl text-sm text-secondary mb-8">
            Send the <strong>Link</strong> OR the <strong>Escrow Address + OTP</strong> to the Seller. Seller must use wallet <strong>{sellerAddress.slice(0, 6)}...{sellerAddress.slice(-4)}</strong> to submit.
          </div>

          <button className="btn btn-primary py-4 px-12 font-black" onClick={() => window.location.reload()}>START NEW</button>
        </div>
      )}
    </div>
  )
}

export default Deployment;
