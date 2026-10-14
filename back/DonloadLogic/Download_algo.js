const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be', 'youtube-nocookie.com'];
const TERABOX_HOSTS = [
    'terabox.com', '1024terabox.com', 'teraboxapp.com', 'terabox.app',
    '4funbox.com', 'mirrobox.com', 'nephobox.com', 'momerybox.com', 'tibibox.com'
];

function hostMatches(url, hosts) {
    try {
        const h = new URL(url).hostname.toLowerCase();
        return hosts.some(d => h === d || h.endsWith('.' + d));
    } catch {
        return false;
    }
}

// Cookies: set COOKIES_FILE env var, or drop a cookies.txt (Netscape format) next to this file.
// Optional: COOKIES_BROWSER=chrome|firefox|edge reads cookies straight from the browser.
function baseOptions() {
    const opts = { noWarnings: true, noCheckCertificates: true };
    const file = process.env.COOKIES_FILE || path.join(__dirname, 'cookies.txt');
    if (fs.existsSync(file)) opts.cookies = file;
    else if (process.env.COOKIES_BROWSER) opts.cookiesFromBrowser = process.env.COOKIES_BROWSER;
    return opts;
}

function explainError(err, url) {
    const msg = String(err.stderr || err.message || err);
    let hint = '';
    if (/confirm you.?re not a bot|Sign in to confirm/i.test(msg)) {
        hint = 'YouTube wants a logged-in session. Export cookies.txt and set COOKIES_FILE (or put cookies.txt next to this file).';
    } else if (/age.restricted|Sign in to confirm your age|private video|members.only/i.test(msg)) {
        hint = 'This video needs a logged-in account. Add cookies.txt.';
    } else if (/JavaScript runtime|n challenge|Requested format is not available/i.test(msg) && hostMatches(url, YOUTUBE_HOSTS)) {
        hint = 'Recent yt-dlp needs a JS runtime for YouTube. Install Deno (https://deno.com) and update yt-dlp.';
    } else if (hostMatches(url, TERABOX_HOSTS)) {
        hint = 'TeraBox is not a standard yt-dlp site. Cookies will not fix an unsupported-URL error; a custom extractor is needed.';
    }
    const e = new Error(hint ? `${msg.trim()}\n\nHINT: ${hint}` : msg.trim());
    e.stderr = err.stderr;
    return e;
}

function getFormattedType(f) {
    const hasVideo = f.vcodec && f.vcodec !== 'none';
    const hasAudio = f.acodec && f.acodec !== 'none';

    if (hasVideo && hasAudio) return 'both';
    if (hasVideo && !hasAudio) return 'video';
    if (!hasVideo && hasAudio) return 'audio';
    return 'unknown';
}

function getSizeMB(f) {
    const bytes = f.filesize || f.filesize_approx;
    if (!bytes) return 'unknown';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function summarizeFormats(formats) {
    return formats.map(f => {
        const type = getFormattedType(f);
        return {
            format_id: f.format_id,
            ext: f.ext,
            protocol: f.protocol,
            abr: f.abr,
            height: f.height,
            url: f.url,
            downloader_options: f.downloader_options,
            type,
            http_headers: f.http_headers,
            resolution:
                f.resolution && f.resolution !== 'audio only'
                    ? f.resolution
                    : f.width && f.height
                        ? `${f.width}x${f.height}`
                        : type === 'audio'
                            ? 'audio-only'
                            : 'unknown',
            video_size: getSizeMB(f)
        };
    });
}

// Keep ONLY formats that contain audio: type 'audio' (m4a/opus) or 'both' (video+audio).
// Drops video-only streams and storyboards (mhtml).
// Order: video+audio first (direct http links before m3u8, then highest resolution), then audio-only (best bitrate).
function onlyAudioFormats(formats) {
    let result = formats.filter(
        f => (f.type === 'audio' || f.type === 'both') && f.ext !== 'mhtml' && f.protocol !== 'mhtml'
    );
    // Direct-file URLs sometimes have no codec info at all -> keep those as a last resort
    if (!result.length) result = formats.filter(f => f.type === 'unknown' && f.ext !== 'mhtml');

    const rank = { both: 0, audio: 1, unknown: 2 };
    const notDirect = f => (/^https?$/.test(f.protocol || '') ? 0 : 1);
    return result.sort(
        (a, b) =>
            rank[a.type] - rank[b.type] ||
            notDirect(a) - notDirect(b) ||
            (b.height || 0) - (a.height || 0) ||
            (b.abr || 0) - (a.abr || 0)
    );
}

// Best separate streams, for when a site offers NO combined video+audio URL (YouTube mostly doesn't above 360p).
function pickBest(all) {
    const ok = f => f.ext !== 'mhtml' && f.protocol !== 'mhtml';
    const byHeight = (a, b) => (b.height || 0) - (a.height || 0);
    const both = all.filter(f => f.type === 'both' && ok(f)).sort(byHeight);
    const video = all.filter(f => f.type === 'video' && ok(f) && /^https?$/.test(f.protocol || '')).sort(byHeight);
    const audio = all.filter(f => f.type === 'audio' && ok(f) && /^https?$/.test(f.protocol || '')).sort((a, b) => (b.abr || 0) - (a.abr || 0));
    const direct = both.find(f => /^https?$/.test(f.protocol || ''));
    return { combined: direct || both[0] || null, video: video[0] || null, audio: audio[0] || null };
}

async function getInfo(url) {
    let raw;
    try {
        raw = await youtubedl(url, {
            ...baseOptions(),
            dumpSingleJson: true,
            preferFreeFormats: true
        });
    } catch (err) {
        throw explainError(err, url);
    }

    // Some versions return a JSON string, others an object
    const info = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!info || typeof info !== 'object') {
        throw new Error('yt-dlp returned no data. Reinstall: npm i youtube-dl-exec@latest');
    }

    // Some extractors return a single format on the info object itself
    const rawFormats = Array.isArray(info.formats) && info.formats.length
        ? info.formats
        : [info];

    const all = summarizeFormats(rawFormats);
    const formats = onlyAudioFormats(all);
    const best = pickBest(all);
    const counts = {
        both: all.filter(f => f.type === 'both').length,
        video_only: all.filter(f => f.type === 'video').length,
        audio_only: all.filter(f => f.type === 'audio').length
    };
    const duration = info.duration ? Number((info.duration / 60).toFixed(2)) : null;

    return { title: info.title, duration, counts, best, formats, thumbnail: info.thumbnail };
}

