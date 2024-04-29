// Author: Ibraheem Ganayim

// Web3 Initialization with Infura

// ETH
var web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://sepolia.infura.io/v3/b4eef4414e364d1094a02604a7018b22"
  )
);
// I used the sepolia api to get ETH we can replace it with the mainnet or goerli.
// mainnet example - "https://mainnet.infura.io/v3/b4eef4414e364d1094a02604a7018b22"

// AVAX
var web3AVAX = new Web3(
  "https://avalanche-fuji.infura.io/v3/b4eef4414e364d1094a02604a7018b22"
);
// I used avalanche c chain fuji to test avalanche we can replace it with the mainnet

function login() {
  // login function
  var username = document.getElementById("loginUsername").value;
  var password = document.getElementById("loginPassword").value;
  var loginResult = document.getElementById("loginResult");

  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];

  // If any user is logged in already, prevent new login
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);
  if (loggedInUser) {
    loginResult.innerText =
      "Another user is already logged in. Logout before logging in.";
    return;
  }

  var user = allUsers.find(
    (user) => user.username === username && user.password === password
  ); // check if its the correct username and password

  if (!user) {
    loginResult.innerText = "Invalid Username or Password";
    return;
  }

  loginResult.innerText = "Login Successful. Redirecting...";
  setTimeout(function () {
    window.location.href = "index.html";
  }, 2000);
  user.isLoggedIn = true;
  localStorage.setItem("userData", JSON.stringify(allUsers));
}

function logOut() {
  // logout
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];

  // Find the logged in user and set isLoggedIn to false
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);
  if (loggedInUser) {
    loggedInUser.isLoggedIn = false;
  }

  // Update the localStorage
  localStorage.setItem("userData", JSON.stringify(allUsers));

  // Get the current page URL
  var currentPage = window.location.href;

  // Check if the current page is not the login page
  if (
    currentPage.indexOf("Login.html") === -1 &&
    currentPage.indexOf("RestoreAccount.html") === -1
  ) {
    window.location.href = "Login.html"; // redirect to login page
  }
}

var keyss = null;

var createAccountForm = document.getElementById("createAccountForm"); // listener method
if (createAccountForm) {
  createAccountForm.addEventListener("submit", function (event) {
    event.preventDefault();
    createAccount();
  });
}

function createAccount() {
  //create a new account to use the wallet
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var seedPhrase = lightwallet.keystore.generateRandomSeed();

  lightwallet.keystore.createVault(
    {
      password: password,
      seedPhrase: seedPhrase,
      hdPathString: "m/44'/60'/0'/0",
    },
    function (err, keyStore) {
      // Renamed keyss to keyStore
      if (err) throw err;

      keyStore.keyFromPassword(password, function (err, pwDerivedKey) {
        if (err) throw err;
        keyStore.generateNewAddress(pwDerivedKey, 1);
        var addr = keyStore.getAddresses()[0];

        var userData = {
          username: username,
          password: password,
          address: addr,
          seedPhrase: seedPhrase,
          isLoggedIn: true,
          serializedKeystore: keyStore.serialize(),
          transactions: [],
        };

        // Retrieve all the users from localStorage
        var allUsers = JSON.parse(localStorage.getItem("userData")) || [];

        // Add new user to the list and save it in localStorage
        allUsers.push(userData);
        localStorage.setItem("userData", JSON.stringify(allUsers));

        document.getElementById("accountAddress").innerText =
          "Username: " + username + "\nAccount Address: " + addr;
        document.getElementById("seedPhraseDisplay").innerText = seedPhrase; // Display the seed phrase
      });
    }
  );
}

async function getETHBalance() {
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);

  if (!loggedInUser) {
    console.log("No logged in user found");
    return;
  }

  // Assuming web3 is already initialized and connected to the Ethereum network
  let balanceWei = await web3.eth.getBalance(loggedInUser.address);
  let balanceEth = web3.utils.fromWei(balanceWei, "ether");

  console.log("Balance: ", balanceEth);
  document.getElementById("walletBalance").innerText = `${balanceEth} ETH`;
}

