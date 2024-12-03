#!/usr/bin/env python3
"""
Simple HTTP server in python for logging requests
Usage::
    ./server.py [<port>]
"""
from http.server import BaseHTTPRequestHandler, HTTPServer, SimpleHTTPRequestHandler
import logging
import json
import time

class S(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'text/html')       
        self.end_headers()

    def do_GET(self):
        logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        self._set_response()
        self.wfile.write("GET request for {}".format(self.path).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
        post_data = self.rfile.read(content_length)          # <--- Gets the data itself
        post_data = post_data.decode('utf-8')
        post_data = json.loads(post_data)

        subject_id = post_data['_trialData'][0]['subject_id']
        trial_index = post_data['_trialData'][-1]['trial_index']
        
        now = time.time() * 1000
        
        save_file = f"{subject_id}_{trial_index}_{now}_chess"
        with open(f'data/{save_file}.json', 'w') as f:
            json.dump(post_data, f)

        logging.info("\nreceived POST request and saved file\n")
    
        self._set_response()
        

def run(server_class=HTTPServer, handler_class=S, port=8001):
    logging.basicConfig(level=logging.INFO)
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')

if __name__ == '__main__':
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()