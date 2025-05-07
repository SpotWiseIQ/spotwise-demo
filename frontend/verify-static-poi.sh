#!/bin/bash

# Ensure the static_poi directory exists
mkdir -p public/mock_data/static_poi

# Create placeholder CSV files if any are missing
if [ ! -f "public/mock_data/static_poi/LOC_Lielahti Zone_poi.csv" ]; then
  echo "Creating placeholder LOC_Lielahti Zone_poi.csv"
  touch "public/mock_data/static_poi/LOC_Lielahti Zone_poi.csv"
fi

if [ ! -f "public/mock_data/static_poi/LOC_Ratina Mall Zone_poi.csv" ]; then
  echo "Creating placeholder LOC_Ratina Mall Zone_poi.csv"
  touch "public/mock_data/static_poi/LOC_Ratina Mall Zone_poi.csv"
fi

if [ ! -f "public/mock_data/static_poi/LOC_Hervanta Bypass Area_poi.csv" ]; then
  echo "Creating placeholder LOC_Hervanta Bypass Area_poi.csv"
  touch "public/mock_data/static_poi/LOC_Hervanta Bypass Area_poi.csv"
fi

if [ ! -f "public/mock_data/static_poi/LOC_Prisma Kaleva Zone_poi.csv" ]; then
  echo "Creating placeholder LOC_Prisma Kaleva Zone_poi.csv"
  touch "public/mock_data/static_poi/LOC_Prisma Kaleva Zone_poi.csv"
fi

# List contents for verification
echo "Contents of public/mock_data/static_poi:"
ls -la public/mock_data/static_poi/ 