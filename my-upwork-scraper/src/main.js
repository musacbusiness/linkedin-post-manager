import { PuppeteerCrawler } from 'crawlee';

const startUrls = [
    'https://www.upwork.com/ab/account-security/login?redir=%2Fnx%2Ffind-work%2Fmost-recent',
];

const crawler = new PuppeteerCrawler({
    launchContext: {
        launchOptions: {
            headless: false, // Set to true for headless mode
        },
    },
    requestHandler: async ({ page, log, enqueueLinks, pushData }) => {
        log.info(`Processing ${page.url()}`);

        // Perform login
        if (page.url().includes('account-security/login')) {
            // Type in username
            await page.waitForSelector('#login_username', { visible: true });
            await page.type('#login_username', 'Musacomma@gmail.com'); // Replace with your username
            
            // Click 'Next' to reveal password field (if applicable)
            const nextButtonSelector = '[type="submit"]';
            if (await page.$(nextButtonSelector)) {
                await page.click(nextButtonSelector);
                await page.waitForSelector('#login_password', { visible: true });
            }

            // Type in password
            await page.type('#login_password', 'qytwan-nanXuz-pigpe0'); // Replace with your password
            await page.click(nextButtonSelector); // Submit login form

            // Wait for navigation after login
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        }

        // Extract job postings after login
        if (page.url().includes('find-work/most-recent')) {
            const jobPosts = await page.$$eval('div[data-test-key="_transition-"]', (jobs) =>
                jobs.map((job) => {
                    const title = job.querySelector('h4')?.innerText.trim();
                    const description = job.querySelector('p')?.innerText.trim();
                    const url = job.querySelector('a')?.href.trim();
                    return { title, description, url };
                })
            );

            // Log extracted jobs
            log.info(`Extracted ${jobPosts.length} job posts:`, jobPosts);

            // Push data to Apify Dataset
            for (const job of jobPosts) {
                await pushData(job);
            }
        }
    },
    errorHandler: async ({ request, error, log }) => {
        log.error(`Request failed: ${request.url}`, { error });
    },
});

(async () => {
    console.log('Starting Upwork Jobs Scraper...');
    await crawler.run(startUrls);
    console.log('Scraper finished successfully.');
})();
