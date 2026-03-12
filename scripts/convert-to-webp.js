#!/usr/bin/env node

/**
 * WebP Image Conversion Script
 * Converts PNG/JPG images to WebP format for better performance
 * 
 * Usage: node scripts/convert-to-webp.js [directory]
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const INPUT_FORMATS = ['.jpg', '.jpeg', '.png'];
const WEBP_QUALITY = 85; // 0-100, 85 is good balance
const PARALLEL_LIMIT = 5; // Process 5 images at a time

async function convertImage(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);
    
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    const savings = ((1 - (outputStats.size / inputStats.size)) * 100).toFixed(1);
    
    console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% smaller)`);
    
    return {
      input: inputPath,
      output: outputPath,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      savings: parseFloat(savings),
    };
  } catch (error) {
    console.error(`✗ Error converting ${inputPath}:`, error.message);
    return null;
  }
}

async function findImages(dir) {
  const images = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, dist, etc.
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
          images.push(...await findImages(fullPath));
        }
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (INPUT_FORMATS.includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return images;
}

async function convertBatch(images, startIndex, batchSize) {
  const batch = images.slice(startIndex, startIndex + batchSize);
  const promises = batch.map(imagePath => {
    const parsed = path.parse(imagePath);
    const outputPath = path.join(parsed.dir, `${parsed.name}.webp`);
    return convertImage(imagePath, outputPath);
  });
  
  return await Promise.all(promises);
}

async function main() {
  const targetDir = process.argv[2] || './public';
  
  console.log(`🔍 Searching for images in: ${targetDir}\n`);
  
  const images = await findImages(targetDir);
  
  if (images.length === 0) {
    console.log('No images found to convert.');
    return;
  }
  
  console.log(`Found ${images.length} image(s) to convert\n`);
  
  const results = [];
  for (let i = 0; i < images.length; i += PARALLEL_LIMIT) {
    const batchResults = await convertBatch(images, i, PARALLEL_LIMIT);
    results.push(...batchResults.filter(r => r !== null));
  }
  
  // Summary
  console.log(`\n✨ Conversion Complete!\n`);
  console.log(`Images converted: ${results.length}/${images.length}`);
  
  if (results.length > 0) {
    const totalInputSize = results.reduce((sum, r) => sum + r.inputSize, 0);
    const totalOutputSize = results.reduce((sum, r) => sum + r.outputSize, 0);
    const totalSavings = ((1 - (totalOutputSize / totalInputSize)) * 100).toFixed(1);
    
    console.log(`Total size before: ${(totalInputSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total size after: ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total savings: ${totalSavings}%\n`);
    
    // Option to delete originals
    console.log(`To delete original files and keep only WebP versions, run:`);
    console.log(`node scripts/cleanup-originals.js\n`);
  }
}

main().catch(console.error);
