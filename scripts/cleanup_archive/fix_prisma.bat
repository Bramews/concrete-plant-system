call node_modules\.bin\prisma.cmd generate > gen.log 2>&1
call node_modules\.bin\prisma.cmd migrate dev --name sync_schema_approval > mig.log 2>&1
