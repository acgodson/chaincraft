import { useContext } from 'react';
import { GlobalContext } from 'contexts/global';
import HomePage from './home';

const IndexPage = () => {
  const { user } = useContext(GlobalContext);

  return <HomePage />;
};

export default IndexPage;
