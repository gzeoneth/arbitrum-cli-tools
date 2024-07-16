import {
  getRawData,
  processRawData,
  decompressAndDecode,
  getAllL2Msgs,
  decodeL2Msgs,
} from './utils';
import fs from 'fs';
import args from '../getClargs';
import { providers } from 'ethers';
import { addCustomNetwork } from '@arbitrum/sdk';

export let l2NetworkId: number;
export let l1Provider: providers.JsonRpcProvider;

export const startL1BatchHandler = async (
  sequencerTx: string,
  provider: providers.JsonRpcProvider,
) => {
  if (!args.outputFile) {
    throw new Error('No outputFile! (You should add --outputFile)');
  }
  if (!args.l2NetworkId) {
    throw new Error('No l2NetworkId! (You should add --l2NetworkId)');
  }
  addCustomNetwork({
    customL2Network: {
      chainID: 20231119,
      confirmPeriodBlocks: 45818,
      ethBridge: {
        bridge: '0xD4FE46D2533E7d03382ac6cACF0547F336e59DC0',
        inbox: '0xFF55fB76F5671dD9eB6c62EffF8D693Bb161a3ad',
        outbox: '0xA597e0212971e65f53f288Ff1fFd26A6C8201f83',
        rollup: '0x846387C3D6001F74170455B1074D01f05eB3067a',
        sequencerInbox: '0xe347C1223381b9Dcd6c0F61cf81c90175A7Bae77',
      },
      explorerUrl: 'http://localhost:8545',
      isArbitrum: true,
      isCustom: true,
      name: 'Deri',
      partnerChainID: 42161,
      partnerChainIDs: [],
      retryableLifetimeSeconds: 604800,
      tokenBridge: {
        l1CustomGateway: '0x0000000000000000000000000000000000000000',
        l1ERC20Gateway: '0x0000000000000000000000000000000000000000',
        l1GatewayRouter: '0x0000000000000000000000000000000000000000',
        l1MultiCall: '0x0000000000000000000000000000000000000000',
        l1ProxyAdmin: '0x0000000000000000000000000000000000000000',
        l1Weth: '0x0000000000000000000000000000000000000000',
        l1WethGateway: '0x0000000000000000000000000000000000000000',
        l2CustomGateway: '0x0000000000000000000000000000000000000000',
        l2ERC20Gateway: '0x0000000000000000000000000000000000000000',
        l2GatewayRouter: '0x0000000000000000000000000000000000000000',
        l2Multicall: '0x0000000000000000000000000000000000000000',
        l2ProxyAdmin: '0x0000000000000000000000000000000000000000',
        l2Weth: '0x0000000000000000000000000000000000000000',
        l2WethGateway: '0x0000000000000000000000000000000000000000',
      },
      nitroGenesisBlock: 0,
      nitroGenesisL1Block: 0,
      depositTimeout: 1800000,
      blockTime: 0.25
    }})


  l2NetworkId = args.l2NetworkId;
  l1Provider = provider;

  const [rawData, deleyedCount] = await getRawData(sequencerTx);
  const compressedData = processRawData(rawData);
  const l2segments = decompressAndDecode(compressedData);

  const l2Msgs = await getAllL2Msgs(l2segments, deleyedCount.toNumber());

  const txHash: string[] = [];
  for (let i = 0; i < l2Msgs.length; i++) {
    txHash.push(...decodeL2Msgs(l2Msgs[i]));
  }

  console.log(
    `Get all ${txHash.length} l2 transaction and ${l2Msgs.length} blocks in this batch, writing tx to ${args.outputFile}`,
  );
  fs.writeFileSync(args.outputFile, txHash.reverse().join('\n').toString());
};
