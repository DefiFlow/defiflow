import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";

describe("ArcPayroll", function () {
    let arcPayroll: Contract;
    let erc20Mock: Contract;
    let owner: Signer;
    let recipient1: Signer;
    let recipient2: Signer;
    let recipients: string[];
    let amounts: number[];

    beforeEach(async function () {
        [owner, recipient1, recipient2] = await ethers.getSigners();

        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        erc20Mock = await ERC20Mock.deploy("Mock USDC", "mUSDC", 6);
        await erc20Mock.waitForDeployment();

        const ArcPayroll = await ethers.getContractFactory("ArcPayroll");
        arcPayroll = await ArcPayroll.deploy();
        await arcPayroll.waitForDeployment();

        recipients = [await recipient1.getAddress(), await recipient2.getAddress()];
        amounts = [100, 200];

        await erc20Mock.mint(await owner.getAddress(), 300);
    });

    it("should distribute salary correctly", async function () {
        const ownerAddress = await owner.getAddress();
        const arcPayrollAddress = await arcPayroll.getAddress();
        const erc20MockAddress = await erc20Mock.getAddress();

        await erc20Mock.connect(owner).approve(arcPayrollAddress, 300);

        const distributeTx = await arcPayroll.connect(owner).distributeSalary(
            erc20MockAddress,
            recipients,
            amounts,
            "Test Salary"
        );

        await expect(distributeTx).to.emit(arcPayroll, "SalaryDistributed").withArgs("Test Salary");

        expect(await erc20Mock.balanceOf(ownerAddress)).to.equal(0);
        expect(await erc20Mock.balanceOf(arcPayrollAddress)).to.equal(0);
        expect(await erc20Mock.balanceOf(await recipient1.getAddress())).to.equal(100);
        expect(await erc20Mock.balanceOf(await recipient2.getAddress())).to.equal(200);
    });

    it("should revert if arrays have mismatched lengths", async function () {
        const arcPayrollAddress = await arcPayroll.getAddress();
        const erc20MockAddress = await erc20Mock.getAddress();
        await erc20Mock.connect(owner).approve(arcPayrollAddress, 300);

        await expect(
            arcPayroll.connect(owner).distributeSalary(
                erc20MockAddress,
                recipients,
                [100],
                "Mismatched Test"
            )
        ).to.be.revertedWith("Mismatched arrays");
    });
});
