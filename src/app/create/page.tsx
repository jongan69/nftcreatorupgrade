"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  Transaction
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction
} from "@solana/spl-token";
import Image from 'next/image';
import Link from 'next/link';

import { UPLOAD_IPFS_IMAGE } from "@/lib/constants";

//INTERNAL IMPORT
import { Preloader, Loader } from "@/components";
import {
  SideBar_1,
  SideBar_2,
  SideBar_3,
  SideBar_4,
  SideBar_5,
  SideBar_6,
  FaExternalLinkAlt,
} from "@/components/SVG";
import { ErrorResponse, NFTAttributes, NFTData } from "@/lib/types";

const NETWORK = process.env.NEXT_PUBLIC_NETWORK;
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN || "";
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;
const TOKEN_MINT = new PublicKey("8Ki8DpuWNxu9VsS3kQbarsCWMcFGWkzzA8pUPto9zBd5");
const TOKEN_AMOUNT = 10 * (10 ** 9); // Assuming 9 decimals, adjust if different
const ADMIN_TOKEN_ACCOUNT = new PublicKey(ADMIN_ADDRESS);

// Add validation
if (!process.env.NEXT_PUBLIC_ADMIN) {
  throw new Error("NEXT_PUBLIC_ADMIN environment variable is not set");
}

