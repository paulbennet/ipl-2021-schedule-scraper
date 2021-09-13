# ipl-2021-schedule-scraper
A puppeteer based web scraper for IPL event schedule

#### Usage

````bash
npm install -g ipl-2021-schedule-scraper
````

````bash
#Options:
#  -o --output-dir <output-dir>  Output directory path
#  -d --date <date-to-parse>     Date to fetch game schedules

# 1. [SCRAPE] Fetch event schedules
ipl-2021-scraper --date=<date-to-parse> --output-dir=<output-dir>

# e.g. ipl-2021-scraper --date=2021-08-01 --output-dir=./schedules

# NOTE:
# 1. <date-to-parse> format must be YYYY-MM-DD
# 2. JSON files will be written in specified {output-dir} with the name format 'ipl-schedule-{date-to-parse}.json'
````

**Tip:** You can also use this utility without installing the package

````bash
# Fetch event schedules
npx ipl-2021-schedule-scraper --date=<date-to-parse> --output-dir=<output-dir>
````


**Disclaimer:**
- This tool uses puppeteer to load web pages from iplt20.com to scrape schedule data.
- Make sure to sensibly use this tool if used in automation, and not overwhelm the web servers.
- YOU (user) will be completely responsible for usage of this tool. The developer CAN'T be blamed for the abuse of this tool.