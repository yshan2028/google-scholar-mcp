#!/bin/bash

echo "🔐 Google Scholar MCP - 安全检查"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
passed=0
failed=0

# 检查 1：.env 不存在（应该不提交）
echo -n "1. 检查 .env 是否存在（本地文件，不应提交）... "
if [ ! -f ".env" ]; then
    echo -e "${GREEN}✅ 通过${NC} (不存在于 git 中)"
    ((passed++))
else
    echo -e "${YELLOW}⚠️  警告${NC} (.env 存在，确保在 .gitignore 中)"
fi

# 检查 2：.env.example 存在且不含真实 keys
echo -n "2. 检查 env.example 是否安全... "
if grep -q "your_" env.example; then
    echo -e "${GREEN}✅ 通过${NC} (仅包含示例占位符)"
    ((passed++))
else
    echo -e "${RED}❌ 失败${NC} (可能包含真实 keys)"
    ((failed++))
fi

# 检查 3：.gitignore 包含 .env
echo -n "3. 检查 .gitignore 是否忽略 .env... "
if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((passed++))
else
    echo -e "${RED}❌ 失败${NC}"
    ((failed++))
fi

# 检查 4：README.md 不含真实 keys
echo -n "4. 检查 README.md 是否安全... "
if grep -q "your_scrapingdog_key_here\|your_serpapi_key_here" README.md; then
    echo -e "${GREEN}✅ 通过${NC} (仅包含示例)"
    ((passed++))
else
    echo -e "${RED}❌ 失败${NC} (可能包含真实 keys)"
    ((failed++))
fi

# 检查 5：docker-compose.yml 使用环境变量
echo -n "5. 检查 docker-compose.yml 是否使用环境变量... "
if grep -q 'SCRAPINGDOG_API_KEY=\$' docker-compose.yml && grep -q 'SERP_API_KEY=\$' docker-compose.yml; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((passed++))
else
    echo -e "${RED}❌ 失败${NC}"
    ((failed++))
fi

# 检查 6：Dockerfile 不含真实 keys
echo -n "6. 检查 Dockerfile 是否安全... "
if ! grep -q "68f7e36631dee34ec17cc68e\|39df2078c6ca4a05643a71d9c6c021e151b94bb1de3e45bae32ca1f56a266f04" Dockerfile; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((passed++))
else
    echo -e "${RED}❌ 失败${NC}"
    ((failed++))
fi

# 检查 7：代码中没有硬编码的 keys
echo -n "7. 检查代码中是否有硬编码的 keys... "
if ! grep -r "68f7e36631dee34ec17cc68e\|39df2078c6ca4a05643a71d9c6c021e151b94bb1de3e45bae32ca1f56a266f04" --include="*.py" . 2>/dev/null | grep -q .; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((passed++))
else
    echo -e "${RED}❌ 失败${NC}"
    ((failed++))
fi

echo ""
echo "=================================="
echo -e "结果: ${GREEN}✅ $passed 项通过${NC}, ${RED}❌ $failed 项失败${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 所有安全检查通过！${NC}"
    echo "准备就绪，可以安全部署！"
    exit 0
else
    echo -e "${RED}⚠️  有 $failed 项检查失败${NC}"
    echo "请在部署前修复这些问题。"
    exit 1
fi