const Create = () => {
  const { connection } = useConnection();
  const [loader, setLoader] = useState(false);
  const [allowCreate, setAllowCreate] = useState(false);
  const {
    sendTransaction,
    connected,
    publicKey,
  } = useWallet();

  const connectionCustom = useMemo(() => 
    new Connection(HELIUS_RPC_URL),
    []
  );

  console.log("Network:", NETWORK);
  console.log("Network URL:", HELIUS_RPC_URL);

  const notifySuccess = (msg: string) => toast.success(msg, { duration: 2000 });
  const notifyError = (msg: string) => toast.error(msg, { duration: 2000 });

  const [attributes, setAttributes] = useState({
    traitTypeOne: "",
    valueOne: "",
    traitTypeTwo: "",
    valueTwo: "",
  });

  const [nft, setNft] = useState({
    name: "",
    description: "",
    symbol: "",
    image: "",
    link: "",
  });

  const getOrCreateAssociatedTokenAccount = async (
    connection: Connection,
    payer: PublicKey,
    mint: PublicKey,
    owner: PublicKey
  ) => {
    try {
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        owner,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if account exists
      const tokenAccount = await connection.getAccountInfo(associatedToken);
      
      if (!tokenAccount) {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            payer,
            associatedToken,
            owner,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
        await sendTransaction(transaction, connection);
      }
      
      return associatedToken;
    } catch (error) {
      console.error("Error getting/creating token account:", error);
      throw error;
    }
  };

  const CREATE_NFT = async (nft: NFTData, attributes: NFTAttributes) => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    try {
      setLoader(true);

      // Token transfer logic remains the same
      const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        TOKEN_MINT,
        publicKey
      );

      const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
      if (!tokenBalance.value.uiAmount || tokenBalance.value.uiAmount < 10) {
        notifyError("Insufficient token balance. Need 10 tokens to mint.");
        setLoader(false);
        return;
      }

      // Create token transfer instruction
      const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        TOKEN_MINT,
        ADMIN_TOKEN_ACCOUNT
      );

      const transferInstruction = createTransferInstruction(
        userTokenAccount,
        adminTokenAccount,
        publicKey,
        TOKEN_AMOUNT
      );

      // Create and send token transfer transaction
      const transferTx = new Transaction().add(transferInstruction);
      const transferSignature = await sendTransaction(transferTx, connection);
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: transferSignature,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight
      });
      console.log("Token transfer successful:", transferSignature);

      // Update the mint request to match the API parameters exactly
      const mintRequest = {
        jsonrpc: '2.0',
        id: 'helius-test',
        method: 'mintCompressedNft',
        params: {
          name: nft.name,
          symbol: nft.symbol,
          owner: publicKey.toString(),          
          description: nft.description,
          attributes: [
            {
              trait_type: attributes.traitTypeOne,
              value: attributes.valueOne,
            },
            {
              trait_type: attributes.traitTypeTwo,
              value: attributes.valueTwo,
            }
          ],
          imageUrl: nft.image,
          externalUrl: nft.link,
          sellerFeeBasisPoints: 0,
          creators: [
            {
              address: publicKey.toString(),
              share: 100
            }
          ],
          confirmTransaction: true
        }
      };

      console.log("Sending mint request:", mintRequest);

      const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mintRequest)
      });

      const data = await response.json();
      console.log("Mint response:", data);

      if (data.error) {
        console.error("Minting error:", data.error);
        throw new Error(data.error.message || "Minting failed");
      }

      if (data.result && data.result.minted) {
        console.log('Minted asset:', data.result.assetId);
        console.log('Transaction signature:', data.result.signature);

        // Store the NFT data in local storage
        const nftData = {
          ...nft,
          attributes,
          mint: data.result.assetId,
          owner: publicKey.toString(),
          signature: data.result.signature
        };

        const existingNfts = JSON.parse(localStorage.getItem("SOLANA_NFTS") || "[]");
        existingNfts.push(nftData);
        localStorage.setItem("SOLANA_NFTS", JSON.stringify(existingNfts));

        setLoader(false);
        notifySuccess("NFT Created Successfully");
      } else {
        throw new Error("Minting failed - unexpected response format");
      }

    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.error("Error in NFT creation:", {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      notifyError(err.message || "Error creating NFT");
      setLoader(false);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoader(true);
      const file = event.target.files?.[0];
      if (file) {
        const imgUrl = await UPLOAD_IPFS_IMAGE(file);
        console.log(imgUrl);
        setNft({ ...nft, image: imgUrl || "" });
        setLoader(false);
      }
    } catch (error) {
      console.log(error);
      setLoader(false);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        try {
          const balance = await connectionCustom.getBalance(publicKey);
          const checkBal = balance / 1e9;
          setAllowCreate(checkBal > 0);
        } catch (error: unknown) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    fetchBalance();
  }, [connected, publicKey, connectionCustom]);


  return (
    <>
      <Preloader />
      <div id="wrapper">
        <div id="page" className="market-page ">
          <div id="market-header">
            <div className="market-header flex items-center justify-between">
              <div className="admin_active" id="header_admin">
                <div className="popup-user relative">
                  <div className="user">
                    <Image
                      src="/assets/images/avatar/avatar-small-09.png"
                      alt="Avatar"
                      width={60}
                      height={60}
                    />
                    <span>@theblockchaincoders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="btn-canvas active">
            <div className="canvas">
              <Link href="/">
                <span />
              </Link>
            </div>
          </div>
          <div className="flat-tabs">
            <div className="section-menu-left">
              <div className="box-logo">
                <Link href="/">
                  <Image
                    src="logo-br.png"
                    alt="Logo"
                    style={{
                      width: "60px",
                      height: "auto",
                    }}
                  />
                </Link>
              </div>
              <div className="create menu-tab">
                <a
                  className="tf-button style-1 type-1 tablinks active"
                  data-tabs="create"
                >
                  <span>Create</span>
                </a>
              </div>
              <div className="over-content">
                <div className="content">
                  <h6>Menu</h6>
                  <ul className="menu-tab">
                    <li className="">
                      <Link href="/">
                        <SideBar_1 />
                        <SideBar_2 />
                        Home
                      </Link>
                    </li>
                    <li className="">
                      <Link href="/">
                        <SideBar_3 />
                        <SideBar_4 />
                        Created
                      </Link>
                    </li>
                    <li className="">
                      <Link href="/">
                        <SideBar_5 />
                        <SideBar_6 />
                        Explore
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bottom">
                <p>© 2023 Made By</p>
                <p>@theblockchaincoders</p>
              </div>
            </div>
            <div className="content-tabs">
              <div id="create" className="tabcontent active">
                <div className="wrapper-content-create">
                  <div className="heading-section">
                    <h2 className="tf-title pb-30">Create Solana NFT</h2>
                  </div>
                  <div className="widget-tabs relative">
                    <div className="widget-content-tab">
                      <div className="widget-content-inner description active">
                        <div className="wrap-upload">
                          <div className="h-full">
                            <label className="uploadfile h-full flex items-center justify-center">
                              <div className="text-center">
                                <Image
                                  src="assets/images/box-icon/upload.png"
                                  alt=""
                                  width={60}
                                  height={60}
                                />
                                <h5>Upload file</h5>
                                <p className="text">
                                  Drag or choose your file to upload
                                </p>
                                <div className="text filename">
                                  PNG, GIF, WEBP, MP4 or MP3.Max 1Gb.
                                </div>
                                <input
                                  type="file"
                                  className=""
                                  name="file"
                                  onChange={handleImageChange}
                                />
                              </div>
                            </label>
                          </div>
                        </div>
                        <div className="wrap-content w-full">
                          <div
                            id="commentform"
                            className="comment-form"
                          >
                            <fieldset className="name">
                              <label>Name *</label>
                              <input
                                type="text"
                                id="name"
                                placeholder="nft name"
                                name="name"
                                tabIndex={2}
                                defaultValue=""
                                aria-required="true"
                                required
                                onChange={(e) =>
                                  setNft({ ...nft, name: e.target.value })
                                }
                              />
                            </fieldset>
                            <fieldset className="message">
                              <label>NFT Description *</label>
                              <textarea
                                id="message"
                                name="message"
                                rows={4}
                                placeholder="Please describe your nft*"
                                tabIndex={4}
                                aria-required="true"
                                required
                                defaultValue={""}
                                onChange={(e) =>
                                  setNft({
                                    ...nft,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </fieldset>
                            <div className="flex gap30">
                              <fieldset className="price">
                                <label>Symbol</label>
                                <input
                                  type="text"
                                  id="price"
                                  placeholder="symbol"
                                  name="price"
                                  tabIndex={2}
                                  defaultValue=""
                                  aria-required="true"
                                  required
                                  onChange={(e) =>
                                    setNft({ ...nft, symbol: e.target.value })
                                  }
                                />
                              </fieldset>
                              <fieldset className="website">
                                <label>Website Link</label>
                                <input
                                  type="text"
                                  id="website"
                                  placeholder="website"
                                  name="website"
                                  tabIndex={2}
                                  defaultValue=""
                                  aria-required="true"
                                  required
                                  onChange={(e) =>
                                    setNft({ ...nft, link: e.target.value })
                                  }
                                />
                              </fieldset>
                            </div>
                            <fieldset className="blockchain">
                              <label>Blockchain</label>
                              <div className="widget-coins flex gap30 flex-wrap">
                                <div className="widget-coins-item flex items-center">
                                  <Image
                                    src="assets/images/box-icon/coin-01.png"
                                    alt=""
                                    width={60}
                                    height={60}
                                  />
                                  <p>
                                    <a href="#">Bitcoin</a>
                                  </p>
                                </div>
                                <div className="widget-coins-item flex items-center">
                                  <Image
                                    src="assets/images/box-icon/coin-02.png"
                                    alt=""
                                    width={60}
                                    height={60}
                                  />
                                  <p>
                                    <a href="#">Ethereum</a>
                                  </p>
                                </div>
                                <div className="widget-coins-item flex items-center">
                                  <Image
                                    src="assets/images/box-icon/coin-03.png"
                                    alt=""
                                    width={60}
                                    height={60}
                                  />
                                  <p>
                                    <a href="#">Cardano</a>
                                  </p>
                                </div>
                                <div className="widget-coins-item flex items-center">
                                  <Image
                                    src="assets/images/box-icon/coin-04.png"
                                    alt=""
                                    width={60}
                                    height={60}
                                  />
                                  <p>
                                    <a href="#">Solana</a>
                                  </p>
                                </div>
                              </div>
                            </fieldset>
                            <div className="flex gap30">
                              <fieldset className="price">
                                <label>Attributes</label>
                                <input
                                  type="text"
                                  id="price"
                                  placeholder="type"
                                  name="price"
                                  tabIndex={2}
                                  defaultValue=""
                                  aria-required="true"
                                  required
                                  onChange={(e) =>
                                    setAttributes({
                                      ...attributes,
                                      traitTypeOne: e.target.value,
                                    })
                                  }
                                />
                              </fieldset>
                              <fieldset className="value">
                                <label>*</label>
                                <input
                                  type="text"
                                  id="value"
                                  placeholder="value"
                                  name="value"
                                  tabIndex={2}
                                  defaultValue=""
                                  aria-required="true"
                                  required
                                  onChange={(e) =>
                                    setAttributes({
                                      ...attributes,
                                      valueOne: e.target.value,
                                    })
                                  }
                                />
                              </fieldset>
                            </div>
                            <div className="flex gap30">
                              <fieldset className="price">
                                <input
                                  type="text"
                                  id="price"
                                  placeholder="type"
                                  name="price"
                                  tabIndex={2}
                                  defaultValue=""
                                  aria-required="true"
                                  required
                                  onChange={(e) =>
                                    setAttributes({
                                      ...attributes,
                                      traitTypeTwo: e.target.value,
                                    })
                                  }
                                />
                              </fieldset>
                              <fieldset className="value">
                                <input
                                  type="text"
                                  id="value"
                                  placeholder="value"
                                  name="value"
                                  tabIndex={2}
                                  defaultValue=""
                                  aria-required="true"
                                  required
                                  onChange={(e) =>
                                    setAttributes({
                                      ...attributes,
                                      valueTwo: e.target.value,
                                    })
                                  }
                                />
                              </fieldset>
                            </div>

                            <div className="btn-submit flex gap30 justify-center">
                              <button
                                onClick={() => window.location.reload()}
                                className="tf-button style-1 h50 active"
                              >
                                Cancle
                                <FaExternalLinkAlt />
                              </button>
                              {allowCreate ? (
                                <button
                                  className="tf-button style-1 h50"
                                  onClick={() => CREATE_NFT(nft, attributes)}
                                >
                                  Create NFT
                                  <FaExternalLinkAlt />
                                </button>
                              ) : (
                                <button className="tf-button style-1 h50">
                                  Minimum required 2 Sol
                                  <FaExternalLinkAlt />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {loader && <Loader />}
    </>
  );
};

export default Create;
