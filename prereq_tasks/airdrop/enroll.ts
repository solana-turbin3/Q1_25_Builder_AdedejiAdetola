// enroll.ts
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./Turbin3-wallet.json";

// Import the keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Your GitHub account (replace "<your github account>" with actual GitHub username)
const github = Buffer.from("AdedejiAdetola", "utf8");

// Create the Anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });

// Create the program object from IDL and provider
const program: Program<Turbin3Prereq> = new Program(IDL, provider);

// Create the PDA for the prereq account
const enrollment_seeds = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

// Execute the enrollment transaction
(async () => {
  try {
    const txhash = await program.methods
      .complete(github)
      .accounts({
        signer: keypair.publicKey,
      })
      .signers([keypair])
      .rpc();

    console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();




// const web3 = require("@solana/web3.js");
// const bs58 = require('bs58');
// let secretKey = bs58.default.decode("your private key");
// console.log(`[${web3.Keypair.fromSecretKey(secretKey).secretKey}]`);

// exporting back from Uint8Array to bs58 private key
// == from solana cli id.json key file to phantom private key

// const bs58 = require('bs58');
// privkey = new Uint8Array([111, 43, 24, ...]); // content of id.json here
// console.log(bs58.encode(privkey));
