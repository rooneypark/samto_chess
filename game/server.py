"""Local preview for Samguk Chess, with existing UI concepts served read-only."""
import argparse
import functools
import subprocess
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent


class PreviewServer(ThreadingHTTPServer):
    # Chromium opens a burst of connections for modules, styles and sprite assets.
    # Windows may reject connections when the default five-slot backlog fills.
    request_queue_size = 128


class Handler(SimpleHTTPRequestHandler):
    # Keep-alive: without it every module, style and image opens its own connection, and a burst of page
    # loads (the browser checks) runs Windows out of local ports (net::ERR_ADDRESS_IN_USE), which left a
    # module unloaded and the game stuck on its loading state.
    protocol_version = "HTTP/1.1"
    timeout = 30  # drop idle keep-alive connections

    def end_headers(self):
        # Development previews must not combine cached old modules with new UI.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        route = unquote(urlsplit(self.path).path)
        if route == "/":
            self.send_response(302)
            self.send_header("Location", "/game/")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if not route.startswith(("/game/", "/docs/ui/", "/art-source/motions/v1/2/", "/art-source/characters/v1/")) or ".." in route.split("/"):
            self.send_error(404)
            return
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404)
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8780)
    parser.add_argument("--open-browser", action="store_true")
    args = parser.parse_args()
    # Git stores binary assets in categorized ZIPs. Restore before serving.
    subprocess.run([sys.executable, str(REPO / 'tools' / 'asset_packs.py'), 'restore'],
                   cwd=REPO, check=True)
    handler = functools.partial(Handler, directory=str(REPO))
    for port in range(args.port, args.port + 20):
        try:
            server = PreviewServer(("127.0.0.1", port), handler)
            break
        except OSError as error:
            if error.errno != 10048 and getattr(error, "winerror", None) != 10048 and error.errno != 98:
                raise
    else:
        raise SystemExit("No available preview port")
    url = f"http://127.0.0.1:{port}/game/"
    print(url, flush=True)
    if args.open_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
