const ApartmentScraper = require('./scraper');

async function test() {
  console.log('🧪 Testing apartment scraper locally...\n');
  
  // Test with a working URL
  process.env.URLS = 'https://www.apartments.com/ellwood-at-lake-travis-austin-tx/4v6169l/';
  
  const scraper = new ApartmentScraper();
  await scraper.run();
  
  console.log('\n📄 Test complete! Check results.json for output.');
}

if (require.main === module) {
  test().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}