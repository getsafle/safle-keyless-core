import { getNetworks, KeylessWeb3 } from "@getsafle/safle-keyless-js";
import { connectToParent } from "penpal";
import Web3 from "web3";
import { RPC_URLS } from "../constants/RPC_URLS";
import abi from "../erc20-abi.json";

//!* Do the necessary cleanups
let flag=false
export default class ConnectionManager {
  constructor() {
    this.connection = null;
    this.showLogin = false;
    this.addresses = [];
    this.w3 = null;
    this.from = null;
    this.keyless2 = null;
    this.signedData = null;
    this.blockNumber = null;
  }

  initializeConnection = async () => {
    this.connection = connectToParent({
      debug:true,
      methods: {
        init: async (parentShowLogin) => {
          console.log("parentShowLogin", parentShowLogin);
          this.showLogin = parentShowLogin;
          try {
            const login = await this.initializeConnectionManager();
            console.log("init-> ",login)
            return Promise.resolve({ success: true, resp: login });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        // initializeConnectionManager: async ()=> await this.initializeConnectionManager(),
        getAccounts: async () => {
          flag=true
          if(flag){
            console.log("getAccounts")
            try {
              const getAccounts_resp = await this.getAccounts(
                this.w3,
                this.keyless2
              );
              // const signTransaction_resp = await this.signMessage(
              //   "messageToSign",
              //   this.from,
              //   this.w3,
              //   this.keyless2
              // );
              // console.log('signTransaction_resp',signTransaction_resp)
              console.log("init->getAccounts ",getAccounts_resp)
              flag=false
              return Promise.resolve({ success: true, resp: getAccounts_resp });
              
            } catch (e) {
              return { success: false, error: e };
            }
          }
          
        },
        getBlockByNumber: async () => {
            console.log("getBlockByNumber")
            try {
              const block_resp = await this.getBlockByNumber(
                this.w3,
                this.keyless2
              );
              console.log("init->getBlockByNumber ",block_resp)
              flag=false
              return Promise.resolve({ success: true, resp: block_resp });
            } catch (e) {
              return { success: false, error: e };
            }
          
          
        },
        processTransaction: async (data) => {
          try {
            console.log("processTransaction->data",data)
            const sendAmountTransaction_resp = await this.sendAmountTransaction(
              data,
              this.w3,
              this.keyless2
            );
            return Promise.resolve({
              success: true,
              resp: sendAmountTransaction_resp,
            });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        signTransaction: async (data) => {
          try {
            console.log("signTransaction->data",data)
            const sendAmountTransaction_resp = await this.sendAmountTransaction(
              "sendTo",
              1
            );
            return Promise.resolve({
              success: true,
              resp: sendAmountTransaction_resp,
            });
          } catch (e) {
            return { success: false, error: e };
          }
        },
        signData: async (messageToSign) => {
          console.log("signMessage",messageToSign)
          try {
            const signTransaction_resp = await this.signMessage(
              messageToSign.data,
              messageToSign.from,
              this.w3,
              this.keyless2
            );
            console.log("signTransaction_resp",signTransaction_resp)
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
          data
        ) => {
          console.log("sendTokenAmountTransaction->Widget:",data)
          try {
            const transaction_resp = await this.sendTokenAmountTransaction(
              data.tokenTo,
              data.tokenSendTo,
              data.tokenAmount,
              data.fromAddr
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

    const keyless2 = new KeylessWeb3({ blockchain: networks, env: "test" });
    this.keyless2 = keyless2;
    const w32 = new Web3(keyless2.provider);
    console.log("keyless2", this.keyless2);
    this.w3 = w32;

    let addressPromise;

    let successTrans = false;
    // if (this.showLogin) {
      keyless2.login();
    // }

    this.w3.currentProvider.on("login successful", async (callFn) => {
      addressPromise = await this.getAccounts(this.w3, keyless2);
    });

    this.w3.currentProvider.on("transactionSuccess", (resp) => {
      console.log(
        "🚀 ~ file: ConnectionManager.js ~ line 54 ~ ConnectionManager ~ w32.currentProvider.on ~ resp",
        resp
      );
      console.log(resp.receipt);
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
        web3: this.w3,
        keyless: this.keyless2
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
    setTimeout(() => {
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
          type:'getAccount',
          tokens,
          balance,
          currentChain,
        });
      });
    });
    // _w3.eth.personal.getAccounts().then((accounts) => {
    //     this.addresses =accounts
    //     this.connection.promise.then(parent=>{
    //     parent.parentMethod({"sucess":true,message:"addresss sent", data:accounts})})
    //    // console.log('getAcc : ', accounts);
    // });
    }, 1000);

    return {
      addresses: this.addresses,
      from,
      connect,
      balance,
      tokens,
      currentChain,
    };
  };
  getBlockByNumber = async (_w3, _keyless) => {
    let blockNumber= await  _w3.eth.getBlockNumber()
    if(blockNumber){
      console.log("getBlockByNumber",blockNumber)
      this.blockNumber=blockNumber
    }
    return {
      blockNumber:this.blockNumber
    };
  };

  sendAmountTransaction = async (data, _w3, _keyless) => {
   // this.keyless2.sendTransaction();
  //   console.log({ sendTo, sendAmount });
   let  signedTx=null
   let  resp=null
  //  let sendValue1=this.w3.utils.fromWei(sendAmount, 'ether');
  //   const sendValue = this.w3.utils.toBN(sendValue1 * Math.pow(10, 18));
  //   //console.log({ sendValue });
  //   // data = 0xa9059cbb0000000000000000000000002723a2756ecb99b3b50f239782876fb595728ac00000000000000000000000000000000000000000000000000de0b6b3a7640000
  //   const transaction = {
  //     from: this.from,
  //     to: sendTo, //to address
  //     value: sendValue,
  //     // 'gas': gas,
  //     // 'data': data,
  //     // 'nonce': nonce,
  //     // 'type': '0x2',
  //     // 'chainId': 137,
  //   };

    console.log("raw txxxxx : ", {
      from:data.from,
      to:data.to,
      value:data.value
    });
    let tx_res=await this.w3.eth.sendTransaction(
      data
    )
    if(tx_res){
      this.resp=tx_res
    }
    console.log(tx_res);
    this.connection.promise.then((parent) => {
      parent.parentMethod({
        success: true,
        message: "Connection is initialized from ConnectionManger",
        data: "sendTransaction",
       tx_res
      });
    });
    return tx_res;
  };

  signMessage = async (messageToSign, fromAddr,_w3, _keyless) => {
    console.log(messageToSign,fromAddr);
    let signedData=await _w3.eth.sign(messageToSign, fromAddr);
    console.log("signedData",signedData)
    if(signedData){
      console.log("signedData",signedData)
      this.signedData=signedData
    }
    return {
      sign_resp:this.signedData
    };
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