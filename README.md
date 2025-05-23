<<<<<<< HEAD
# apartment_scraper
=======
# Apartment Scraper GitHub Service

A Puppeteer-based apartment scraper that runs on GitHub Actions and can be triggered by Make.com or any external service.

## Features

- 🏠 Scrapes apartment amenities from apartments.com and other sites
- 🤖 Runs on GitHub Actions (free tier includes 2000 minutes/month)
- 🔄 Can be triggered by Make.com webhooks
- 📊 Categorizes amenities (Interior, Exterior, Community, Services)
- 💾 Results saved as downloadable artifacts
- 🚀 No server costs - completely serverless

## Setup Instructions

### 1. Create GitHub Repository

1. Go to GitHub and create a new repository called `apartment-scraper`
2. Upload all files from this folder to your repository
3. Make sure the repository is public (for free GitHub Actions)

### 2. Test the Scraper

1. Go to your repository → Actions tab
2. Click "Apartment Scraper API" workflow
3. Click "Run workflow"
4. Enter comma-separated URLs like:
   ```
   https://www.apartments.com/ellwood-at-lake-travis-austin-tx/4v6169l/,https://www.apartments.com/park-south-austin-tx/g44yr3z/
   ```
5. Click "Run workflow" button

### 3. Set Up Make.com Integration

#### Method A: Repository Dispatch (Recommended)

1. In Make.com, create an HTTP module with:
   - **URL**: `https://api.github.com/repos/YOUR_USERNAME/apartment-scraper/dispatches`
   - **Method**: POST
   - **Headers**:
     ```json
     {
       "Authorization": "Bearer YOUR_GITHUB_TOKEN",
       "Accept": "application/vnd.github.v3+json",
       "Content-Type": "application/json"
     }
     ```
   - **Body**:
     ```json
     {
       "event_type": "scrape-apartments",
       "client_payload": {
         "urls": "{{your_apartment_urls_comma_separated}}"
       }
     }
     ```

2. Create a GitHub Personal Access Token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create token with "repo" permissions

### 4. Get Results

Results are saved as GitHub Actions artifacts and can be:
- Downloaded manually from the Actions page
- Retrieved via GitHub API
- Posted to an issue (automatic)
- Sent to a webhook endpoint (optional)

## Example Results

```json
{
  "metadata": {
    "totalProperties": 2,
    "successfulScrapes": 2,
    "failedScrapes": 0,
    "scrapedAt": "2025-05-22T10:30:00.000Z",
    "version": "1.0"
  },
  "properties": [
    {
      "name": "Ellwood at Lake Travis",
      "address": "7655 N Ranch Road 620, Austin, TX 78726",
      "amenities": ["Pool", "Fitness Center", "Clubhouse", "Pet Play Area"],
      "categorizedAmenities": {
        "interior": ["Granite Counters", "Stainless Steel"],
        "exterior": ["Balcony", "Garage"],
        "community": ["Pool", "Fitness Center", "Clubhouse"],
        "services": ["Wi-Fi", "Maintenance"]
      },
      "totalAmenities": 15,
      "url": "https://www.apartments.com/ellwood-at-lake-travis-austin-tx/4v6169l/",
      "scrapedAt": "2025-05-22T10:30:00.000Z"
    }
  ]
}
```

## Advantages of This Approach

1. **Bypasses Rate Limiting**: GitHub Actions IPs are different each time
2. **Free**: 2000 minutes/month on GitHub free tier
3. **Reliable**: Uses full Chrome browser, not just HTTP requests
4. **Scalable**: Can handle multiple URLs in parallel
5. **No Maintenance**: Serverless architecture

## Troubleshooting

- If scraping fails, check the Actions log for detailed error messages
- For 404 errors, verify apartment URLs are still valid
- For timeouts, increase the timeout values in scraper.js

## Local Testing

```bash
# Install dependencies
npm install

# Set environment variable and run
URLS="https://www.apartments.com/ellwood-at-lake-travis-austin-tx/4v6169l/" node scraper.js
```
>>>>>>> c2f9a98 (Initial commit: Apartment Scraper system)
