# Daoverse

## Overview
**Daoverse** is the capstone project for the **Turbin3 Q1 '25 Builders Cohort**. It is a decentralized platform that enables the creation and management of DAOs. The program is designed to support three different types of users: **Admins**, **DAO Creators**, and **DAO Members**.

## Features
### 1. Admin
Admins oversee the platform and perform key administrative functions such as:
- **initialize_daoverse** – Initializes the Daoverse platform.
- **admin_deposit** – Deposits funds into the Daoverse treasury.
- **update_daoverse** – Updates the Daoverse configuration.

### 2. DAO Creators
DAO creators establish DAOs within Daoverse. Their key functions include:
- **validate_creator** – Ensures a user meets the requirements to become a DAO creator.
- **pay_daoverse_fee** – Pays the required fee to gain eligibility as a DAO creator.
- **create_dao** – Creates a DAO for eligible users.
- **update_dao** – Updates DAO configurations.

### 3. DAO Members
DAO members participate in governance and decision-making within a DAO. They function in three key roles:

#### 3.1 DAO Member - General
- **validate_member** – Checks if the user is a valid DAO member.
- **initialize_member** – Registers the user as a DAO member.
- **update_member** – Allows a DAO member to update their configuration.

#### 3.2 DAO Member - As a Proposer
- **validate_proposer** – Ensures that a member is eligible to propose projects.
- **create_proposal** – Enables an eligible member to submit a proposal.

#### 3.3 DAO Member - As a Voter
- **validate_voter** – Verifies the member as a voter.
- **cast_vote** – Records a member's vote, updates the proposal account, and transfers tokens to the staking vault.

#### 3.4 DAO Member - As a Reward Claimer
- **finalize_proposal** – Distributes rewards to stakers after voting concludes.
- **claim_rewards** – Allows participants to reclaim staked tokens along with a reward percentage.

---

## Deployment & Testing

### Deployment to Devnet
After deploying, the Daoverse program is available at:
```
Program Id: 2DCZ8tfm5Jj4GVLyGVqygQYGsZSxrWUMYdrZT8KJ1Ad4
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: F43BqM3gAjB6AF5jFJVjeTnNhFLZTVU8NYEaJaqbNcLM
Authority: 8Jwcot83CBXzAj1a7HEn1C8F6yymstKNjxUBpUEyRYqz
Last Deployed In Slot: 363968457
Data Length: 454720 (0x6f040) bytes
Balance: 3.16605528 SOL
```

### Running Tests
To run tests locally:
```sh
solana-test-validator  # Start a local Solana blockchain
solana airdrop 10      # (Optional) Airdrop SOL to your account
solana balance         # Check your balance

anchor build
anchor deploy --provider.cluster localnet

anchor test
```
For testing on **Devnet**, modify `Anchor.toml`:
```toml
[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"
```
Then deploy the program again:
```sh
solana program show 2DCZ8tfm5Jj4GVLyGVqygQYGsZSxrWUMYdrZT8KJ1Ad4
```

---

## Test Results
Below is a summary of key test cases executed:

### ✅ Successfully Executed Tests
- Initializes Daoverse and fetches treasury balance.
- Updates Daoverse configuration successfully.
- Prevents unauthorized updates.
- Creates a DAO and updates DAO configurations.
- Initializes DAO members and prevents initialization with insufficient funds.
- Submits valid proposals and rejects invalid ones.
- Records votes, prevents duplicate voting, and ensures sufficient staking funds.
- Distributes rewards correctly and prevents double claiming.

### ❌ Expected Failures (Correctly Handled)
- Unauthorized config updates.
- Unauthorized DAO updates.
- DAO member initialization with insufficient funds.
- Invalid proposal creation.
- Voting with insufficient tokens.
- Duplicate voting.
- Unauthorized reward claims.

Total **20 passing tests** in **14s**. Complete execution in **16.34s**.

DAOverse Program
🔄 Airdropping SOL...
✅ Creating DAOverse Mint...
🔍 Fetching Initial Treasury Balance (Expected: 0)...
⚠️ DAOverse Treasury has no balance or does not exist yet.
🔧 Initializing DAOverse...
✅ Fetching DAOverse Config...
🔍 Fetching Actual On-Chain Treasury Balance...
💰 Actual Treasury Token Balance: 500
✅ DAOverse Initialized Successfully!
    ✔ 🚀 Initializes DAOverse (431ms)
