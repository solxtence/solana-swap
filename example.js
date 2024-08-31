const { Keypair } = require("@solana/web3.js");
const bs58 = require("bs58");
const SolanaSwap = require("@solxtence/solana-swap");

async function swapIt(useJito = false) {
  // Replace with your actual private key
  const privateKey = "YOUR_PRIVATE_KEY_HERE";
  
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

  const solanaSwap = new SolanaSwap(
    keypair,
    "https://api.mainnet-beta.solana.com"
  );

  const swapResponse = await solanaSwap.getSwapInstructions(
    "So11111111111111111111111111111111111111112", // From Token (SOL)
    "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // To Token (example)
    0.005, // Amount to swap
    10, // Slippage tolerance (in percentage)
    keypair.publicKey.toBase58(),
    0.0005 // Priority fee
  );

  try {
    const txid = await solanaSwap.performSwap(swapResponse, {
      sendConfig: { skipPreflight: true },
      maxConfirmationAttempts: 30,
      confirmationTimeout: 500,
      commitmentLevel: "processed",
      jitoConfig: useJito ? { active: true, tip: 0.0001 } : undefined,
    });

    console.log("TX Hash:", txid);
    console.log("TX on Solscan:", `https://solscan.io/tx/${txid}`);
  } catch (error) {
    console.error("Error while performing the swap:", error.message);
  }
}

// Run the swap function
swapIt(false); // Set to true to use Jito for faster transactions

