const REQUEST_TIMEOUT_MS = 6000;

const OG_IMAGE_REGEX =
  /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["'][^>]*>/i;

const ICON_REGEX = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i;

function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function toAbsoluteUrl(candidate, normalizedUrl) {
  if (!candidate) {
    return '';
  }

  try {
    return new URL(candidate, normalizedUrl).toString();
  } catch {
    return '';
  }
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return '';
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return '';
    }

    return await response.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGoogleScreenshot(normalizedUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      normalizedUrl
    )}&strategy=mobile&screenshot=true&category=performance`;
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    const screenshotData =
      data?.lighthouseResult?.audits?.['final-screenshot']?.details?.data ||
      data?.lighthouseResult?.audits?.['full-page-screenshot']?.details?.screenshot?.data;

    return typeof screenshotData === 'string' ? screenshotData : '';
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLinkPreview(rawUrl) {
  const normalizedUrl = normalizeUrl(rawUrl);
  if (!normalizedUrl) {
    return {
      normalizedUrl: '',
      domain: 'unknown',
      thumbnail: '',
    };
  }

  let domain = 'unknown';
  try {
    domain = new URL(normalizedUrl).hostname || 'unknown';
  } catch {
    domain = 'unknown';
  }

  const html = await fetchHtml(normalizedUrl);
  let thumbnail = '';
  if (html) {
    const ogMatch = html.match(OG_IMAGE_REGEX);
    const iconMatch = html.match(ICON_REGEX);
    thumbnail =
      toAbsoluteUrl(ogMatch?.[1], normalizedUrl) || toAbsoluteUrl(iconMatch?.[1], normalizedUrl);
  }

  if (!thumbnail) {
    thumbnail = await fetchGoogleScreenshot(normalizedUrl);
  }

  return {
    normalizedUrl,
    domain,
    thumbnail,
  };
}
