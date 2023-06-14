import { getNetworks, KeylessWeb3 } from "@getsafle/safle-keyless-js";
import { connectToParent } from "penpal";
import Web3 from "web3";
import { RPC_URLS } from "../constants/RPC_URLS";
import abi from "../erc20-abi.json";

//!* Do the necessary cleanups

export default class ConnectionManager {
  constructor() {
    this.connection = null;
    this.showLogin = false;
    this.addresses = [];
    this.w3 = null;
    this.from = null;
    this.keyless2 = null;
  }

  initializeConnection = async () => {
    this.connection = connectToParent({
      // debug:true,
      methods: {
        init: async (parentShowLogin) => {
          this.showLogin = parentShowLogin;
          try {
            const login = await this.initializeConnectionManager();
            return Promise.resolve({ success: true, resp: login });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        // initializeConnectionManager: async ()=> await this.initializeConnectionManager(),
        getAccounts: async () => {
          try {
            const getAccounts_resp = await this.getAccounts(
              this.w3,
              this.keyless2
            );
            return Promise.resolve({ success: true, resp: getAccounts_resp });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        sendAmountTransaction: async (sendTo, sendAmount) => {
          try {
            const sendAmountTransaction_resp = await this.sendAmountTransaction(
              sendTo,
              sendAmount
            );
            return Promise.resolve({
              success: true,
              resp: sendAmountTransaction_resp,
            });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        signMessage: async (messageToSign, from) => {
          try {
            const signTransaction_resp = await this.signMessage(
              messageToSign,
              this.from
            );
            return Promise.resolve({
              success: true,
              resp: signTransaction_resp,
            });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        refreshBalance: async (fromAddr = this.from) => {
          try {
            const balance_resp = await this.refreshBalance(fromAddr);
            return Promise.resolve({ success: true, resp: balance_resp });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        sendTokenAmountTransaction: async (
          tokenTo,
          tokenSendTo,
          tokenAmount,
          fromAddr
        ) => {
          try {
            const transaction_resp = await this.sendTokenAmountTransaction(
              tokenTo,
              tokenSendTo,
              tokenAmount,
              fromAddr
            );
            return Promise.resolve({ success: true, resp: transaction_resp });
          } catch (e) {
            return { success: false, error: e };
          }
        },
      },
    });
  };

  initializeConnectionManager = async () => {
    // let showLogin = false
    let networks = await getNetworks();

    //formatting network objects with rpcURls
    for (let i in networks) {
      networks[i]["rpcURL"] = RPC_URLS[networks[i].chainId];
    }

    const keyless2 = new KeylessWeb3({ blockchain: networks, env: 'test' });
    this.keyless2 = keyless2;
    const w32 = new Web3(keyless2.provider);

    this.w3 = w32;

    let addressPromise;

    let successTrans = false;
    if (this.showLogin) {
      keyless2.login();
    }

    this.w3.currentProvider.on("login successful", async (callFn) => {
      addressPromise = await this.getAccounts(this.w3, keyless2);
    });

    this.w3.currentProvider.on("transactionSuccess", (resp) => {
      successTrans = "Transaction succeded";
    });

    // console.log("testLog--->",{ keyless2 })
    // await setKeyless(keyless2)
    // let addressResult=await setAddress(w32, keyless2)
    // console.log("address--->",addressResult)

    this.connection.promise.then((parent) => {
      parent.parentMethod({
        success: true,
        message: "Connection is initialized from ConnectionManger",
        data: "",
        successTrans,
        addressPromise,
      });
    });

    return {
      success: true,
      message: "Connection is initialized from ConnectionManger",
      data: "",
      successTrans,
      addressPromise,
    };
  };

  getAccounts = async (_w3, _keyless) => {
    let from = false;
    let connect = false;
    let balance = false;
    let tokens = false;
    let currentChain = false;

    console.log("login ", _w3);
    // setTimeout(() => {
    _w3.eth.personal.getAccounts().then(async (addresses) => {
      console.log("personal : ", addresses);
      this.addresses = addresses;
      if (Array.isArray(addresses) && addresses.length > 0) {
        from = addresses[0];
        this.from = addresses[0];
        console.log(from);
        // setfromAddr(from);
        connect = true;
        // setConnect(true)
        balance = await _w3.eth.getBalance(from);
        // setUserBalance(_w3.utils.fromWei(bal, 'ether'))
        tokens = await _keyless.getCurrentNetworkTokens();
        // console.log({ tokens })
        // setUserAvailableTokens(tokens)

        currentChain = await _keyless.getCurrentChain();
        // setSelectedChain(currentChain)
      }
      this.connection.promise.then((parent) => {
        parent.parentMethod({
          sucess: true,
          message: "getAccounts is called and found addresses",
          data: this.addresses,
          loginSuccess: true,
          tokens,
          balance,
          currentChain,
        });
      });
    });

    // _w3.eth.personal.getAccounts().then((accounts) => {
    //     this.addresses =accounts
    //     this.connection.promise.then(parent=>{
    //     parent.parentMethod({"sucess":true,message:"adresss sent",data:accounts})})
    //     console.log('getAcc : ', accounts);
    // });
    // }, 0);

    return {
      addresses: this.addresses,
      from,
      connect,
      balance,
      tokens,
      currentChain,
    };
  };

  sendAmountTransaction = async (sendTo, sendAmount) => {
    this.keyless2.sendTransaction();
    console.log({ sendTo, sendAmount });

    const sendValue = this.w3.utils.toBN(sendAmount * Math.pow(10, 18));
    console.log({ sendValue });
    // data = 0xa9059cbb0000000000000000000000002723a2756ecb99b3b50f239782876fb595728ac00000000000000000000000000000000000000000000000000de0b6b3a7640000
    const transaction = {
      from: this.from,
      to: sendTo, //to address
      value: sendValue,
      // 'gas': gas,
      // 'data': data,
      // 'nonce': nonce,
      // 'type': '0x2',
      // 'chainId': 137,
    };

    console.log("raw txxxxx : ", transaction);

    const resp = await this.w3.eth.sendTransaction(transaction);
    console.log({ resp });

    const signedTx = await this.w3.eth.signTransaction(transaction);
    console.log("signedTx : ", signedTx);
    return signedTx;
  };

  signMessage = async (messageToSign, fromAddr) => {
    const message = messageToSign;
    console.log({ message, messageToSign });
    const sign_resp = await this.w3.eth.sign(message, fromAddr);

    console.log(sign_resp);
    return sign_resp;
  };

  refreshBalance = async (fromAddr) => {
    const balance = await this.w3.eth.getBalance(fromAddr);
    return balance;
  };

  sendTokenAmountTransaction = async (
    tokenTo,
    tokenSendTo,
    tokenAmount,
    fromAddr
  ) => {
    tokenTo = JSON.parse(tokenTo);
    console.log({ tokenSendTo, tokenTo, tokenAmount, tokenTo });

    const toAddress = tokenSendTo;
    const contractAddress = tokenTo.tokenAddress.toLowerCase();

    const nonce = await this.w3.eth.getTransactionCount(fromAddr, "latest"); // nonce starts counting from 0

    const instance = new this.w3.eth.Contract(abi, contractAddress);

    const sendValue = this.w3.utils.toBN(
      tokenAmount * Math.pow(10, tokenTo.decimal)
    );
    console.log({ sendValue });

    // const sendValue = w3.utils.toBN(0.01 * Math.pow(10, 18));

    let data, gas, balance;

    data = await instance.methods.transfer(toAddress, sendValue).encodeABI();

    try {
      balance = await instance.methods.balanceOf(fromAddr).call();
      console.log("weenus balance : ", balance);
      gas = await instance.methods
        .transfer(toAddress, sendValue)
        .estimateGas({ from: fromAddr });
    } catch (e) {
      console.log("err", e);
    }

    console.log("dataaaaa : ", data);
    console.log("gassssss : ", gas);
    console.log("balanceeeeeee : ", balance);

    // data = 0xa9059cbb0000000000000000000000002723a2756ecb99b3b50f239782876fb595728ac00000000000000000000000000000000000000000000000000de0b6b3a7640000
    const transaction = {
      from: fromAddr,
      to: contractAddress, //to address
      value: 0,
      // 'gas': gas,
      data: data,
      // 'nonce': nonce,
      // 'type': '0x2',
      // 'chainId': 137,
    };

    console.log("raw txxxxx : ", transaction);

    const resp = await this.w3.eth.sendTransaction(transaction);
    console.log(resp);

    const signedTx = await this.w3.eth.signTransaction(transaction);
    console.log("signedTx : ", signedTx);
  };
}
