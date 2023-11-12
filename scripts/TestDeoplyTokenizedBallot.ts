import { ethers } from 'hardhat';
import { MyToken__factory } from '../typechain-types/factories/contracts/MyToken__factory';
import { TokenizedBallot__factory } from '../typechain-types';

const MINT_VALUE = ethers.parseUnits('1');

async function main() {
  const [deployer, acc1, acc2] = await ethers.getSigners();
  const contractFactory = new MyToken__factory(deployer);
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`Token contract deployed at ${contractAddress}\n`);

  const mintTx = await contract.mint(acc1.address, MINT_VALUE);
  await mintTx.wait();

  const mintTx2 = await contract.mint(acc2.address, MINT_VALUE);
  await mintTx2.wait();

  const balanceBN = await contract.balanceOf(acc1.address);
  console.log(
    `Account ${
      acc1.address
    } has ${balanceBN.toString()} decimal units of MyToken\n`
  );

  const delegateAcc1Tx = await contract.connect(acc1).delegate(acc1.address);
  await delegateAcc1Tx.wait();

  const delegateAcc2Tx = await contract.connect(acc2).delegate(acc2.address);
  await delegateAcc2Tx.wait();
  const votesAfterAcc1 = await contract.getVotes(acc1.address);
  const votesAfterAcc2 = await contract.getVotes(acc1.address);

  console.log(`Acc 1 has ${votesAfterAcc1} votes`);
  console.log(`Acc 2 has ${votesAfterAcc1} votes`);

  const lastBlock = await ethers.provider.getBlock('latest');
  const lastBlockNumber = lastBlock?.number ?? 0;

  console.log(`The last block number was ${lastBlockNumber}`);

  const proposalsForDeployment = ['Proposal1', 'Proposal2'].map(
    ethers.encodeBytes32String
  );

  const contractFactoryTokenizedBallot = new TokenizedBallot__factory(deployer);
  const ballotContract = await contractFactoryTokenizedBallot.deploy(
    proposalsForDeployment,
    contract.getAddress(),
    4
  );
  await ballotContract.waitForDeployment();

  for (let i = 0; i < proposalsForDeployment.length; i++) {
    const proposal = await ballotContract.proposals(i);
    console.log(ethers.decodeBytes32String(proposal.name));
  }

  const voteTx = await ballotContract
    .connect(acc1)
    .vote(1, ethers.parseUnits('1'));
  voteTx.wait();

  // const votesLeftAfterVote = await contract.getVotes(acc1.address);

  // console.log(`Acc 1 has ${votesLeftAfterVote} votes left`);
  const votingPowerSpent = await ballotContract.getRemeiningVotingPower(acc1);
  console.log(votingPowerSpent.toString());

  const voteTx2 = await ballotContract
    .connect(acc1)
    .vote(1, ethers.parseUnits('1'));
  voteTx2.wait();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
