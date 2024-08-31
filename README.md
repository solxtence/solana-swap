# Solana Swap

Package for performing token swaps on Solana - *Jito integrated 🚀*

**Made with the Public and Free [Swap API](https://docs.solxtence.com/swap) by Solxtence <3**

Useful for Sniper Bots, Volume Bots, Trading bots, Swap Platforms, DeFi applications...

## Supported Platforms ⭐️
- Pump.fun
- Moonshot
- Raydium
- Raydium CPMM
- Orca
- Jupiter AMMs

## ⚠️ Important Security Note
Your private key is never sent to the Solxtence API or any third party. It's only used locally to sign the transaction in your code. However, it's always recommended to review the code of any packages you are using for potential security issues or malicious code.

## Prerequisites

- Install Node.js from [nodejs.org](https://nodejs.org/)

## Installation

1. Create a new project folder
   ```
   mkdir my-solana-swap
   cd my-solana-swap
   ```

2. Initialize your project
   ```
   npm init -y
   ```

3. Install necessary packages
   ```
   npm install @solana/web3.js bs58 @solxtence/solana-swap
   ```

4. Create a new file named `swap.js` in your project folder

## Build Your Swap Script

Open `swap.js` in a text editor:

1. Import required modules:
   ```javascript
   const { Keypair } = require("@solana/web3.js");
   const bs58 = require("bs58");
   const SolanaSwap = require("@solxtence/solana-swap");
   ```
   This imports the necessary functions and classes we'll use.

2. Create the main function:
   ```javascript
   async function swapIt(useJito = false) {
     // We'll add the swap logic here
   }
   ```
   This function will contain our swap logic.

3. Set up the keypair:
   ```javascript
   const privateKey = "YOUR_PRIVATE_KEY_HERE";
   const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
   ```
   Replace `YOUR_PRIVATE_KEY_HERE` with your actual Solana wallet private key. This creates a keypair for signing transactions.

4. Initialize SolanaSwap:
   ```javascript
   const solanaSwap = new SolanaSwap(
     keypair,
     "https://api.mainnet-beta.solana.com"
   );
   ```
   This sets up the SolanaSwap instance with your keypair and a Solana RPC endpoint.

5. Get swap instructions:
   ```javascript
   const swapResponse = await solanaSwap.getSwapInstructions(
     "So11111111111111111111111111111111111111112", // From Token (SOL)
     "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // To Token (example)
     0.005, // Amount to swap
     10, // Slippage tolerance (in percentage)
     keypair.publicKey.toBase58(),
     0.0005 // Priority fee
   );
   ```
   This fetches the instructions from [our Swap API](https://docs.solxtence.com/swap/swap "our Swap API") for the swap. Customize the token addresses, amount, slippage, and fees as needed.

6. Perform the swap:
   ```javascript
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
   ```
   This executes the swap and handles the result, whether successful or not.

7. Call the function:
   ```javascript
   swapIt(false); // Set to true to use Jito for faster transactions
   ```
   This runs the swap function. Change `false` to `true` to use Jito.

Find the full example [here](https://github.com/solxtence/solana-swap/blob/98cc56e46317de263d0efda53378a3e089f28dfe/example.js).

## Running Your Script

Run your script using:
```
node swap.js
```

## Important Notes

- Always double-check token addresses and amounts before swapping
- Keep your private key secret and secure
- It's good practice to review any code that interacts with your wallet or performs financial transactions

## Troubleshooting

- If you get an error about missing modules, make sure you've installed all required packages (step 3)
- If the swap fails, check that you have enough balance and that the token addresses are correct
- If any unexpected error happens, just open an issue [here](https://github.com/solxtence/solana-swap/issues "here") and we will fix it as soon as possible <3

Remember, when dealing with real funds, start with small amounts to test everything works correctly!

## Resources
- [Swap API Docs](https://docs.solxtence.com/swap "Swap API Docs")
- [SolanaSwap NPM Package](https://www.npmjs.com/package/@solxtence/solana-swap "SolanaSwap NPM Package")

## FAQ

#### Is there a fee for using this API?
No, the Swap API is completely free -  no fees included!
