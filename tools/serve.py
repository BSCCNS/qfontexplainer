#!/usr/bin/env python3
"""
Development server for the Quantum Compass site.

Why not `python3 -m http.server`
-------------------------------
Chrome's media pipeline requests video with a `Range` header and expects a
`206 Partial Content` reply. The standard library's SimpleHTTPRequestHandler
ignores `Range` and answers `200` with the whole file, and Chrome responds by
stalling: the <video> sits at readyState 0, networkState LOADING, and fires no
error at all. It looks exactly like a broken video file.

That cost an hour once. This server implements Range, so video behaves the way
it does on the kiosk.

It is also threaded — the single-threaded default blocks on one large media
file while everything else waits.

The kiosk itself needs none of this: it opens index.html over file://, which
supports ranges natively. This is only for testing over HTTP.

Usage:
    ./tools/serve.py            # http://localhost:8000
    ./tools/serve.py 9000
"""

import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class RangeHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler plus byte-range support."""

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        m = re.match(r"bytes=(\d*)-(\d*)\s*$", rng)
        if not m:
            return super().send_head()

        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        size = os.fstat(f.fileno()).st_size
        start, end = m.group(1), m.group(2)

        if start == "":
            # A suffix range: the last N bytes.
            length = int(end or 0)
            start = max(0, size - length)
            end = size - 1
        else:
            start = int(start)
            end = int(end) if end else size - 1
            end = min(end, size - 1)

        if start >= size or start > end:
            f.close()
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.end_headers()
            return None

        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()

        f.seek(start)
        return _Slice(f, end - start + 1)

    def end_headers(self):
        # Advertise range support, and keep the browser from caching stale
        # assets between edits — Chrome will otherwise serve an old app.js
        # straight through a reload.
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "GET" in (args[0] if args else ""):
            sys.stderr.write("  %s\n" % (fmt % args))


class _Slice:
    """A file wrapper that stops after `remaining` bytes, for copyfile()."""

    def __init__(self, fp, remaining):
        self._fp = fp
        self._remaining = remaining

    def read(self, amt=-1):
        if self._remaining <= 0:
            return b""
        if amt is None or amt < 0:
            amt = self._remaining
        data = self._fp.read(min(amt, self._remaining))
        self._remaining -= len(data)
        return data

    def close(self):
        self._fp.close()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(RangeHandler, directory=str(ROOT))

    class Server(ThreadingHTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    print("Quantum Compass — http://localhost:%d" % port)
    print("  ?layout=kiosk / ?layout=fluid to force a layout")
    print("  Ctrl-C to stop")
    try:
        Server(("127.0.0.1", port), handler).serve_forever()
    except KeyboardInterrupt:
        print()


if __name__ == "__main__":
    main()
