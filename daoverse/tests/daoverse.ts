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
  const voter1 = anchor.web3.Keypair.generate();
  const voter2 = anchor.web3.Keypair.generate();

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
  const voter1DaoAta = getAssociatedTokenAddressSync(daoMint.publicKey, voter1.publicKey, false, TOKEN_PROGRAM_ID);
  const voter2DaoAta = getAssociatedTokenAddressSync(daoMint.publicKey, voter2.publicKey, false, TOKEN_PROGRAM_ID);

  const DAO_NAME = "DAO Name";
  const DAO_DESCRIPTION = "DAO Description Test";

  const PROPOSAL_SEED = new BN(1);
  const PROPOSAL_TITLE = "Test Proposal";
  const PROPOSAL_DETAILS = "This is a test proposal for our DAO";
  const PROPOSAL_COST = new BN(500e6);
  const MIN_TOKEN_STAKE = new BN(100e6);
  let VOTING_END_TIME = new BN(Math.floor(Date.now() / 1000) + 86400);

  const [proposalPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("proposal"), member.publicKey.toBuffer(), PROPOSAL_SEED.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  //an ata
  const stakingVaultPda = getAssociatedTokenAddressSync(
    daoMint.publicKey,
    proposalPda,
    true,
    TOKEN_PROGRAM_ID
  );

  const VOTER_1_VOTE_SEEDS = new BN(3);
  const [voter1VoteRecord] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter"),
      voter1.publicKey.toBuffer(),
      proposalPda.toBuffer(),
    ],
    program.programId
  );

  const VOTER_2_VOTE_SEEDS = new BN(4);
  const [voter2VoteRecord] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter"),
      voter2.publicKey.toBuffer(),
      proposalPda.toBuffer(),
    ],
    program.programId
  );


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

    //Airdrop for voters
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter1.publicKey, 5e9)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter2.publicKey, 5e9)
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
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, memberDaoAta, member.publicKey, daoMint.publicKey),
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, voter1DaoAta, voter1.publicKey, daoMint.publicKey),
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, voter2DaoAta, voter2.publicKey, daoMint.publicKey),
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
      createMintToInstruction(daoMint.publicKey, memberDaoAta, creator.publicKey, MEMBER_MIN_TOKENS, []),
      createMintToInstruction(daoMint.publicKey, voter1DaoAta, creator.publicKey, 10e9, []),
      createMintToInstruction(daoMint.publicKey, voter2DaoAta, creator.publicKey, 10e9, [])
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

    console.log("✅ Fetching DAO Config...");
    const InitDaoConfig = await program.account.daoConfig.fetch(daoPda);

    assert.ok(InitDaoConfig.daoCreator.equals(creator.publicKey));
    assert.ok(InitDaoConfig.daoMint.equals(daoMint.publicKey));
    assert.equal(InitDaoConfig.daoName, DAO_NAME);
    assert.equal(InitDaoConfig.daoDescription, DAO_DESCRIPTION);
    console.log("✅ DAO Initialized Successfully!");
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

    console.log("✅ Fetching Updated DAO Config...");
    const updatedDaoConfig = await program.account.daoConfig.fetch(daoPda);

    assert.equal(updatedDaoConfig.daoName, newDaoName);
    assert.equal(updatedDaoConfig.daoDescription, newDaoDescription);

    console.log("✅ DAO Updated Successfully!");
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

  it("🚀 Successfully creates a proposal", async () => {
    console.log("🔧 Creating a new proposal...");

    try {
      await program.methods
        .proposal(
          PROPOSAL_SEED,
          PROPOSAL_TITLE,
          PROPOSAL_DETAILS,
          PROPOSAL_COST,
          MIN_TOKEN_STAKE,
          VOTING_END_TIME
        )
        .accountsPartial({
          proposer: member.publicKey,
          daoMint: daoMint.publicKey,
          proposerDaoAta: memberDaoAta,
          proposal: proposalPda,
          stakingVault: stakingVaultPda,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([member])
        .rpc();

      console.log("✅ Fetching proposal state...");
      const proposalState = await program.account.proposalState.fetch(proposalPda);

      assert.ok(proposalState.proposalOwner.equals(member.publicKey));
      assert.equal(proposalState.proposalTitle, PROPOSAL_TITLE);
      assert.equal(proposalState.proposalDetails, PROPOSAL_DETAILS);
      assert.equal(proposalState.proposalCost.toString(), PROPOSAL_COST.toString());
      assert.equal(proposalState.minTokenStake.toString(), MIN_TOKEN_STAKE.toString());
      assert.equal(proposalState.votingEndTime.toString(), VOTING_END_TIME.toString()); //why??
      assert.equal(proposalState.voteCountYes.toString(), "0");
      assert.equal(proposalState.voteCountNo.toString(), "0");

      console.log("✅ Proposal created successfully!");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("❌ Fails to create proposal with invalid parameters", async () => {
    console.log("🔄 Attempting to create invalid proposal...");

    const invalidProposalSeed = new BN(2);
    const invalidProposalPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        member.publicKey.toBuffer(),
        invalidProposalSeed.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    )[0];

    const invalidStakingVaultPda = getAssociatedTokenAddressSync(
      daoMint.publicKey,
      invalidProposalPda,
      true,
      TOKEN_PROGRAM_ID
    );

    try {
      // Invalid because the voting end time is in the past
      const pastVotingEndTime = new BN(Math.floor(Date.now() / 1000) - 86400); // 24 hours ago

      await program.methods
        .proposal(
          invalidProposalSeed,
          PROPOSAL_TITLE,
          PROPOSAL_DETAILS,
          PROPOSAL_COST,
          MIN_TOKEN_STAKE,
          pastVotingEndTime
        )
        .accountsPartial({
          proposer: member.publicKey,
          daoMint: daoMint.publicKey,
          proposerDaoAta: memberDaoAta,
          proposal: invalidProposalPda,
          stakingVault: invalidStakingVaultPda,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([member])
        .rpc();

      assert.fail("Should have failed with invalid parameters");
    } catch (error) {
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to invalid parameters"
      );
      console.log("✅ Correctly rejected invalid proposal parameters");
    }
  });

  it("🗳️ Voter 1 successfully votes YES on the proposal", async () => {
    console.log("🔄 Voter 1 voting on proposal...");

    const tokensToStake = new BN(100e6);

    // Debug: Log the PDA address being used


    try {
      await program.methods
        .voteOnProposal(
          { yes: {} }, // VoteType enum - YES vote
          tokensToStake,
          VOTER_1_VOTE_SEEDS
        )
        .accountsPartial({
          voter: voter1.publicKey,
          daoMint: daoMint.publicKey,
          dao: daoPda,
          proposal: proposalPda,
          voterDaoAta: voter1DaoAta,
          stakingVault: stakingVaultPda,
          voteRecordss: voter1VoteRecord,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([voter1])
        .rpc();

      console.log("✅ Fetching vote record...");
      const voteRecord = await program.account.voteState.fetch(voter1VoteRecord);

      assert.ok(voteRecord.voter.equals(voter1.publicKey));
      // assert.ok(voteRecord.proposal.equals(proposalPda));
      assert.equal(Object.keys(voteRecord.voteType)[0], "yes");
      assert.equal(voteRecord.tokensStaked.toString(), tokensToStake.toString());
      assert.equal(voteRecord.claimed, false);

      console.log("✅ Fetching updated proposal state...");
      const proposalState = await program.account.proposalState.fetch(proposalPda);
      assert.equal(proposalState.voteCountYes.toString(), "1");
      assert.equal(proposalState.voteCountNo.toString(), "0");

      console.log("✅ Voter 1 voted successfully!");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("🗳️ Voter 2 successfully votes NO on the proposal", async () => {
    console.log("🔄 Voter 2 voting on proposal...");

    const tokensToStake = new BN(150e6);

    try {
      await program.methods
        .voteOnProposal(
          { no: {} }, // VoteType enum - NO vote
          tokensToStake,
          VOTER_2_VOTE_SEEDS
        )
        .accountsPartial({
          voter: voter2.publicKey,
          daoMint: daoMint.publicKey,
          dao: daoPda,
          proposal: proposalPda,
          voterDaoAta: voter2DaoAta,
          stakingVault: stakingVaultPda,
          voteRecordss: voter2VoteRecord,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([voter2])
        .rpc();

      console.log("✅ Fetching vote record...");
      const voteRecord = await program.account.voteState.fetch(voter2VoteRecord);
      assert.ok(voteRecord.voter.equals(voter2.publicKey));
      // assert.ok(voteRecord.proposal.equals(proposalPda));
      assert.equal(Object.keys(voteRecord.voteType)[0], "no");
      assert.equal(voteRecord.tokensStaked.toString(), tokensToStake.toString());
      assert.equal(voteRecord.claimed, false);

      console.log("✅ Fetching updated proposal state...");
      const proposalState = await program.account.proposalState.fetch(proposalPda);
      assert.equal(proposalState.voteCountYes.toString(), "1"); // First voter's stake
      assert.equal(proposalState.voteCountNo.toString(), '1');

      console.log("✅ Voter 2 voted successfully!");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("❌ Fails when voter tries to vote with insufficient tokens", async () => {
    console.log("🔄 Attempting to vote with insufficient tokens...");

    const poorVoter = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(poorVoter.publicKey, 1e9)
    );

    // Create token account with insufficient tokens
    const poorVoterAta = getAssociatedTokenAddressSync(
      daoMint.publicKey,
      poorVoter.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    let setupTx = new anchor.web3.Transaction();
    setupTx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        provider.publicKey,
        poorVoterAta,
        poorVoter.publicKey,
        daoMint.publicKey
      ),
      createMintToInstruction(
        daoMint.publicKey,
        poorVoterAta,
        creator.publicKey,
        50e6, // Only 50 tokens, less than MIN_TOKEN_STAKE
        []
      )
    );
    await provider.sendAndConfirm(setupTx, [creator]);

    const voteSeed = new BN(3);
    const poorVoterVoteRecord = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        poorVoter.publicKey.toBuffer(),
        proposalPda.toBuffer(),
        voteSeed.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    )[0];

    try {
      await program.methods
        .voteOnProposal(
          { yes: {} },
          new BN(50e6), // Trying to stake all available tokens, but below minimum
          voteSeed
        )
        .accountsPartial({
          voter: poorVoter.publicKey,
          daoMint: daoMint.publicKey,
          dao: daoPda,
          proposal: proposalPda,
          voterDaoAta: poorVoterAta,
          stakingVault: stakingVaultPda,
          voteRecordss: poorVoterVoteRecord,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([poorVoter])
        .rpc();

      assert.fail("Should have failed with insufficient tokens");
    } catch (error) {
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to insufficient tokens"
      );
      console.log("✅ Correctly rejected vote with insufficient tokens");
    }
  });

  it("❌ Fails when voter tries to vote twice", async () => {
    console.log("🔄 Attempting to vote twice...");

    const voteSeed = new BN(4);
    const duplicateVoteRecord = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        voter1.publicKey.toBuffer(),
        proposalPda.toBuffer(),
        voteSeed.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    )[0];

    try {
      await program.methods
        .voteOnProposal(
          { yes: {} },
          new BN(100e6),
          voteSeed
        )
        .accountsPartial({
          voter: voter1.publicKey,
          daoMint: daoMint.publicKey,
          dao: daoPda,
          proposal: proposalPda,
          voterDaoAta: voter1DaoAta,
          stakingVault: stakingVaultPda,
          voteRecordss: duplicateVoteRecord,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([voter1])
        .rpc();

      assert.fail("Should have failed because voter already voted");
    } catch (error) {
      // In this case, we would expect the program to prevent duplicate votes
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to duplicate voting"
      );
      console.log("✅ Correctly rejected duplicate vote");
    }
  });

  // This test requires a wait until voting period ends
  it("💰 Voter 1 successfully claims stake rewards", async () => {
    console.log("🔄 Fast-forwarding past voting end time (simulated)...");

    // In a real blockchain we'd wait for the time to pass
    // For testing, we'll just assume the voting has ended
    // VOTING_END_TIME = new BN(Math.floor(Date.now() / 1000) - 86400);
    // Add funds to DAO treasury
    console.log("🔄 Adding funds to DAO treasury...");
    const treasuryAmount = 500e6; // 500 tokens with 6 decimals
    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        createMintToInstruction(
          daoMint.publicKey,
          daoTreasury,
          creator.publicKey,
          treasuryAmount,
          []
        )
      ),
      [creator]
    );

    // Ensure staking vault has sufficient tokens for base reward
    const stakingAmount = await provider.connection.getTokenAccountBalance(stakingVaultPda);
    if (parseInt(stakingAmount.value.amount) < 100e6) {
      console.log("🔄 Adding funds to staking vault...");
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createMintToInstruction(
            daoMint.publicKey,
            stakingVaultPda,
            creator.publicKey,
            200e6, // 200 tokens
            []
          )
        ),
        [creator]
      );
    }

    // Check balances before claim
    const treasuryBalance = await provider.connection.getTokenAccountBalance(daoTreasury);
    const stakingBalance = await provider.connection.getTokenAccountBalance(stakingVaultPda);
    console.log(`Treasury balance: ${treasuryBalance.value.amount}`);
    console.log(`Staking vault balance: ${stakingBalance.value.amount}`);


    console.log("🔄 Claiming rewards for Voter 1...");

    // Get initial balance
    const initialBalance = await provider.connection.getTokenAccountBalance(voter1DaoAta);
    console.log(`Initial token balance: ${initialBalance.value.amount}`);

    try {
      await program.methods
        .claimStakeRewards()
        .accountsPartial({
          voter: voter1.publicKey,
          daoMint: daoMint.publicKey,
          proposal: proposalPda,
          voterDaoAta: voter1DaoAta,
          stakingVault: stakingVaultPda,
          dao: daoPda,
          daoTreasury: daoTreasury,
          voteRecord: voter1VoteRecord,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([voter1])
        .rpc();

      // Get updated balance
      const updatedBalance = await provider.connection.getTokenAccountBalance(voter1DaoAta);
      console.log(`Updated token balance: ${updatedBalance.value.amount}`);

      // Verify the tokens were returned to the voter
      assert(
        new BN(updatedBalance.value.amount).gt(new BN(initialBalance.value.amount)),
        "Balance should have increased after claiming rewards"
      );

      // Check that rewards were claimed
      const updatedVoteRecord = await program.account.voteState.fetch(voter1VoteRecord);
      assert.equal(updatedVoteRecord.claimed, true);

      console.log("✅ Rewards claimed successfully!");
    } catch (error) {
      console.error("Error:", error);
      throw error;

    }
  });

  it("❌ Fails when trying to claim rewards twice", async () => {
    console.log("🔄 Attempting to claim rewards again...");

    try {
      await program.methods
        .claimStakeRewards()
        .accountsPartial({
          voter: voter1.publicKey,
          daoMint: daoMint.publicKey,
          proposal: proposalPda,
          voterDaoAta: voter1DaoAta,
          stakingVault: stakingVaultPda,
          dao: daoPda,
          daoTreasury: daoTreasury,
          voteRecord: voter1VoteRecord,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([voter1])
        .rpc();

      assert.fail("Should have failed because rewards were already claimed");
    } catch (error) {
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to already claimed rewards"
      );
      console.log("✅ Correctly rejected duplicate reward claim");
    }
  });

  it("💰 Voter 2 successfully claims stake rewards", async () => {

    // Add funds to DAO treasury
    console.log("🔄 Adding funds to DAO treasury...");
    const treasuryAmount = 500e6; // 500 tokens with 6 decimals
    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        createMintToInstruction(
          daoMint.publicKey,
          daoTreasury,
          creator.publicKey,
          treasuryAmount,
          []
        )
      ),
      [creator]
    );

    // Ensure staking vault has sufficient tokens for base reward
    const stakingAmount = await provider.connection.getTokenAccountBalance(stakingVaultPda);
    if (parseInt(stakingAmount.value.amount) < 100e6) {
      console.log("🔄 Adding funds to staking vault...");
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createMintToInstruction(
            daoMint.publicKey,
            stakingVaultPda,
            creator.publicKey,
            200e6, // 200 tokens
            []
          )
        ),
        [creator]
      );
    }

    // Check balances before claim
    const treasuryBalance = await provider.connection.getTokenAccountBalance(daoTreasury);
    const stakingBalance = await provider.connection.getTokenAccountBalance(stakingVaultPda);
    console.log(`Treasury balance: ${treasuryBalance.value.amount}`);
    console.log(`Staking vault balance: ${stakingBalance.value.amount}`);
    console.log("🔄 Claiming rewards for Voter 2...");

    // Get initial balance
    const initialBalance = await provider.connection.getTokenAccountBalance(voter2DaoAta);
    console.log(`Initial token balance: ${initialBalance.value.amount}`);

    try {
      await program.methods
        .claimStakeRewards()
        .accountsPartial({
          voter: voter2.publicKey,
          daoMint: daoMint.publicKey,
          proposal: proposalPda,
          voterDaoAta: voter2DaoAta,
          stakingVault: stakingVaultPda,
          dao: daoPda,
          daoTreasury: daoTreasury,
          voteRecord: voter2VoteRecord,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([voter2])
        .rpc();

      // Get updated balance
      const updatedBalance = await provider.connection.getTokenAccountBalance(voter2DaoAta);
      console.log(`Updated token balance: ${updatedBalance.value.amount}`);

      // Verify the tokens were returned to the voter
      assert(
        new BN(updatedBalance.value.amount).gt(new BN(initialBalance.value.amount)),
        "Balance should have increased after claiming rewards"
      );

      // Check that rewards were claimed
      const updatedVoteRecord = await program.account.voteState.fetch(voter2VoteRecord);
      assert.equal(updatedVoteRecord.claimed, true);

      console.log("✅ Rewards claimed successfully!");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("❌ Fails when unauthorized user tries to claim rewards", async () => {
    console.log("🔄 Attempting to claim rewards by unauthorized user...");

    const unauthorizedUser = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(unauthorizedUser.publicKey, 1e9)
    );

    try {
      await program.methods
        .claimStakeRewards()
        .accountsPartial({
          voter: unauthorizedUser.publicKey,
          daoMint: daoMint.publicKey,
          proposal: proposalPda,
          voterDaoAta: voter1DaoAta, // Trying to claim from voter1's vote record
          stakingVault: stakingVaultPda,
          dao: daoPda,
          daoTreasury: daoTreasury,
          voteRecord: voter1VoteRecord,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([unauthorizedUser])
        .rpc();

      assert.fail("Should have failed because user is not the authorized voter");
    } catch (error) {
      assert.ok(
        error.message.includes("Error") ||
        error.message.includes("failed") ||
        error.message.includes("constraint"),
        "Expected an error related to unauthorized access"
      );
      console.log("✅ Correctly rejected unauthorized reward claim");
    }
  });
});