// Download video+audio as one file. 'b' = best single file with audio (no ffmpeg needed).
// Use 'bv*+ba/b' for best quality (needs ffmpeg to merge).
async function download(url, { outDir = './downloads', format = 'b' } = {}) {
    try {
        await youtubedl(url, {
            ...baseOptions(),
            output: path.join(outDir, '%(title).100s [%(id)s].%(ext)s'),
            format,
            restrictFilenames: true
        });
    } catch (err) {
        throw explainError(err, url);
    }
    return outDir;
}

// Download video+audio merged into ONE .mp4 at best quality. REQUIRES ffmpeg on PATH.
async function downloadMp4(url, { outDir = './downloads' } = {}) {
    try {
        await youtubedl(url, {
            ...baseOptions(),
            output: path.join(outDir, '%(title).100s [%(id)s].%(ext)s'),
            format: 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b',
            mergeOutputFormat: 'mp4',
            restrictFilenames: true
        });
    } catch (err) {
        throw explainError(err, url);
    }
    return outDir;
}

// Download audio only as a real .mp3 file. REQUIRES ffmpeg installed and on PATH.
async function downloadMp3(url, { outDir = './downloads' } = {}) {
    try {
        await youtubedl(url, {
            ...baseOptions(),
            output: path.join(outDir, '%(title).100s [%(id)s].%(ext)s'),
            format: 'ba/b',
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0,
            restrictFilenames: true
        });
    } catch (err) {
        throw explainError(err, url);
    }
    return outDir;
}

module.exports = { getInfo, download, downloadMp4, downloadMp3, onlyAudioFormats, pickBest };

// ---- just put your URL here and run: node Download_algo.js ----
if (require.main === module) {
    const url = 'https://youtu.be/l8B8BWWXqKE?si=8G_CvVw0GHnIN0Dp';

    getInfo(url)
        .then(info => {
            console.log('Title:', info.title);
            console.log('Duration (min):', info.duration);
            console.log('Thumbnail:', info.thumbnail);
            console.log('Stream counts on this site:', info.counts);
            console.log('Best combined video+audio URL:', info.best.combined && info.best.combined.url);
            console.log('Best video-only URL:', info.best.video && info.best.video.url);
            console.log('Best audio URL:', info.best.audio && info.best.audio.url);
            console.log('Formats (audio / video+audio only):', info.formats);
            // To also download, uncomment ONE:
            // return downloadMp4(url).then(dir => console.log('MP4 saved to:', dir)); // best quality, needs ffmpeg
            // return download(url).then(dir => console.log('Downloaded to:', dir));  // single file, no ffmpeg
            // return downloadMp3(url).then(dir => console.log('MP3 saved to:', dir));
        })
        .catch(err => {
            console.error('Failed:', err.message);
            process.exit(1);
        });
}