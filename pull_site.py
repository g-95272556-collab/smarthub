from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen


ROOT_URL = "https://xbasmarthub.netlify.app/"
OUT_DIR = Path(r"D:\Pull Netlify\xbasmarthub.netlify.app")
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CodexSitePuller/1.0"


class RefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: set[str] = set()

    def handle_starttag(self, _tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for key, value in attrs:
            if not value:
                continue
            if key in {"src", "href", "content"}:
                self.refs.add(value)


def fetch(url: str) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        data = response.read()
        content_type = response.headers.get_content_type()
    return data, content_type


def normalize_same_origin(url: str) -> str | None:
    absolute = urljoin(ROOT_URL, url)
    parsed = urlparse(absolute)
    root = urlparse(ROOT_URL)
    if parsed.scheme not in {"http", "https"}:
        return None
    if parsed.netloc != root.netloc:
        return None
    cleaned = parsed._replace(fragment="", query="")
    return urlunparse(cleaned)


def local_path_for(url: str, content_type: str) -> Path:
    parsed = urlparse(url)
    raw_path = parsed.path or "/"
    if raw_path.endswith("/"):
        raw_path += "index.html"
    if raw_path == "/":
        raw_path = "/index.html"
    local = OUT_DIR / raw_path.lstrip("/")
    if not local.suffix:
        if content_type == "text/html":
            local = local.with_suffix(".html")
    return local


def extract_refs(text: str, content_type: str) -> set[str]:
    refs: set[str] = set()
    if content_type == "text/html":
        parser = RefParser()
        parser.feed(text)
        refs.update(parser.refs)
        refs.update(re.findall(r"""url\((['"]?)([^)'"]+)\1\)""", text))
        refs = {match[1] if isinstance(match, tuple) else match for match in refs}
    elif content_type in {"text/css", "application/javascript", "text/javascript"} or text.endswith("}"):
        refs.update(match[1] for match in re.findall(r"""url\((['"]?)([^)'"]+)\1\)""", text))
        refs.update(re.findall(r"""['"](\.?/[^'"]+\.(?:png|jpg|jpeg|svg|webp|gif|js|css|json|webmanifest|html))['"]""", text))
    elif content_type in {"application/manifest+json", "application/json"}:
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            return refs

        def walk(value: object) -> None:
            if isinstance(value, str):
                refs.add(value)
            elif isinstance(value, dict):
                for item in value.values():
                    walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)

        walk(payload)
    return refs


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    queue = [ROOT_URL]
    seen: set[str] = set()

    while queue:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        try:
            data, content_type = fetch(url)
        except Exception as exc:  # noqa: BLE001
            print(f"FAILED {url} :: {exc}")
            continue

        local_path = local_path_for(url, content_type)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(data)
        print(f"SAVED {url} -> {local_path}")

        if content_type.startswith("text/") or content_type in {
            "application/javascript",
            "application/json",
            "application/manifest+json",
        }:
            text = data.decode("utf-8", errors="ignore")
            for ref in extract_refs(text, content_type):
                normalized = normalize_same_origin(ref)
                if normalized and normalized not in seen and normalized not in queue:
                    queue.append(normalized)

    return 0


if __name__ == "__main__":
    sys.exit(main())
