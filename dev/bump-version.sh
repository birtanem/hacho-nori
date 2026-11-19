#!/bin/sh
# 배포 전에 실행: index.html 의 모든 ?v=숫자 를 하나 올린다 (GitHub Pages 캐시 대책)
cd "$(dirname "$0")/.." || exit 1
cur=$(grep -o 'main.js?v=[0-9]*' index.html | head -1 | sed 's/.*v=//')
next=$((cur + 1))
sed -i.bak "s/?v=$cur\"/?v=$next\"/g" index.html && rm -f index.html.bak
echo "v=$cur -> v=$next"
