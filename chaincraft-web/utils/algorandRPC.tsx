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

  getBalance = async (): Promise<any> => {
    const keyPair = await this.getAlgorandKeyPair();
    const client = await this.makeClient();
    const balance = await client.accountInformation(keyPair.addr).do();
    return balance.amount;
  };

  makeClient = async (): Promise<any> => {
    const algodToken = {
      'x-api-key': ALGO_API_KEY,
    };
    const algodServer = 'https://testnet-algorand.api.purestake.io/ps2';
    const algodPort = '';
    let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    const client = algodClient;
    return client;
  };

  signMessage = async (): Promise<any> => {
    const keyPair = await this.getAlgorandKeyPair();
    const client = await this.makeClient();
    const params = await client.getTransactionParams().do();
    const enc = new TextEncoder();
    const message = enc.encode('Web3Auth says hello!');
    const txn = algosdk.makePaymentTxnWithSuggestedParams(
      keyPair.addr,
      keyPair.addr,
      0,
      undefined,
      message,
      params
    );
    let signedTxn = algosdk.signTransaction(txn, keyPair.sk);
    let txId = signedTxn.txID;
    return txId;
  };
  confirmTransaction = async (txID: string): Promise<any> => {
    const client = await this.makeClient();
    // Wait for confirmation
    let confirmedTxn = await waitForConfirmation(client, txID, 4);
    //Get the completed Transaction
    const txinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
    var notes = new TextDecoder().decode(confirmedTxn.txn.txn.note);
    const response = {
      tx: txinfo,
      note: notes,
    };
    return response;
  };

  fetchSellersAssets = async (address: string): Promise<any> => {
    try {
      let response = await indexerClient
        .lookupAccountCreatedAssets(address)
        .do();
      if (response) {
        const info = JSON.stringify(response, undefined, 2);
        console.log(info);
        return info;
      }
    } catch (e) {
      console.log(e);
    }
  };

  isAlgorandAddress = async (address: string): Promise<any> => {
    try {
      const client = await this.makeClient();
      const decode = client.decodeAddress(address);
      return true;
    } catch (ex) {
      return false;
    }
  };

  printCreatedAsset = async (
    account: string,
    assetid: number
  ): Promise<any> => {
    const client = await this.makeClient();
    let i: number;
    let accountInfo = await client.accountInformation(account).do();

    for (i = 0; i < accountInfo['created-assets'].length; i++) {
      let scrutinizedAsset = accountInfo['created-assets'][i];
      if (scrutinizedAsset['index'] == assetid) {
        console.log('AssetID = ' + scrutinizedAsset['index']);
        let myparms = JSON.stringify(scrutinizedAsset['params'], undefined, 2);
        console.log('parms = ' + myparms);
        return myparms;
      }
    }
  };


  checkAsset = async (
    assetid: number
  ): Promise<any> => {

    const keyPair = await this.getAlgorandKeyPair();
    const client = await this.makeClient();
    let accountInfo = await client.accountInformation(keyPair.addr).do();
    let idx: number;
    for (idx = 0; idx < accountInfo["created-assets"].length; idx++) {
      let scrutinizedAsset = accountInfo["created-assets"][idx];
      if (scrutinizedAsset["index"] == assetid) {
        let myparms = JSON.stringify(scrutinizedAsset["params"], undefined, 2);
        return myparms;
      }
    }



  };

  printAssetHolding = async (
    account: string,
    assetid: number
  ): Promise<any> => {
    const client = await this.makeClient();
    let i: number;

    const parami = [];
    let accountInfo = await client.accountInformation(account).do();
    for (i = 0; i < accountInfo['assets'].length; i++) {
      let scrutinizedAsset = accountInfo['assets'][i];
      if (scrutinizedAsset['asset-id'] == assetid) {
        let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
        console.log('assetholdinginfo = ' + myassetholding);
        parami.push(myassetholding);
        return parami;
      }
    }
  };

  createAsset = async (arcData: any): Promise<any> => {
    const keyPair = await this.getAlgorandKeyPair();
    const client = await this.makeClient();
    const params = await client.getTransactionParams().do();
    const defaultFrozen = false;
    const unitName = arcData.asset.unitName;
    const assetName = arcData.asset.assetName;
    const url = arcData.asset.url;
    const managerAddr =
      arcData.asset.manager.length === 58 ? arcData.asset.manager : undefined;
    const freezeAddr = undefined;
    const clawbackAddr = undefined;
    const reserveAddr = undefined;
    const decimals = arcData.asset.decimals;
    const total = arcData.asset.total;
    let bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(arcData.asset.metadata.substr(i * 2, 2), 16);
    }
    const metadata = bytes;

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: keyPair.addr,
      total,
      decimals,
      assetName,
      unitName,
      assetURL: url,
      assetMetadataHash: metadata,
      defaultFrozen,
      freeze: freezeAddr,
      manager: managerAddr,
      clawback: clawbackAddr,
      reserve: reserveAddr,
      suggestedParams: params,
    });

    const rawSignedTxn = txn.signTxn(keyPair.sk);
    const tx = await client.sendRawTransaction(rawSignedTxn).do();

    // Wait for confirmation
    let confirmedTxn = await algosdk.waitForConfirmation(client, tx.txId, 4);
    //Get the completed Transaction
    console.log(
      'Transaction ' +
      tx.txId +
      ' confirmed in round ' +
      confirmedTxn['confirmed-round']
    );
    const assetID = confirmedTxn['asset-index'];

    const result = await this.printCreatedAsset(keyPair.addr, assetID);
    return result;
  };




  destroyAsset = async (assetID: string): Promise<any> => {
    const keyPair = await this.getAlgorandKeyPair();
    const client = await this.makeClient();
    const params = await client.getTransactionParams().do();
    const note = undefined;
    const id = parseInt(assetID)
    const parm = await this.checkAsset(id);
    if (parm && parm.manager && parm.manager === keyPair.addr) {
      const params = await client.getTransactionParams().do();
      const addr = keyPair.addr;
      const txn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
        from: addr,
        note: undefined,
        assetIndex: id,
        suggestedParams: params,
      });
      const rawSignedTxn = txn.signTxn(keyPair.sk);
      const tx = await client.sendRawTransaction(rawSignedTxn).do();
      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(
        client,
        tx.txId,
        4
      );
      console.log(confirmedTxn);

      return confirmedTxn;
    }



  };

  findAssetsOnAccount = async (address: string): Promise<any> => {
    let response = await indexerClient.lookupAccountAssets(address).do();
    console.log(JSON.stringify(response, undefined, 2));
  };
}
