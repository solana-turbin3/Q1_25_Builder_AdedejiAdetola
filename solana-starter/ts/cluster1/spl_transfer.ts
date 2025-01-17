import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../Turbin3-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("Dk1tBT34MuYT8nX8CpjM6GyoxndVKuFUfzZjM5WgnUCY");

// Recipient address
const to = new PublicKey("2CquYcQoBGv8MiiMfP3Lgut79oLCtDbCTrB6fnQm1WeG"); //apaar
//85Wnyyd6RNm7mow351m6hgnfQtTgUJWUph1FkZMh5Spy

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it

        const fromWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);

        // Get the token account of the toWallet address, and if it does not exist, create it
        const toWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, to);

        // Transfer the new token to the "toTokenAccount" we just created
        const signature = await transfer(connection, keypair, fromWallet.address, toWallet.address, keypair, 1);

    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();