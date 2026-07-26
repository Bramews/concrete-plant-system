
@echo off
echo ===================================================
echo 1. PRISMA VERSIONS
echo ===================================================
call npm list prisma
call npm list @prisma/client

echo.
echo ===================================================
echo 2. DB FILES CHECK
echo ===================================================
dir /s /b *.db

echo.
echo ===================================================
echo 3. DATA COUNTS
echo ===================================================
call npx tsx verify_counts.ts

echo.
echo ===================================================
echo 4. SEED UPSERT CHECK (Searching for direct create)
echo ===================================================
findstr /s /i "create(" prisma\seed.ts

echo.
echo ===================================================
echo 5. MIGRATE STATUS
echo ===================================================
call npx prisma migrate status

echo.
echo ===================================================
echo 6. DB PULL & STRIPE ID
echo ===================================================
call npx prisma db pull
echo.
echo Checking schema for StripeId:
findstr "stripeId" prisma\schema.prisma

echo.
echo ===================================================
echo DONE
echo ===================================================
