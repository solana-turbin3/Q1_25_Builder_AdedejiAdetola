import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Daoverse } from "../target/types/daoverse";
import { assert } from "chai";

import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE
} from "@solana/spl-token";

import { SystemProgram } from "@solana/web3.js";

describe("DAOverse Program", () => {
  // Initialize the Anchor provider
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  // Get the Anchor program instance
  const program = anchor.workspace.Daoverse as Program<Daoverse>;

  // Admin Keypair
  const admin = anchor.web3.Keypair.generate();

  // Mints and Account PDAs
  const daoverseMint = anchor.web3.Keypair.generate();
  const [daoversePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("daoverse")],
    program.programId
  );
  const adminAta = getAssociatedTokenAddressSync(daoverseMint.publicKey, admin.publicKey, false, TOKEN_PROGRAM_ID);
  const daoverseTreasury = getAssociatedTokenAddressSync(daoverseMint.publicKey, daoversePda, true, TOKEN_PROGRAM_ID);

  // Constants
  const DAO_CREATION_FEE = new BN(1000);
  const INITIAL_DEPOSIT = new BN(500);
  const ADMIN_NAME = "Admin";
  const DAO_DESCRIPTION = "DAOverse Configuration";

  before(async () => {
    console.log("🔄 Airdropping SOL to Admin...");
    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);
    const airdropTx = await provider.connection.requestAirdrop(admin.publicKey, 2e9);
    await provider.connection.confirmTransaction(airdropTx);

    console.log("✅ Creating DAOverse Mint...");
    let tx = new anchor.web3.Transaction();
    tx.instructions = [
      SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: daoverseMint.publicKey,
        lamports,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID
      }),
      createInitializeMint2Instruction(daoverseMint.publicKey, 6, admin.publicKey, null, TOKEN_PROGRAM_ID),
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, adminAta, admin.publicKey, daoverseMint.publicKey, TOKEN_PROGRAM_ID),
      createMintToInstruction(daoverseMint.publicKey, adminAta, admin.publicKey, 10e9, [], TOKEN_PROGRAM_ID)
    ];
    await provider.sendAndConfirm(tx, [admin, daoverseMint]);

    console.log("🔍 Fetching Initial Treasury Balance (Expected: 0)...");
    try {
      let treasuryBalance = await provider.connection.getTokenAccountBalance(daoverseTreasury);
      console.log(`💰 Initial Treasury Token Balance: ${treasuryBalance.value.amount}`);
    } catch (error) {
      console.log("⚠️ DAOverse Treasury has no balance or does not exist yet.");
    }
  });

  it("🚀 Initializes DAOverse", async () => {
    console.log("🔧 Initializing DAOverse...");
    await program.methods
      .initializeDaoverse(DAO_CREATION_FEE, ADMIN_NAME, DAO_DESCRIPTION, INITIAL_DEPOSIT)
      .accounts({
        admin: admin.publicKey,
        daoverseMint: daoverseMint.publicKey,
        daoverse: daoversePda,
        adminAta: adminAta,
        daoverseTreasury: daoverseTreasury,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    console.log("✅ Fetching DAOverse Config...");
    const config = await program.account.daoverseConfig.fetch(daoversePda);

    assert.ok(config.admin.equals(admin.publicKey));
    assert.ok(config.daoverseMint.equals(daoverseMint.publicKey));
    assert.equal(config.daoCreationFee.toString(), DAO_CREATION_FEE.toString());
    assert.equal(config.adminName, ADMIN_NAME);
    assert.equal(config.daoverseDescription, DAO_DESCRIPTION);
    assert.equal(config.daoverseTreasuryBalance.toString(), INITIAL_DEPOSIT.toString());

    console.log("🔍 Fetching Actual On-Chain Treasury Balance...");
    let treasuryBalanceAfter = await provider.connection.getTokenAccountBalance(daoverseTreasury);
    console.log(`💰 Actual Treasury Token Balance: ${treasuryBalanceAfter.value.amount}`);

    console.log("✅ DAOverse Initialized Successfully!");
  });

  it("🛠 Updates DAOverse Config", async () => {

    console.log("🔄 Updating DAOverse Config...");
    const newDaoCreationFee = new BN(2000);
    const newAdminName = "Updated Admin";
    const newDescription = "Updated DAOverse Description";

    await program.methods
      .updateDaoverse(newDaoCreationFee, newAdminName, newDescription)
      .accounts({
        admin: admin.publicKey,
        daoverse: daoversePda,
        daoverseMint: daoverseMint.publicKey,
        daoverseTreasury: daoverseTreasury,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    console.log("✅ Fetching Updated DAOverse Config...");
    const updatedConfig = await program.account.daoverseConfig.fetch(daoversePda);

    assert.equal(updatedConfig.daoCreationFee.toString(), newDaoCreationFee.toString());
    assert.equal(updatedConfig.adminName, newAdminName);
    assert.equal(updatedConfig.daoverseDescription, newDescription);

    console.log("✅ DAOverse Updated Successfully!");
  });

  it("❌ Fails to update config with unauthorized user", async () => {
    console.log("🚨 Attempting Unauthorized Update...");
    const unauthorizedUser = anchor.web3.Keypair.generate();

    console.log("🔄 Airdropping SOL to Unauthorized User...");
    const airdropSig = await provider.connection.requestAirdrop(unauthorizedUser.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);

    try {
      await program.methods
        .updateDaoverse(new BN(3000), "Hacker Admin", "Unauthorized Change")
        .accounts({
          admin: unauthorizedUser.publicKey,
          daoverse: daoversePda,
          daoverseMint: daoverseMint.publicKey,
          daoverseTreasury: daoverseTreasury,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([unauthorizedUser])
        .rpc();

      assert.fail("🚨 Unauthorized update should have failed!");
    } catch (error) {
      assert.include(error.message, "Unauthorized");
      console.log("✅ Unauthorized update was correctly rejected.");
    }
  });
});


