import React, { createContext, useEffect, useState } from 'react';
import { initFirebase, WEB3AUTH_CLIENT_ID } from '../config';
import { getAuth, UserCredential } from 'firebase/auth';
import { Web3AuthCore } from '@web3auth/core';
import {
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import RPC from '../utils/algorandRPC';

export interface AuthContext {
  values: {};
}

export const GlobalContext = createContext<AuthContext['values'] | null>(null);

initFirebase();
const GlobalProvider = (props: { children: any }) => {
  const [web3auth, setWeb3auth] = useState<any | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );
  const [keyPairs, setKeyPairs] = useState<any | null>(null);

  const loginWeb3 = async (credential: UserCredential) => {
    if (!web3auth) {
      console.log('web3auth not initialized yet');
      return;
    }
    const idToken = await credential.user.getIdToken(true);
    console.log(idToken);
    console.log(web3auth);

    if (web3auth.walletAdapters.openlogin.status === 'ready') {
      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        {
          loginProvider: 'jwt',
          extraLoginOptions: {
            id_token: idToken,
            verifierIdField: 'sub',
            domain: 'http://localhost:3000',
          },
        }
      );
      setProvider(web3authProvider);
    }
  };

  const onGetAlgorandKeypair = async () => {
    if (!provider) {
      console.log('provider not initialized yet');
      return;
    }
    const rpc = new RPC(provider as SafeEventEmitterProvider);
    const algorandKeypair = await rpc.getAlgorandKeyPair();
    console.log('Keypair', algorandKeypair);
    if (algorandKeypair) {
      setKeyPairs(algorandKeypair);
    }
  };

  //Initialize web3Auth
  useEffect(() => {
    const clientId = WEB3AUTH_CLIENT_ID;
    const init = async () => {
      try {
        const web3auth = new Web3AuthCore({
          clientId,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.OTHER,
          },
        });

        const openLoginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: 'testnet',
            clientId: clientId,
            uxMode: 'redirect', // other option: popup
            loginConfig: {
              jwt: {
                name: 'Chaincraft Login',
                verifier: 'chaincraft',
                typeOfLogin: 'jwt',
                clientId: 'chaincraft-algo',
              },
            },
          },
        });

        web3auth.configureAdapter(openLoginAdapter);

        setWeb3auth(web3auth);

        await web3auth.init();

        if (web3auth.provider) {
          setProvider(web3auth.provider);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  // Fetch KeyPairs
  useEffect(() => {
    if (!keyPairs) {
      onGetAlgorandKeypair();
    }
  });

  return (
    <GlobalContext.Provider
      value={{
        loginWeb3,
        setKeyPairs,
        keyPairs,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
