# Apple root certificates

`AppleRootCA-G3.cer` was downloaded directly from Apple's own certificate
authority page:

https://www.apple.com/certificateauthority/AppleRootCA-G3.cer

This is Apple's **public** root certificate (DER-encoded), used by
`@apple/app-store-server-library`'s `SignedDataVerifier` to check the
certificate chain on every signed transaction/renewal-info/notification
payload back up to a root Apple controls. It is not a secret and is safe
to commit -- it's the same file Apple publishes for anyone to download.

If Apple ever rotates or adds an additional root CA relevant to
StoreKit 2 / the App Store Server API, download the new `.cer` from the
same page and drop it in this folder; `Backend/Utils/appleIap.js` loads
every `.cer` file here automatically.
