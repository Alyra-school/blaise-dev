import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function setUpSmartContracts() {
    const [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const voting = await ethers.deployContract("Voting");
    return { owner, voter1, voter2, voter3, voting };
}

async function setUpWithVoter() {
    let voting: any;
    let owner, voter1, voter2, voter3 : any;
    ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
    await voting.addVoter(voter1.address);
    await voting.startProposalsRegistering();
    return { owner, voter1, voter2, voter3, voting };
}

async function setUpWithProposal() {
    let voting: any;
    let owner, voter1, voter2, voter3 : any;
    ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
    await voting.addVoter(voter1.address);
    await voting.startProposalsRegistering();
    await voting.connect(voter1).addProposal("DEFAULT_PROPOSAL");
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    return { owner, voter1, voter2, voter3, voting };
}

async function setUpWithVote() {
    let voting: any;
    let owner, voter1, voter2, voter3 : any;
    ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
    await voting.addVoter(voter1.address);
    await voting.startProposalsRegistering();
    await voting.connect(voter1).addProposal("DEFAULT_PROPOSAL");
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    await voting.connect(voter1).setVote(1);
    await voting.endVotingSession();
    return { owner, voter1, voter2, voter3, voting };
}

function deterministicRandom(seed: string, upper: number) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) % 0x7fffffff;
    }
    return hash % upper;
}

function pseudoProposalString(seed: string, length: number) {
    let str = "";
    for (let i = 0; i < length; i++) {
        const charCode = 97 + deterministicRandom(`${seed}-${i}`, 26);
        str += String.fromCharCode(charCode);
    }
    return str;
}


describe("Voting contract", function () {

    let voting : any;
    let owner : any, voter1 : any, voter2 : any, voter3 : any;

  const WorkflowStatus = {
    RegisteringVoters: 0,
    ProposalsRegistrationStarted: 1,
    ProposalsRegistrationEnded: 2,
    VotingSessionStarted: 3,
    VotingSessionEnded: 4,
    VotesTallied: 5,
  };

  // *********** Get one proposal *********** //
  describe("getOneProposal", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpWithProposal());
    });

    it("Should get an existing proposal", async function () {
      //const truc = await voting.connect(voter1).getStorageAt(voting.target, ethers.keccak256(ethers.solidityPack(["uint256", "string"], [1, syntaxe vu en cours])));
      expect((await voting.connect(voter1).getOneProposal(1)).description).to.equal("DEFAULT_PROPOSAL");
    });


    it("Should fail trying to get a proposal without being a voter", async function () {
      await expect(voting.getOneProposal(1)).to.be.revertedWith("You're not a voter");
    });

    it("Should fail trying to get a proposal without being a voter", async function () {
      await expect(voting.connect(voter1).getOneProposal(2)).to.be.revertedWithoutReason;
    });

    // add get proposal qui fonctionne pas
  });

  // *********** Get one voter *********** //
  describe("getVoter(address voterAddress)", function () {


    it("Should get existing voters", async function () {
    ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter3.address);

      expect((await voting.connect(voter1).getVoter(voter1.address)).isRegistered).to.equal(true);
      expect((await voting.connect(voter1).getVoter(voter2.address)).isRegistered).to.equal(false);
      expect((await voting.connect(voter1).getVoter(voter3.address)).isRegistered).to.equal(true);
    });

    it("Should fail trying to get a voter without being a voter", async function () {
      await expect(voting.getVoter(voter1.address)).to.be.revertedWith("You're not a voter");
    });
  });
