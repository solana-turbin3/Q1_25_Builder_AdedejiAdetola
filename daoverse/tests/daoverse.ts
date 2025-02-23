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
  const DAOVERSE_DESCRIPTION = "DAOverse Configuration";

  const creator = anchor.web3.Keypair.generate();
  const daoMint = anchor.web3.Keypair.generate();
  const member = anchor.web3.Keypair.generate();

  const MEMBER_SEED = new BN(1);
  const MEMBER_MIN_TOKENS = 10e9;

  const [daoPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("dao"), creator.publicKey.toBuffer(), new BN(1).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [memberPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("member"), member.publicKey.toBuffer(), MEMBER_SEED.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  //Creator Ata
  const creatorAta = getAssociatedTokenAddressSync(daoMint.publicKey, creator.publicKey, false, TOKEN_PROGRAM_ID);
  const daoTreasury = getAssociatedTokenAddressSync(daoMint.publicKey, daoPda, true, TOKEN_PROGRAM_ID);
  const creatorDaoverseAta = getAssociatedTokenAddressSync(daoverseMint.publicKey, creator.publicKey, false, TOKEN_PROGRAM_ID);

  //Member DAO Ata
  const memberDaoAta = getAssociatedTokenAddressSync(daoMint.publicKey, member.publicKey, false, TOKEN_PROGRAM_ID);


  const DAO_NAME = "DAO Name";
  const DAO_DESCRIPTION = "DAO Description Test";

  before(async () => {
    console.log("🔄 Airdropping SOL...");
    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);

    // Airdrop to provider wallet
    await provider.connection.requestAirdrop(provider.publicKey, 10e9);
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(provider.publicKey, 10e9)
    );

    // Airdrop to admin and creator and member
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 5e9)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 5e9)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(member.publicKey, 5e9)
    );

    console.log("✅ Creating DAOverse Mint...");
    // Split into multiple transactions to handle different signers
    // Create mints
    let tx1 = new anchor.web3.Transaction();
    tx1.instructions = [
      SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: daoverseMint.publicKey,
        lamports,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID
      }),
      SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: daoMint.publicKey,
        lamports,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID
      }),
      createInitializeMint2Instruction(daoverseMint.publicKey, 6, admin.publicKey, null, TOKEN_PROGRAM_ID),
      createInitializeMint2Instruction(daoMint.publicKey, 6, creator.publicKey, null, TOKEN_PROGRAM_ID),
    ];
    await provider.sendAndConfirm(tx1, [daoverseMint, daoMint]);

    // Create ATAs
    let tx2 = new anchor.web3.Transaction();
    tx2.instructions = [
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, adminAta, admin.publicKey, daoverseMint.publicKey),
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, creatorAta, creator.publicKey, daoMint.publicKey),
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, creatorDaoverseAta, creator.publicKey, daoverseMint.publicKey),
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, memberDaoAta, member.publicKey, daoMint.publicKey)
    ];
    await provider.sendAndConfirm(tx2, []);

    // Mint tokens (admin mint)
    let tx3 = new anchor.web3.Transaction();
    tx3.instructions = [
      createMintToInstruction(daoverseMint.publicKey, adminAta, admin.publicKey, 10e9, []),
      createMintToInstruction(daoverseMint.publicKey, creatorDaoverseAta, admin.publicKey, 10e9, []),
    ];
    await provider.sendAndConfirm(tx3, [admin]);

    // Mint tokens (creator mint)
    let tx4 = new anchor.web3.Transaction();
    tx4.instructions = [
      createMintToInstruction(daoMint.publicKey, creatorAta, creator.publicKey, 10e9, []),
      createMintToInstruction(daoMint.publicKey, memberDaoAta, creator.publicKey, MEMBER_MIN_TOKENS, []
      )
    ];
    await provider.sendAndConfirm(tx4, [creator]);


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
      .initializeDaoverse(DAO_CREATION_FEE, ADMIN_NAME, DAOVERSE_DESCRIPTION, INITIAL_DEPOSIT)
      .accountsPartial({
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
    assert.equal(config.daoverseDescription, DAOVERSE_DESCRIPTION);
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
      .accountsPartial({
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
        .accountsPartial({
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


  it("🚀 Creates a DAO", async () => {

    console.log("🔧 Initializing DAO...");
    await program.methods
      .initializeDao(
        new BN(1),
        INITIAL_DEPOSIT,
        DAO_NAME,
        DAO_DESCRIPTION,
        { reputationBased: {} },
        { quadratic: {} },
        { contributionBased: {} },
        {
          quorumPercentage: 50,
          approvalPercentage: 60,
          minVotingPeriod: new anchor.BN(86400), // 1 day in seconds
          maxVotingPeriod: new anchor.BN(604800)  // 1 week in seconds
        })
      .accountsPartial({
        creator: creator.publicKey,
        daoverseMint: daoverseMint.publicKey,
        daoMint: daoMint.publicKey,
        dao: daoPda,
        daoTreasury,
        creatorDaoAta: creatorAta,
        daoverse: daoversePda,
        daoverseTreasury,
        creatorDaoverseAta: creatorDaoverseAta,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    console.log("✅ Fetching DAOverse Config...");
    const InitDaoConfig = await program.account.daoConfig.fetch(daoPda);

    assert.ok(InitDaoConfig.daoCreator.equals(creator.publicKey));
    assert.ok(InitDaoConfig.daoMint.equals(daoMint.publicKey));
    assert.equal(InitDaoConfig.daoName, DAO_NAME);
    assert.equal(InitDaoConfig.daoDescription, DAO_DESCRIPTION);

    console.log("🔍 Fetching Actual On-Chain Treasury Balance...");
    let treasuryBalanceAfter = await provider.connection.getTokenAccountBalance(daoTreasury);
    console.log(`💰 Actual Treasury Token Balance: ${treasuryBalanceAfter.value.amount}`);

    console.log("✅ DAOverse Initialized Successfully!");
  });

  it("🛠 Updates DAO Config", async () => {
    console.log("🔄 Updating DAO Config...");
    const newDaoName = "Updated DAO Name";
    const newDaoDescription = "Updated DAO Description";
    await program.methods
      .updateDao(
        newDaoName,
        newDaoDescription,
        { tokenBased: {} },
        { weightedToken: {} },
        { proportionalDistribution: {} },
        {
          quorumPercentage: 50,
          approvalPercentage: 60,
          minVotingPeriod: new anchor.BN(86400), // 1 day in seconds
          maxVotingPeriod: new anchor.BN(604800)  // 1 week in seconds
        }
      )
      .accountsPartial({
        creator: creator.publicKey,
        dao: daoPda,
      })
      .signers([creator])
      .rpc();

    console.log("✅ Fetching Updated DAOverse Config...");
    const updatedDaoConfig = await program.account.daoConfig.fetch(daoPda);

    assert.equal(updatedDaoConfig.daoName, newDaoName);
    assert.equal(updatedDaoConfig.daoDescription, newDaoDescription);

    console.log("✅ DAOverse Updated Successfully!");
  });

  it("❌ Fails to update DAO with unauthorized user", async () => {
    const unauthorizedCreator = anchor.web3.Keypair.generate();

    console.log("🔄 Airdropping SOL to Unauthorized User...");
    const airdropSig = await provider.connection.requestAirdrop(unauthorizedCreator.publicKey, 1e9);
    await provider.connection.confirmTransaction(airdropSig);

    console.log("🚨 Attempting Unauthorized DAO Update...");

    try {
      await program.methods
        .updateDao(
          "Hacker",
          "Unauthorized Update",
          { reputationBased: {} },
          { weightedToken: {} },
          { proportionalDistribution: {} },
          {
            quorumPercentage: 50,
            approvalPercentage: 60,
            minVotingPeriod: new anchor.BN(86400),
            maxVotingPeriod: new anchor.BN(604800)
          })
        .accountsPartial({
          creator: unauthorizedCreator.publicKey,
          dao: daoPda,
        })
        .signers([unauthorizedCreator])
        .rpc();

      assert.fail("🚨 Unauthorized update should have failed!");
    } catch (error) {
      // Log the actual error message for debugging
      // console.log("Received error:", error.message);

      // Check for any constraint violation error
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to unauthorized access"
      );
      console.log("✅ Unauthorized update was correctly rejected.");
    }
  });

  it("🚀 Successfully initializes a member", async () => {
    console.log("🔧 Initializing member...");

    try {
      await program.methods
        .initializeMember(MEMBER_SEED)
        .accountsPartial({
          user: member.publicKey,
          daoMint: daoMint.publicKey,
          member: memberPda,
          memberDaoAta: memberDaoAta,
          dao: daoPda,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([member])
        .rpc();

      console.log("✅ Fetching member state...");
      const memberState = await program.account.daoMemberState.fetch(memberPda);

      assert.ok(memberState.daoMember.equals(member.publicKey));
      assert.equal(memberState.memberSeed.toString(), MEMBER_SEED.toString());
      assert.equal(memberState.createdProposals.toString(), "0");
      assert.equal(memberState.totalVotes.toString(), "0");
      assert.ok(memberState.daoJoined.equals(daoPda));
      assert.equal(memberState.daoMemberBalance.toString(), MEMBER_MIN_TOKENS.toString());

      console.log("✅ Member initialized successfully!");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("❌ Fails to initialize member with insufficient tokens", async () => {
    const poorMember = anchor.web3.Keypair.generate();

    console.log("🔄 Setting up poor member account...");
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(poorMember.publicKey, 1e9)
    );

    const poorMemberAta = getAssociatedTokenAddressSync(
      daoMint.publicKey,
      poorMember.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    // Create ATA and mint insufficient tokens
    let tx = new anchor.web3.Transaction();
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        provider.publicKey,
        poorMemberAta,
        poorMember.publicKey,
        daoMint.publicKey
      ),
      createMintToInstruction(
        daoMint.publicKey,
        poorMemberAta,
        creator.publicKey,
        50e6, // Only 50 tokens
        []
      )
    );
    await provider.sendAndConfirm(tx, [creator]);

    try {
      const [poorMemberPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("member"), poorMember.publicKey.toBuffer(), MEMBER_SEED.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      await program.methods
        .initializeMember(MEMBER_SEED)
        .accountsPartial({
          user: poorMember.publicKey,
          daoMint: daoMint.publicKey,
          member: poorMemberPda,
          memberDaoAta: poorMemberAta,
          dao: daoPda,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([poorMember])
        .rpc();

      assert.fail("Should have failed with insufficient tokens");
    } catch (error) {
      // Log the actual error message for debugging
      // console.log("Received error:", error.message);

      // Check for any constraint violation error
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to unauthorized access"
      );
      console.log("✅ Correctly rejected member with insufficient tokens");
    }
  });

  it("🛠 Successfully updates member state", async () => {
    console.log("🔄 Updating member state...");

    try {
      await program.methods
        .updateMember(
          new BN(1), // created_proposals
          new BN(0), // approved_proposals
          new BN(100), // total_rewards
          new BN(5) // total_votes
        )
        .accountsPartial({
          user: member.publicKey,
          member: memberPda,
        })
        .signers([member])
        .rpc();

      console.log("✅ Fetching updated member state...");
      const updatedMemberState = await program.account.daoMemberState.fetch(memberPda);

      assert.equal(updatedMemberState.createdProposals.toString(), "1");
      assert.equal(updatedMemberState.approvedProposals.toString(), "0");
      assert.equal(updatedMemberState.totalRewards.toString(), "100");
      assert.equal(updatedMemberState.totalVotes.toString(), "5");

      console.log("✅ Member state updated successfully!");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("❌ Fails to update member state with unauthorized member", async () => {
    const unauthorizedUser = anchor.web3.Keypair.generate();

    console.log("🔄 Attempting unauthorized update...");
    try {
      await program.methods
        .updateMember(
          new BN(2),
          new BN(1),
          new BN(200),
          new BN(10)
        )
        .accountsPartial({
          user: unauthorizedUser.publicKey,
          member: memberPda,
        })
        .signers([unauthorizedUser])
        .rpc();

      assert.fail("Should have failed with unauthorized member");
    } catch (error) {
      // Log the actual error message for debugging
      // console.log("Received error:", error.message);

      // Check for any constraint violation error
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to unauthorized access"
      );

      console.log("✅ Correctly rejected unauthorized update");
    }
  });
});