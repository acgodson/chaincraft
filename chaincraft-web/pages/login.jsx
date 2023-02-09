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
  const {
    user,
    mapUserData,
    setUserCookie,
    loginWeb3,
    account,
    balance,
    createAsset,
    provider,
    destroyAsset,
  } = useContext(GlobalContext);
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
  const [destroying, setDestroying] = useState(false);
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

  const arcData = {
    asset: {
      defaultFrozen: false,
      unitName: name,
      assetName: `${name}@arc3`,
      url: '',
      manager: manager,
      metadata: '',
      imageIntegrity: '',
    },
    description: description,
    creator: account,
    total: total,
  };

  async function submitAsset() {
    setSubmitting(true);

    // const file = this.files[0];
    const file = fileRef.current.files[0];

    if (!file) {
      console.log('No file selected');
      return;
    }
    const formData = new FormData();
    formData.append('img', file);

    try {
      const response = await fetch('http:localhost:4040/pin/cid', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': file.type,
        },
      });

      const result = await response.json();
      if (result) {
        console.log('file pinned on IPFS');
        const ipfsCid = result.ipfsCid;
        const imageIntegrity = result.imageIntegrity;
        const arc3Metadata = {
          image: ipfsCid,
          description: arcData.asset.description,
          image: `ipfs://${ipfsCid}`,
          image_integrity: imageIntegrity,
          image_mimetype: `image/jpg`,
          properties: {
            file_url: 'arc3-asa',
            file_url_integrity: imageIntegrity,
            file_url_mimetype: `image/jpg`,
          },
        };

        const arc69Metadata = {
          standard: 'arc69',
          description: arcData.asset.description,
          mime_type: `image/jpg`,
          properties: {
            media_url: `ipfs://${ipfsCid}`,
            mime_type: `image/jpg`,
          },
        };

        // Add and pin the metadata to IPFS
        const metadataPinned = await pinata.pinJSONToIPFS(
          arcData.asset.manager.length > 1 ? arc69Metadata : arc3Metadata
        );
        const metadataHash = metadataPinned.IpfsHash;
        //Convert metadata hash to base64 32 bytes string (compatible with algorand);
        const hexString = ipfscidv0ToByte32(metadataHash);
        arcData.asset.url =
          arcData.asset.manager.length > 1
            ? `ipfs://${ipfsCid}`
            : `ipfs://${metadataHash}`;
        arcData.asset.metadata = hexString;
        arcData.asset.imageIntegrity = imageIntegrity;
        console.log(arcData);

        console.log('metadata pinned on IPFS');
        console.log(arcData);
      }

      createAsset(arcData);

      setSubmitting(false);
      setSuccess(true);
    } catch (e) {
      setSubmitting(false);
      console.log(e);
      alert('error uploading asset: cannot fetch from localhost:4040');
    }
  }

  async function handleDestroy() {
    setDestroying(true);
  }

  useEffect(() => {
    if (destroying) {
      const id = window.prompt('Enter Asset ID');
      if (id) {
        try {
          destroyAsset(id);
        } catch (e) {
          console.log(e);
        }
      }
      setDestroying(false);
    }
  }, [destroying]);

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

        {/* Dashboard view */}
        {user && (
          <VStack
            align='center'
            w={{ base: '100%', md: '100%' }}
            py={{ base: 5, md: 0 }}
            px={5}
          >
            <Stack
              direction={['column', 'column', 'row']}
              w='100%'
              justifyContent={'center'}
              alignItems='center'
            >
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
                  <Text>{user.email}</Text>
                  <br />
                  <Text fontSize={'xs'}>Account</Text>
                  <Input
                    readOnly={true}
                    borderRadius={'12px'}
                    type='text'
                    value={!account ? '' : account}
                    h={'48px'}
                    w='100%'
                  />
                  <br /> <br />
                  <Text fontSize={'xs'}>Balance</Text>
                  <Input
                    readOnly={true}
                    borderRadius={'12px'}
                    type='text'
                    value={!balance ? '' : `${balance}  Algo`}
                    h={'48px'}
                    w='100%'
                  />
                  <br /> <br />
                </Box>
                <br />
                <Box px={5} pb={2}>
                  <Link
                    href={`https://bank.testnet.algorand.network/?account=${account}`}
                  >
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
                    >
                      FUND WALLET
                    </Button>
                  </Link>
                </Box>
              </Box>

              <Box
                mt={3}
                py={6}
                px={0}
                w='100%'
                borderRadius={20}
                background={'#2d3142'}
                fontWeight={600}
                display={'flex'}
                justifyContent='center'
                alignItems={'center'}
                flexDirection='column'
                textAlign={'center'}
                h='100%'
                fontSize='xl'
                color={'white'}
              >
                <Box px={2} pb={2} w='300px'>
                  <br />
                  <br />
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
                    onClick={() => {
                      onOpen();
                      setAction('create');
                    }}
                  >
                    CREATE ASSET
                  </Button>
                </Box>
                <Box px={2} pb={2} w='300px'>
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
                    onClick={handleDestroy}
                    _hover={{
                      background: 'deepOrange',
                    }}
                    _active={{
                      background: 'deepOrange',
                    }}
                    disabled={id ? true : false}
                  >
                    {id ? <Spinner /> : '  DESTROY ASSET'}
                  </Button>
                </Box>
                <Box px={2} pb={2} w='300px'>
                  <Button
                    w='100%'
                    mt={3}
                    fontSize={'lg'}
                    fontWeight={600}
                    background='gray'
                    sx={{
                      borderRadius: '15px',
                      height: '55px',
                    }}
                  >
                    VIEW ASSETS
                  </Button>
                </Box>
              </Box>
            </Stack>
          </VStack>
        )}
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {action === 'create' ? 'Create Asset' : 'Destroy Asset'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!submitting && !success && (
              <>
                <Box w='100%' cursor={'pointer'} py={3}>
                  <Box
                    bg={'blackAlpha.300'}
                    w='100%'
                    display={'flex'}
                    justifyContent='center'
                    alignItems='center'
                    flexDirection={'column'}
                    textAlign={'center'}
                  >
                    {!image && (
                      <>
                        <FiUploadCloud fontSize={'55px'} />
                        <Text fontSize={'sm'} py={1}>
                          Upload file
                        </Text>
                      </>
                    )}

                    <Box position={'absolute'} px={5}>
                      <Input
                        opacity={image ? 1 : 0}
                        className='hidden'
                        type='file'
                        id='file-input'
                        accept='.jpeg,.jpg,.png,,image/*'
                        ref={fileRef}
                        onChange={(e) => capture()}
                      />
                    </Box>
                  </Box>
                </Box>
                <br />
                <Select
                  borderRadius={'12px'}
                  h={'48px'}
                  w='100%'
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                >
                  <option value='pure nft'>pure nft</option>
                  <option value='fractional'>fractional</option>
                </Select>

                <Stack
                  direction={['column', 'column', 'row']}
                  w='100%'
                  spacing={4}
                >
                  <Box>
                    <Text fontSize={'xs'} py={2}>
                      Unit name
                    </Text>
                    <Input
                      borderRadius={'12px'}
                      type='text'
                      value={name}
                      h={'48px'}
                      w='100%'
                      placeholder='Unit Name'
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Tooltip
                      label={
                        assetType === 'fractional'
                          ? 'value should be a power of 10 > 1 eg 10,100...'
                          : 'value is 1 for pure nfts'
                      }
                      fontSize='xs'
                    >
                      <Text fontSize={'xs'} py={2}>
                        Total
                      </Text>
                    </Tooltip>

                    <Input
                      borderRadius={'12px'}
                      type='number'
                      value={total}
                      h={'48px'}
                      w='100%'
                      readOnly={assetType === 'fractional' ? false : true}
                      placeholder='Total units'
                      onChange={(e) => setTotal(e.target.value)}
                    />
                  </Box>

                  <Box>
                    <Text fontSize={'xs'} py={2}>
                      Manager Address
                    </Text>
                    <Input
                      borderRadius={'12px'}
                      type='text'
                      value={manager}
                      h={'48px'}
                      w='100%'
                      placeholder='optional'
                      onChange={(e) => setManager(e.target.value)}
                    />
                    <Text fontSize={'xs'} py={2}>
                      Description
                    </Text>

                    <Textarea
                      borderRadius={'12px'}
                      w='100%'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder='Optional'
                      size='sm'
                    />
                  </Box>
                </Stack>
              </>
            )}

            {submitting && !success && (
              <>
                <Center>
                  <VStack w='100%' h='240'>
                    <Spinner />
                    <Text py={3}>Brave new world</Text>
                  </VStack>
                </Center>
              </>
            )}

            {success && (
              <>
                <VStack w='100%' h='240'>
                  <BsCheckCircle fontSize={'48px'} />
                  <Text py={3}>Asset Created</Text>
                </VStack>
              </>
            )}
          </ModalBody>

          {!submitting && !success && (
            <ModalFooter>
              <Button colorScheme='blue' mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button variant='ghost' onClick={submitAsset}>
                Create Asset
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </PageLayout>
  );
};

export default IndexPage;
