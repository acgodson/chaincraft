import ThemeButton from '@/components/theme-button';
import { HStack, Button } from '@chakra-ui/react';
import { GlobalContext } from 'contexts/global';
import { useContext } from 'react';

const Header = () => {

  const { provider }: any =
    useContext(GlobalContext);

  return (
    <HStack
      as='header'
      position='fixed'
      top='0'
      p={8}
      zIndex='tooltip'
      justify='space-between'
      align='center'
      w='100%'
    >
      <ThemeButton />
      {/* <LanguagesButton /> */}

      <Button disabled={true}
        _hover={{
          backgroundColor: null
        }}
      >
        {!provider ? "No Network" : "Testnet"}
      </Button>
    </HStack>
  );
};

export default Header;
