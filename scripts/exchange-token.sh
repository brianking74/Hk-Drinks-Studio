#!/bin/bash
set -e

SHORT_TOKEN="EAAT45UhWCZCYBSucsZCd3i9w5iRFZAwR3tljBcSo9D2Bm7I8BJRxHm6DbcmEDvDiyBQY8eksusmI9UdsirLWqrM2RT5MKcrKxtC0ZBhU6AkVsFVWay11BMIdt5UbsdZAE2mUnBqDWeflSxcnBpdW3vpVIAU51O1zAtVf2iLdvjhgnl3pmftknhvyRtsZB8SlZAI0F2Ws2oEtmqFEZBuoS37mwZAVNS0Q4F9CSrZB5Bt0Jfo1l4KXTGjYpdqTakePNswjSJqZBx2uZCTMNSt3CI52iSo3VBGn8XHxwxlR6bUZD"
APP_ID="1399563551640566"
APP_SECRET="f070128317e60dcdd3300edefe341743"
PAGE_ID="820518311147657"

echo "=== Step 1: Exchange short user token for long-lived user token ==="
EXCHANGE_RESP=$(curl -s "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_TOKEN}")
echo "$EXCHANGE_RESP" | head -c 500
echo ""

LONG_USER_TOKEN=$(echo "$EXCHANGE_RESP" | grep -oE '"access_token":"[^"]+"' | sed 's/"access_token":"//;s/"$//')
if [ -z "$LONG_USER_TOKEN" ]; then
  echo "FAILED to extract long user token"
  exit 1
fi
echo "Long user token (first 30 chars): ${LONG_USER_TOKEN:0:30}..."

echo ""
echo "=== Step 2: Get Page Access Token using long user token ==="
PAGE_RESP=$(curl -s "https://graph.facebook.com/v19.0/${PAGE_ID}?fields=access_token,name&access_token=${LONG_USER_TOKEN}")
echo "$PAGE_RESP" | head -c 500
echo ""

PAGE_TOKEN=$(echo "$PAGE_RESP" | grep -oE '"access_token":"[^"]+"' | sed 's/"access_token":"//;s/"$//')
PAGE_NAME=$(echo "$PAGE_RESP" | grep -oE '"name":"[^"]+"' | sed 's/"name":"//;s/"$//')
echo "Page name: $PAGE_NAME"
echo "Page token (first 30 chars): ${PAGE_TOKEN:0:30}..."
echo "Page token length: ${#PAGE_TOKEN}"

echo ""
echo "=== Step 3: Verify the Page token is valid and non-expiring ==="
VERIFY_RESP=$(curl -s "https://graph.facebook.com/v19.0/debug_token?input_token=${PAGE_TOKEN}&access_token=${LONG_USER_TOKEN}")
echo "$VERIFY_RESP" | head -c 800
echo ""

echo ""
echo "=== Step 4: Final Page Access Token (paste this into Vercel) ==="
echo "$PAGE_TOKEN"
