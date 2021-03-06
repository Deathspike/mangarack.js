import * as archiver from 'archiver';
import * as fs from 'fs-extra';
import * as mio from '../';
import * as path from 'path';
import * as imageSize from 'image-size';
import shared = mio.shared;

export async function downloadAsync() {
  await mio.usingAsync(mio.Browser.createAsync(), async browser => {
    let fileNames = await fs.readdir(shared.path.normal());
    for (let fileName of fileNames) {
      let fileExtension = path.extname(fileName);
      if (fileExtension === shared.extension.json) {
        let metaProviderPath = shared.path.normal(fileName);
        let metaProvider = await fs.readJson(metaProviderPath) as shared.IMetaProvider;
        for (let url in metaProvider) {
          let timer = new mio.Timer();
          let awaiter = mio.scrapeAsync(browser, url);
          if (awaiter) {
            console.log(`Awaiting ${url}`);
            await mio.usingAsync(awaiter, async series => {
              if (series.title !== metaProvider[url]) throw new Error(`Series at ${url} property changed: title`)
              if (series.url !== url) throw new Error(`Series at ${url} property changed: url`);
              console.log(`Fetching ${series.title}`);
              await mio.commands.updateSeriesAsync(series);
              await downloadSeriesAsync(series);
              console.log(`Finished ${series.title} (${timer})`);
            });
          } else {
            console.log(`Rejected ${url}`);
          }
        }
      }
    }
  });
}

export async function downloadSeriesAsync(series: mio.IScraperSeries) {
  await series.chapters.reduce((p, c) => p.then(() => downloadSeriesItemAsync(series, c)), Promise.resolve());
  await cleanAsync(series);
}

export async function downloadSeriesItemAsync(series: mio.IScraperSeries, seriesChapter: mio.IScraperSeriesChapter) {
  let chapterPath = shared.path.normal(series.providerName, series.title, seriesChapter.name + shared.extension.cbz);
  let chapterExists = await fs.pathExists(chapterPath);
  if (!chapterExists) {
    console.log(`Fetching ${seriesChapter.name}`);
    let chapter = archiver.create('zip', {store: true});
    let timer = new mio.Timer();
    await fs.ensureDir(path.dirname(chapterPath));
    chapter.pipe(fs.createWriteStream(chapterPath + shared.extension.tmp));
    await mio.usingAsync(seriesChapter.iteratorAsync(), async iterator => {
      try {
        await archiveAsync(chapter, iterator);
        chapter.finalize();
        await fs.rename(chapterPath + shared.extension.tmp, chapterPath);
        console.log(`Finished ${seriesChapter.name} (${timer})`);
      } catch (error) {
        await fs.unlink(chapterPath + shared.extension.tmp);
        throw error;
      } finally {
        chapter.abort();
      }
    });
  }
}

async function archiveAsync(chapter: archiver.Archiver, iterator: mio.IScraperIterator) {
  let currentPageNumber = 1;
  while (await iterator.moveAsync()) {
    let buffer = await iterator.currentAsync();
    let imageInfo = imageSize(buffer);
    let name = `${String(currentPageNumber).padStart(3, '0')}.${imageInfo.type}`;
    chapter.append(buffer, {name});
    currentPageNumber++;
  }
}

async function cleanAsync(series: mio.IScraperSeries) {
  let chapterPaths = series.chapters.map(seriesChapter => shared.path.normal(series.providerName, series.title, seriesChapter.name + shared.extension.cbz));
  let fileNames = await fs.readdir(shared.path.normal(series.providerName, series.title));
  let filePaths = fileNames.map(fileName => shared.path.normal(series.providerName, series.title, fileName));
  for (let filePath of filePaths) {
    let fileExtension = path.extname(filePath);
    if (fileExtension === shared.extension.cbz && chapterPaths.indexOf(filePath) === -1) {
      await fs.rename(filePath, filePath.substr(0, filePath.length - fileExtension.length) + shared.extension.del);
    }
  }
}
