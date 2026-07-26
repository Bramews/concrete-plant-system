#!/bin/bash
# سكريبت اختبار سريع لوحة الإدارة
curl -v http://localhost:3000/admin 2>&1 | head -50
