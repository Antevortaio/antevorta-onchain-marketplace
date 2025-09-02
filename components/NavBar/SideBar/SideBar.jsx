import React, { useState } from "react";
import { GrClose } from "react-icons/gr";
import { DiJqueryLogo } from "react-icons/di";
import {
  TiSocialFacebook,
  TiSocialLinkedin,
  TiSocialTwitter,
  TiSocialYoutube,
  TiSocialInstagram,
  TiArrowSortedDown,
} from "react-icons/ti";
import Link from "next/link";
import { useRouter } from "next/router";

//INTERNAL IMPORT
import Style from "./SideBar.module.css";
import images from "../../../public/img";
import Button from "../../Button/Button";
import { Router } from "next/router";

const SideBar = ({ setOpenSideMenu, currentAccount, connectWallet, isOwner = false }) => {
  //------USESTATE
  const [openDiscover, setOpenDiscover] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  const router = useRouter();

  //--------SIMPLIFIED NAVIGATION MENU
  const navigationItems = [
    {
      name: "Landing Page",
      link: "/",
    },
    {
      name: "Marketplace",
      link: "/searchPage",
    },
    {
      name: "About Antevorta", 
      link: "/aboutus",
    },
  ];

  if (isOwner) {
    navigationItems.push({
      name: "Admin Panel",
      link: "/admin",
    });
  }

  //------HELP CNTEER
  const helpCenter = [
    {
      name: "About",
      link: "aboutus",
    },
    {
      name: "Contact Us",
      link: "contactus",
    },
    {
      name: "Subscription",
      link: "subscription",
    },
  ];

  const openDiscoverMenu = () => {
    if (!openDiscover) {
      setOpenDiscover(true);
    } else {
      setOpenDiscover(false);
    }
  };

  const openHelpMenu = () => {
    if (!openHelp) {
      setOpenHelp(true);
    } else {
      setOpenHelp(false);
    }
  };

  const closeSideBar = () => {
    setOpenSideMenu(false);
  };

  return (
    <div className={Style.sideBar}>
      <GrClose
        className={Style.sideBar_closeBtn}
        onClick={() => closeSideBar()}
      />

      <div className={Style.sideBar_box}>
        {/* <Image src={images.logo} alt="logo" width={150} height={150} /> */}
        <p>
          <a href="/">
            <DiJqueryLogo className={Style.sideBar_box_logo} />
          </a>
        </p>
        <p>
          Discover the most outstanding articles on all topices of NFT & write
          your own stories and share them
        </p>
        <div className={Style.sideBar_social}>
          <a href="#">
            <TiSocialFacebook />
          </a>
          <a href="#">
            <TiSocialLinkedin />
          </a>
          <a href="#">
            <TiSocialTwitter />
          </a>
          <a href="#">
            <TiSocialYoutube />
          </a>
          <a href="#">
            <TiSocialInstagram />
          </a>
        </div>
      </div>

      <div className={Style.sideBar_menu}>
        <div>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Navigation</h3>
          <div className={Style.sideBar_discover}>
            {navigationItems.map((el, i) => (
              <p key={i + 1}>
                <Link href={el.link}>{el.name}</Link>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className={Style.sideBar_button}>
        {currentAccount == "" ? (
          <Button btnName="Connect Wallet" handleClick={() => connectWallet()} />
        ) : (
          isOwner && (
          <Button
            btnName="Admin Panel"
            handleClick={() => router.push("/admin")}
          />
          )
        )}
      </div>
    </div>
  );
};

export default SideBar;
