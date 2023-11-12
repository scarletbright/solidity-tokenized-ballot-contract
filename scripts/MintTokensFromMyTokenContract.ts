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

  // Minting tokens
  try {
    const mintTx = await myTokenContract.mint(address, MINT_VALUE);
    await mintTx.wait();

    const newBalanceOfAddress = await myTokenContract.balanceOf(address);
    console.log(`The balance of ${address} is now ${newBalanceOfAddress}`);
  } catch (error: any) {
    console.log(error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
