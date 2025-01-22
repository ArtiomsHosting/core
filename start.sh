#!/bin/bash
npm i
pm2-runtime start npm --name "core" -- run start