"""Add link previews to posts.json.

    python tools/fetch_posts.py URL [URL ...]

Run with no URL to self-check the parser.
shortcut: reads OpenGraph tags only (title, summary, image, date, site), not the
article body, and cannot read Facebook (login wall). Paste your own post text into
the "content" list in posts.json by hand; upgrade to a real extractor if that gets old.
"""
import json
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

POSTS = Path(__file__).resolve().parent.parent / "posts.json"


class Meta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.title, self._in_title = {}, "", False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        key = a.get("property") or a.get("name")
        if tag == "meta" and key and a.get("content"):
            self.meta.setdefault(key, a["content"].strip())
        self._in_title = tag == "title"

    def handle_endtag(self, tag):
        self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def extract(html, url):
    p = Meta()
    p.feed(html)
    m = p.meta
    image = m.get("og:image", "")
    return {
        "title": m.get("og:title") or p.title.strip() or url,
        "date": m.get("article:published_time", "")[:10],
        "topic": "Press",
        "summary": m.get("og:description") or m.get("description", ""),
        "image": image if image.startswith(("http://", "https://")) else "",
        "source": m.get("og:site_name", ""),
        "url": url,
    }


def main(urls):
    posts = json.loads(POSTS.read_text(encoding="utf-8")) if POSTS.exists() else []
    known = {p.get("url") for p in posts}
    for url in urls:
        if not url.startswith(("http://", "https://")):
            print("skip (not http/https):", url)
        elif url in known:
            print("skip (already saved):", url)
        else:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                html = r.read(2_000_000).decode("utf-8", errors="replace")
            posts.insert(0, extract(html, url))
            print("added:", posts[0]["title"])
    POSTS.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # Windows consoles default to cp1252
    if len(sys.argv) > 1:
        main(sys.argv[1:])
    else:
        got = extract(
            '<title>Fallback</title><meta property="og:title" content="T">'
            '<meta name="description" content="D"><meta property="og:image" content="javascript:x">'
            '<meta property="article:published_time" content="2026-05-01T10:00:00Z">',
            "https://example.com/a",
        )
        assert got["title"] == "T" and got["summary"] == "D" and got["date"] == "2026-05-01" and got["image"] == "", got
        print("self-check ok")
