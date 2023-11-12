import { ethers } from 'ethers';
import { MyToken__factory, TokenizedBallot__factory } from '../typechain-types';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const proposal = process.argv.slice(2)[0];
  const amount = process.argv.slice(2)[1];
  if (!proposal) throw new Error('No proposal provided');
  if (!amount) throw new Error('No amount provided');

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ''
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider);

  // todo: address of deployed tonkenized ballot contract
  const tokenizedBallotContractAddress = '';
  const tokenizedBallotContract = TokenizedBallot__factory.connect(
    tokenizedBallotContractAddress,
    wallet
  );

  try {
    const voteTx = await tokenizedBallotContract.vote(
      proposal,
      ethers.parseUnits(amount)
    );
    await voteTx.wait();

    console.log(
      `${wallet.address} voted ${ethers.parseUnits(
        amount
      )} for proposal ${proposal}`
    );
  } catch (error: any) {
    console.log(error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
