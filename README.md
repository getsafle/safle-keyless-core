# Setup packages

1. Goto safle-keyless-js repo and checkout to dev branch.

2. Update `src/helpers/api.js` to the following values:
```
    login: 'https://dev-auth.getsafle.com' + '/auth/keyless-login',
    retrieve_vault: 'https://dev-auth.getsafle.com' + '/vault/retrieve',
    retrieve_encription_key: 'https://dev-auth.getsafle.com' + '/auth/encrypted-encryption-key',
```

3. Goto `src/helpers/safleHelpers.js`.
  i. In line 17: do the following changes.
   
   ``` 
   let params = {
        "userName": safleID,
        "password": pdkeyHash,
        "g-recaptcha-response": token
    }; 
    
    to 
    
    let params = {
        "userName": safleID,
        "PDKeyHash": pdkeyHash,
    };
    
    ```
    
  ii. In line 114: do the following change.
  
    ```
    body: JSON.stringify( { userName: user, password: PDKeyHash, 'g-recaptcha-response': gtoken.toString() } )
    
    to
    body: JSON.stringify( { userName: user, PDKeyHash: PDKeyHash, } )
    
    ```
    
4. Open terminal: run the following command: `npm run build:lib` to update the build.

5. The link the project locally using `npm link`.

6. Do `npm link safle-keyless-skeleton in the project where you want to use it. 

