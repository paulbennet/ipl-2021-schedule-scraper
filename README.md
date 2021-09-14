# ipl-2021-schedule-scraper
A puppeteer based web scraper for IPL event schedule

#### Usage

````bash
npm install -g ipl-2021-schedule-scraper
````

````bash
#Options:
#  -o --output-dir <output-dir>  Output directory path

# 1. [SCRAPE] Fetch event schedules
ipl-2021-scraper --output-dir=<output-dir>

# e.g. ipl-2021-scraper --output-dir=./schedules

# NOTE:
# 1. JSON files will be written in specified {output-dir} with the name 'ipl-2021-schedule.json'
````

**Tip:** You can also use this utility without installing the package

````bash
# Fetch event schedules
npx ipl-2021-schedule-scraper --output-dir=<output-dir>
````


**Disclaimer:**
- This tool uses puppeteer to load web pages from iplt20.com to scrape schedule data.
- Make sure to sensibly use this tool if used in automation, and not overwhelm the web servers.
- YOU (user) will be completely responsible for usage of this tool. The developer CAN'T be blamed for the abuse of this tool.