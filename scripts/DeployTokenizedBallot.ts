import { ethers } from 'ethers';
import { MyToken__factory, TokenizedBallot__factory } from '../typechain-types';
import * as dotenv from 'dotenv';
dotenv.config();

const PROPOSALS = ['Proposal1', 'Proposal2', 'Proposal3'].map(
  ethers.encodeBytes32String
);

async function main() {
  const targetBlockNumber = process.argv.slice(2)[0];
  if (!targetBlockNumber) throw new Error('No target block number provided');

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ''
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider);

  const tokenizedBallotFactory = new TokenizedBallot__factory(wallet);
  const tokenizedBallotContract = await tokenizedBallotFactory.deploy(
    PROPOSALS,
    '0x7fE72432Df2F96EB07236FF1d23C85d89f5b5D1F',
    targetBlockNumber
  );
  await tokenizedBallotContract.waitForDeployment();
  console.log(`Contract deployed to ${tokenizedBallotContract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
