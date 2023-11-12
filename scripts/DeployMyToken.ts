import { ethers } from 'ethers';
import { MyToken__factory } from '../typechain-types';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Configuring the provider
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ''
  );
  const lastBlock = await provider.getBlock('latest');
  console.log(`Last block number: ${lastBlock?.number}`);
  const lastBlockTimestamp = lastBlock?.timestamp ?? 0;
  const lastBlockDate = new Date(lastBlockTimestamp * 1000);
  console.log(
    `Last block timestamp: ${lastBlockTimestamp} (${lastBlockDate.toLocaleDateString()} ${lastBlockDate.toLocaleTimeString()})`
  );

  // Configuring the wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider);
  console.log(`Using address ${wallet.address}`);
  const balanceBN = await provider.getBalance(wallet.address);
  const balance = Number(ethers.formatUnits(balanceBN));
  console.log(`Wallet balance ${balance} ETH`);
  if (balance < 0.01) {
    throw new Error('Not enough ether');
  }

  // Deploying the smart contract MyToken
  const myTokenFactory = new MyToken__factory(wallet);
  const myTokenContract = await myTokenFactory.deploy();
  await myTokenContract.waitForDeployment();
  console.log(`Contract deployed to ${myTokenContract.target}`);
  const owner = await myTokenContract.owner;
  console.log(`Contract owner is ${owner}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Last block number: 4674015
// Last block timestamp: 1699726980 (11/11/2023 7:23:00 PM)
// Using address 0xBAF5cdEAD710e3347Dc3862E38a4044EAc50A036
// Wallet balance 0.47731920799750716 ETH
// Contract deployed to 0x7fE72432Df2F96EB07236FF1d23C85d89f5b5D1F