async function getAVAXBalance() {
  // display the user balance on the home(index) page for AVAX
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);

  if (!loggedInUser) {
    console.log("No logged in user found");
    return;
  }

  let balanceWei = await web3AVAX.eth.getBalance(loggedInUser.address);
  let balanceAVAX = web3AVAX.utils.fromWei(balanceWei, "ether");

  console.log("AVAX Balance: ", balanceAVAX);
  document.getElementById(
    "walletBalanceAvax"
  ).innerText = `${balanceAVAX} AVAX`;
}

// This function gets the address of the currently logged in user
function getLoggedInUserAddress() {
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);

  if (!loggedInUser) {
    console.log("No logged in user found");
    return;
  }

  console.log("User Address: ", loggedInUser.address);
  document.getElementById(
    "walletAddress"
  ).innerText = ` ${loggedInUser.address}`;
}

function checkLoginStatus() {
  // this function to display the user username on the screen on the top left

  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);

  if (loggedInUser) {
    document.getElementById(
      "loginStatus"
    ).innerHTML = `Logged in as: <h2>${loggedInUser.username}</h2>`;
    getLoggedInUserAddress();
    getETHBalance();
    getAVAXBalance();
  } else {
    document.getElementById("loginStatus").innerHTML =
      "Log in to use the wallet";
    window.location.href = "Login.html";
  }
}

function sendETHTransaction(toAddress, amountInEther) {
  // this function is for ETH transactions
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);
  var password = loggedInUser ? loggedInUser.password : null;

  if (!password) {
    console.log("No logged in user found");
    return;
  }

  var serializedKeystore = loggedInUser.serializedKeystore;
  var keyss = lightwallet.keystore.deserialize(serializedKeystore);
  keyss.keyFromPassword(password, function (err, pwDerivedKey) {
    if (err) throw err;
    var privateKey = keyss.exportPrivateKey(loggedInUser.address, pwDerivedKey);
    var account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    var transactionParams = {
      from: account.address,
      to: toAddress,
      value: web3.utils.toWei(amountInEther.toString(), "ether"),
      gas: 21000, // standard gas limit for a simple transaction
      gasPrice: 54340000000, //  this is the average gas price for ETH transaction
    };

    // signing and sending transaction
    web3.eth
      .sendTransaction(transactionParams)
      .on("transactionHash", function (hash) {
        console.log("Transaction sent successfully. Transaction hash: ", hash);
        document.getElementById("transactionStatus").innerText =
          "Transaction sent successfully. Transaction hash: " + hash;

        var transactionDetails = {
          hash: hash,
          from: account.address,
          to: toAddress,
          value: amountInEther,
          type: "ETH",
        };

        if (!loggedInUser.transactions) {
          loggedInUser.transactions = [];
        }

        loggedInUser.transactions.push(transactionDetails);
        localStorage.setItem("userData", JSON.stringify(allUsers));

        // Find the reciever user in the list of all users
        var ToUser = allUsers.find((user) => user.address === toAddress);

        // If the sending user is found and they don't have a transactions array, initialize one
        if (ToUser && !ToUser.transactions) {
          ToUser.transactions = [];
        }

        // If the sending user is found, add the transaction to their history
        if (ToUser) {
          ToUser.transactions.push(transactionDetails);
        }

        localStorage.setItem("userData", JSON.stringify(allUsers));
      })

      .on("error", function (error) {
        console.error(error);
        document.getElementById("transactionStatus").innerText =
          "Transaction failed. Not enough funds to complete transaction ";
      });
  });
}

