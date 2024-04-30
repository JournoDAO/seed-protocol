import {keccak256, toUtf8Bytes} from 'ethers'


async function main() {
  const signature = 'multiPublish(PublishRequestData[])'
  const selector = keccak256(toUtf8Bytes(signature)).slice(0, 10)
  console.log(selector)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
