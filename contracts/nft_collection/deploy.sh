#!/bin/sh

ALIENS="0x574c184a57b165540bb95c547803d963252ff6adc2a545e0776dd48441abe4ab"
COLLECTIONS=(\
  "0x139725e8b062917db51b5807383a1a655c27ff79ee0a87928b25d653f57b8f0d"\
  "0x123a7d729f18f8d924b1e1d53b63ad53dc886311829197716d7abb82e3a51619"\
  "0x7d2518b9661692ef15cc3444c60e366b2be5e555e3c9e92e059a88f8cce548c4"\
  "0x153f3dd5a1436dbb68be5e3ffc40959b93107325d0a6402655412731b541a172"\
)

for (( i = 0; i < 4; i++ )); do
  COLLECION="${COLLECTIONS[$i]}"
  echo "- Collection is deploying on ${COLLECION}"
  aptos move publish --named-addresses aliens=$ALIENS,collection=$COLLECION
  break
done

