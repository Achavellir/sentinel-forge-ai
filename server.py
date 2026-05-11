#!/usr/bin/env python3
import html
import ipaddress
import json
import re
import socket
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, build_opener
from urllib.request import HTTPRedirectHandler


MAX_BYTES = 2_000_000
MAX_REDIRECTS = 4


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.title = ""
        self.meta = []
        self._in_title = False
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            name = (attrs.get("name") or attrs.get("property") or "").lower()
            content = (attrs.get("content") or "").strip()
            if content and name in {"description", "og:title", "og:description", "twitter:title", "twitter:description"}:
                self.meta.append(html.unescape(content))
        if tag in {"script", "style", "noscript", "svg"}:
            self._skip += 1
        if tag == "title":
            self._in_title = True
        if tag in {"p", "br", "li", "h1", "h2", "h3", "section", "article", "tr", "div"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "svg"} and self._skip:
            self._skip -= 1
        if tag == "title":
            self._in_title = False
        if tag in {"p", "li", "h1", "h2", "h3", "tr"}:
            self.parts.append("\n")

    def handle_data(self, data):
        if self._skip:
            return
        text = html.unescape(data).strip()
        if not text:
            return
        if self._in_title:
            self.title = f"{self.title} {text}".strip()
        self.parts.append(text)

    def text(self):
        joined = " ".join([*self.meta, *self.parts])
        joined = re.sub(r"[ \t\r\f\v]+", " ", joined)
        joined = re.sub(r"\n\s+", "\n", joined)
        joined = re.sub(r"\n{3,}", "\n\n", joined)
        return joined.strip()


def is_public_http_url(value):
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http and https URLs are supported.")
    if not parsed.hostname:
        raise ValueError("URL must include a hostname.")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80), proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise ValueError(f"Could not resolve hostname: {parsed.hostname}") from exc
    for info in infos:
        address = info[4][0]
        ip = ipaddress.ip_address(address)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified or ip.is_reserved:
            raise ValueError("Blocked non-public network address.")
    return parsed


def fetch_public_url(url):
    opener = build_opener(NoRedirect)
    current = url
    redirects = 0
    while True:
        is_public_http_url(current)
        req = Request(
            current,
            headers={
                "User-Agent": "AchavelliAssistant/1.0 (+local bug bounty program analyzer)",
                "Accept": "text/html,text/plain,application/json;q=0.9,*/*;q=0.8",
            },
        )
        try:
            with opener.open(req, timeout=12) as response:
                raw = response.read(MAX_BYTES + 1)
                if len(raw) > MAX_BYTES:
                    raise ValueError("Page is too large to analyze locally.")
                content_type = response.headers.get("content-type", "")
                charset_match = re.search(r"charset=([^;]+)", content_type, re.I)
                charset = charset_match.group(1).strip() if charset_match else "utf-8"
                return current, raw.decode(charset, errors="replace")
        except HTTPError as exc:
            if exc.code in {301, 302, 303, 307, 308}:
                redirects += 1
                if redirects > MAX_REDIRECTS:
                    raise ValueError("Too many redirects.")
                location = exc.headers.get("location")
                if not location:
                    raise ValueError("Redirect did not include a location.")
                current = urljoin(current, location)
                continue
            raise ValueError(f"Remote server returned HTTP {exc.code}.") from exc
        except URLError as exc:
            raise ValueError(f"Network error: {exc.reason}") from exc


def html_to_text(markup):
    parser = TextExtractor()
    parser.feed(markup)
    text = parser.text()
    if not text:
        text = re.sub(r"<[^>]+>", " ", markup)
        text = html.unescape(re.sub(r"\s+", " ", text)).strip()
    return parser.title, text


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/fetch-program":
            return super().do_GET()

        params = parse_qs(parsed.query)
        url = (params.get("url") or [""])[0].strip()
        self.send_response_only(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        try:
            if not url:
                raise ValueError("Missing url parameter.")
            final_url, body = fetch_public_url(url)
            title, text = html_to_text(body)
            payload = {
                "ok": True,
                "url": url,
                "finalUrl": final_url,
                "title": title or urlparse(final_url).netloc,
                "text": text[:180_000],
            }
        except Exception as exc:
            payload = {"ok": False, "error": str(exc)}
        self.wfile.write(json.dumps(payload).encode("utf-8"))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 5173), Handler)
    print("Achavelli server running at http://localhost:5173")
    server.serve_forever()
