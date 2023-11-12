import { ethers } from "ethers";
import { TokenizedBallot, TokenizedBallot__factory } from "../typechain-types";
import * as dotenv from "dotenv";
dotenv.config();

// Mapping of wallet addresses to Discord usernames
const walletMapping: { [address: string]: string } = {
  "0xBAF5cdEAD710e3347Dc3862E38a4044EAc50A036": "@falko6544",
  "0x49F719613Da44fb4EDF69c3f8544C1a4fe75ceE4": "@bladesofchaos23",
  "0xefb02f2ae2f725e1f53878258ab3b121feafe8f3": "@outerspace_staking",
  "0xBFfCe813B6c14D8659057dD3111D3F83CEE271b8": "@anjaysahoo",
  "0xfDC252985c13cA04865cf1546b66Df4FA33EC42a": "@deca12x",
  "0xbc6a681f7ebf7a9ad9b564e4ff81148cbde6b243": "@Davoelgofara",
};

async function main() {
  const proposal = process.argv.slice(2)[0];
  const amount = process.argv.slice(2)[1];
  if (!proposal) throw new Error("No proposal provided");
  if (!amount) throw new Error("No amount provided");

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ""
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "", provider);

  // Get the TokenizedBallot contract address.
  const ballotAddress = "0x1234567890123456789012345678901234567890";

  // Create a factory for the TokenizedBallot contract.
  const tokenizedBallotFactory = new TokenizedBallot__factory(wallet);

  // Attach the factory to the contract address.
  const tokenizedBallotContract = tokenizedBallotFactory.attach(
    ballotAddress
  ) as TokenizedBallot;

  try {
    const voteTx = await tokenizedBallotContract.vote(
      proposal,
      ethers.parseUnits(amount)
    );
    await voteTx.wait();

    const discordUsername = walletMapping[wallet.address];
    if (discordUsername) {
      console.log(
        `${discordUsername} voted ${ethers.parseUnits(
          amount
        )} for proposal ${proposal}`
      );
    } else {
      console.log(
        `${wallet.address} voted ${ethers.parseUnits(
          amount
        )} for proposal ${proposal}`
      );
    }
  } catch (error: any) {
    console.log(error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
