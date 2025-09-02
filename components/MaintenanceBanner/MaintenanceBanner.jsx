import React, { useContext } from 'react';
import Style from './MaintenanceBanner.module.css';
import { NFTMarketplaceContext } from '../../Context/NFTMarketplaceContext';

const MaintenanceBanner = () => {
  const { isPaused } = useContext(NFTMarketplaceContext);

  if (!isPaused) return null;

  return (
    <div className={Style.maintenanceBanner}>
      <div className={Style.content}>
        <span className={Style.icon}>⚠️</span>
        <span className={Style.message}>
          Marketplace is currently under maintenance. All transactions are temporarily disabled.
        </span>
      </div>
    </div>
  );
};

export default MaintenanceBanner; 