import { Box, Text, Heading, VStack, useToast } from '@chakra-ui/react';
import { GlobalContext } from '../contexts/global';
import { useContext, useState } from 'react';
import { Auth, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';

const LoginPage = () => {
  let router = useRouter();
  const toast = useToast();
  const { loginWeb3, keyPairs, setKeyPairs }: any = useContext(GlobalContext);

  const [email, setEmail] = useState<string>('demo@algo.com');
  const [password, setPassword] = useState<string>('testing');
  const auth: Auth = getAuth();
  function handleLogin() {
    try {
      signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          // User credential from custom Auth
          const user = userCredential.user;
          // Sign in web3auth
          await loginWeb3(userCredential);
        })
        .catch((error) => {
          const errorCode = error.code;
          toast({
            title: 'Error',
            description: error.message,
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        });
    } catch (e: any) {
      console.log(e);
    }
  }

  return (
    <>
      {!keyPairs && (
        <div id="form" className="signin-form">
          <Text
            bgGradient="linear(to-l, #FF0080, #1075f6)"
            bgClip="text"
            fontWeight={800}
            fontSize="xl"
          >
            CHAINCRAFT
          </Text>
          <br />
          <Heading variant={'h4'} fontSize="xs">
            Don&apos;t have a chaincraft account?{' '}
            <span>
              <a
                href="#"
                style={{
                  color: 'purple',
                }}
              >
                Sign Up
              </a>
            </span>
          </Heading>
          <br />
          <div>
            <label htmlFor="email">Email:</label>
            <br />

            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <br />
            <label htmlFor="password">Password:</label>
            <br />

            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <br />
            <br />

            <input
              type="submit"
              id="submit"
              value="Login"
              onClick={handleLogin}
            />

            <hr />
            <br />
            {/* <Heading variant={'h4'} fontSize="xs">
              Want to sign in as guest? <br /> <br />
              <em>
                {' '}
                <span>Import Existing Wallet</span>
              </em>
            </Heading>
            <Heading variant={'h4'} fontSize="xs">
              or <br />
              <em>
                {' '}
                <span>Generate Account</span>
              </em>
            </Heading> */}
          </div>
          <div
            id="authToken"
            style={{
              display: 'none',
            }}
          ></div>
        </div>
      )}

      {keyPairs && (
        <VStack w="100%" px={3} py={6}>
          <h1>ChainCraft</h1>
          <Heading variant={'h4'} fontSize="xs" px={3} textAlign={'center'}>
            Allow local terminal access to store the following keypair
          </Heading>
          <Box w="100%" maxW={'240px'} fontSize={'xs'} color={'grey'}>
            <Box color={'green'} className="addr">
              {keyPairs.addr}
            </Box>
            <Box color={'red.500'} className="sk">
              {JSON.stringify(Array.from(keyPairs.sk))}
            </Box>
          </Box>

          <ul
            style={{
              fontSize: 'xs',
              textAlign: 'left',
            }}
          >
            <li>Import or Generate Wallet Using Keypair</li>
            <li>Sign messages and transactions</li>
            <li>Monitor Algo API usage</li>
          </ul>
          <br />
          <br />

          <input
            type="submit"
            id="submit"
            className="authorize"
            value="Authorize"
            //onClick={}
          />
        </VStack>
      )}
    </>
  );
};

export default LoginPage;
