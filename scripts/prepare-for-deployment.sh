#!/bin/bash
# prepare-for-deployment.sh
# Run this before pushing to GitHub to make sure everything is deployment-ready.

set -e

cd /home/z/my-project

echo "🔍 Checking deployment readiness..."

# 1. Verify .env.example exists
if [ ! -f .env.example ]; then
  echo "❌ .env.example missing"
  exit 1
fi
echo "✅ .env.example present"

# 2. Verify .env is NOT tracked (should be in .gitignore)
if git check-ignore .env 2>/dev/null; then
  echo "✅ .env is gitignored"
else
  echo "❌ .env is NOT gitignored — fix .gitignore before pushing!"
  exit 1
fi

# 3. Verify DEPLOYMENT.md exists
if [ ! -f DEPLOYMENT.md ]; then
  echo "❌ DEPLOYMENT.md missing"
  exit 1
fi
echo "✅ DEPLOYMENT.md present"

# 4. Verify vercel.json exists
if [ ! -f vercel.json ]; then
  echo "❌ vercel.json missing"
  exit 1
fi
echo "✅ vercel.json present"

# 5. Verify Prisma schema is PostgreSQL
if grep -q 'provider = "postgresql"' prisma/schema.prisma; then
  echo "✅ Prisma using PostgreSQL"
else
  echo "❌ Prisma not using PostgreSQL — check prisma/schema.prisma"
  exit 1
fi

# 6. Verify next.config doesn't use standalone (uncommented)
if grep -E '^\s*output:\s*["\x27]standalone' next.config.ts; then
  echo "❌ next.config.ts still has output:standalone uncommented — remove it for Vercel"
  exit 1
fi
echo "✅ next.config.ts OK for Vercel"

# 7. Lint check
echo "🔍 Running lint..."
bun run lint
echo "✅ Lint clean"

# 8. List files that will be committed
echo ""
echo "📋 Files staged for commit (sample):"
git add -A
git status --short | head -20
echo ""

echo "🎉 Ready to deploy!"
echo ""
echo "Next steps:"
echo "  1. Create a GitHub repo at https://github.com/new (name: hkdrinks-studio, private)"
echo "  2. Run these commands to push:"
echo "     git commit -m 'Initial commit — HKDrinks Studio'"
echo "     git branch -M main"
echo "     git remote add origin https://github.com/<your-username>/hkdrinks-studio.git"
echo "     git push -u origin main"
echo "  3. Follow DEPLOYMENT.md to deploy on Vercel"
