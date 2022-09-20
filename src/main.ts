import {run} from './@task';

async function main(): Promise<void> {
  await run();
}

main().catch(console.error);
