// Example serverless function (capture-requests.js) for Vercel
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

module.exports = async (req, res) => {
    const { url } = req.body;
    const result = [];

    try {
        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            defaultViewport: chromium.defaultViewport,
        });

        const page = await browser.newPage();
        
        console.log(`Navigating to ${url}...`);
        await page.setRequestInterception(true);

        page.on('request', request => {
            request.continue();
        });

        page.on('response', async (response) => {
            const request = response.request();
            const responseHeader = response.headers();
            const requestHeader = request.headers();
            const request_url = request.url();
            const response_status = response.status();
            const response_type = response.headers()['content-type']; 
            const response_size = (await response.buffer()).length; 
            const request_method = request.method();
            const remote_address = `${request.url().split('/')[2]}`; 
            
            result.push({
                request_url,
                request_method,
                response_status,
                response_type,
                response_size,
                remote_address,
                requestHeader,          
                responseHeader
            });
        });

        await page.goto(url, { waitUntil: 'networkidle0' });
        await browser.close();

        console.log('Puppeteer process completed.');
        res.json(result);
    } catch (error) {
        console.error('Error capturing requests:', error);
        res.status(500).send('Error capturing requests');
    }
};