// voter non ajouté
  // *********** Add voter *********** //

  describe("addVoter(address voterAddress)", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should add a voter", async function () {
      await voting.addVoter(owner.address);
      expect((await voting.getVoter(owner.address)).isRegistered).to.equal(true);
    });

    it("Should fail trying to add an already registered voter", async function () {
      await voting.addVoter(voter1.address);

      await expect(voting.addVoter(voter1.address)).to.be.revertedWith("Already registered");
    });

    it("Should fail trying to add a voter in the wrong workflow status", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.addVoter(voter2.address)).to.be.revertedWith("Voters registration is not open yet");
    });

    it("Should fail trying to add a voter without being the owner", async function () {
      await expect(voting.connect(voter1).addVoter(voter2.address))
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });

    it("Should emit an event when adding a voter", async function () {
      await expect(voting.addVoter(voter1.address)).to.emit(voting, "VoterRegistered").withArgs(voter1.address);
    });
  });

  // *********** Add proposal *********** //
  describe("addProposal(string proposalDescription)", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpWithVoter());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should add a proposal", async function () {
      await voting.connect(voter1).addProposal("New proposal");
      expect((await voting.connect(voter1).getOneProposal(1)).description).to.equal("New proposal");
    });

    it("Should fail trying to add an empty proposal", async function () {
      await expect(voting.connect(voter1).addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });

    it("Should fail trying to add a proposal in the wrong workflow status", async function () {
      await voting.endProposalsRegistering();
      await expect(voting.connect(voter1).addProposal("New proposal")).to.be.revertedWith("Proposals are not allowed yet");
    });

    it("Should fail trying to add a proposal without being voter", async function () {
      await expect(voting.addProposal("New proposal")).to.be.revertedWith("You're not a voter");
    });

    it("Should emit an event when adding a proposal", async function () {
      await expect(voting.connect(voter1).addProposal("New proposal")).to.emit(voting, "ProposalRegistered").withArgs(1);
    });
  });

  // *********** Add vote *********** //
  describe("setVote(uint proposalId)", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpWithProposal());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should add a vote", async function () {
      await voting.connect(voter1).setVote(1);

      expect((await voting.connect(voter1).getVoter(voter1.address)).hasVoted).to.equal(true);
      expect((await voting.connect(voter1).getVoter(voter1.address)).votedProposalId).to.equal(1);
    });

    it("Should fail trying to vote for a non existing proposal", async function () {
      await expect(voting.connect(voter1).setVote(42424242)).to.be.revertedWith("Proposal not found");
    });

    it("Should fail trying to vote in a wrong workflow status", async function () {
      await voting.endVotingSession();
      await expect(voting.connect(voter1).setVote(1)).to.be.revertedWith("Voting session havent started yet");
    });

    it("Should fail trying to vote twice", async function () {
      await voting.connect(voter1).setVote(1);

      await expect(voting.connect(voter1).setVote(1)).to.be.revertedWith("You have already voted");
    });

    it("Should fail trying to vote without being a voter", async function () {
      await expect(voting.setVote(1)).to.be.revertedWith("You're not a voter");
    });

    it("Should emit an event when voting", async function () {
      await expect(voting.connect(voter1).setVote(1)).to.emit(voting, "Voted").withArgs(voter1.address, 1);
    });

    it("Should increment the proposal vote count", async function () {
      await voting.connect(voter1).setVote(1);
      expect((await voting.connect(voter1).getOneProposal(1)).voteCount).to.equal(1);
    });
  });

  // *********** Change workflow status *********** //
  // *********** Start proposal time *********** //
  describe("startProposalRegistering()", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should start proposal time", async function () {
      await voting.startProposalsRegistering();

      expect(await voting.workflowStatus()).to.equal(WorkflowStatus.ProposalsRegistrationStarted);
    });

    it("Should fail trying to start proposal time in wrong workflow status", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now");
    });

    it("Should fail trying to start proposal time without being owner", async function () {
      await expect(voting.connect(voter1).startProposalsRegistering())
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });

    it("Should emit an event when starting proposal time", async function () {
      await expect(voting.startProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    });

    it("Should register a genesis proposal for voters once proposals start", async function () {
      await voting.addVoter(owner.address);
      await voting.startProposalsRegistering();

      expect((await voting.getOneProposal(0)).description).to.equal("GENESIS");
    });
  });

  // *********** End proposal time *********** //
  describe("endProposalRegistering()", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpWithVoter());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should end proposal time", async function () {
      await voting.endProposalsRegistering();
      expect(await voting.workflowStatus()).to.equal(WorkflowStatus.ProposalsRegistrationEnded);
    });

    it("Should fail trying to end proposal time in wrong workflow status", async function () {
      await voting.endProposalsRegistering(); // Calling it twice to be in wrong current status on 2nd try
      await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
    });

    it("Should fail trying to end proposal time without being owner", async function () {
      await expect(voting.connect(voter1).endProposalsRegistering())
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });

    it("Should emit an event when ending proposal time", async function () {
      await expect(voting.endProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    });
  });

  // *********** Start voting session *********** //
  describe("startVotingSession()", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpWithVoter());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should start voting session", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      expect(await voting.workflowStatus()).to.equal(WorkflowStatus.VotingSessionStarted);
    });

    it("Should fail trying to start voting session in wrong workflow status", async function () {
      await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
    });

    it("Should fail trying to start voting session without being owner", async function () {
      await voting.endProposalsRegistering();
      await expect(voting.connect(voter1).startVotingSession())
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });

    it("Should emit an event when starting voting session", async function () {
      await voting.endProposalsRegistering();
      await expect(voting.startVotingSession())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    });
  });

  // *********** End voting session *********** //
  describe("endVotingSession()", function () {
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpWithProposal());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should end voting session", async function () {
      await voting.endVotingSession();
      expect(await voting.workflowStatus()).to.equal(WorkflowStatus.VotingSessionEnded);
    });

    it("Should fail trying to end voting session in wrong workflow status", async function () {
      await voting.endVotingSession(); // Calling it twice to be in wrong current status on 2nd try
      await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
    });

    it("Should fail trying to end voting session before it started", async function () {
      ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
      await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
    });

    it("Shoud fail trying to end voting session without being owner", async function () {
      await expect(voting.connect(voter1).endVotingSession())
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });

    it("Should emit an event when ending voting session", async function () {
      await expect(voting.endVotingSession())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    });
  });

  // *********** Tally *********** //
  describe("tallyVotes()", function () {
    // I don't use beforeEach() here as most of my tests needs to set status manually
    beforeEach(async () => {
      ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
      return { owner, voter1, voter2, voter3, voting };
    });

    it("Should tally vote (with multiple proposals)", async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.addVoter(voter3.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal1");
      await voting.connect(voter1).addProposal("Proposal2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.connect(voter3).setVote(1);
      await voting.endVotingSession();
      await voting.tallyVotes();

      expect(await voting.winningProposalID()).to.equal(1);
    });

    it("Should tally vote (with tie vote)", async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal1");
      await voting.connect(voter1).addProposal("Proposal2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(2);
      await voting.endVotingSession();
      await voting.tallyVotes();
      
      expect(await voting.winningProposalID()).to.equal(1);
    });

    it("Should tally votes (without any votes)", async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposal1");
      await voting.connect(voter1).addProposal("Proposal2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.endVotingSession();
      await voting.tallyVotes();
      
      expect(await voting.winningProposalID()).to.equal(0);
    });

    it("Should fail trying to tally votes without being owner", async function () {
      await expect(voting.connect(voter1).tallyVotes())
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
        .withArgs(voter1.address);
    });

    it("Should fail trying to tally votes in wrong workflow status", async function () {
      await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");
    });

    it("Should emit an event when tallying votes", async function () {
      await voting.startProposalsRegistering();
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.endVotingSession();
      await expect(voting.tallyVotes())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    });

    it("Should update workflow status to votes tallied after tallying", async function () {
      await voting.startProposalsRegistering();
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.endVotingSession();
      await voting.tallyVotes();

      expect(await voting.workflowStatus()).to.equal(WorkflowStatus.VotesTallied);
    });
  });

  describe("fuzzing proposals and votes", function () {
    it("Should accept variable-length proposal descriptions", async function () {
      ({ owner, voter1, voter2, voter3, voting } = await setUpWithVoter());

      const seeds = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"];
      let currentProposalId = 1;

      for (const seed of seeds) {
        const descLength = deterministicRandom(`${seed}-len`, 64) + 1;
        const proposalDesc = pseudoProposalString(seed, descLength);
        await voting.connect(voter1).addProposal(proposalDesc);
        expect((await voting.connect(voter1).getOneProposal(currentProposalId)).description).to.equal(proposalDesc);
        currentProposalId++;
      }
    });

    it("Should handle fuzzed voting loads with deterministic randomness", async function () {
      ({ owner, voter1, voter2, voter3, voting } = await setUpSmartContracts());
      const signers = await ethers.getSigners();
      const extraVoters = signers.slice(4, 8);
      const voters = [voter1, voter2, voter3, ...extraVoters];

      for (const voter of voters) {
        await voting.addVoter(voter.address);
      }

      await voting.startProposalsRegistering();
      const proposalSeeds = ["golf", "hotel", "india", "juliet"];
      let proposalId = 1;
      for (const seed of proposalSeeds) {
        const proposalDesc = pseudoProposalString(seed, deterministicRandom(`${seed}-len`, 56) + 1);
        await voting.connect(voter1).addProposal(proposalDesc);
        proposalId++;
      }

      const totalProposals = proposalSeeds.length + 1;
      await voting.endProposalsRegistering();
      await voting.startVotingSession();

      const voteCounts = new Array(totalProposals).fill(0);
      for (let index = 0; index < voters.length; index++) {
        const choice = deterministicRandom(`fuzz-vote-${index}`, totalProposals);
        await voting.connect(voters[index]).setVote(choice);
        voteCounts[choice]++;
      }

      await voting.endVotingSession();
      await voting.tallyVotes();

      const highestVoteCount = Math.max(...voteCounts);
      const expectedWinner = voteCounts.indexOf(highestVoteCount);
      expect(await voting.winningProposalID()).to.equal(expectedWinner);
    });
  });
});
