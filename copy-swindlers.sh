#!/bin/bash

# Define source, destination and files
SOURCE="src/tensor/swindlers-temp"
DESTINATION="src/tensor/temp"
FILES=("group1-shard1of1.bin" "model.json" "vocab.json")

# Execute the copy command for each file
for FILE in "${FILES[@]}"; do
  cp "$SOURCE/$FILE" "$DESTINATION"
done
