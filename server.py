import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
})

print(f"启动服务器在 http://localhost:{PORT}")
print("请在浏览器中访问上面的地址")
print("按 Ctrl+C 停止服务器")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()