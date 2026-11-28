# The device gate's mailbox: Maestro flows POST "KEY=value" here (http.post in evalScript), because a flow's
# console.log does not reach the host. Each body is appended as one line to the file given.
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
out = sys.argv[1]
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length') or 0)).decode('utf-8', 'replace').replace('\n', ' ')
        with open(out, 'a') as f: f.write(body + '\n')
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', 8765), H).serve_forever()
