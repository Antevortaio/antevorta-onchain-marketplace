import "../styles/globals.css";
import { NavBar, Footer, MaintenanceBanner } from "../components/componentsindex";
import { NFTMarketplaceProvider } from "../Context/NFTMarketplaceContext";

const MyApp = ({ Component, pageProps }) => {
  return (
  <div>
    <NFTMarketplaceProvider>
        <MaintenanceBanner />
      <NavBar />
      <Component {...pageProps} />
      <Footer />
    </NFTMarketplaceProvider>
  </div>
);
};

export default MyApp;
