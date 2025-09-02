import React from "react";
import { GiGoldBar } from "react-icons/gi";
import Link from "next/link";
import Image from "next/image";

//INTERNAL IMPORT
import Style from "./Profile.module.css";
import images from "../../../public/img";

const Profile = ({ currentAccount }) => {
  return (
    <div className={Style.profile}>
      <div className={Style.profile_account}>
        <Image
          src={images.goldprofile}
          alt="Gold Profile"
          width={50}
          height={50}
          className={Style.profile_account_img}
        />

        <div className={Style.profile_account_info}>
          <small>{currentAccount.slice(0, 18)}..</small>
        </div>
      </div>

      <div className={Style.profile_menu}>
        <div className={Style.profile_menu_one}>
          <div className={Style.profile_menu_one_item}>
            <GiGoldBar />
            <p>
              <Link href={{ pathname: "/my-collection" }}>View My Collection</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
