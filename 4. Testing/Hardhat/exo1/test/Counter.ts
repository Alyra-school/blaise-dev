import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const [user1, user2] = await ethers.getSigners();

describe("test de trucs", function () {
  it("Should veify that inc() function increment x", async function () {
    const counter = await ethers.deployContract("Counter");
    let value = await counter.x();
    await counter.inc();
    await counter.connect(user2).inc();
    const addr = user2.address;
    let value2 = await counter.x();
    await expect(value2).to.equal(value + 1n);
    expect(await counter.x()).to.equal(value2 + 1n);

  });

  it.only("Should send eth", async function () {
    const counter = await ethers.deployContract("Counter");
    await counter.inc({ value: 1n });
    expect(await ethers.provider.getBalance(counter.target)).to.equal(1n);
  });
  
  it("Should emit the Increment event when calling the inc() function", async function () {
    const counter = await ethers.deployContract("Counter");

    await expect(counter.inc()).to.emit(counter, "Increment").withArgs(1n);
  });

  it("Should trigger revert if incby a little value", async function () {
    const counter = await ethers.deployContract("Counter");

    await expect(counter.incBy(1)).to.be.revertedWith("incBy: increment should be more than two");
    await expect(counter.incBy(0)).to.be.revertedWith("incBy: increment should be more than two");

   for (let i = 1; i <= 2; i++) {
    await expect(counter.incBy(i)).to.be.revertedWith("incBy: increment should be more than two");
   }

  });

  describe("sous catégorie de trucs", function () {

  it.skip("The sum of the Increment events should match the current value", async function () {
    const counter = await ethers.deployContract("Counter");
    const deploymentBlockNumber = await ethers.provider.getBlockNumber();

    // run a series of increments
    for (let i = 1; i <= 10; i++) {
      await counter.incBy(i);
    }

    const events = await counter.queryFilter(
      counter.filters.Increment(),
      deploymentBlockNumber,
      "latest",
    );

    // check that the aggregated events match the current value
    let total = 0n;
    for (const event of events) {
      total += event.args.by;
    }

    expect(await counter.x()).to.equal(total);
  });
  });
});
