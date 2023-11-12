import { ethers } from 'ethers';
import { MyToken__factory } from '../typechain-types';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Configuring the address to transfer to and the transfer amount
  const address = process.argv.slice(2)[0];
  const amountInDecimals = process.argv.slice(2)[1];
  if (!address) throw new Error('Address not provided');
  if (!amountInDecimals) throw new Error('Amount not provided');

  console.log(`Address attempting to transfer to ${address}`);

  // Configuring the provider
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ''
  );

  // Configuring the wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider);

  // Connecting to MyTokenContract
  const contractAddress = '0x7fE72432Df2F96EB07236FF1d23C85d89f5b5D1F';
  const myTokenContract = MyToken__factory.connect(contractAddress, wallet);

  const balanceReceiverBefore = await myTokenContract.balanceOf(address);
  console.log(
    `Address ${address} has a balance of ${balanceReceiverBefore.toString()} decimal units of MyToken.`
  );

  console.log('Transfering tokens...');

  // Transfering tokens
  try {
    const transferTx = await myTokenContract.transfer(
      address,
      amountInDecimals
    );
    await transferTx.wait();

    const balanceReceiverAfter = await myTokenContract.balanceOf(address);

    console.log(
      `Address ${address} now has a balance of ${balanceReceiverAfter.toString()} decimal units of MyToken.`
    );

    const balanceSenderAfter = await myTokenContract.balanceOf(wallet.address);
    console.log(
      `Sender has now has a balance of ${balanceSenderAfter.toString()} decimal units of MyToken.`
    );
  } catch (error: any) {
    console.log(error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
