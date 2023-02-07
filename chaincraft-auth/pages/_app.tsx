import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import GlobalProvider from '../contexts/global';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GlobalProvider>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </GlobalProvider>
  );
}

export default MyApp;
