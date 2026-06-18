import { network } from "hardhat";

const { ethers } = await network.create({
  network: "sepolia",
});

console.log("Recherche de l'age");

const age = await ethers.provider.getStorage( "0x96884AD36c89DAc00a4dd63060D238C723a0ab3B", 0 );

console.log("cyril a : ", age);
