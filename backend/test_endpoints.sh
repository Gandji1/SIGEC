#!/bin/bash

# Script de test complet des endpoints SIGEC
# Utilise UN SEUL PORT: 8000

BASE_URL="http://localhost:8000/api"
TOKEN=""
TENANT_ID=""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================"
echo "🧪 TEST COMPLET SIGEC - PORT 8000"
echo "================================"
echo ""

# 1. TEST HEALTH
echo -e "${YELLOW}1️⃣  Test: /api/health${NC}"
RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Health OK${NC}"
else
    echo -e "${RED}❌ Health échouée${NC}"
    echo "$RESPONSE"
fi
echo ""

# 2. TEST LOGIN
echo -e "${YELLOW}2️⃣  Test: /api/login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@demo.local","password":"password"}')

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    TENANT_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"tenant_id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✅ Login OK${NC}"
    echo "   Token: ${TOKEN:0:20}..."
    echo "   Tenant ID: $TENANT_ID"
else
    echo -e "${RED}❌ Login échouée${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 3. TEST ME
echo -e "${YELLOW}3️⃣  Test: /api/me (Utilisateur connecté)${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$ME_RESPONSE" | grep -q '"email":"admin@demo.local"'; then
    echo -e "${GREEN}✅ /me OK${NC}"
    echo "   Utilisateur: $(echo "$ME_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ /me échouée${NC}"
    echo "$ME_RESPONSE"
fi
echo ""

# 4. TEST PRODUCTS
echo -e "${YELLOW}4️⃣  Test: /api/products${NC}"
PRODUCTS=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$PRODUCTS" | grep -q '"data"'; then
    COUNT=$(echo "$PRODUCTS" | grep -o '"id":[0-9]*' | wc -l)
    echo -e "${GREEN}✅ /products OK (${COUNT} produits)${NC}"
else
    echo -e "${RED}❌ /products échouée${NC}"
fi
echo ""

# 5. TEST WAREHOUSES
echo -e "${YELLOW}5️⃣  Test: /api/warehouses${NC}"
WAREHOUSES=$(curl -s -X GET "$BASE_URL/warehouses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$WAREHOUSES" | grep -q '"data"'; then
    COUNT=$(echo "$WAREHOUSES" | grep -o '"id":[0-9]*' | wc -l)
    echo -e "${GREEN}✅ /warehouses OK (${COUNT} entrepôts)${NC}"
else
    echo -e "${RED}❌ /warehouses échouée${NC}"
fi
echo ""

# 6. TEST TENANT-CONFIG
echo -e "${YELLOW}6️⃣  Test: /api/tenant-config${NC}"
TENANT_CONFIG=$(curl -s -X GET "$BASE_URL/tenant-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$TENANT_CONFIG" | grep -q '"tva_rate"'; then
    echo -e "${GREEN}✅ /tenant-config OK${NC}"
    echo "   TVA: $(echo "$TENANT_CONFIG" | grep -o '"tva_rate":[0-9.]*' | cut -d':' -f2)"
else
    echo -e "${RED}❌ /tenant-config échouée${NC}"
    echo "$TENANT_CONFIG"
fi
echo ""

# 7. TEST PAYMENT METHODS
echo -e "${YELLOW}7️⃣  Test: /api/tenant-config/payment-methods${NC}"
PAYMENT_METHODS=$(curl -s -X GET "$BASE_URL/tenant-config/payment-methods" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$PAYMENT_METHODS" | grep -q '"data"'; then
    echo -e "${GREEN}✅ /payment-methods OK${NC}"
else
    echo -e "${RED}❌ /payment-methods échouée${NC}"
    echo "$PAYMENT_METHODS"
fi
echo ""

# 8. TEST COLLABORATORS
echo -e "${YELLOW}8️⃣  Test: /api/collaborators${NC}"
COLLABORATORS=$(curl -s -X GET "$BASE_URL/collaborators" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$COLLABORATORS" | grep -q '"data"'; then
    COUNT=$(echo "$COLLABORATORS" | grep -o '"id":[0-9]*' | wc -l)
    echo -e "${GREEN}✅ /collaborators OK (${COUNT} collaborateurs)${NC}"
else
    echo -e "${RED}❌ /collaborators échouée${NC}"
    echo "$COLLABORATORS"
fi
echo ""

# 9. TEST EXPENSES
echo -e "${YELLOW}9️⃣  Test: /api/expenses${NC}"
EXPENSES=$(curl -s -X GET "$BASE_URL/expenses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$EXPENSES" | grep -q '"data"'; then
    echo -e "${GREEN}✅ /expenses OK${NC}"
else
    echo -e "${RED}❌ /expenses échouée${NC}"
    echo "$EXPENSES"
fi
echo ""

# 10. TEST ACCOUNTING
echo -e "${YELLOW}🔟 Test: /api/accounting/entries${NC}"
ACCOUNTING=$(curl -s -X GET "$BASE_URL/accounting/entries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

if echo "$ACCOUNTING" | grep -q '"data"'; then
    echo -e "${GREEN}✅ /accounting/entries OK${NC}"
else
    echo -e "${RED}❌ /accounting/entries échouée${NC}"
fi
echo ""

echo "================================"
echo "✅ Tests terminés!"
echo "================================"
