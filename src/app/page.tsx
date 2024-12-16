"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
// import { Connection } from "@solana/web3.js";
import {
  Preloader,
  Mouse,
  PopUp,
  Footer,
  Header,
  Promotion,
  Featured,
  Hero,
  Information,
  Popular,
  Collections,
  Action,
  Discover,
} from "@/components";

// const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;

export default function Home() {
  const {
    publicKey,
  } = useWallet();

  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const storedArray = localStorage.getItem("SOLANA_NFTS");
    if (storedArray) {
      const nftsArray = JSON.parse(storedArray);
      setNfts(nftsArray.reverse());
    }
  }, []);

  function removeLastItemFromLocalStorage() {
    const storedArray = localStorage.getItem("SOLANA_NFTS");
    if (storedArray) {
      const array = JSON.parse(storedArray);
      array.pop();
      const updatedArray = JSON.stringify(array);
      localStorage.setItem("SOLANA_NFTS", updatedArray);
    }
  }

  return (
    <>
      <Preloader />
      <div id="wrapper">
        <div id="page" className="pt-40">
          <Header />
          <Hero
            removeLastItemFromLocalStorage={removeLastItemFromLocalStorage}
            publicKey={publicKey}
          />
          <Promotion />
          {nfts?.length ? <Featured nfts={nfts} publicKey={publicKey} /> : null}
          <Information />
          <Popular nfts={nfts} publicKey={publicKey} />
          <Collections />
          <Action publicKey={publicKey} />
          <Discover nfts={nfts} publicKey={publicKey} />
          <Footer />
        </div>
        <PopUp />
      </div>
      <Mouse />
    </>
  );
}