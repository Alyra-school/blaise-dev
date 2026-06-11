import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingModule", (m) => {
  const voting = m.contract("Voting", ["0x70997970c51812dc3a010c7d01b50e0d17dc79c8"], {value : 1000000000000000000n});
  
  m.call(voting, "startProposalRegistration", [5n]);
  
  return { voting };
});