🔄 Updating DAOverse Config...
✅ Fetching Updated DAOverse Config...
✅ DAOverse Updated Successfully!
    ✔ 🛠 Updates DAOverse Config (403ms)
🚨 Attempting Unauthorized Update...
🔄 Airdropping SOL to Unauthorized User...
✅ Unauthorized update was correctly rejected.
    ✔ ❌ Fails to update config with unauthorized user (430ms)
🔧 Initializing DAO...
✅ Fetching DAO Config...
✅ DAO Initialized Successfully!
    ✔ 🚀 Creates a DAO (395ms)
🔄 Updating DAO Config...
✅ Fetching Updated DAO Config...
✅ DAO Updated Successfully!
    ✔ 🛠 Updates DAO Config (434ms)
🔄 Airdropping SOL to Unauthorized User...
🚨 Attempting Unauthorized DAO Update...
✅ Unauthorized update was correctly rejected.
    ✔ ❌ Fails to update DAO with unauthorized user (460ms)
🔧 Initializing member...
✅ Fetching member state...
✅ Member initialized successfully!
    ✔ 🚀 Successfully initializes a member (398ms)
🔄 Setting up poor member account...
✅ Correctly rejected member with insufficient tokens
    ✔ ❌ Fails to initialize member with insufficient tokens (1235ms)
🔄 Updating member state...
✅ Fetching updated member state...
✅ Member state updated successfully!
    ✔ 🛠 Successfully updates member state (440ms)
🔄 Attempting unauthorized update...
✅ Correctly rejected unauthorized update
    ✔ ❌ Fails to update member state with unauthorized member (80ms)
🔧 Creating a new proposal...
✅ Fetching proposal state...
✅ Proposal created successfully!
    ✔ 🚀 Successfully creates a proposal (333ms)
🔄 Attempting to create invalid proposal...
✅ Correctly rejected invalid proposal parameters
    ✔ ❌ Fails to create proposal with invalid parameters (406ms)
🔄 Voter 1 voting on proposal...
✅ Fetching vote record...
✅ Fetching updated proposal state...
✅ Voter 1 voted successfully!
    ✔ 🗳️ Voter 1 successfully votes YES on the proposal (434ms)
🔄 Voter 2 voting on proposal...
✅ Fetching vote record...
✅ Fetching updated proposal state...
✅ Voter 2 voted successfully!
    ✔ 🗳️ Voter 2 successfully votes NO on the proposal (425ms)
🔄 Attempting to vote with insufficient tokens...
✅ Correctly rejected vote with insufficient tokens
    ✔ ❌ Fails when voter tries to vote with insufficient tokens (863ms)
🔄 Attempting to vote twice...
✅ Correctly rejected duplicate vote
    ✔ ❌ Fails when voter tries to vote twice (43ms)
🔄 Fast-forwarding past voting end time (simulated)...
🔄 Adding funds to DAO treasury...
Treasury balance: 500000500
Staking vault balance: 250000000
🔄 Claiming rewards for Voter 1...
Initial token balance: 9900000000
Updated token balance: 10020000000
✅ Rewards claimed successfully!
    ✔ 💰 Voter 1 successfully claims stake rewards (758ms)
🔄 Attempting to claim rewards again...
✅ Correctly rejected duplicate reward claim
    ✔ ❌ Fails when trying to claim rewards twice (404ms)
🔄 Adding funds to DAO treasury...
Treasury balance: 870000500
Staking vault balance: 140000000
🔄 Claiming rewards for Voter 2...
Initial token balance: 9850000000
Updated token balance: 10030000000
✅ Rewards claimed successfully!
    ✔ 💰 Voter 2 successfully claims stake rewards (849ms)
🔄 Attempting to claim rewards by unauthorized user...
✅ Correctly rejected unauthorized reward claim
    ✔ ❌ Fails when unauthorized user tries to claim rewards (442ms)


  20 passing (14s)

Done in 16.34s.


---

## Conclusion
Daoverse provides a robust foundation for decentralized governance. With clear role-based permissions, secure proposal voting, and a staking-based incentive system, it ensures transparency and fairness in DAO operations. 🚀

