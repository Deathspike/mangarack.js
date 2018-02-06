import * as fs from 'fs-extra';
import * as mio from '../';
import shared = mio.shared;

export async function createAsync(urls: string[]) {
  await mio.usingAsync(mio.Browser.createAsync(), async browser => {
    for (let url of urls) {
      let timer = new mio.Timer();
      console.log(`Awaiting ${url}`);
      await mio.usingAsync(mio.scrapeAsync(browser, url), async series => {
        console.log(`Fetching ${series.title}`);
        let metaProviderPath = shared.path.normal(series.providerName + shared.extension.json);
        let metaProviderExists = await fs.pathExists(metaProviderPath);
        let metaProvider = metaProviderExists ? await fs.readJson(metaProviderPath) as shared.IMetaProvider : {};
        if (!metaProvider[series.url]) {
          await createSeriesAsync(series);
          console.log(`Finished ${series.title} (${timer})`);
        } else {
          console.log(`Canceled ${series.title} (${timer})`);
        }
      });
    }
  });
}

export async function createSeriesAsync(series: mio.IScraperSeries) {
  let metaProviderPath = shared.path.normal(series.providerName + shared.extension.json);
  let metaProviderExists = await fs.pathExists(metaProviderPath);
  let metaProvider = metaProviderExists ? await fs.readJson(metaProviderPath) as shared.IMetaProvider : {};
  metaProvider[series.url] = series.title;
  await mio.commands.updateSeriesAsync(series);
  await fs.writeJson(metaProviderPath, metaProvider, {spaces: 2});
}
