import React from "react";
import Link from "next/link";

//INTERNAL IMPORT
import Style from "./Discover.module.css";

const Discover = ({ isOwner = false }) => {
  //--------DISCOVER NAVIGATION MENU
  let discover = [
    {
      name: "Explore NFTs",
      link: "searchPage",
    },
    {
      name: "Your Portfolio",
      link: "author",
    },
    {
      name: "Account Settings",
      link: "account",
    },
  ];

  if (isOwner) {
    discover.push({
      name: "Admin Panel",
      link: "admin",
    });
  }

  return (
    <div>
      {discover.map((el, i) => (
        <div key={i + 1} className={Style.discover}>
          <Link href={{ pathname: `${el.link}` }}>{el.name}</Link>
        </div>
      ))}
    </div>
  );
};

export default Discover;
