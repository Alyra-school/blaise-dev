import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const [user1, user2] = await ethers.getSigners();

describe("test de trucs", function () {
  it("Should veify that inc() function increment x", async function () {
    const token = await ethers.deployContract("Token");
    expect(await token.decimals()).to.equal(18);
  });
});

describe("test des variables initiales", function () {
    beforeEach(function () {
        // deployer le contrat
        // get signers
    });

    // nos it()...
});

describe("test buy token", function () {
        beforeEach(function () {
        // deployer le contrat
        // get signers
    });

    // nos it()...
    // test sur la balance qui augmente a l'achat
});

describe("test des transfers", function () {
    beforeEach(function () {
        // deployer le contrat
        // get signers
        // user 1 achete des token : buy token
    });

    // nos it()...
    // par exemple user 1 transfere des token 
    // par exemple user 2 transfere des token
});

describe("test allowance", function () {
        beforeEach(function () {
        // deployer le contrat
        // get signers
        // user 1 achete des token : buy token
    });

    // nos it()...
    // test sur user 1 qui approuve user 2 pour un certain montant
    // test sur user 1 qui approuve user 2 pour un montant qu'il n'a pas

});

describe("test  transfer from", function () {

    beforeEach(function () {
        // deployer le contrat
        // get signers : user 1, 2 et 3
        // user 1 achete des token : buy token
        // user 1 approve user 2 pour un certain montant
    });

    // nos it()...
    // test sur user 2 qui transfere des token de user 1 vers user 3
});




