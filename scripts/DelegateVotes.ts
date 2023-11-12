import { ethers } from 'ethers';
import { MyToken__factory } from '../typechain-types';
import * as dotenv from 'dotenv';
dotenv.config();

const MINT_VALUE = ethers.parseUnits('1');

async function main() {
  // Configuring the address to mint to
  const address = process.argv.slice(2)[0];
  if (!address || address.length < 1) throw new Error('Address not provided');
  console.log(`Address attempting to mint to ${address}`);

  // Configuring the provider
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ''
  );

  // Configuring the wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider);

  // Connecting to MyTokenContract
  const contractAddress = '0x7fE72432Df2F96EB07236FF1d23C85d89f5b5D1F';
  const myTokenContract = MyToken__factory.connect(contractAddress, wallet);

  const votesBefore = await myTokenContract.getVotes(address);
  const balanceBefore = await myTokenContract.balanceOf(address);

  console.log(
    `Address ${address} has currently ${votesBefore.toString()} votes.`
  );
  console.log(
    `Address ${address} has a balance of ${balanceBefore.toString()} decimal units of MyToken.`
  );

  console.log('Delegating votes...');

  // Delegating votes
  try {
    const delegateTx = await myTokenContract.delegate(address);
    await delegateTx.wait();

    const votesAfter = await myTokenContract.getVotes(address);
    const balanceAfter = await myTokenContract.balanceOf(address);

    console.log(`Address ${address} has now ${votesAfter.toString()} votes.`);
    console.log(
      `Address ${address} now has a balance of ${balanceAfter.toString()} decimal units of MyToken.`
    );
  } catch (error: any) {
    console.log(error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
