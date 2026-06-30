import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BankModule", (m) => {
  const bank = m.contract("Bank");

  return { bank };
});