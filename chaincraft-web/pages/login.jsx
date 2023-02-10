import PageLayout from '@/components/page-layout';
import {
  Box,
  Button,
  Center,
  Divider,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast,
  Modal,
  ModalBody,
  Select,
  Textarea,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  Spinner,
  ModalOverlay,
} from '@chakra-ui/react';
import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { GlobalContext } from 'contexts/global';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '@firebase/auth';
import Link from 'next/link';
import { ipfscidv0ToByte32 } from '../utils/constant';
import { FiUploadCloud } from 'react-icons/fi';
import { pinata } from '../utils/constant';
import { BsCheckCircle } from 'react-icons/bs';
import { useRouter } from 'next/router';
import { createUser } from '../db/firestore';

const IndexPage = () => {
  const toast = useToast();
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const { user, mapUserData, setUserCookie, loginWeb3, account, createAsset } =
    useContext(GlobalContext);
  const [password, setPassword] = useState('');
  const [image, setImage] = useState('');
  const [passwordR, setPasswordR] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [action, setAction] = useState(null);
  const [assetType, setAssetType] = useState('pure nft');
  const [name, setName] = useState('');
  const [total, setTotal] = useState(1);
  const [decimals, setDecimals] = useState(0);
  const [manager, setManager] = useState('');
  const [freeze, setFreeze] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [id, setId] = useState(null);
  const [fetching, setFetching] = useState(false);

  const fileRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = fileRef.current.files[0];
    console.log(imageSrc);
    setImage(imageSrc);
  }, [fileRef]);
  const navigator = useRouter();

  async function handleLogin() {
    try {
      signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          // User credential from custom Auth
          const user = userCredential.user;
          // Sign in web3auth
          await loginWeb3(userCredential);
          //Save Browser Cookie
          const userData = await mapUserData(user);
          setUserCookie(userData);
          navigator.push('/');
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
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (user) {
      navigator.push('/home');
    }
  }, [user]);

  function handlSignUp() {
    if (password !== passwordR) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      return;
    }
    setFetching(true);
    try {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          // Signed in
          const user = userCredential.user;
          //Save Browser Cookie
          const userData = await mapUserData(user);
          setUserCookie(userData);
          if (userData) {
            //Create users offchain database (firestore) here
            await createUser(user.email, user.uid);
            // Sign in web3auth
            await loginWeb3(userCredential);
          }

          //Navigate to home if everything is successful
          navigator.push('/');
        })
        .catch((error) => {
          const errorCode = error.code;
          setFetching(false);
          //          const errorMessage = error.message;
          toast({
            title: 'Error',
            description: errorCode,
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        });
    } catch (e) {
      setFetching(false);
      console.log(e);
    }
  }

  return (
    <PageLayout title='Home' description='Welcome to Chaincraft'>
      <Box mt={18} mb={4}>
        <Text
          bgGradient='linear(to-l, #FF0080, #1075f6)'
          bgClip='text'
          fontWeight={800}
          fontSize='4xl'
        >
          CHAINCRAFT
        </Text>
      </Box>

      <Divider />
      <Stack
        spacing={4}
        py={4}
        borderRadius={16}
        background='#1075f6'
        initial='hidden'
        sx={{
          backgroundImage:
            "linear-gradient(to bottom, rgb(16, 117, 246, 0.73), rgba(245, 246, 252, 0.52)),url('assets/images/people.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        align='center'
        h='80vh'
        w='100%'
        direction={{ base: 'column', md: 'row' }}
      >
        {/* Welcoming View */}
        {!user && (
          <VStack
            align='center'
            w={{ base: '100%', md: '100%' }}
            py={{ base: 5, md: 0 }}
            px={5}
          >
            <Box display={'flex'} justifyContent='center' alignItems={'center'}>
              <Heading
                fontSize='3xl'
                textAlign={'center'}
                sx={{
                  color: 'white',
                  borderColor: 'gray.500',
                  fontWeight: 900,
                }}
              >
                Bring your creative ideas to life on the Algorand Blockchain
              </Heading>
            </Box>

            <Stack
              direction={['column', 'column', 'column']}
              w='100%'
              justifyContent={'center'}
              alignItems='center'
            >
              <Center
                maxW={{ base: '100%', lg: '450px' }}
                w={{ base: '100%', md: '100%' }}
              >
                {/* SignIn Form */}
                {pageIndex === 0 && (
                  <Box
                    mt={3}
                    py={6}
                    px={0}
                    w='100%'
                    borderRadius={20}
                    background={'#2d3142'}
                    fontWeight={600}
                    justifyContent='center'
                    alignItems={'center'}
                    flexDirection='column'
                    textAlign={'center'}
                    h='100%'
                    fontSize='xl'
                    color={'white'}
                  >
                    <Box px={6}>
                      <Text>Create Account</Text>
                      <Box fontSize={'sm'} py={2}>
                        Have a chaincraft Account?{' '}
                        <Box
                          as='span'
                          color={'orange'}
                          cursor={'pointer'}
                          onClick={() => setPageIndex(1)}
                        >
                          Login
                        </Box>{' '}
                      </Box>
                      <br />
                      <Input
                        borderRadius={'12px'}
                        type='email'
                        value={email}
                        h={'48px'}
                        w='100%'
                        placeholder='Email Address'
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <br /> <br />
                      <Input
                        borderRadius={'12px'}
                        type='password'
                        value={password}
                        h={'48px'}
                        w='100%'
                        placeholder='Password'
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <br /> <br />
                      <Input
                        borderRadius={'12px'}
                        type='password'
                        value={passwordR}
                        h={'48px'}
                        w='100%'
                        placeholder='Repeat Password'
                        onChange={(e) => setPasswordR(e.target.value)}
                      />
                    </Box>

                    <br />
                    <Box px={5} pb={2}>
                      <Button
                        w='100%'
                        mt={3}
                        fontSize={'lg'}
                        fontWeight={600}
                        sx={{
                          background: 'orange',
                          borderRadius: '15px',
                          height: '55px',
                        }}
                        onClick={handlSignUp}
                      >
                        {fetching ? <Spinner /> : ' CREATE WALLET'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Login Form */}
                {pageIndex === 1 && (
                  <Box
                    mt={3}
                    py={6}
                    px={0}
                    w='100%'
                    borderRadius={20}
                    background={'#2d3142'}
                    fontWeight={600}
                    justifyContent='center'
                    alignItems={'center'}
                    flexDirection='column'
                    textAlign={'center'}
                    h='100%'
                    fontSize='xl'
                    color={'white'}
                  >
                    <Box px={6}>
                      <Text>login</Text>
                      <Box fontSize={'sm'} py={2}>
                        Don&apos;t have a chaincraft Account?{' '}
                        <Box
                          as='span'
                          color={'orange'}
                          cursor={'pointer'}
                          onClick={() => setPageIndex(0)}
                        >
                          Sign Up
                        </Box>{' '}
                      </Box>
                      <br />
                      <Input
                        borderRadius={'12px'}
                        type='email'
                        value={email}
                        h={'48px'}
                        w='100%'
                        placeholder='Email Address'
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <br /> <br />
                      <Input
                        borderRadius={'12px'}
                        type='password'
                        value={password}
                        h={'48px'}
                        w='100%'
                        placeholder='Password'
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <br /> <br />
                    </Box>
                    <br />
                    <Box px={5} pb={2}>
                      <Button
                        w='100%'
                        mt={3}
                        fontSize={'lg'}
                        fontWeight={600}
                        sx={{
                          background: 'orange',
                          borderRadius: '15px',
                          height: '55px',
                        }}
                        onClick={handleLogin}
                      >
                        LOGIN WALLET
                      </Button>
                    </Box>
                  </Box>
                )}
              </Center>
            </Stack>
          </VStack>
        )}
      </Stack>
    </PageLayout>
  );
};

export default IndexPage;
