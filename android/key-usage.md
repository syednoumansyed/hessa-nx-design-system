# Encode & Decode Key file for github secret usage

```bash
# encode
xxd -p keystore.p12 | tr -d '\n' > keystore.p12.base64
# decode
xxd -r -p keystore.p12.base64 > decoded-keystore.p12
# verfiy
diff keystore.p12 decoded-keystore.p12
```
