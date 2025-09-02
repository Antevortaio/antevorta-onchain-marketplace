import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { DiJqueryLogo } from "react-icons/di";
import { CgMenuRight } from "react-icons/cg";
import { FaExclamationTriangle } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";

//INTERNAL IMPORT
import Style from "./NavBar.module.css";
import { Profile, SideBar } from "./index";
import { Button, Error } from "../componentsindex";
import images from "../../public/img";

//IMPORT FROM SMART CONTRACT
import { NFTMarketplaceContext } from "../../Context/NFTMarketplaceContext";

const NavBar = () => {
  const [profile, setProfile] = useState(false);
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const router = useRouter();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${Style.navbar_container_right_profile_box}`)) {
        setProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setProfile(false);
    setOpenSideMenu(false);
  }, [router.asPath]);

  const openProfile = () => {
    setProfile(!profile);
  };

  const openSideBar = () => {
    setOpenSideMenu(!openSideMenu);
  };

  //SMART CONTRACT SECTION
  const { currentAccount, connectWallet, openError, isOwner, isPaused } = useContext(
    NFTMarketplaceContext
  );

  // Helper function to check if route is active
  const isActiveRoute = (route) => {
    return router.pathname === route;
  };

  return (
    <div className={Style.navbar}>
      <div className={Style.navbar_container}>
        <div className={Style.navbar_container_left}>
          <div className={Style.logo}>
            <DiJqueryLogo onClick={() => router.push("/")} />
          </div>
          
          {/* Navigation Links */}
          <nav className={Style.navbar_nav}>
            <Link href="/">
              <span className={`${Style.nav_link} ${isActiveRoute('/') ? Style.nav_link_active : ''}`}>
                Landing Page
              </span>
            </Link>
            <Link href="/searchPage">
              <span className={`${Style.nav_link} ${isActiveRoute('/searchPage') ? Style.nav_link_active : ''}`}>
                Marketplace
              </span>
            </Link>
            <span 
              className={Style.nav_link}
              onClick={() => window.open('https://antevorta-gold.com/', '_blank', 'noopener,noreferrer')}
              style={{ cursor: 'pointer' }}
            >
              About Antevorta
            </span>
          </nav>
        </div>

        {/* Right Section */}
        <div className={Style.navbar_container_right}>
          {/* Maintenance Indicator */}
          {isPaused && (
            <div 
              className={Style.maintenance_indicator}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <FaExclamationTriangle className={Style.maintenance_icon} />
              <span className={Style.maintenance_text}>Maintenance</span>
              
              {showTooltip && (
                <div className={Style.maintenance_tooltip}>
                  <div className={Style.tooltip_content}>
                    <FaExclamationTriangle className={Style.tooltip_icon} />
                    <div className={Style.tooltip_text}>
                      <strong>Platform Update in Progress</strong>
                      <p>A platform update is currently in progress. For security reasons, all transactions are temporarily disabled. The marketplace will be restored within 24 hours.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection Status & Admin Button */}
          <div className={Style.navbar_container_right_button}>
            {!currentAccount ? (
              <Button btnName="Connect Wallet" handleClick={() => connectWallet()} />
            ) : (
              <div className={Style.connected_section}>
                <div className={Style.connected_status}>
                  <div className={Style.connected_dot}></div>
                  <span className={Style.connected_text}>
                    Connected: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                  </span>
                </div>
                
                {isOwner && (
                  <Button
                    btnName="Admin Panel"
                    handleClick={() => router.push("/admin")}
                    classStyle={Style.admin_button}
                  />
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          {currentAccount && (
            <div className={Style.navbar_container_right_profile_box}>
              <div className={Style.navbar_container_right_profile}>
                <Image
                  src={images.goldprofile}
                  alt="Gold Profile"
                  width={40}
                  height={40}
                  onClick={() => openProfile()}
                  className={Style.profile_image}
                />
                {profile && <Profile currentAccount={currentAccount} />}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className={Style.navbar_container_right_menuBtn}>
            <CgMenuRight
              className={Style.menuIcon}
              onClick={() => openSideBar()}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {openSideMenu && (
        <div className={Style.sideBar}>
          <SideBar
            setOpenSideMenu={setOpenSideMenu}
            currentAccount={currentAccount}
            connectWallet={connectWallet}
            isOwner={isOwner}
          />
        </div>
      )}

      {openError && <Error />}
    </div>
  );
};

export default NavBar;
