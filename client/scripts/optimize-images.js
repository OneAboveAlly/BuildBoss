#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

/**
 * Image Optimization Script
 * 
 * This script optimizes images in the src/assets directory:
 * - Compresses JPEG/PNG images
 * - Generates WebP versions
 * - Creates responsive sizes
 * - Maintains original files
 */

const CONFIG = {
  inputDir: path.join(__dirname, '../src/assets'),
  outputDir: path.join(__dirname, '../public/optimized'),
  sizes: [320, 640, 768, 1024, 1280, 1920],
  formats: ['webp', 'jpg'],
  quality: {
    jpg: 80,
    webp: 80,
    png: 80
  }
};

class ImageOptimizer {
  constructor(config) {
    this.config = config;
    this.stats = {
      processed: 0,
      skipped: 0,
      errors: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0
    };
  }

  async init() {
    console.log('🖼️  Starting image optimization...');
    console.log(`📁 Input directory: ${this.config.inputDir}`);
    console.log(`📁 Output directory: ${this.config.outputDir}`);
    
    await this.ensureOutputDir();
    await this.processDirectory(this.config.inputDir);
    this.printStats();
  }

  async ensureOutputDir() {
    try {
      await fs.access(this.config.outputDir);
    } catch {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      console.log(`✅ Created output directory: ${this.config.outputDir}`);
    }
  }

  async processDirectory(dir) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          await this.processDirectory(fullPath);
        } else if (this.isImageFile(item.name)) {
          await this.processImage(fullPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing directory ${dir}:`, error.message);
      this.stats.errors++;
    }
  }

  isImageFile(filename) {
    const imageExtensions = /\.(jpg|jpeg|png|gif)$/i;
    return imageExtensions.test(filename);
  }

  async processImage(inputPath) {
    try {
      const filename = path.basename(inputPath, path.extname(inputPath));
      const relativePath = path.relative(this.config.inputDir, path.dirname(inputPath));
      const outputDir = path.join(this.config.outputDir, relativePath);
      
      // Ensure output subdirectory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Get original file stats
      const originalStats = await fs.stat(inputPath);
      this.stats.totalSizeBefore += originalStats.size;

      console.log(`🔄 Processing: ${path.relative(process.cwd(), inputPath)}`);

      // Load image with sharp
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      console.log(`   📐 Original: ${metadata.width}x${metadata.height} (${this.formatFileSize(originalStats.size)})`);

      // Generate responsive sizes for each format
      for (const format of this.config.formats) {
        for (const size of this.config.sizes) {
          // Skip if original is smaller than target size
          if (metadata.width && metadata.width < size) continue;

          const outputFilename = `${filename}_${size}w.${format}`;
          const outputPath = path.join(outputDir, outputFilename);

          await this.generateOptimizedImage(image, outputPath, size, format);
        }

        // Generate original size version
        const outputFilename = `${filename}.${format}`;
        const outputPath = path.join(outputDir, outputFilename);
        await this.generateOptimizedImage(image, outputPath, null, format);
      }

      this.stats.processed++;
    } catch (error) {
      console.error(`❌ Error processing ${inputPath}:`, error.message);
      this.stats.errors++;
    }
  }

  async generateOptimizedImage(sharpImage, outputPath, width, format) {
    try {
      let pipeline = sharpImage.clone();

      // Resize if width is specified
      if (width) {
        pipeline = pipeline.resize(width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        });
      }

      // Apply format-specific optimizations
      switch (format) {
        case 'jpg':
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: this.config.quality.jpg,
            progressive: true,
            mozjpeg: true
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: this.config.quality.webp,
            effort: 6
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality: this.config.quality.png,
            compressionLevel: 9,
            adaptiveFiltering: true
          });
          break;
      }

      // Save the optimized image
      await pipeline.toFile(outputPath);

      // Track file size
      const outputStats = await fs.stat(outputPath);
      this.stats.totalSizeAfter += outputStats.size;

      const sizeInfo = width ? ` (${width}w)` : '';
      console.log(`   ✅ Generated: ${path.basename(outputPath)}${sizeInfo} - ${this.formatFileSize(outputStats.size)}`);
    } catch (error) {
      console.error(`❌ Error generating ${outputPath}:`, error.message);
      this.stats.errors++;
    }
  }

  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  printStats() {
    console.log('\n📊 Optimization Summary:');
    console.log(`   ✅ Processed: ${this.stats.processed} images`);
    console.log(`   ⏭️  Skipped: ${this.stats.skipped} files`);
    console.log(`   ❌ Errors: ${this.stats.errors} files`);
    console.log(`   📦 Original size: ${this.formatFileSize(this.stats.totalSizeBefore)}`);
    console.log(`   🗜️  Optimized size: ${this.formatFileSize(this.stats.totalSizeAfter)}`);
    
    if (this.stats.totalSizeBefore > 0) {
      const savings = this.stats.totalSizeBefore - this.stats.totalSizeAfter;
      const percentage = Math.round((savings / this.stats.totalSizeBefore) * 100);
      console.log(`   💾 Space saved: ${this.formatFileSize(savings)} (${percentage}%)`);
    }
    
    console.log('\n🎉 Image optimization complete!');
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new ImageOptimizer(CONFIG);
  optimizer.init().catch(error => {
    console.error('💥 Optimization failed:', error);
    process.exit(1);
  });
}

module.exports = ImageOptimizer; 