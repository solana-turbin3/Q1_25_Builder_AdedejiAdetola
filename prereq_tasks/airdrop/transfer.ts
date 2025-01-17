import {
    Transaction,
    SystemProgram,
    Connection,
    Keypair,
    sendAndConfirmTransaction,
    PublicKey,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("8Jwcot83CBXzAj1a7HEn1C8F6yymstKNjxUBpUEyRYqz");
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
    try {
        const balance = await connection.getBalance(from.publicKey);
        console.log(`Current balance: ${balance} lamports`);

        // Create transaction to calculate fees
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to,
                lamports: balance,
            })
        );
        
        transaction.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
        transaction.feePayer = from.publicKey;

        // Calculate fee
        const fee = (await connection.getFeeForMessage(transaction.compileMessage(), "confirmed")).value || 0;
        console.log(`Transaction fee: ${fee} lamports`);

        // Remove instruction and add new one with adjusted amount
        transaction.instructions.pop();
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to,
                lamports: balance - fee,
            })
        );

        // Sign and send
        const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
        console.log(
            `Success! Check out your TX here: https://explorer.solana.com/tx/${signature}?cluster=devnet`
        );
    } catch (e) {
        console.error(`Oops, something went wrong: ${e}`);
    }
})();