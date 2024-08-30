const { Keypair } = require("@solana/web3.js");
const bs58 = require("bs58");
const SolanaSwap = require("@solxtence/solana-swap");

// Function to perform a token swap
async function swapIt() {
  // Step 1: Initialize the Keypair using a Private Key
  // Note: You're not sending your Private Key to anywhere here, it is only used to sign the transaction !
  const keypair = Keypair.fromSecretKey(
    bs58.decode(
      "4hJPMMPvUpvKnKCYe16XK5MGDTqYw8bCmf6UVcCV8wMh3imssDDDxiBWwkRf5vgAY3rTfLJe5htxray3VWjHn8Vn"
    )
  );

  // Step 2: Initialize the SolanaSwap instance
  const solanaSwap = new SolanaSwap(
    keypair,
    "https://api.mainnet-beta.solana.com"
  );

  // Step 3: Fetch swap instructions from Solxtence swap API
  // These instructions specify how to swap one token for another
  const swapResponse = await solanaSwap.getSwapInstructions(
    // The token you want to swap (From Token)
    "So11111111111111111111111111111111111111112",
    // The token you want to receive (To Token)
    "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    0.005, // Amount to swap
    10, // Slippage tolerance (in percentage)
    keypair.publicKey.toBase58(), // Payer Public Key
    0.0005 // Priority fee to speed up the transaction
  );

  // Step 4a: Perform the swap as a regular transaction
  try {
    const txid = await solanaSwap.performSwap(swapResponse, {
      sendConfig: { skipPreflight: true }, // Skip the preflight transaction simulation
      maxConfirmationAttempts: 30, // Number of retries for confirmation
      confirmationTimeout: 500, // Timeout between retries in milliseconds
      lastValidBlockHeightBuffer: 150, // Block height buffer for validity
      resendDelay: 1000, // Interval to resend the transaction in case of failure
      statusCheckInterval: 1000, // Interval to check confirmation status
      commitmentLevel: "processed", // Level of commitment for confirmation ("processed", "confirmed", "finalized")
      bypassConfirmation: false, // Set to true to skip confirmation checks and return txid immediately
    });

    // Log the transaction ID and URL on Solscan
    console.log("TX Hash:", txid);
    console.log("TX on Solscan:", `https://solscan.io/tx/${txid}`);
  } catch (error) {
    const { signature, message } = error;
    console.error("Error while performing the swap:", message, signature);
  }

  // Step 4b: Perform the swap using Jito
  try {
    const txid = await solanaSwap.performSwap(swapResponse, {
      sendConfig: { skipPreflight: true },
      maxConfirmationAttempts: 30,
      confirmationTimeout: 500,
      commitmentLevel: "processed",
      jitoConfig: {
        active: true,
        tip: 0.0001,
      },
    });

    // Log the transaction ID and URL on Solscan
    console.log("TX Hash:", txid);
    console.log("TX on Solscan:", `https://solscan.io/tx/${txid}`);
  } catch (error) {
    const { signature, message } = error;
    console.error("Error while performing the swap:", message, signature);
  }
}