async function sendAVAXTransaction(toAddress, amountInEther) {
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);
  var password = loggedInUser ? loggedInUser.password : null;

  if (!password) {
    console.log("No logged in user found");
    return;
  }

  var serializedKeystore = loggedInUser.serializedKeystore;
  var keyss = lightwallet.keystore.deserialize(serializedKeystore);

  keyss.keyFromPassword(password, function (err, pwDerivedKey) {
    if (err) throw err;

    var privateKey = keyss.exportPrivateKey(loggedInUser.address, pwDerivedKey);
    var account = web3AVAX.eth.accounts.privateKeyToAccount(privateKey);
    web3AVAX.eth.accounts.wallet.add(account);

    var transactionParams = {
      from: account.address,
      to: toAddress,
      value: web3AVAX.utils.toWei(amountInEther.toString(), "ether"),
      gas: 21000,
      gasPrice: 54340000000,
    };

    // signing and sending transaction
    web3AVAX.eth
      .sendTransaction(transactionParams)
      .on("transactionHash", function (hash) {
        console.log("Transaction sent successfully. Transaction hash: ", hash);
        document.getElementById("transactionStatus").innerText =
          "Transaction sent successfully. Transaction hash: " + hash;

        var transactionDetails = {
          hash: hash,
          from: account.address,
          to: toAddress,
          value: amountInEther,
          type: "AVAX",
        };

        if (!loggedInUser.transactions) {
          loggedInUser.transactions = [];
        }

        loggedInUser.transactions.push(transactionDetails);

        // Find the reciever user in the list of all users
        var ToUser = allUsers.find((user) => user.address === toAddress);

        // If the recieving user is found and they don't have a transactions array, initialize one
        if (ToUser && !ToUser.transactions) {
          ToUser.transactions = [];
        }

        // If the recieving user is found, add the transaction to their history
        if (ToUser) {
          ToUser.transactions.push(transactionDetails);
        }

        localStorage.setItem("userData", JSON.stringify(allUsers));
      })
      .on("error", function (error) {
        console.error(error);
        document.getElementById("transactionStatus").innerText =
          "Transaction failed. Not enough funds to complete transaction ";
      });
  });
}

function sendCoins(event) {
  // this function interacts with the html send coins page
  event.preventDefault(); // prevent form from being submitted normally

  var toAddress = document.getElementById("recipient").value; // get account
  var amountInEther = document.getElementById("amount").value; // get amount
  var coinType = document.getElementById("coin").value; //get coin type

  // depending on which type of coin to choose the specific transaction function for that coin
  if (coinType === "ETH") {
    sendETHTransaction(toAddress, amountInEther);
  } else if (coinType === "AVAX") {
    sendAVAXTransaction(toAddress, amountInEther);
  }
}

function getEthPrice() {
  // to display the ETH price on the page
  fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  )
    .then((response) => response.json())
    .then((data) => {
      const ethPrice = data.ethereum.usd;
      document.getElementById("ethPrice").innerText = `${ethPrice} `;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function getAvaxPrice() {
  // to display the avalanche price
  fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd"
  )
    .then((response) => response.json())
    .then((data) => {
      const avaxPrice = data["avalanche-2"].usd;
      document.getElementById("avaxPrice").innerText = `${avaxPrice} `;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function fetchTransactions() {
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);

  if (!loggedInUser) {
    console.log("No logged in user found");
    return;
  }

  let transactionList = document.getElementById("transactionList");
  let transactions = loggedInUser.transactions;

  if (transactions && transactions.length) {
    transactions.forEach((tx) => {
      let transactionRow = document.createElement("tr");
      transactionRow.innerHTML = `
        <td>
          <p><h3>Hash: </h3>${tx.hash}</p>
          <p><h3>From: </h3>${tx.from}</p>
          <p><h3>To: </h3>${tx.to}</p>
        </td>
        <td>${tx.value}</td>
        <td>${tx.type}</td>
      `;
      transactionList.appendChild(transactionRow);
    });
  } else {
    console.log("No transactions found for this user");
  }
}

function restoreAccount(seedPhraseInput) {
  // Retrieve all the users from localStorage
  var allUsers = JSON.parse(localStorage.getItem("userData")) || [];

  // Check if there is a user currently logged in
  var loggedInUser = allUsers.find((user) => user.isLoggedIn);
  if (loggedInUser) {
    return "A user is already logged in";
  }

  // Find the user whose seed phrase matches the input seed phrase
  var user = allUsers.find((user) => user.seedPhrase === seedPhraseInput);
  allUsers.forEach((user) => console.log(user.seedPhrase));
  console.log(seedPhraseInput);

  if (user) {
    user.password = document.getElementById("newPassword").value; // update password

    // Log in the user associated with the seed phrase
    user.isLoggedIn = true;
    localStorage.setItem("userData", JSON.stringify(allUsers));
    // window.location.href = "Login.html";
    return "Successfully logged in, password is restored!";
  } else {
    return "No user found with the given seed phrase";
  }
}
