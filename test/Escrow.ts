import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

const token = (n: number) => {
  return ethers.parseUnits(n.toString(), "ether");
};

describe("Escrow", function () {
  let buyer: HardhatEthersSigner,
    seller: HardhatEthersSigner,
    inspector: HardhatEthersSigner,
    lender: HardhatEthersSigner;
  let realEstate: any, escrow: any, address: any, escrowAddress: any;

  beforeEach(async () => {
    // Set up accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy Real estate contract
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();
    address = await realEstate.getAddress();

    // Mint
    let transactions = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );

    await transactions.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      address,
      seller.address,
      inspector.address,
      lender.address
    );

    escrowAddress = await escrow.getAddress();

    // Approve property
    transactions = await realEstate.connect(seller).approve(escrowAddress, 0);
    await transactions.wait();

    // List property
    transactions = await escrow
      .connect(seller)
      .list(0, buyer.address, token(10), token(5));
    await transactions.wait();
  });

  describe("Deployment", () => {
    it("Returns Nft Address", async () => {
      const result = await escrow.nftAddress();
      expect(result).to.be.equal(address);
    });
    it("Returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });
    it("Returns inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });
    it("Returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Updates as Listed", async () => {
      const result = await escrow.isListed(0);
      expect(result).to.be.true;
    });

    it("Updates ownership", async () => {
      const owner = await realEstate.ownerOf(0);
      expect(owner).to.be.equal(escrowAddress);
    });

    it("Returns Buyer", async () => {
      const result = await escrow.buyer(0);
      expect(result).to.be.equal(buyer.address);
    });

    it("Returns Purchase price", async () => {
      const result = await escrow.purchasePrice(0);
      expect(result).to.be.equal(token(10));
    });

    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(0);
      expect(result).to.be.equal(token(5));
    });
  });
});
