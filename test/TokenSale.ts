import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { MyToken } from '../typechain-types';
import { tokenSaleSol } from '../typechain-types/contracts';

const TEST_RATIO = 3n;
const TEST_PRICE = 5n;
const TEST_BUY_VALUE = ethers.parseUnits('10', 'wei'); // Trying to send 10 ETH

describe('NFT Shop', async () => {
  async function deployContracts() {
    const [
      accounts,
      myTokenContractFactory,
      myNFTContractFactory,
      tokenSaleContractFactory,
    ] = await Promise.all([
      ethers.getSigners(),
      ethers.getContractFactory('MyToken'),
      ethers.getContractFactory('MyNFT'),
      ethers.getContractFactory('TokenSale'),
    ]);
    const myTokenContract = await myTokenContractFactory.deploy();
    await myTokenContract.waitForDeployment();
    const myNFTContract = await myNFTContractFactory.deploy();
    await myNFTContract.waitForDeployment();
    const tokenSaleContract = await tokenSaleContractFactory.deploy(
      TEST_RATIO,
      TEST_PRICE,
      myTokenContract.target,
      myNFTContract.target
    );
    await tokenSaleContract.waitForDeployment();
    const MINTER_ROLE = await myTokenContract.MINTER_ROLE();
    const roleTx = await myTokenContract.grantRole(
      MINTER_ROLE,
      tokenSaleContract.target
    );
    await roleTx.wait();
    const roleNftTx = await myNFTContract.grantRole(
      MINTER_ROLE,
      tokenSaleContract.target
    );
    await roleNftTx.wait();
    return { accounts, tokenSaleContract, myNFTContract, myTokenContract };
  }

  async function buyTokens() {
    const { accounts, tokenSaleContract, myTokenContract, myNFTContract } =
      await loadFixture(deployContracts);
    const balanceBefore = await ethers.provider.getBalance(accounts[1].address);
    const tx = await tokenSaleContract
      .connect(accounts[1])
      .buyTokens({ value: TEST_BUY_VALUE });
    const txReceipt = await tx.wait();
    const gasUsed = txReceipt?.gasUsed ?? 0n;
    const gasPrice = txReceipt?.gasPrice ?? 0n;
    const gasCost = gasUsed * gasPrice;
    const balanceAfter = await ethers.provider.getBalance(accounts[1].address);
    return {
      accounts,
      tokenSaleContract,
      myTokenContract,
      myNFTContract,
      balanceAfter,
      balanceBefore,
      gasCost,
    };
  }

  describe('When the Shop contract is deployed', async () => {
    it('defines the ratio as provided in parameters', async () => {
      const { tokenSaleContract } = await loadFixture(deployContracts);
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.eq(TEST_RATIO);
    });
    it('defines the price as provided in parameters', async () => {
      const { tokenSaleContract } = await loadFixture(deployContracts);
      const price = await tokenSaleContract.price();
      expect(price).to.eq(TEST_PRICE);
    });
    it('uses a valid ERC20 as payment token', async () => {
      const { tokenSaleContract } = await loadFixture(deployContracts);
      const tokenAddress = await tokenSaleContract.paymentToken();
      const paymentTokenContractFactory = await ethers.getContractFactory(
        'MyToken'
      );
      const paymentTokenContract = paymentTokenContractFactory.attach(
        tokenAddress
      ) as MyToken;
      await expect(paymentTokenContract.totalSupply()).not.to.be.reverted;
      await expect(paymentTokenContract.balanceOf(ethers.ZeroAddress)).not.to.be
        .reverted;
    });

    it('uses a valid ERC721 as NFT collection', async () => {
      throw new Error('Not implemented');
    });
  });
  describe('When a user buys an ERC20 from the Token contract', async () => {
    it('charges the correct amount of ETH', async () => {
      const { balanceBefore, balanceAfter, gasCost } = await loadFixture(
        buyTokens
      );
      const diff = balanceBefore - balanceAfter;
      const expectedDiff = TEST_BUY_VALUE + gasCost;
      const error = diff - expectedDiff;
      expect(error).to.eq(0);
    });
    it('gives the correct amount of tokens', async () => {
      const { myTokenContract, accounts } = await loadFixture(buyTokens);
      const balance = await myTokenContract.balanceOf(accounts[1].address);
      expect(parseFloat(ethers.formatUnits(balance))).to.eq(100);
    });
  });

  describe('When a user burns an ERC20 at the Shop contract', async () => {
    async function burnTokens() {
      const { accounts, tokenSaleContract, myTokenContract } =
        await loadFixture(buyTokens);
      const expectedBalance = TEST_BUY_VALUE * TEST_RATIO;
      const ethBalanceBefore = await ethers.provider.getBalance(
        accounts[1].address
      );
      const allowTx = await myTokenContract
        .connect(accounts[1])
        .approve(tokenSaleContract.target, expectedBalance);
      const allowTxReceipt = await allowTx.wait();
      const allowTxGasUsed = allowTxReceipt?.gasUsed ?? 0n;
      const allowTxPricePerGas = allowTxReceipt?.gasPrice ?? 0n;
      const allowTxGasCosts = allowTxGasUsed * allowTxPricePerGas;

      const burnTx = await tokenSaleContract
        .connect(accounts[1])
        .returnTokens(expectedBalance);
      await burnTx.wait();
      const burnTxReceipt = await burnTx.wait();
      const burnTxGasUsed = burnTxReceipt?.gasUsed ?? 0n;
      const burnTxPricePerGas = burnTxReceipt?.gasPrice ?? 0n;
      const burnTxGasCosts = burnTxGasUsed * burnTxPricePerGas;
      const ethBalanceAfter = await ethers.provider.getBalance(
        accounts[1].address
      );
      const gasCosts = allowTxGasCosts + burnTxGasCosts;
      return {
        accounts,
        tokenSaleContract,
        myTokenContract,
        ethBalanceBefore,
        gasCosts,
        ethBalanceAfter,
      };
    }
    it('gives the correct amount of ETH', async () => {
      throw new Error('Not implemented');
    });
    it('burns the correct amount of tokens', async () => {
      const { accounts, myTokenContract } = await loadFixture(burnTokens);
      const balanceAfterBurn = await myTokenContract.balanceOf(
        accounts[1].address
      );
      expect(balanceAfterBurn).to.eq(0);
    });
  });

  describe('When a user buys an NFT from the Shop contract', async () => {
    async function buyNFTs() {
      const { accounts, tokenSaleContract, myTokenContract, myNFTContract } =
        await loadFixture(buyTokens);
      const allowTx = await myTokenContract
        .connect(accounts[1])
        .approve(tokenSaleContract.target, TEST_PRICE);
      await allowTx.wait();
      const buyTx = await tokenSaleContract.connect(accounts[1]).buyNFT(0);
      await buyTx.wait();
      return {
        accounts,
        tokenSaleContract,
        myTokenContract,
        myNFTContract,
      };
    }
    it('charges the correct amount of ERC20 tokens', async () => {
      throw new Error('Not implemented');
    });
    it('gives the correct NFT', async () => {
      const { accounts, myNFTContract } = await loadFixture(buyNFTs);
      const nftOwner = await myNFTContract.ownerOf(0);
      expect(nftOwner).to.eq(accounts[1].address);
    });
  });
  describe('When a user burns their NFT at the Shop contract', async () => {
    it('gives the correct amount of ERC20 tokens', async () => {
      throw new Error('Not implemented');
    });
  });
  describe('When the owner withdraws from the Shop contract', async () => {
    it('recovers the right amount of ERC20 tokens', async () => {
      throw new Error('Not implemented');
    });
    it('updates the owner pool account correctly', async () => {
      throw new Error('Not implemented');
    });
  });
});
