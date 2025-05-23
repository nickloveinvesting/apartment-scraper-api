const puppeteer = require('puppeteer');
const fs = require('fs');

class ApartmentScraper {
  constructor() {
    this.results = [];
  }

  async scrapeApartment(page, url) {
    try {
      console.log(`Scraping: ${url}`);
      
      // Navigate with better options
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 60000 
      });
      
      // Wait for content to load
      await page.waitForTimeout(5000);
      
      // Extract property info
      const propertyData = await page.evaluate(() => {
        const getPropertyName = () => {
          // Try multiple selectors for property name
          const selectors = [
            'h1[data-testid="property-name"]',
            '.property-title',
            'h1',
            '.property-name',
            '[class*="property"] h1',
            '[class*="title"] h1'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              return element.textContent.trim();
            }
          }
          
          // Fallback to page title
          const title = document.title;
          if (title && !title.includes('404') && !title.includes('Error')) {
            return title.split('|')[0].trim();
          }
          
          return 'Unknown Property';
        };

        const getAddress = () => {
          const selectors = [
            '[data-testid="property-address"]',
            '.property-address',
            '.address',
            '[class*="address"]'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              return element.textContent.trim();
            }
          }
          return 'Address not found';
        };

        const extractAmenities = () => {
          const amenities = new Set();
          
          // Look for amenity keywords in the page text
          const amenityKeywords = [
            'Pool', 'Swimming Pool', 'Fitness Center', 'Gym', 'Clubhouse',
            'Business Center', 'Pet Play Area', 'Dog Park', 'Playground',
            'Garage', 'Parking', 'Balcony', 'Patio', 'Grill', 'BBQ',
            'Laundry', 'Washer', 'Dryer', 'Dishwasher', 'Air Conditioning',
            'Heating', 'Walk-in Closet', 'Hardwood Floors', 'Carpet',
            'Tile', 'Granite Counters', 'Stainless Steel', 'Wi-Fi',
            'Internet', 'Cable', 'Trash Pickup', 'Maintenance',
            'Security', '24 Hour', 'Gated', 'Recycling', 'Package',
            'Concierge', 'Valet', 'Tennis', 'Basketball', 'Volleyball',
            'Refrigerator', 'Microwave', 'Oven', 'Stove', 'Fireplace',
            'Ceiling Fan', 'Window Coverings', 'Patio/Deck', 'Garden Tub'
          ];
          
          const pageText = document.body.innerText;
          
          amenityKeywords.forEach(keyword => {
            // Use word boundaries to avoid partial matches
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(pageText)) {
              amenities.add(keyword);
            }
          });
          
          // Try to find structured amenity sections
          const amenitySelectors = [
            '.amenity', '.feature', '[class*="amenity"]', '[class*="feature"]',
            'li', '.list-item', '.amenity-item', '[data-testid*="amenity"]'
          ];
          
          amenitySelectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                const text = el.textContent.trim();
                if (text.length > 3 && text.length < 100) {
                  // Check if it looks like an amenity
                  const isAmenity = amenityKeywords.some(keyword => 
                    new RegExp(`\\b${keyword}\\b`, 'i').test(text)
                  );
                  if (isAmenity) {
                    amenities.add(text);
                  }
                }
              });
            } catch (e) {
              // Continue if selector fails
            }
          });
          
          return Array.from(amenities);
        };

        return {
          name: getPropertyName(),
          address: getAddress(),
          amenities: extractAmenities(),
          url: window.location.href,
          scrapedAt: new Date().toISOString()
        };
      });

      // Categorize amenities
      const categorized = this.categorizeAmenities(propertyData.amenities);
      
      const result = {
        ...propertyData,
        categorizedAmenities: categorized,
        totalAmenities: propertyData.amenities.length
      };

      this.results.push(result);
      console.log(`✅ Successfully scraped: ${result.name} (${result.totalAmenities} amenities)`);
      return result;

    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error.message);
      const errorResult = {
        url,
        error: error.message,
        scrapedAt: new Date().toISOString(),
        success: false
      };
      this.results.push(errorResult);
      return errorResult;
    }
  }

  categorizeAmenities(amenities) {
    const categories = {
      interior: [],
      exterior: [],
      community: [],
      services: []
    };

    amenities.forEach(amenity => {
      const lower = amenity.toLowerCase();
      
      if (lower.includes('kitchen') || lower.includes('bathroom') || 
          lower.includes('bedroom') || lower.includes('closet') ||
          lower.includes('appliance') || lower.includes('flooring') ||
          lower.includes('dishwasher') || lower.includes('washer') ||
          lower.includes('dryer') || lower.includes('granite') ||
          lower.includes('stainless') || lower.includes('hardwood') ||
          lower.includes('refrigerator') || lower.includes('microwave') ||
          lower.includes('oven') || lower.includes('fireplace') ||
          lower.includes('ceiling fan') || lower.includes('window')) {
        categories.interior.push(amenity);
      } else if (lower.includes('balcony') || lower.includes('patio') ||
                 lower.includes('parking') || lower.includes('garage') ||
                 lower.includes('entrance') || lower.includes('gated') ||
                 lower.includes('deck')) {
        categories.exterior.push(amenity);
      } else if (lower.includes('pool') || lower.includes('gym') ||
                 lower.includes('fitness') || lower.includes('clubhouse') ||
                 lower.includes('playground') || lower.includes('court') ||
                 lower.includes('dog park') || lower.includes('grill') ||
                 lower.includes('tennis') || lower.includes('basketball')) {
        categories.community.push(amenity);
      } else {
        categories.services.push(amenity);
      }
    });

    return categories;
  }

  async run() {
    const urls = process.env.URLS ? process.env.URLS.split(',').map(u => u.trim()) : [];
    
    if (urls.length === 0) {
      console.error('❌ No URLs provided');
      process.exit(1);
    }

    console.log(`🚀 Starting scrape of ${urls.length} apartments...`);

    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    // Add stealth settings
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'DNT': '1'
    });

    for (let i = 0; i < urls.length; i++) {
      console.log(`\n📍 Processing ${i + 1}/${urls.length}: ${urls[i]}`);
      await this.scrapeApartment(page, urls[i]);
      
      // Add delay between requests (2-5 seconds)
      if (i < urls.length - 1) {
        const delay = 2000 + Math.random() * 3000;
        console.log(`⏱️  Waiting ${Math.round(delay/1000)}s before next request...`);
        await page.waitForTimeout(delay);
      }
    }

    await browser.close();

    // Save results
    const output = {
      metadata: {
        totalProperties: this.results.length,
        successfulScrapes: this.results.filter(r => !r.error).length,
        failedScrapes: this.results.filter(r => r.error).length,
        scrapedAt: new Date().toISOString(),
        version: '1.0'
      },
      properties: this.results
    };

    fs.writeFileSync('results.json', JSON.stringify(output, null, 2));
    
    console.log(`\n🎉 Scraping complete!`);
    console.log(`✅ Successful: ${output.metadata.successfulScrapes}`);
    console.log(`❌ Failed: ${output.metadata.failedScrapes}`);
    console.log(`📄 Results saved to results.json`);

    // Exit with error code if all scrapes failed
    if (output.metadata.successfulScrapes === 0) {
      process.exit(1);
    }
  }
}

// Run the scraper
if (require.main === module) {
  const scraper = new ApartmentScraper();
  scraper.run().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ApartmentScraper;