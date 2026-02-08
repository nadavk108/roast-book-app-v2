#!/bin/bash

# Vercel Deployment Validation Script
# Run this BEFORE updating DNS to ensure everything works

echo "🔍 Vercel Deployment Validation"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    return 1
  fi
}

# Get production URL
echo "Enter your Vercel production URL (e.g., theroastbook-abc123.vercel.app):"
read VERCEL_URL

if [ -z "$VERCEL_URL" ]; then
  echo -e "${RED}Error: URL cannot be empty${NC}"
  exit 1
fi

# Remove protocol if present
VERCEL_URL=$(echo $VERCEL_URL | sed 's|https://||' | sed 's|http://||')

echo ""
echo "Testing: https://$VERCEL_URL"
echo "================================"
echo ""

# Test 1: Check if site responds
echo -n "1. Homepage responds with 200 OK: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$VERCEL_URL")
if [ "$HTTP_STATUS" = "200" ]; then
  check
else
  echo -e "${RED}❌ FAIL (Status: $HTTP_STATUS)${NC}"
fi

# Test 2: Check for Vercel headers
echo -n "2. Vercel headers present: "
VERCEL_HEADER=$(curl -s -I "https://$VERCEL_URL" | grep -i "x-vercel-id")
if [ ! -z "$VERCEL_HEADER" ]; then
  check
else
  echo -e "${RED}❌ FAIL${NC}"
fi

# Test 3: Check SSL certificate
echo -n "3. SSL certificate valid: "
curl -s --head "https://$VERCEL_URL" > /dev/null 2>&1
check

# Test 4: Check if login page exists
echo -n "4. Login page exists: "
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$VERCEL_URL/login")
if [ "$LOGIN_STATUS" = "200" ]; then
  check
else
  echo -e "${RED}❌ FAIL (Status: $LOGIN_STATUS)${NC}"
fi

# Test 5: Check if dashboard page exists (will redirect if not logged in, that's ok)
echo -n "5. Dashboard page exists: "
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$VERCEL_URL/dashboard")
if [ "$DASHBOARD_STATUS" = "200" ] || [ "$DASHBOARD_STATUS" = "307" ] || [ "$DASHBOARD_STATUS" = "302" ]; then
  check
else
  echo -e "${RED}❌ FAIL (Status: $DASHBOARD_STATUS)${NC}"
fi

# Test 6: Check if API routes are accessible
echo -n "6. API routes respond: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$VERCEL_URL/api/book/test")
if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "404" ] || [ "$API_STATUS" = "200" ]; then
  # 401 or 404 is fine - means the route exists
  check
else
  echo -e "${RED}❌ FAIL (Status: $API_STATUS)${NC}"
fi

# Test 7: Check build ID (indicates successful build)
echo -n "7. Next.js build successful: "
curl -s "https://$VERCEL_URL" | grep -q "_next"
check

echo ""
echo "================================"
echo "Manual Testing Required:"
echo "================================"
echo ""
echo "Open in browser: https://$VERCEL_URL"
echo ""
echo "Test these features:"
echo "  [ ] Homepage loads with correct styling"
echo "  [ ] Click 'Start Roasting' button"
echo "  [ ] Login with Google works"
echo "  [ ] Dashboard shows your books"
echo "  [ ] Upload new image works"
echo "  [ ] Quote submission works"
echo "  [ ] Preview generation works"
echo "  [ ] Payment button visible"
echo ""
echo "If all manual tests pass, you're ready to update DNS!"
echo ""
echo "================================"
echo "Next Steps:"
echo "================================"
echo ""
echo "1. Add custom domain in Vercel dashboard"
echo "2. Get A and CNAME records from Vercel"
echo "3. Update DNS in GoDaddy"
echo "4. Run: dig theroastbook.com +short"
echo "5. Verify it shows Vercel IP (not 185.158.133.1)"
echo ""
echo "Full instructions: DNS_TRANSITION_CHECKLIST.md"
echo ""
