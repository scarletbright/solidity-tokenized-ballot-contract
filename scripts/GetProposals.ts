import { ethers } from 'ethers';
import { TokenizedBallot, TokenizedBallot__factory } from '../typechain-types';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ''
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider);

  // Get the TokenizedBallot contract address.
  const ballotAddress = '0x94c8383F5CC86889D57873410ADf1D92fD04546A';

  // Create a factory for the TokenizedBallot contract.
  const tokenizedBallotFactory = new TokenizedBallot__factory(wallet);

  // Attach the factory to the contract address.
  const tokenizedBallotContract = tokenizedBallotFactory.attach(
    ballotAddress
  ) as TokenizedBallot;

  try {
    let proposal:
      | ([string, bigint] & { name: string; voteCount: bigint })
      | boolean = true;
    let proposalIndex = 0;
    while (proposal) {
      proposal = await tokenizedBallotContract.proposals(proposalIndex);
      console.log(`${ethers.decodeBytes32String(proposal.name)}`);
      proposalIndex++;
    }
  } catch (error: any) {
    console.log(error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
