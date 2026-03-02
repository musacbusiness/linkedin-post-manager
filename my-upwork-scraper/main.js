const puppeteer = require('puppeteer');

(async () => {
    // Add your cookies here in the specified format
    const cookies = [
        { name: '__cf_bm', value: 'qRJEYCxnPkqSqZhncqGB5z...', domain: '.upwork.com' },
        { name: '__cflb', value: '02DiuEXPXZVk436fJfSVuu...', domain: '.upwork.com' },
        { name: '__pdst', value: 'd731475e981843ce9508e...', domain: '.upwork.com' },
        // Add the rest of your cookies here
    ];

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Set the cookies to simulate a logged-in session
    await page.setCookie(...cookies);

    // Navigate to the Upwork job listings page
    const url = 'https://www.upwork.com/nx/find-work/most-recent';
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Navigated to Upwork job listings page.');

    // Scrape job listings
    const jobListings = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.job-details-card')).map((jobCard) => {
            const title = jobCard.querySelector('.job-title')?.innerText || 'N/A';
            const description = jobCard.querySelector('.job-description')?.innerText || 'N/A';
            const postedAt = jobCard.querySelector('.posted-date')?.innerText || 'N/A';
            const budget = jobCard.querySelector('.job-budget')?.innerText || 'N/A';

            return { title, description, postedAt, budget };
        });
    });

    // Log the job listings
    console.log('Extracted job postings:', jobListings);

    // Close the browser
    await browser.close();
    console.log('Scraper finished successfully.');
})();
