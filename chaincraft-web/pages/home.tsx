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
  HStack,
  Avatar,
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
  Slide,
  IconButton,
} from '@chakra-ui/react';
import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { GlobalContext } from 'contexts/global';
import { getAuth, signInWithEmailAndPassword } from '@firebase/auth';
import Link from 'next/link';
import { hexToBase64, ipfscidv0ToByte32 } from '../utils/constant';
import { FiUploadCloud } from 'react-icons/fi';
import { pinata } from '../utils/constant';
import { BsCheckCircle } from 'react-icons/bs';

const HomePage = () => {
  const { user, account, balance, createAsset, destroyAsset, logout, loading, asset, getAssets,
    assetLoading,
    setAssetLoading,
    ImageURL,
    setImageURL,
    checkAssetInfo
  }: any =
    useContext(GlobalContext);
  const [image, setImage] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [action, setAction] = useState(null);
  const [assetType, setAssetType] = useState('pure nft');
  const [name, setName] = useState('');
  const [total, setTotal] = useState("1");
  const [decimals, setDecimals] = useState(0);
  const [manager, setManager] = useState('');
  const [freeze, setFreeze] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [id, setId] = useState(null);
  const [destroying, setDestroying] = useState(false);
  const [onView, setOnView] = useState(false);
  const [viewImage, setViewImage] = useState(false)
  const [cid, setCid] = useState(null);

  const fileRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = fileRef.current.files[0];
    console.log(imageSrc);
    setImage(imageSrc);
  }, [fileRef]);

  const arcData: any = {
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
    total: parseInt(total),
  };

  async function submitAsset() {
    setSubmitting(true);

    if (!image) {
      console.log('No file selected');
      return;
    }
    const formData = new FormData();
    formData.append('img', image);

    try {
      const response = await fetch('https://energetic-tuna-cowboy-hat.cyclic.app/cid/ ', {
        method: 'POST',
        body: formData,
      });

      //https://cors-anywhere.herokuapp.com/
      // https://cors-anywhere.herokuapp.com/https://energetic-tuna-cowboy-hat.cyclic.app/cid/ 

      const result = await response.json();

      if (result) {
        console.log('file pinned on IPFS');
        const ipfsCid = result.ipfsCid;
        const imageIntegrity = result.imageIntegrity;
        const arc3Metadata = {
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
  }, [destroying, destroyAsset]);


  useEffect(() => {
    getAssets();
  }, [onView])

  useEffect(() => {
    if (cid) {
      // <Box as="img" src={`${x.external_url}`} />
      setViewImage(!viewImage)
      const id = parseInt(cid)
      checkAssetInfo(id)

    }
  }, [cid])



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

                  <Text
                    py={2}
                    color={'orange'}
                    cursor={'pointer'}
                    onClick={logout}
                  >
                    Log out
                  </Text>
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
                    onClick={() => setOnView(true)}
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
        <ModalContent bg="#2d3142" color="whitesmoke">
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


      <Slide direction='right' in={onView} style={{ zIndex: 99999999 }}>
        <Box bgColor={'blackAlpha.700'} w='100%' minH='100vh' display={'flex'}>


          {cid && (
            <Box
              w={{ base: '100%', lg: '60%' }}
              left={0}
              bg={"gray"}
              top={0}
              h="100vh"
            >

              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                p={6}
              >
                <Button
                  bg={"grey"}
                  onClick={() => {
                    setCid(null);
                  }}>  Close</Button>

              </Box>

              {assetLoading && (
                <Center h="60%">
                  <Spinner />
                 
                  <Text pl={2} color="white">fetching media from metadata...</Text>
                </Center>
              )}
              {!assetLoading && (
                <Box
                  w="57%"
                  h="auto"
                  as='img'
                  src={`https://ipfs.io/ipfs/${ImageURL}`}

                />
              )}
            </Box>
          )}

          <Box
            w={{ base: '100%', lg: '40%' }}
            py={6}
            px={3}
            right={0}
            bgColor='#2d3142'
            position='absolute'
            minH='100%'
          >
            <Box px={3} w='100%' overflow={"auto"}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Heading
                  sx={{
                    color: 'rgb(18, 29, 51',
                  }}
                  as='h6'
                  fontWeight='600'
                  fontSize='24px'
                >
                  My Assets
                </Heading>

                <IconButton
                  size={'md'}
                  color='grey'
                  borderRadius='50%'
                  icon={<Text fontSize={'25px'}>X</Text>}
                  aria-label={'Open Menu'}
                  display={['inherit', 'inherit', 'inherit']}
                  onClick={() => {
                    setOnView(false);
                    setCid(null)
                  }}
                />
              </Box>
              <br />
              <Input
                type='text'
                w='100%'
                py={6}
                placeholder='Search By Asset ID'
                borderRadius='15px'
              />

              <Box minH='100vh' py={6}>

                {!loading &&
                  asset &&
                  asset.map((x: any) =>

                  (
                    <HStack w='100%' bg="blackAlpha.400" justifyContent={'space-between'}
                      alignItems="center"
                      key={x["asset-id"]}
                      h="120px" px={6}
                      borderRadius={6}
                      mb={3}
                    >
                      <HStack textAlign={"left"} justify={"start"}>
                        {/* <VStack>
                          <Avatar
                            h="40px"
                            w="40px"
                            bg={"gray"}
                          />
                        </VStack> */}
                        <VStack textAlign={"left"} w="100%">
                          <Box><Box as="span" color="orange">Asset-id: </Box> {x["asset-id"]}</Box>
                          <Box><Box as="span" color="orange">Amount: </Box>  {x["amount"]}</Box>
                        </VStack>
                      </HStack>

                      <Link href={"#"} >
                        <Box fontSize={"xs"} color="orange" onClick={() => setCid(x)}>View on IPFS</Box>
                      </Link>
                    </HStack>
                  )



                  )
                }

                {loading && (
                  <Center>
                    <Spinner />
                  </Center>
                )}





                {!asset && (
                  <>
                    <Text>Fetched IDs would appear here</Text>
                  </>
                )}




              </Box>
            </Box>
          </Box>
        </Box>
      </Slide>
    </PageLayout >
  );
};

export default HomePage;
