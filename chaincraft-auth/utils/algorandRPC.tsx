import { SafeEventEmitterProvider } from '@web3auth/base';
import algosdk, { waitForConfirmation } from 'algosdk';
import { ALGO_API_KEY } from '../config';
const algodToken = {
  'x-api-key': ALGO_API_KEY,
};
const algodServer = 'https://testnet-algorand.api.purestake.io/idx2';
const algodPort = '';

const indexerClient = new algosdk.Indexer(algodToken, algodServer, algodPort);

export default class AlgorandRPC {
  private provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  getAlgorandKeyPair = async (): Promise<any> => {
    const privateKey = (await this.provider.request({
      method: 'private_key',
    })) as string;
    var passphrase = algosdk.secretKeyToMnemonic(
      Buffer.from(privateKey, 'hex')
    );
    var keyPair = algosdk.mnemonicToSecretKey(passphrase);
    return keyPair;
  };

  getAccounts = async (): Promise<any> => {
    const keyPair = await this.getAlgorandKeyPair();
    return keyPair.addr;
  };
}
